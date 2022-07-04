import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { DatabaseTransactionHandler, Member } from 'graasp';

import { CustomerExtra } from '../interfaces/customer-extra';
import { BaseTask } from './base-task';
import { SubscriptionService } from '../db-service';

export type CreateCustomerTaskInputType = {
  member?: Member;
};

export class CreateCustomerTask extends BaseTask<CustomerExtra> {
  get name(): string {
    return CreateCustomerTask.name;
  }

  input: CreateCustomerTaskInputType;

  constructor(member: Member<CustomerExtra>, input: CreateCustomerTaskInputType, stripe: Stripe, subscriptionService: SubscriptionService) {
    super(member, stripe, subscriptionService);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const { member } = this.input;

    const customer = await this.stripe.customers.create({ name: member.name, email: member.email });

    // create in database
    // memberId, customer_id
    await this.subscriptionService.create({
      creator: member.id,
      customerId: customer.id,
      planId: '',
    }, handler);

    // The stripe informations are saved in the extra, should we save them in their own table ?
    this._result = { customerId: customer.id };

    this.status = 'OK';
  }
}
