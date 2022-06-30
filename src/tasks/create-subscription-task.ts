import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { DatabaseTransactionHandler, Member } from 'graasp';

import { CustomerExtra } from '../interfaces/customer-extra';
import { COLLECTION_METHOD } from '../util/constants';
import { BaseTask } from './base-task';

export type CreateSubscriptionTaskInputType = {
  member?: Member<CustomerExtra>;
  priceId: string;
  cardId?: string;
};

export class CreateSubscriptionTask extends BaseTask<CustomerExtra> {
  get name(): string {
    return CreateSubscriptionTask.name;
  }

  input: CreateSubscriptionTaskInputType;

  constructor(member: Member<CustomerExtra>, input: CreateSubscriptionTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const {
      member: {
        extra: { customerId },
      },
      priceId,
      cardId,
    } = this.input;

    const subscription = await this.stripe.subscriptions.create({
      collection_method: COLLECTION_METHOD,
      customer: customerId,
      default_payment_method: cardId,
      items: [{ price: priceId }],
    });

    // The stripe informations are saved in the extra, should we save them in their own table ?
    this._result = { subscriptionId: subscription.id };

    this.status = 'OK';
  }
}
