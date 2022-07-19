import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import { DEFAULT_PRICE, INDIVIDUAL_PLAN } from '../../util/constants';
import { Plan } from '../interfaces/plan';
import { BaseStripeTask } from './base-stripe-task';

export type GetPlansTaskInputType = {
  product?: string;
};

export class GetPlansTask extends BaseStripeTask<Plan[]> {
  get name(): string {
    return GetPlansTask.name;
  }

  input: GetPlansTaskInputType;

  constructor(member: Actor, stripe: Stripe, input?: GetPlansTaskInputType) {
    super(member, stripe);
    this.input = input ?? {};
  }

  async run(_handler: DatabaseTransactionHandler, _log: FastifyLoggerInstance): Promise<void> {
    this.status = TaskStatus.RUNNING;

    // This block of code takes all the Individual plans (Organisations plans or similar may exist in the future)
    // And then sort them by level, the level is a metadata used to rank the plans (ex. Free < Standard < Professional)
    // All the additional informations linked to a plan are stored in the metadata
    const plans = Array.from(
      (
        await this.stripeService.prices.list({
          product: this.input?.product ?? undefined,
          expand: ['data.product'],
        })
      ).data
        .filter((price) => (price.product as Stripe.Product).metadata['type'] === INDIVIDUAL_PLAN)
        // This lines creates a Map containing all the productsId with their prices
        // ex: { key: "prod_xxx", entry: [{ price1 }, { price2 }] }

        // This would be a better solution when implmented in node.js: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/group
        // this allows the following : (await prices).filter((price) => ).group((price) => (e.product as Stripe.Product)).map()
        .reduce(
          (entryMap, e) =>
            entryMap.set((e.product as Stripe.Product).id, [
              ...(entryMap.get((e.product as Stripe.Product).id) || []),
              e,
            ]),
          new Map(),
        ),
    )
      .map(([key, prices]) => {
        const product = prices[0].product as Stripe.Product;
        return {
          // product id
          id: key,
          name: product.name,
          // Stripe returns the price in the smallest unit of the choosen currency
          // ex: 30.00 CHF becomes 3000 cents, should the front end do the conversion ?
          prices: prices.map((price) => ({
            id: price.id,
            price: price.unit_amount / 100 ?? DEFAULT_PRICE,
            currency: price.currency,
            interval: price.recurring.interval,
          })),
          description: product.description,
          level: Number(product.metadata['level']),
        };
      })
      .sort((p1, p2) => p1.level - p2.level);

    this._result = plans;

    this.status = TaskStatus.OK;
  }
}
