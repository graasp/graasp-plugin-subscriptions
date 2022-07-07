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
import { PlanService } from '../db-service';

export abstract class BasePlanTask<R> extends BaseTask<R> {
  protected planService: PlanService;
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

  constructor(actor: Actor, planService?: PlanService) {
    super(actor);
    this.planService = planService;
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
