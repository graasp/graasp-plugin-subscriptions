import { BaseTask } from './base-task';
import { Stripe } from 'stripe';
import { DatabaseTransactionHandler, Member } from 'graasp';
import { FastifyLoggerInstance } from 'fastify';
import { CustomerExtra } from '../interfaces/customer-extra';
import { COLLECTION_METHOD } from '../util/constants';

export type CreateCustomerTaskInputType = {
  member?: Member;
  stripeDefaultPlanPriceId: string;
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

    const { member, stripeDefaultPlanPriceId } = this.input;

    const customer = await this.stripe.customers.create({ name: member.name, email: member.email });
    const subscription = await this.stripe.subscriptions.create({
      collection_method: COLLECTION_METHOD,
      customer: customer.id,
      items: [{ price: stripeDefaultPlanPriceId }],
    });
    // The stripe informations are saved in the extra, should we save them in their own table ?
    this._result = { customerId: customer.id, subscriptionId: subscription.id };

    this.status = 'OK';
  }
}
