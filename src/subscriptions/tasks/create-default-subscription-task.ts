import { Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import { SubscriptionService } from '../db-service';
import { Subscription } from '../interfaces/subscription';
import { BaseSubscriptionTask } from './base-subscription-task';

export type CreateDefaultSubscriptionTaskInputType = {
  defaultPlanId?: string;
};

export class CreateDefaultSubscriptionTask extends BaseSubscriptionTask<Subscription> {
  get name(): string {
    return CreateDefaultSubscriptionTask.name;
  }

  input: CreateDefaultSubscriptionTaskInputType;
  getInput: () => CreateDefaultSubscriptionTaskInputType;

  constructor(
    member: Actor,
    input: CreateDefaultSubscriptionTaskInputType,
    subscriptionService: SubscriptionService,
  ) {
    super(member, subscriptionService);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { defaultPlanId } = this.input;

    const result = await this.subscriptionService.create(
      {
        memberId: this.actor.id,
        planId: defaultPlanId,
      },
      handler,
    );

    this._result = result;

    this.status = TaskStatus.OK;
  }
}
