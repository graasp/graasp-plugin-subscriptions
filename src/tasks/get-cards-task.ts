import { BaseTask } from './base-task';
import { Stripe } from 'stripe';
import { DatabaseTransactionHandler, Member } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { CustomerExtra } from '../interfaces/customer-extra';
import { Card } from '../interfaces/card';

export class GetCardsTask extends BaseTask<Card[]> {
  get name(): string {
    return GetCardsTask.name;
  }

  constructor(member: Member<CustomerExtra>, stripe: Stripe) {
    super(member, null, stripe);
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
