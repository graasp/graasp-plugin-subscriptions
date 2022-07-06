import { Actor, DatabaseTransactionHandler } from 'graasp';
import { SubscriptionService } from '../db-service';
import { Subscription } from '../interfaces/subscription';

import { BaseSubscriptionTask } from './base-subscription-task';

export type UpdateSubscriptionTaskInputType = {
  subscription: Partial<Subscription>;
};

export class UpdateSubscriptionTask extends BaseSubscriptionTask<Subscription> {
  get name(): string {
    return UpdateSubscriptionTask.name;
  }

  input: UpdateSubscriptionTaskInputType;
  getInput: () => UpdateSubscriptionTaskInputType;

  constructor(
    member: Actor,
    input: UpdateSubscriptionTaskInputType,
    subscriptionService: SubscriptionService
  ) {
    super(member, subscriptionService);
    this.input = input;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    const { subscription } = this.input;

    const result = await this.subscriptionService.update(subscription.id, subscription, handler);

    this._result = result;

    this.status = 'OK';
  }
}
