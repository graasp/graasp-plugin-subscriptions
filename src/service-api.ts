import { Stripe } from 'stripe';

import { FastifyPluginAsync } from 'fastify';

import { Member } from 'graasp';

import { PlanTaskManager } from './plans/task-manager';
// local
import common, {
  changePlan,
  getCurrentCustomer,
  getOwnPlan,
  getPlan,
  getPlans,
  setDefaultCard,
} from './schemas';
import { StripeTaskManager } from './stripe/task-manager';
import { SubscriptionTaskManager } from './subscriptions/task-manager';
import { API_VERSION } from './util/constants';

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

  const stipeTaskManager = new StripeTaskManager(stripe);

  const planTaskManger = new PlanTaskManager();

  const subscriptionTaskManager = new SubscriptionTaskManager();

  // schemas
  fastify.addSchema(common);

  // When a member is created, we subscribe them to the default free plan
  // This doesn't create a customer in stripe, we only make the link in our database
  runner.setTaskPostHookHandler<Member>(
    memberTaskManager.getCreateTaskName(),
    async (member, _actor, { handler }) => {
      const t1 = planTaskManger.createGetPlanTask(member, { planId: stripeDefaultProductId });
      const t2 = subscriptionTaskManager.createCreateDefaultSubscriptionTask(member);
      t2.getInput = () => ({ defaultPlanId: t1.result.id });

      // If we use the runner, the member is not created when we want to insert the subscription. 
      // A fix would be to modify the runner allowing it to run task in the current transaction.
      // We cannot use the task runner because the tasks will be run on a new transaction, and create the follwing SQL:
      // BEGIN TRANSACTION
      // insert member
      //    BEGIN TRANSACTION
      //    insert subscription (member.id)
      //    END TRANSACTION
      // END TRANSACTION
      for (const t of [t1, t2]) {
        if (t.getInput) Object.assign(t.input, t.getInput());
        await t.run(handler);
      }
    },
  );

  // get plans
  fastify.get('/plans', { schema: getPlans }, async ({ member, log }) => {
    const task = stipeTaskManager.createGetPlansTask(member);
    return runner.runSingle(task, log);
  });

  fastify.get<{ Params: { planId: string } }>(
    '/plans/:planId',
    { schema: getPlan },
    async ({ member, params: { planId }, log }) => {
      const task = stipeTaskManager.createGetPlansTask(member, { product: planId });
      return (await runner.runSingle(task, log))[0];
    },
  );

  // get own plan
  fastify.get('/plans/own', { schema: getOwnPlan }, async ({ member, log }) => {
    const t1 = subscriptionTaskManager.createGetSubscriptionTask(member, { memberId: member.id });
    const t2 = stipeTaskManager.createGetOwnPlanTask(member);
    t2.getInput = () => ({ subscriptionId: t1.result.subscriptionId });

    return runner.runSingleSequence([t1, t2], log);
  });

  // change plan
  fastify.patch<{ Body: { cardId: string }; Params: { planId: string } }>(
    '/plans/:planId',
    { schema: changePlan },
    async ({ member, params: { planId }, body: { cardId }, log }) => {
      const t1 = subscriptionTaskManager.createGetSubscriptionTask(member, { memberId: member.id });

      // This task is only called if the member doesn't have a subscriptionId stored in the DB.
      // If the customer doesn't have a subscriptionId, it means it's it first subscription and 
      // we create a new subscription in Stripe for the futur changes of plan
      const t2 = stipeTaskManager.createCreateSubscriptionTask(member, {
        priceId: planId,
        cardId,
      });
      t2.getInput = () => {
        t2.skip = Boolean(t1.result.subscriptionId);
        return { customerId: t1.result.customerId };
      };

      // Updates the subscription of the customer, this could be skipped if the createSubscription
      // task is executed
      const t3 = stipeTaskManager.createChangePlanTask(member, {
        planId,
        cardId,
      });
      t3.getInput = () => ({
        subscriptionId: t1.result.subscriptionId ?? t2.result.subscriptionId,
      });

      const t4 = planTaskManger.createGetPlanTask(member);
      t4.getInput = () => ({
        planId: t3.result.id,
      });

      // Updates the subscription with the new planId in our database
      const t5 = subscriptionTaskManager.createUpdateSubscriptionTask(member);
      t5.getInput = () => ({
        subscription: {
          id: t1.result.id,
          subscriptionId: t1.result.subscriptionId ?? t2.result.subscriptionId,
          planId: t4.result.id,
        },
      });

      return runner.runSingleSequence([t1, t2, t3, t4, t5], log);
    },
  );

  // Changes to a subscription such as can result in prorated charges. 
  // For example, if a customer upgrades from a 10 GBP per month subscription to a 20 GBP option, 
  // they’re charged prorated amounts for the time spent on each option. 
  // Assuming the change occurred halfway through the billing period,
  // the customer is billed an additional 5 GBP: -5 GBP for unused time on the initial price, and 10 GBP for the remaining time on the new price.
  // source: https://stripe.com/docs/billing/subscriptions/prorations
  // This can be used to show the price the customer is paying in the confimation screen
  // fastify.get<{ Params: { planId: string } }>(
  //   '/plans/:planId/proration-preview',
  //   { schema: getProrationPreview },
  //   async ({ member, params: { planId }, log }) => {
  //     const t1 = subscriptionTaskManager.createGetSubscriptionTask(member, { id: member.id });
  //     const t2 = stipeTaskManager.createGetProrationPreviewTask(member, { planId });
  //     t2.getInput = () => {
  //       return {
  //         customerId: t1.result.customerId,
  //         subscriptionId: t1.result.subscriptionId,
  //       };
  //     };

  //     return runner.runSingleSequence([t1, t2], log);
  //   },
  // );


  // Use the Setup Intents API to set up a payment method for future payments. It’s similar to a payment, but no charge is created.
  // When setting up a card, for example, it may be necessary to authenticate the customer or check the card’s validity with the customer’s bank.
  // source: https://stripe.com/docs/payments/setup-intents
  // This is used by the stripe React component to add a card. 
  // This returns a code allowing the front end to do an operation on behalf of the customer
  fastify.post('/setup-intent', async ({ member, log }) => {
    // if the member doesn't have a stripe account when adding a card, create a new customer
    const t1 = subscriptionTaskManager.createGetSubscriptionTask(member, { memberId: member.id });
    const t2 = stipeTaskManager.createCreateCustomerTask(member, { member });
    t2.getInput = () => {
      t2.skip = Boolean(t1.result.customerId);
    };
    const t3 = subscriptionTaskManager.createUpdateSubscriptionTask(member);
    t3.getInput = () => {
      t3.skip = t2.skip;
      return {
        subscription: {
          id: t1.result.id,
          ...t2.result,
        },
      };
    };
    const t4 = stipeTaskManager.createCreateSetupIntentTask(member);
    t4.getInput = () => ({
      customerId: t1.result?.customerId ?? t3.result.customerId,
    });

    return runner.runSingleSequence([t1, t2, t3, t4], log);
  });

  fastify.get('/cards', async ({ member, log }) => {
    const t1 = subscriptionTaskManager.createGetSubscriptionTask(member, { memberId: member.id });
    const t2 = stipeTaskManager.createGetCardsTask(member);
    t2.getInput = () => ({ customerId: t1.result.customerId });
    return runner.runSingleSequence([t1, t2], log);
  });

  fastify.patch<{ Params: { cardId: string } }>(
    '/cards/:cardId/default',
    { schema: setDefaultCard },
    async ({ member, params: { cardId }, log }) => {
      const t1 = subscriptionTaskManager.createGetSubscriptionTask(member, { memberId: member.id });
      const t2 = stipeTaskManager.createSetDefaultCardTask(member, { cardId });
      t2.getInput = () => ({ customerId: t1.result.customerId });

      return runner.runSingleSequence([t1, t2], log);
    },
  );

  fastify.get('/customer/current', { schema: getCurrentCustomer }, async ({ member, log }) => {
    const t1 = subscriptionTaskManager.createGetSubscriptionTask(member, { memberId: member.id });
    const t2 = stipeTaskManager.createGetCustomerTask(member);
    t2.getInput = () => {
      if (t1.result.customerId) {
        return {
          customerId: t1.result.customerId,
        };
      }
      t2.skip = true;
    };
    return runner.runSingleSequence([t1, t2], log);
  });
};

export default plugin;
