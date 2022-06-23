import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { DatabaseTransactionHandler, Member } from 'graasp';

import { Card } from '../interfaces/card';
import { CustomerExtra } from '../interfaces/customer-extra';
import { CardNotFound } from '../util/errors';
import { BaseTask } from './base-task';

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
