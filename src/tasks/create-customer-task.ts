import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { DatabaseTransactionHandler, Member } from 'graasp';

import { CustomerExtra } from '../interfaces/customer-extra';
import { BaseTask } from './base-task';

export type CreateCustomerTaskInputType = {
  member?: Member;
};

export class CreateCustomerTask extends BaseTask<CustomerExtra> {
  get name(): string {
    return CreateCustomerTask.name;
  }

  input: CreateCustomerTaskInputType;

  constructor(member: Member<CustomerExtra>, input: CreateCustomerTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const { member } = this.input;

    const customer = await this.stripe.customers.create({ name: member.name, email: member.email });
    // The stripe informations are saved in the extra, should we save them in their own table ?
    this._result = { customerId: customer.id };

    this.status = 'OK';
  }
}
