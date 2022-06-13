import { BaseTask } from './base-task';
import { Stripe } from 'stripe';
import { DatabaseTransactionHandler, Member } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { PaymentFailed, PlanNotFound, SubscriptionNotFound } from '../util/errors';
import { CustomerExtra } from '../interfaces/customer-extra';
import { Plan } from '../interfaces/plan';
import { BILLING_CYCLE_ANCHOR, PAYMENT_BEHAVIOR, PRORATION_BEHAVIOR } from '../util/constants';

export class ChangePlanTask extends BaseTask<Plan> {
  get name(): string {
    return ChangePlanTask.name;
  }

  constructor(member: Member<CustomerExtra>, planId: string, stripe: Stripe) {
    super(member, stripe);
    this.targetId = planId;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const {
      extra: { subscriptionId },
    } = this.actor;

    const plan = await this.stripe.prices.retrieve(this.targetId, { expand: ['product'] });
    if (!plan) {
      throw new PlanNotFound(this.targetId);
    }

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFound(this.targetId);
    }

    await this.stripe.subscriptions
      .update(subscriptionId, {
        billing_cycle_anchor: BILLING_CYCLE_ANCHOR,
        payment_behavior: PAYMENT_BEHAVIOR,
        proration_behavior: PRORATION_BEHAVIOR,
        // this links the subscription id to the price id for the current user
        // the price is the id of the price: price_2KJwvZGcObdOErGj42lU6fER
        items: [{ id: subscription.items.data[0].id, price: this.targetId }],
      })
      .catch((error) => {
        console.log(error);
        throw new PaymentFailed(this.targetId);
      });

    this._result = {
      id: plan.id,
      name: (<Stripe.Product>plan.product).name,
      price: plan.unit_amount ?? 0,
      currency: plan.currency,
      interval: plan.recurring.interval,
      description: (<Stripe.Product>plan.product).description,
      level: Number((<Stripe.Product>plan.product).metadata['level']),
    };

    this.status = 'OK';
  }
}
