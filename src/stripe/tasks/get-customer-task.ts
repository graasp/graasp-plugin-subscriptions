import { Stripe } from 'stripe';
import { Actor, DatabaseTransactionHandler } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
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

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const { customerId } = this.input;

    const customer = <Stripe.Customer>await this.stripeService.customers.retrieve(customerId);
    if (!customer) {
      throw new CustomerNotFound(customerId);
    }

    this._result = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      defaultCard: <string>customer.invoice_settings.default_payment_method,
    };

    this.status = 'OK';
  }
}
