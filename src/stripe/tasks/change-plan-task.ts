import { Stripe } from 'stripe';
import { Actor, DatabaseTransactionHandler } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { PaymentFailed, PlanNotFound, SubscriptionNotFound } from '../../util/errors';
import { Plan } from '../interfaces/plan';
import { BILLING_CYCLE_ANCHOR, DEFAULT_PRICE, PAYMENT_BEHAVIOR, PRORATION_BEHAVIOR } from '../../util/constants';
import { BaseStripeTask } from './base-stripe-task';

export type ChangePlanTaskInputType = {
  planId?: string;
  cardId?:string;
  subscriptionId?: string;
}

export class ChangePlanTask extends BaseStripeTask<Plan> {
  get name(): string {
    return ChangePlanTask.name;
  }

  input: ChangePlanTaskInputType;

  constructor(member: Actor, input: ChangePlanTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const { cardId, planId, subscriptionId } = this.input;

    const plan = await this.stripeService.prices.retrieve(planId, { expand: ['product'] });
    if (!plan) {
      throw new PlanNotFound(planId);
    }

    const subscription = await this.stripeService.subscriptions.retrieve(subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFound(planId);
    }

    await this.stripeService.subscriptions
      .update(subscriptionId, {
        billing_cycle_anchor: BILLING_CYCLE_ANCHOR,
        payment_behavior: PAYMENT_BEHAVIOR,
        proration_behavior: PRORATION_BEHAVIOR,
        // this allows the user to choose the card for the subscription
        default_payment_method: cardId,
        // this links the subscription id to the price id for the current user
        // the price is the id of the price: price_XXXXXXXXXXXXXXXXXXXXXXXX
        items: [{ id: subscription.items.data[0].id, price: planId }],
      })
      .catch((error) => {
        log.error(error);
        throw new PaymentFailed(planId);
      });

    this._result = {
      id: (<Stripe.Product>plan.product).id,
      name: (<Stripe.Product>plan.product).name,
      prices: [{
        id: plan.id,
        price: plan.unit_amount / 100 ?? DEFAULT_PRICE,
        currency: plan.currency,
        interval: plan.recurring.interval,
      }],
      description: (<Stripe.Product>plan.product).description,
      level: Number((<Stripe.Product>plan.product).metadata['level']),
    };

    this.status = 'OK';
  }
}
