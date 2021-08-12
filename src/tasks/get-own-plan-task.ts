import { BaseTask } from "./base-task";
import { Stripe } from "stripe";
import { DatabaseTransactionHandler, Member } from "graasp";
import { FastifyLoggerInstance } from "fastify";
import { Plan } from "../interfaces/plan";
import { CustomerExtra } from "../interfaces/customer-extra";

export class GetOwnPlanTask extends BaseTask<Plan> {
  get name(): string {
    return GetOwnPlanTask.name;
  }

  constructor(member: Member<CustomerExtra>, stripe: Stripe) {
    super(member, null, stripe);
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = "RUNNING";

    const {
      extra: { subscriptionId },
    } = this.actor;

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product"],
    });

    const price = subscription.items.data[0].price;

    const plan = {
      id: price.id,
      name: (<Stripe.Product>price.product).name,
      price: price.unit_amount / 100 ?? 0,
      currency: price.currency,
      interval: price.recurring.interval,
      description: (<Stripe.Product>price.product).description,
      level: Number((<Stripe.Product>price.product).metadata["level"]),
    };

    this._result = plan;

    this.status = "OK";
  }
}
