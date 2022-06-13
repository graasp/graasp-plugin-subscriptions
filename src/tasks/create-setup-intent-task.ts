import { BaseTask } from './base-task';
import { Stripe } from 'stripe';
import { DatabaseTransactionHandler, Member } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { CustomerExtra } from '../interfaces/customer-extra';
import { Intent } from '../interfaces/intent';

export class CreateSetupIntentTask extends BaseTask<Intent> {
  get name(): string {
    return CreateSetupIntentTask.name;
  }

  constructor(member: Member<CustomerExtra>, stripe: Stripe) {
    super(member, stripe);
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const {
      extra: { customerId },
    } = this.actor;

    const intent = await this.stripe.setupIntents.create({
      customer: customerId,
    });

    this._result = { clientSecret: intent.client_secret };

    this.status = 'OK';
  }
}
