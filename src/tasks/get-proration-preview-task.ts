import { BaseTask } from "./base-task";
import { Stripe } from "stripe";
import { DatabaseTransactionHandler, Member } from "graasp";
import { FastifyLoggerInstance } from "fastify";
import { CustomerExtra } from "../interfaces/customer-extra";
import { Invoice } from "../interfaces/invoice";
import { PlanNotFound, SubscriptionNotFound } from "../util/errors";

export class GetProrationPreviewTask extends BaseTask<Invoice> {
  get name(): string {
    return GetProrationPreviewTask.name;
  }

  constructor(member: Member<CustomerExtra>, planId: string, stripe: Stripe) {
    super(member, null, stripe);
    this.targetId = planId;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = "RUNNING";

    const {
      extra: { subscriptionId, customerId },
    } = this.actor;

    const plan = await this.stripe.prices.retrieve(this.targetId, { expand: ["product"] });
    if (!plan) throw new PlanNotFound(this.targetId);

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription) throw new SubscriptionNotFound(this.targetId);

    const prorationDate = Math.floor(Date.now() / 1000);

    const items = [
      {
        id: subscription.items.data[0].id,
        price: this.targetId, // Switch to new price
      },
    ];

    const invoice = await this.stripe.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subscriptionId,
      subscription_items: items,
      subscription_proration_date: prorationDate,
    });

    this._result = {
      id: invoice.id,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
    };

    this.status = "OK";
  }
}
