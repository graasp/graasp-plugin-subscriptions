import { Stripe } from 'stripe';
import { FastifyLoggerInstance } from 'fastify';
import { Actor, DatabaseTransactionHandler } from 'graasp';
import { COLLECTION_METHOD } from '../../util/constants';
import { BaseStripeTask } from './base-stripe-task';
import { Subscription } from '../../subscriptions/interfaces/subscription';

export type CreateSubscriptionTaskInputType = {
  customerId?: string;
  priceId?: string;
  cardId?: string;
};

export class CreateSubscriptionTask extends BaseStripeTask<Partial<Subscription>> {
  get name(): string {
    return CreateSubscriptionTask.name;
  }

  input: CreateSubscriptionTaskInputType;
  getInput: () => CreateSubscriptionTaskInputType;

  constructor(member: Actor, input: CreateSubscriptionTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const {
      customerId,
      priceId,
      cardId,
    } = this.input;

    const subscription = await this.stripeService.subscriptions.create({
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

