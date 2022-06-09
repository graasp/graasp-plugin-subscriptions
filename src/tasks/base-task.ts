// global
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
import { Member, MemberService } from 'graasp';
import { Stripe } from 'stripe';
import { CustomerExtra } from '../interfaces/customer-extra';

export abstract class BaseTask<R> implements Task<Actor, R> {
  protected memberService: MemberService;
  protected stripe: Stripe;
  protected _result: R;
  protected _message: string;

  readonly actor: Member<CustomerExtra>;

  status: TaskStatus;
  targetId: string;
  data: Partial<IndividualResultType<R>>;
  preHookHandler: PreHookHandlerType<R>;
  postHookHandler: PostHookHandlerType<R>;

  constructor(actor: Member<CustomerExtra>, memberService: MemberService, stripe: Stripe) {
    this.actor = actor;
    this.memberService = memberService;
    this.stripe = stripe;
    this.status = 'NEW';
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
