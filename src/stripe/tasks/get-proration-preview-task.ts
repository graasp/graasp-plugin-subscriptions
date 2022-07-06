import { Stripe } from 'stripe';
import { FastifyLoggerInstance } from 'fastify';
import { Actor, DatabaseTransactionHandler } from 'graasp';
import { Invoice } from '../interfaces/invoice';
import { PlanNotFound, SubscriptionNotFound } from '../../util/errors';
import { getProrationDate } from '../../util/utils';
import { BaseStripeTask } from './base-stripe-task';

export type GetProrationPreviewTaskInputType = {
  subscriptionId?: string,
  customerId?: string,
  planId?: string;
};

export class GetProrationPreviewTask extends BaseStripeTask<Invoice> {
  get name(): string {
    return GetProrationPreviewTask.name;
  }

  input?: GetProrationPreviewTaskInputType;
  getInput: () => GetProrationPreviewTaskInputType;

  constructor(member: Actor, input: GetProrationPreviewTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const { subscriptionId, customerId, planId }= this.input;

    const plan = await this.stripeService.prices.retrieve(planId, { expand: ['product'] });
    if (!plan) {
      throw new PlanNotFound(planId);
    }

    const subscription = await this.stripeService.subscriptions.retrieve(subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFound(planId);
    }

    const prorationDate = getProrationDate();

    const items = [
      {
        id: subscription.items.data[0].id,
        price: planId, // Switch to new price
      },
    ];

    const invoice = await this.stripeService.invoices.retrieveUpcoming({
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

    this.status = 'OK';
  }
}
