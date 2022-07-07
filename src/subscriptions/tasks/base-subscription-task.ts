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

import { BaseTask } from '../../tasks/base-task';
import { SubscriptionService } from '../db-service';

export abstract class BaseSubscriptionTask<R> extends BaseTask<R> {
  protected subscriptionService: SubscriptionService;
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

  constructor(actor: Actor, subscriptionService: SubscriptionService) {
    super(actor);
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
