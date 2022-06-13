import { BaseTask } from './base-task';
import { Stripe } from 'stripe';
import { DatabaseTransactionHandler, Member } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { CustomerExtra } from '../interfaces/customer-extra';
import { CustomerNotFound } from '../util/errors';
import { Customer } from '../interfaces/customer';

export class GetCustomerTask extends BaseTask<Customer> {
  get name(): string {
    return GetCustomerTask.name;
  }

  constructor(actor: Member<CustomerExtra>, customerId: string, stripe: Stripe) {
    super(actor, stripe);
    this.targetId = customerId;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const customer = <Stripe.Customer>await this.stripe.customers.retrieve(this.targetId);
    if (!customer) {
      throw new CustomerNotFound(this.targetId);
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
