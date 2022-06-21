// global
import { FastifyPluginAsync } from 'fastify';

// local
import common, {
  changePlan,
  getPlans,
  getOwnPlan,
  getProrationPreview,
  setDefaultCard,
  getCurrentCustomer,
} from './schemas';
import { TaskManager } from './task-manager';
import { Stripe } from 'stripe';
import { Member } from 'graasp';
import { CustomerExtra } from './interfaces/customer-extra';
import { API_VERSION } from './util/constants';

interface GraaspSubscriptionsOptions {
  stripeSecretKey: string;
  // This is called stripeDefaultPlanPriceId, because apparently you the customer is linked to the price instead of the plan
  // This value should looks like this: price_2KJwvZGcObdOErGj42lU6fER
  stripeDefaultPlanPriceId: string;
}

const plugin: FastifyPluginAsync<GraaspSubscriptionsOptions> = async (fastify, options) => {
  const { stripeSecretKey, stripeDefaultPlanPriceId } = options;
  const {
    members: { taskManager: memberTaskManager },
    taskRunner: runner,
  } = fastify;

  // Constants
  const stripe = new Stripe(stripeSecretKey, { apiVersion: API_VERSION });

  const taskManager = new TaskManager(stripe);

  // schemas
  fastify.addSchema(common);

  // get plans
  fastify.get('/plans', { schema: getPlans }, async ({ member, log }) => {
    const task = taskManager.createGetPlansTask(member);
    return runner.runSingle(task, log);
  });

  // get own plan
  fastify.get('/plans/own', { schema: getOwnPlan }, async ({ member, log }) => {
    const task = taskManager.createGetOwnPlanTask(member);
    return runner.runSingle(task, log);
  });

  // change plan
  fastify.patch<{ Params: { planId: string } }>(
    '/plans/:planId',
    { schema: changePlan },
    async ({ member, params: { planId }, log }) => {
      const task = taskManager.createChangePlanTask(member, planId);
      return runner.runSingle(task, log);
    },
  );

  fastify.get<{ Params: { planId: string } }>(
    '/plans/:planId/proration-preview',
    { schema: getProrationPreview },
    async ({ member, params: { planId }, log }) => {
      const task = taskManager.createGetProrationPreviewTask(member, planId);
      return runner.runSingle(task, log);
    },
  );

  fastify.post('/setup-intent', async ({ member, log }) => {
    const createTasks = [];

    // if the member doesen't have a stripe account when adding a card, create a new customer
    if(!member.extra.customerId){
      const t1 = taskManager.createCreateCustomerTask(member, {
        member,
        stripeDefaultPlanPriceId,
      });

      const res = await runner.runSingle(t1);
      member.extra = {
        ...member.extra,
        ...res
      };

      createTasks.push(memberTaskManager.createUpdateTaskSequence(member, member.id, member));
    }

    const t3 = taskManager.createCreateSetupIntentTask(member);
    return runner.runSingleSequence([ ...createTasks, t3], log);
  });

  fastify.get('/cards', async ({ member, log }) => {
    const task = taskManager.createGetCardsTask(member);
    return runner.runSingle(task, log);
  });

  fastify.patch<{ Params: { cardId: string } }>(
    '/cards/:cardId/default',
    { schema: setDefaultCard },
    async ({ member, params: { cardId }, log }) => {
      const task = taskManager.createSetDefaultCardTask(member, cardId);
      return runner.runSingle(task, log);
    },
  );

  fastify.get('/customer/current', { schema: getCurrentCustomer }, async ({ member, log }) => {
    const task = taskManager.createGetCustomerTask(
      member,
      (<Member<CustomerExtra>>member).extra.customerId,
    );
    return runner.runSingle(task, log);
  });
};

export default plugin;
