import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import { Intent } from '../interfaces/intent';
import { BaseStripeTask } from './base-stripe-task';

export type CreateSetupIntentTaskInputType = {
  customerId?: string;
};

export class CreateSetupIntentTask extends BaseStripeTask<Intent> {
  get name(): string {
    return CreateSetupIntentTask.name;
  }

  input: CreateSetupIntentTaskInputType;

  constructor(member: Actor, input: CreateSetupIntentTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { customerId } = this.input;

    const intent = await this.stripeService.setupIntents.create({
      customer: customerId,
    });

    this._result = { clientSecret: intent.client_secret };

    this.status = TaskStatus.OK;
  }
}
