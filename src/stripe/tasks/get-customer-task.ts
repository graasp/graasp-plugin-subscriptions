import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import { CustomerNotFound } from '../../util/errors';
import { Customer } from '../interfaces/customer';
import { BaseStripeTask } from './base-stripe-task';

export type GetCustomerTaskInputType = {
  customerId?: string;
};

export class GetCustomerTask extends BaseStripeTask<Customer> {
  get name(): string {
    return GetCustomerTask.name;
  }

  input?: GetCustomerTaskInputType;
  getInput: () => GetCustomerTaskInputType;

  constructor(actor: Actor, input: GetCustomerTaskInputType, stripe: Stripe) {
    super(actor, stripe);
    this.input = input ?? {};
  }

  async run(_handler: DatabaseTransactionHandler, _log: FastifyLoggerInstance): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { customerId } = this.input;

    const customer = (await this.stripeService.customers.retrieve(customerId)) as Stripe.Customer;
    if (!customer) {
      throw new CustomerNotFound(customerId);
    }

    this._result = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      defaultCard: customer.invoice_settings.default_payment_method as string,
    };

    this.status = TaskStatus.OK;
  }
}
