import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler, Member, TaskStatus } from '@graasp/sdk';

import { Subscription } from '../../subscriptions/interfaces/subscription';
import { BaseStripeTask } from './base-stripe-task';

export type CreateCustomerTaskInputType = {
  member?: Member;
};

export class CreateCustomerTask extends BaseStripeTask<Partial<Subscription>> {
  get name(): string {
    return CreateCustomerTask.name;
  }

  input: CreateCustomerTaskInputType;

  constructor(member: Actor, input: CreateCustomerTaskInputType, stripe: Stripe) {
    super(member, stripe);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { member } = this.input;

    const customer = await this.stripeService.customers.create({
      name: member.name,
      email: member.email,
    });

    this._result = { customerId: customer.id };

    this.status = TaskStatus.OK;
  }
}
