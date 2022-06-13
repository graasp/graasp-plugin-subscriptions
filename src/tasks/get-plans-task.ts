import { BaseTask } from './base-task';
import { Stripe } from 'stripe';
import { DatabaseTransactionHandler, Member } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { Plan } from '../interfaces/plan';
import { CustomerExtra } from '../interfaces/customer-extra';
import { INDIVIDUAL_PLAN } from '../util/constants';

export class GetPlansTask extends BaseTask<Plan[]> {
  get name(): string {
    return GetPlansTask.name;
  }

  constructor(member: Member<CustomerExtra>, stripe: Stripe) {
    super(member, stripe);
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    // This block of code takes all the Individual plans (Organisations plans or similar may exist in the future)
    // And then sort them by level, the level is a metadata used to rank the plans (ex. Free < Standard < Professional)
    // All the additional informations linked to a plan are stored in the metadata
    const plans = (await this.stripe.prices.list({ expand: ['data.product'] })).data
      .filter((price) => (<Stripe.Product>price.product).metadata['type'] === INDIVIDUAL_PLAN)
      .map<Plan>((price) => {
        return {
          id: price.id,
          name: (<Stripe.Product>price.product).name,
          // Stripe returns the price in the smallest unit of the choosen currency
          // ex: 30.00 CHF becomes 3000 cents, should the front end do the conversion ?
          price: price.unit_amount / 100 ?? 0,
          currency: price.currency,
          interval: price.recurring.interval,
          description: (<Stripe.Product>price.product).description,
          level: Number((<Stripe.Product>price.product).metadata['level']),
        };
      })
      .sort((p1, p2) => p1.level - p2.level);

    this._result = plans;

    this.status = 'OK';
  }
}
