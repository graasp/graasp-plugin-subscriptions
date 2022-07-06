import { Stripe } from 'stripe';

import { Member } from 'graasp';

import { ChangePlanTask, ChangePlanTaskInputType } from './tasks/change-plan-task';
import { CreateCustomerTask, CreateCustomerTaskInputType } from './tasks/create-customer-task';
import {
  CreateSetupIntentTask,
  CreateSetupIntentTaskInputType,
} from './tasks/create-setup-intent-task';
import { GetCardsTask, GetCardsTaskInputType } from './tasks/get-cards-task';
import { GetCustomerTask, GetCustomerTaskInputType } from './tasks/get-customer-task';
import { GetOwnPlanTask, GetOwnPlanTaskInputType } from './tasks/get-own-plan-task';
import { GetPlansTask, GetPlansTaskInputType } from './tasks/get-plans-task';
import { GetProrationPreviewTask, GetProrationPreviewTaskInputType } from './tasks/get-proration-preview-task';
import { SetDefaultCardTask, SetDefaultCardTaskInputType } from './tasks/set-default-card-task';
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

  createGetOwnPlanTask(member: Member, input: GetOwnPlanTaskInputType): GetOwnPlanTask {
    return new GetOwnPlanTask(member, input, this.stripe);
  }

  createGetProrationPreviewTask(member: Member, input: GetProrationPreviewTaskInputType): GetProrationPreviewTask {
    return new GetProrationPreviewTask(member, input, this.stripe);
  }

  createCreateSetupIntentTask(
    member: Member,
    input: CreateSetupIntentTaskInputType,
  ): CreateSetupIntentTask {
    return new CreateSetupIntentTask(member, input, this.stripe);
  }

  createGetCardsTask(member: Member, input?: GetCardsTaskInputType): GetCardsTask {
    return new GetCardsTask(member, input, this.stripe);
  }

  createSetDefaultCardTask(member: Member, input: SetDefaultCardTaskInputType): SetDefaultCardTask {
    return new SetDefaultCardTask(member, input, this.stripe);
  }

  createGetCustomerTask(member: Member, input?: GetCustomerTaskInputType): GetCustomerTask {
    return new GetCustomerTask(member, input, this.stripe);
  }

  createCreateCustomerTask(member: Member, input: CreateCustomerTaskInputType) {
    return new CreateCustomerTask(member, input, this.stripe);
  }

  createCreateSubscriptionTask(member: Member, input:CreateSubscriptionTaskInputType){
    return new CreateSubscriptionTask(member, input, this.stripe);
  }
}
