// global
import { Stripe } from 'stripe';

import { FastifyLoggerInstance } from 'fastify';

import {
  Actor,
  DatabaseTransactionHandler,
  IndividualResultType,
  PostHookHandlerType,
  PreHookHandlerType,
  Task,
  TaskStatus,
} from 'graasp';
// other services
import { Member } from 'graasp';

import { CustomerExtra } from '../interfaces/customer-extra';
import { SubscriptionService } from '../db-service';

export abstract class BaseTask<R> implements Task<Actor, R> {
  protected stripe: Stripe;
  protected subscriptionService: SubscriptionService;
  protected _result: R;
  protected _message: string;

  readonly actor: Member<CustomerExtra>;

  status: TaskStatus;
  targetId: string;
  data: Partial<IndividualResultType<R>>;
  preHookHandler: PreHookHandlerType<R>;
  postHookHandler: PostHookHandlerType<R>;

  input?: unknown;

  constructor(actor: Member<CustomerExtra>, stripe: Stripe, subscriptionService?: SubscriptionService) {
    this.actor = actor;
    this.stripe = stripe;
    this.status = 'NEW';
    this.subscriptionService = subscriptionService;
  }

  abstract get name(): string;
  get result(): R {
    return this._result;
  }
  get message(): string {
    return this._message;
  }

  abstract run(
    handler: DatabaseTransactionHandler,
    log?: FastifyLoggerInstance,
  ): Promise<void | BaseTask<R>[]>;
}
