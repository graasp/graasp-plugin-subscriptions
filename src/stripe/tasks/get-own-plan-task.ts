import { Stripe } from 'stripe';
import { Actor, DatabaseTransactionHandler } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { Plan } from '../interfaces/plan';
import { DEFAULT_PRICE } from '../../util/constants';
import { BaseStripeTask } from './base-stripe-task';

export type GetOwnPlanTaskInputType = {
  subscriptionId?: string;
};

export class GetOwnPlanTask extends BaseStripeTask<Plan> {
  get name(): string {
    return GetOwnPlanTask.name;
  }

  input?: GetOwnPlanTaskInputType;
  getInput: () => GetOwnPlanTaskInputType;

  constructor(member: Actor, input: GetOwnPlanTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const { subscriptionId } = this.input;

    const subscription = await this.stripeService.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const price = subscription.items.data[0].price;

    const plan = {
      id: (<Stripe.Product>price.product).id,
      name: (<Stripe.Product>price.product).name,
      // Stripe returns the price in the smallest unit of the choosen currency
      // ex: 30.00 CHF becomes 3000 cents, should the front end do the conversion ?
      prices: [{
        id: price.id,
        price: price.unit_amount / 100 ?? DEFAULT_PRICE,
        currency: price.currency,
        interval: price.recurring.interval,
      }],
      description: (<Stripe.Product>price.product).description,
      level: Number((<Stripe.Product>price.product).metadata['level']),
    };

    this._result = plan;

    this.status = 'OK';
  }
}
