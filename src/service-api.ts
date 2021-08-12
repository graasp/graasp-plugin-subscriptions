// global
import { FastifyPluginAsync } from "fastify";

// local
import common, {
  changePlan,
  getPlans,
  getOwnPlan,
  getProrationPreview,
  setDefaultCard,
  getCurrentCustomer,
} from "./schemas";
import { TaskManager } from "./task-manager";
import { Stripe } from "stripe";
import { Member } from "graasp";
import { CustomerExtra } from "./interfaces/customer-extra";

interface GraaspSubscriptionsOptions {
  stripeSecretKey: string;
  defaultPlanPriceId: string;
}

const plugin: FastifyPluginAsync<GraaspSubscriptionsOptions> = async (fastify, options) => {
  const { stripeSecretKey, defaultPlanPriceId } = options;
  const {
    members: { dbService: mS, taskManager: memberTaskManager },
    taskRunner: runner,
  } = fastify;

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2020-08-27" });

  const taskManager = new TaskManager(mS, stripe);

  runner.setTaskPreHookHandler<Member>(memberTaskManager.getCreateTaskName(), async (member) => {
    const customer = await stripe.customers.create({ name: member.name, email: member.email });
    const subscription = await stripe.subscriptions.create({
      collection_method: "charge_automatically",
      customer: customer.id,
      items: [{ price: defaultPlanPriceId }],
    });
    member.extra = { customerId: customer.id, subscriptionId: subscription.id };
  });

  // schemas
  fastify.addSchema(common);

  // get plans
  fastify.get("/plans", { schema: getPlans }, async ({ member, log }) => {
    const task = taskManager.createGetPlansTask(member);
    return runner.runSingle(task, log);
  });

  // get own plan
  fastify.get("/plans/own", { schema: getOwnPlan }, async ({ member, log }) => {
    const task = taskManager.createGetOwnPlanTask(member);
    return runner.runSingle(task, log);
  });

  // change plan
  fastify.patch<{ Params: { planId: string } }>(
    "/plans/:planId",
    { schema: changePlan },
    async ({ member, params: { planId }, log }) => {
      const task = taskManager.createChangePlanTask(member, planId);
      return runner.runSingle(task, log);
    }
  );

  fastify.get<{ Params: { planId: string } }>(
    "/plans/:planId/proration-preview",
    { schema: getProrationPreview },
    async ({ member, params: { planId }, log }) => {
      const task = taskManager.createGetProrationPreviewTask(member, planId);
      return runner.runSingle(task, log);
    }
  );

  fastify.post("/setup-intent", async ({ member, log }) => {
    const task = taskManager.createCreateSetupIntentTask(member);
    return runner.runSingle(task, log);
  });

  fastify.get("/cards", async ({ member, log }) => {
    const task = taskManager.createGetCardsTask(member);
    return runner.runSingle(task, log);
  });

  fastify.patch<{ Params: { cardId: string } }>(
    "/cards/:cardId/default",
    { schema: setDefaultCard },
    async ({ member, params: { cardId }, log }) => {
      const task = taskManager.createSetDefaultCardTask(member, cardId);
      return runner.runSingle(task, log);
    }
  );

  fastify.get("/customer/current", { schema: getCurrentCustomer }, async ({ member, log }) => {
    const task = taskManager.createGetCustomerTask(
      member,
      (<Member<CustomerExtra>>member).extra.customerId
    );
    return runner.runSingle(task, log);
  });
};

export default plugin;
