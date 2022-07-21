import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import { CardNotFound } from '../../util/errors';
import { Card } from '../interfaces/card';
import { BaseStripeTask } from './base-stripe-task';

export type SetDefaultCardTaskInputType = {
  customerId?: string;
  cardId?: string;
};

export class SetDefaultCardTask extends BaseStripeTask<Card> {
  get name(): string {
    return SetDefaultCardTask.name;
  }

  input?: SetDefaultCardTaskInputType;
  getInput: () => SetDefaultCardTaskInputType;

  constructor(member: Actor, input: SetDefaultCardTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { customerId, cardId } = this.input;

    const paymentMethod = await this.stripeService.paymentMethods.retrieve(cardId);
    if (!paymentMethod) {
      throw new CardNotFound(cardId);
    }

    await this.stripeService.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    this._result = {
      id: paymentMethod.id,
      brand: paymentMethod.card.brand,
      lastFourDigits: paymentMethod.card.last4,
    };

    this.status = TaskStatus.OK;
  }
}
