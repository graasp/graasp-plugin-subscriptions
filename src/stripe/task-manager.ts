import { Stripe } from 'stripe';

import { Actor } from 'graasp';

import { ChangePlanTask, ChangePlanTaskInputType } from './tasks/change-plan-task';
import { CreateCustomerTask, CreateCustomerTaskInputType } from './tasks/create-customer-task';
import {
  CreateSetupIntentTask,
  CreateSetupIntentTaskInputType,
} from './tasks/create-setup-intent-task';
import {
  CreateSubscriptionTask,
  CreateSubscriptionTaskInputType,
} from './tasks/create-subscription-task';
import { GetCardsTask, GetCardsTaskInputType } from './tasks/get-cards-task';
import { GetCustomerTask, GetCustomerTaskInputType } from './tasks/get-customer-task';
import { GetOwnPlanTask, GetOwnPlanTaskInputType } from './tasks/get-own-plan-task';
import { GetPlansTask, GetPlansTaskInputType } from './tasks/get-plans-task';
import {
  GetProrationPreviewTask,
  GetProrationPreviewTaskInputType,
} from './tasks/get-proration-preview-task';
import { SetDefaultCardTask, SetDefaultCardTaskInputType } from './tasks/set-default-card-task';

export class StripeTaskManager {
  private readonly stripe: Stripe;

  constructor(stripe: Stripe) {
    this.stripe = stripe;
  }

  getGetPlansTaskName(): string {
    return GetPlansTask.name;
  }

  getChangePlanTaskName(): string {
    return ChangePlanTask.name;
  }

  getGetOwnPlanTaskName(): string {
    return GetOwnPlanTask.name;
  }

  getGetProrationPreviewTaskName(): string {
    return GetProrationPreviewTask.name;
  }

  getCreateSetupIntentTaskName(): string {
    return CreateSetupIntentTask.name;
  }

  getGetCardsTaskName(): string {
    return GetCardsTask.name;
  }

  getSetDefaultCardTaskName(): string {
    return SetDefaultCardTask.name;
  }

  getGetCustomerTaskName(): string {
    return GetCustomerTask.name;
  }

  getCreateCustomerTaskName(): string {
    return CreateCustomerTask.name;
  }

  createChangePlanTask(member: Actor, input?: ChangePlanTaskInputType): ChangePlanTask {
    return new ChangePlanTask(member, input, this.stripe);
  }

  createGetPlansTask(member: Actor, input?: GetPlansTaskInputType): GetPlansTask {
    return new GetPlansTask(member, this.stripe, input);
  }

  createGetOwnPlanTask(member: Actor, input?: GetOwnPlanTaskInputType): GetOwnPlanTask {
    return new GetOwnPlanTask(member, input, this.stripe);
  }

  createGetProrationPreviewTask(
    member: Actor,
    input?: GetProrationPreviewTaskInputType,
  ): GetProrationPreviewTask {
    return new GetProrationPreviewTask(member, input, this.stripe);
  }

  createCreateSetupIntentTask(
    member: Actor,
    input?: CreateSetupIntentTaskInputType,
  ): CreateSetupIntentTask {
    return new CreateSetupIntentTask(member, input, this.stripe);
  }

  createGetCardsTask(member: Actor, input?: GetCardsTaskInputType): GetCardsTask {
    return new GetCardsTask(member, input, this.stripe);
  }

  createSetDefaultCardTask(member: Actor, input?: SetDefaultCardTaskInputType): SetDefaultCardTask {
    return new SetDefaultCardTask(member, input, this.stripe);
  }

  createGetCustomerTask(member: Actor, input?: GetCustomerTaskInputType): GetCustomerTask {
    return new GetCustomerTask(member, input, this.stripe);
  }

  createCreateCustomerTask(member: Actor, input?: CreateCustomerTaskInputType) {
    return new CreateCustomerTask(member, input, this.stripe);
  }

  createCreateSubscriptionTask(member: Actor, input?: CreateSubscriptionTaskInputType) {
    return new CreateSubscriptionTask(member, input, this.stripe);
  }
}
