import { BaseTask } from "./base-task";
import { Stripe } from "stripe";
import { DatabaseTransactionHandler, Member } from "graasp";
import { FastifyLoggerInstance } from "fastify";
import { Plan } from "../interfaces/plan";
import { CustomerExtra } from "../interfaces/customer-extra";

export class GetPlansTask extends BaseTask<Plan[]> {
  get name(): string {
    return GetPlansTask.name;
  }

  constructor(member: Member<CustomerExtra>, stripe: Stripe) {
    super(member, null, stripe);
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = "RUNNING";

    const plans = (await this.stripe.prices.list({ expand: ["data.product"] })).data
      .filter((price) => (<Stripe.Product>price.product).metadata["type"] === "INDIVIDUAL_PLAN")
      .map<Plan>((price) => {
        return {
          id: price.id,
          name: (<Stripe.Product>price.product).name,
          price: price.unit_amount / 100 ?? 0,
          currency: price.currency,
          interval: price.recurring.interval,
          description: (<Stripe.Product>price.product).description,
          level: Number((<Stripe.Product>price.product).metadata["level"]),
        };
      })
      .sort((p1, p2) => p1.level - p2.level);

    this._result = plans;

    this.status = "OK";
  }
}
