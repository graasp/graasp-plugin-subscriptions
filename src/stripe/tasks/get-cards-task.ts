import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler } from 'graasp';

import { Card } from '../interfaces/card';
import { BaseStripeTask } from './base-stripe-task';

export type GetCardsTaskInputType = {
  customerId?: string;
};

export class GetCardsTask extends BaseStripeTask<Card[]> {
  get name(): string {
    return GetCardsTask.name;
  }

  input?: GetCardsTaskInputType;
  getInput: () => GetCardsTaskInputType;

  constructor(member: Actor, input: GetCardsTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const { customerId } = this.input;

    const cards = (
      await this.stripeService.paymentMethods.list({
        customer: customerId,
        type: 'card',
      })
    ).data.map<Card>((pm) => ({ id: pm.id, brand: pm.card.brand, lastFourDigits: pm.card.last4 }));

    this._result = cards;

    this.status = 'OK';
  }
}
