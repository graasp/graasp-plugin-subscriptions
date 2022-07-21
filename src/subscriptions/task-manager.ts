import { Actor } from '@graasp/sdk';

import { SubscriptionService } from './db-service';
import {
  CreateDefaultSubscriptionTask,
  CreateDefaultSubscriptionTaskInputType,
} from './tasks/create-default-subscription-task';
import { GetSubscriptionTask, GetSubscriptionTaskInputType } from './tasks/get-subscription-task';
import {
  UpdateSubscriptionTask,
  UpdateSubscriptionTaskInputType,
} from './tasks/update-subscription-task';

export class SubscriptionTaskManager {
  private readonly subscriptionService = new SubscriptionService();

  getCreateDefaultSubscriptionTaskName(): string {
    return CreateDefaultSubscriptionTask.name;
  }

  getGetSubscriptionTaskName(): string {
    return GetSubscriptionTask.name;
  }

  getUpdateSubscriptionTaskName(): string {
    return UpdateSubscriptionTask.name;
  }

  createCreateDefaultSubscriptionTask(
    member: Actor,
    input?: CreateDefaultSubscriptionTaskInputType,
  ) {
    return new CreateDefaultSubscriptionTask(member, input, this.subscriptionService);
  }

  createGetSubscriptionTask(member: Actor, input?: GetSubscriptionTaskInputType) {
    return new GetSubscriptionTask(member, input, this.subscriptionService);
  }

  createUpdateSubscriptionTask(member: Actor, input?: UpdateSubscriptionTaskInputType) {
    return new UpdateSubscriptionTask(member, input, this.subscriptionService);
  }
}
