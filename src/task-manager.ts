import { Stripe } from 'stripe';

import { Member } from 'graasp';

import { ChangePlanTask, ChangePlanTaskInputType } from './tasks/change-plan-task';
import { CreateCustomerTask, CreateCustomerTaskInputType } from './tasks/create-customer-task';
import {
  CreateSetupIntentTask,
  CreateSetupIntentTaskInputType,
} from './tasks/create-setup-intent-task';
import { GetCardsTask } from './tasks/get-cards-task';
import { GetCustomerTask } from './tasks/get-customer-task';
import { GetOwnPlanTask } from './tasks/get-own-plan-task';
import { GetPlansTask, GetPlansTaskInputType } from './tasks/get-plans-task';
import { GetProrationPreviewTask } from './tasks/get-proration-preview-task';
import { SetDefaultCardTask } from './tasks/set-default-card-task';
import { CreateSubscriptionTask, CreateSubscriptionTaskInputType } from './tasks/create-subscription-task';

export class TaskManager {
  private stripe: Stripe;

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

  createChangePlanTask(member: Member, input: ChangePlanTaskInputType): ChangePlanTask {
    return new ChangePlanTask(member, input, this.stripe);
  }

  createGetPlansTask(member: Member, input?: GetPlansTaskInputType): GetPlansTask {
    return new GetPlansTask(member, this.stripe, input);
  }

  createGetOwnPlanTask(member: Member): GetOwnPlanTask {
    return new GetOwnPlanTask(member, this.stripe);
  }

  createGetProrationPreviewTask(member: Member, planId: string): GetProrationPreviewTask {
    return new GetProrationPreviewTask(member, planId, this.stripe);
  }

  createCreateSetupIntentTask(
    member: Member,
    input: CreateSetupIntentTaskInputType,
  ): CreateSetupIntentTask {
    return new CreateSetupIntentTask(member, input, this.stripe);
  }

  createGetCardsTask(member: Member): GetCardsTask {
    return new GetCardsTask(member, this.stripe);
  }

  createSetDefaultCardTask(member: Member, cardId: string): SetDefaultCardTask {
    return new SetDefaultCardTask(member, cardId, this.stripe);
  }

  createGetCustomerTask(member: Member, customerId: string): GetCustomerTask {
    return new GetCustomerTask(member, customerId, this.stripe);
  }

  createCreateCustomerTask(member: Member, input: CreateCustomerTaskInputType) {
    return new CreateCustomerTask(member, input, this.stripe);
  }

  createCreateSubscriptionTask(member: Member, input:CreateSubscriptionTaskInputType){
    return new CreateSubscriptionTask(member, input, this.stripe);
  }
}
