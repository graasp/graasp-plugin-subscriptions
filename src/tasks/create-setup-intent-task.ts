import { BaseTask } from './base-task';
import { Stripe } from 'stripe';
import { DatabaseTransactionHandler, Member } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { CustomerExtra } from '../interfaces/customer-extra';
import { Intent } from '../interfaces/intent';

export type CreateSetupIntentTaskInputType = {
  customerId?: string;
};

export class CreateSetupIntentTask extends BaseTask<Intent> {
  get name(): string {
    return CreateSetupIntentTask.name;
  }

  input: CreateSetupIntentTaskInputType;

  constructor(member: Member<CustomerExtra>, input: CreateSetupIntentTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const { customerId } = this.input;

    const intent = await this.stripe.setupIntents.create({
      customer: customerId,
    });

    this._result = { clientSecret: intent.client_secret };

    this.status = 'OK';
  }
}
