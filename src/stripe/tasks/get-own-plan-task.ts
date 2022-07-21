import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import { DEFAULT_PRICE } from '../../util/constants';
import { Plan } from '../interfaces/plan';
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

  async run(_handler: DatabaseTransactionHandler, _log: FastifyLoggerInstance): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { subscriptionId } = this.input;

    const subscription = await this.stripeService.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const price = subscription.items.data[0].price;

    // Stripe returns the price in the smallest unit of the choosen currency
    // ex: 30.00 CHF becomes 3000 cents, should the front end do the conversion ?
    const product = price.product as Stripe.Product;
    const plan = {
      id: product.id,
      name: product.name,
      prices: [
        {
          id: price.id,
          price: price.unit_amount / 100 ?? DEFAULT_PRICE,
          currency: price.currency,
          interval: price.recurring.interval,
        },
      ],
      description: product.description,
      level: Number(product.metadata['level']),
    };

    this._result = plan;

    this.status = TaskStatus.OK;
  }
}
