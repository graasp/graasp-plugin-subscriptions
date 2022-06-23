import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { DatabaseTransactionHandler, Member } from 'graasp';

import { Card } from '../interfaces/card';
import { CustomerExtra } from '../interfaces/customer-extra';
import { BaseTask } from './base-task';

export class GetCardsTask extends BaseTask<Card[]> {
  get name(): string {
    return GetCardsTask.name;
  }

  constructor(member: Member<CustomerExtra>, stripe: Stripe) {
    super(member, stripe);
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const {
      extra: { customerId },
    } = this.actor;

    const cards = (
      await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      })
    ).data.map<Card>((pm) => {
      return { id: pm.id, brand: pm.card.brand, lastFourDigits: pm.card.last4 };
    });

    this._result = cards;

    this.status = 'OK';
  }
}
