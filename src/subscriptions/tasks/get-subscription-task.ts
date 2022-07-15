import { Actor, DatabaseTransactionHandler } from 'graasp';

import { SubscriptionService } from '../db-service';
import { Subscription } from '../interfaces/subscription';
import { BaseSubscriptionTask } from './base-subscription-task';

export type GetSubscriptionTaskInputType = {
  memberId?: string;
};

export class GetSubscriptionTask extends BaseSubscriptionTask<Subscription> {
  get name(): string {
    return GetSubscriptionTask.name;
  }

  input: GetSubscriptionTaskInputType;
  getInput: () => GetSubscriptionTaskInputType;

  constructor(
    member: Actor,
    input: GetSubscriptionTaskInputType,
    subscriptionService: SubscriptionService,
  ) {
    super(member, subscriptionService);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const { memberId } = this.input;

    const result = await this.subscriptionService.getByMemberId(memberId, handler);

    this._result = result;

    this.status = 'OK';
  }
}
