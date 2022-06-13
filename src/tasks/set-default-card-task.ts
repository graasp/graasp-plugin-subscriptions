import { BaseTask } from './base-task';
import { Stripe } from 'stripe';
import { DatabaseTransactionHandler, Member } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { CustomerExtra } from '../interfaces/customer-extra';
import { Card } from '../interfaces/card';
import { CardNotFound } from '../util/errors';

export class SetDefaultCardTask extends BaseTask<Card> {
  get name(): string {
    return SetDefaultCardTask.name;
  }

  constructor(member: Member<CustomerExtra>, cardId: string, stripe: Stripe) {
    super(member, stripe);
    this.targetId = cardId;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const {
      extra: { customerId },
    } = this.actor;

    const paymentMethod = await this.stripe.paymentMethods.retrieve(this.targetId);
    if (!paymentMethod) {
      throw new CardNotFound(this.targetId);
    }

    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    this._result = {
      id: paymentMethod.id,
      brand: paymentMethod.card.brand,
      lastFourDigits: paymentMethod.card.last4,
    };

    this.status = 'OK';
  }
}
