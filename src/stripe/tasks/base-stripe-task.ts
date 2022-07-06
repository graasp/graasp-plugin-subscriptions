// global
import { FastifyLoggerInstance } from 'fastify';
import {
  Actor,
  DatabaseTransactionHandler,
  IndividualResultType,
  PostHookHandlerType,
  PreHookHandlerType,
  TaskStatus,
} from 'graasp';
import Stripe from 'stripe';
import { BaseTask } from '../../tasks/base-task';

export abstract class BaseStripeTask<R> extends BaseTask<R> {
  protected stripeService: Stripe;
  protected _result: R;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;
  data: Partial<IndividualResultType<R>>;
  preHookHandler: PreHookHandlerType<R>;
  postHookHandler: PostHookHandlerType<R>;

  input?: unknown;
  getInput: () => unknown;

  constructor(actor: Actor, stripeService?: Stripe) {
    super(actor);
    this.stripeService = stripeService;
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
