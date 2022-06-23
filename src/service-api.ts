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
import { TaskManager } from './task-manager';
import { Stripe } from 'stripe';
import { Member } from 'graasp';
import { CustomerExtra } from './interfaces/customer-extra';
import { API_VERSION } from './util/constants';

interface GraaspSubscriptionsOptions {
  stripeSecretKey: string;
  // This is called stripeDefaultPlanPriceId, because the customer is linked to the price instead of the plan
  // This value should looks like this: price_XXXXXXXXXXXXXXXXXXXXXXXX             
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

  fastify.get<{ Params: { planId: string } }>(
    '/plans/:planId', 
    { schema: getPlan }, 
    async ({ member, params: { planId }, log }) => {
    const task = taskManager.createGetPlansTask(member, { product: planId });
    return (await runner.runSingle(task, log))[0];
  });

  // get own plan
  fastify.get('/plans/own', { schema: getOwnPlan }, async ({ member, log }) => {
    const task = taskManager.createGetOwnPlanTask(member);
    return runner.runSingle(task, log);
  });

  // change plan
  fastify.patch<{ Body: { cardId: string }; Params: { planId: string } }>(
    '/plans/:planId',
    { schema: changePlan },
    async ({ member, params: { planId }, body: { cardId }, log }) => {
      const task = taskManager.createChangePlanTask(member, { planId, cardId });
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
    let extra = member.extra as CustomerExtra;

    // if the member doesen't have a stripe account when adding a card, create a new customer
    const createTasks = [];
    if(!extra.customerId){
      const t1 = taskManager.createCreateCustomerTask(member, {
        member,
        stripeDefaultPlanPriceId,
      });

      const res = await runner.runSingle(t1);
      extra = { ...extra, ...res };

      createTasks.push(...memberTaskManager.createUpdateTaskSequence(member, member.id, { extra }));
    }

    const t3 = taskManager.createCreateSetupIntentTask(member, { customerId: extra.customerId });
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
