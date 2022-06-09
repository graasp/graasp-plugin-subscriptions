import { Member, MemberService } from 'graasp';
import { Stripe } from 'stripe';
import { ChangePlanTask } from './tasks/change-plan-task';
import { GetPlansTask } from './tasks/get-plans-task';
import { GetOwnPlanTask } from './tasks/get-own-plan-task';
import { GetProrationPreviewTask } from './tasks/get-proration-preview-task';
import { CreateSetupIntentTask } from './tasks/create-setup-intent-task';
import { GetCardsTask } from './tasks/get-cards-task';
import { SetDefaultCardTask } from './tasks/set-default-card-task';
import { GetCustomerTask } from './tasks/get-customer-task';

export class TaskManager {
  private memberService: MemberService;
  private stripe: Stripe;

  constructor(memberService: MemberService, stripe: Stripe) {
    this.memberService = memberService;
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

  createChangePlanTask(member: Member, planId): ChangePlanTask {
    return new ChangePlanTask(member, planId, this.stripe);
  }

  createGetPlansTask(member: Member): GetPlansTask {
    return new GetPlansTask(member, this.stripe);
  }

  createGetOwnPlanTask(member: Member): GetOwnPlanTask {
    return new GetOwnPlanTask(member, this.stripe);
  }

  createGetProrationPreviewTask(member: Member, planId): GetProrationPreviewTask {
    return new GetProrationPreviewTask(member, planId, this.stripe);
  }

  createCreateSetupIntentTask(member: Member): CreateSetupIntentTask {
    return new CreateSetupIntentTask(member, this.stripe);
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
}
