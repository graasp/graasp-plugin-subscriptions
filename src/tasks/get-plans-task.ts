import { BaseTask } from './base-task';
import { Stripe } from 'stripe';
import { DatabaseTransactionHandler, Member } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { Plan } from '../interfaces/plan';
import { CustomerExtra } from '../interfaces/customer-extra';
import { DEFAULT_PRICE, INDIVIDUAL_PLAN } from '../util/constants';

export type GetPlansTaskInputType = {
    product?: string;
};

export class GetPlansTask extends BaseTask<Plan[]> {
  get name(): string {
    return GetPlansTask.name;
  }

  input: GetPlansTaskInputType;

  constructor(member: Member<CustomerExtra>, stripe: Stripe, input?: GetPlansTaskInputType) {
    super(member, stripe);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    // This block of code takes all the Individual plans (Organisations plans or similar may exist in the future)
    // And then sort them by level, the level is a metadata used to rank the plans (ex. Free < Standard < Professional)
    // All the additional informations linked to a plan are stored in the metadata
    const plans = Array.from((await this.stripe.prices.list({
        product: this.input?.product ?? undefined,
        expand: ['data.product'] 
      })).data
      .filter((price) => (<Stripe.Product>price.product).metadata['type'] === INDIVIDUAL_PLAN)
      // This lines creates a Map containing all the productsId with their prices
      // ex: { key: "prod_xxx", entry: [{ price1 }, { price2 }] }

      // This would be a better solution when implmented in node.js: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/group
      // this allows the following : (await prices).filter((price) => ).group((price) => (e.product as Stripe.Product)).map()
      .reduce((entryMap, e) => entryMap.set((<Stripe.Product>e.product).id, [...entryMap.get((<Stripe.Product>e.product).id)||[], e]), new Map()))
      .map(([key, prices]) => {
        return {
          // product id
          id: key,
          name: (<Stripe.Product>prices[0].product).name,
          // Stripe returns the price in the smallest unit of the choosen currency
          // ex: 30.00 CHF becomes 3000 cents, should the front end do the conversion ?
          prices: prices.map(price => ({
            id: price.id,
            price: price.unit_amount / 100 ?? DEFAULT_PRICE,
            currency: price.currency,
            interval: price.recurring.interval,
          })),
          description: (<Stripe.Product>prices[0].product).description,
          level: Number((<Stripe.Product>prices[0].product).metadata['level']),
        };
      })
      .sort((p1, p2) => p1.level - p2.level);

    this._result = plans;

    this.status = 'OK';
  }
}
