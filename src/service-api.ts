// global
import { FastifyPluginAsync } from 'fastify';

// local
import common, {
  changePlan,
  getPlan,
  getPlans,
  getOwnPlan,
  getProrationPreview,
  setDefaultCard,
  getCurrentCustomer,
} from './schemas';
import { TaskManager } from './stripe/task-manager';
import { Stripe } from 'stripe';
import { Member } from 'graasp';
import { API_VERSION } from './util/constants';
import { GetPlanTask } from './plans/tasks/get-plan-task';
import { PlanService } from './plans/db-service';
import { CreateDefaultSubscriptionTask } from './subscriptions/tasks/create-default-subscription-task';
import { SubscriptionService } from './subscriptions/db-service';
import { GetSubscriptionTask } from './subscriptions/tasks/get-subscription-task';
import { GetOwnPlanTask } from './stripe/tasks/get-own-plan-task';
import { UpdateSubscriptionTask } from './subscriptions/tasks/update-subscription-task';

interface GraaspSubscriptionsOptions {
  stripeSecretKey: string;
  // This is called stripeDefaultPlanPriceId, because the customer is linked to the price instead of the plan
  // This value should looks like this: product_XXXXXXXXXXXXXXXXXXXXXXXX
  stripeDefaultProductId: string;
}

const plugin: FastifyPluginAsync<GraaspSubscriptionsOptions> = async (fastify, options) => {
  const { stripeSecretKey, stripeDefaultProductId } = options;
  const {
    members: { taskManager: memberTaskManager },
    taskRunner: runner,
  } = fastify;

  // Constants
  const stripe = new Stripe(stripeSecretKey, { apiVersion: API_VERSION });

  const taskManager = new TaskManager(stripe);

  // schemas
  fastify.addSchema(common);

  runner.setTaskPostHookHandler<Member>(memberTaskManager.getCreateTaskName(), async (member, actor, { handler }) => {
      const t1 = new GetPlanTask(member, { planId: stripeDefaultProductId }, new PlanService());
      const t2 = new CreateDefaultSubscriptionTask(member, new SubscriptionService());
      t2.getInput = () => ({ defaultPlanId: t1.result.id});

      const tasks = [ t1, t2 ];
      for(const t of tasks){
        if (t.getInput) Object.assign(t.input, t.getInput());
        await t.run(handler);
      }
  });

  // get plans
  fastify.get('/plans', { schema: getPlans }, async ({ member, log }) => {
    const task = taskManager.createGetPlansTask(member);
    return runner.runSingle(task, log);
  });

  fastify.get<{ Params: { planId: string } }>(
    '/plans/:planId',
    { schema: getPlan },
    async ({ member, params: { planId }, log }) => {
    const task = taskManager.createGetPlansTask(member, { product: planId });
    return (await runner.runSingle(task, log))[0];
  });

  // get own plan
  fastify.get('/plans/own', { schema: getOwnPlan }, async ({ member, log }) => {
    const t1 = new GetSubscriptionTask(member, { id: member.id }, new SubscriptionService());
    const t2 = new GetOwnPlanTask(member, null, stripe);
    t2.getInput = () => ({ subscriptionId: t1.result.subscriptionId});

    return runner.runSingleSequence([ t1, t2 ], log);
  });

  // change plan
  fastify.patch<{ Body: { cardId: string }; Params: { planId: string } }>(
    '/plans/:planId',
    { schema: changePlan },
    async ({ member, params: { planId }, body: { cardId }, log }) => {

      const t1 = new GetSubscriptionTask(member, { id: member.id }, new SubscriptionService());
      const t2 = taskManager.createCreateSubscriptionTask(member, {
        priceId: planId,
        cardId,
      });
      t2.getInput = () => {
        t2.skip = Boolean(t1.result.subscriptionId);
        return { customerId: t1.result.customerId };
      };

      const t3 = taskManager.createChangePlanTask(member, {
        planId,
        cardId,
      });
      t3.getInput = () => ({  subscriptionId: t1.result.subscriptionId ?? t2.result.subscriptionId });

      const t4 = new GetPlanTask(member, {}, new PlanService());
      t4.getInput = () => ({
        planId: t3.result.id,
      });

      const t5 = new UpdateSubscriptionTask(member, { subscription: {} }, new SubscriptionService());
      t5.getInput = () => ({
          subscription: {
            id: t1.result.id,
            subscriptionId: t1.result.subscriptionId ?? t2.result.subscriptionId,
            planId: t4.result.id,
          },
      });

      return runner.runSingleSequence([ t1, t2, t3, t4, t5], log);
    },
  );

  fastify.get<{ Params: { planId: string } }>(
    '/plans/:planId/proration-preview',
    { schema: getProrationPreview },
    async ({ member, params: { planId }, log }) => {
      const t1 = new GetSubscriptionTask(member, { id: member.id}, new SubscriptionService());
      const t2 = taskManager.createGetProrationPreviewTask(member, { planId });
      t2.getInput = () => {
        return {
          customerId: t1.result.customerId,
          subscriptionId: t1.result.subscriptionId,
        };
      };

      return runner.runSingleSequence([ t1, t2 ], log);
    },
  );

  fastify.post('/setup-intent', async ({ member, log }) => {
    // if the member doesen't have a stripe account when adding a card, create a new customer
    const t1 = new GetSubscriptionTask(member, { id: member.id }, new SubscriptionService());
    const t2 = taskManager.createCreateCustomerTask(member, {member});
    t2.getInput = () => { t2.skip = Boolean(t1.result.customerId); };
    const t3 = new UpdateSubscriptionTask(member, { subscription: {} }, new SubscriptionService());
    t3.getInput = () => {
      t3.skip = t2.skip;
      return {
        subscription: {
          id: t1.result.id,
          ...t2.result,
        },
      };
    };
    const t4 = taskManager.createCreateSetupIntentTask(member, {});
    t4.getInput = () => ({
      customerId: t1.result?.customerId ?? t3.result.customerId
    });

    return runner.runSingleSequence([ t1, t2, t3, t4], log);
  });

  fastify.get('/cards', async ({ member, log }) => {
    const t1 = new GetSubscriptionTask(member, { id: member.id }, new SubscriptionService());
    const t2 = taskManager.createGetCardsTask(member);
    t2.getInput = () => ({ customerId: t1.result.customerId });
    return runner.runSingleSequence([t1, t2], log);
  });

  fastify.patch<{ Params: { cardId: string } }>(
    '/cards/:cardId/default',
    { schema: setDefaultCard },
    async ({ member, params: { cardId }, log }) => {
      const t1 = new GetSubscriptionTask(member, { id: member.id }, new SubscriptionService());
      const t2 = taskManager.createSetDefaultCardTask(member, { cardId });
      t2.getInput = () => ({ customerId: t1.result.customerId });

      return runner.runSingleSequence([ t1, t2 ], log);
    },
  );

  fastify.get('/customer/current', { schema: getCurrentCustomer }, async ({ member, log }) => {
    const t1 = new GetSubscriptionTask(member, {id: member.id }, new SubscriptionService());
    const t2 = taskManager.createGetCustomerTask(member);
    t2.getInput = () => {
      if(t1.result.customerId){
        return {
          customerId: t1.result.customerId
        };
      }
      t2.skip = true;
    };
    return runner.runSingleSequence([t1, t2], log);
  });
};

export default plugin;
