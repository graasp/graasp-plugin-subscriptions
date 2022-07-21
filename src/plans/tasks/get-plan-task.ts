import { Actor, DatabaseTransactionHandler, TaskStatus } from '@graasp/sdk';

import { PlanNotFound } from '../../util/errors';
import { PlanService } from '../db-service';
import { Plan } from '../interfaces/plan';
import { BasePlanTask } from './base-plan-task';

export type GetPlanTaskInputType = {
  planId?: string;
};

export class GetPlanTask extends BasePlanTask<Plan> {
  get name(): string {
    return GetPlanTask.name;
  }

  input: GetPlanTaskInputType;
  getInput: () => GetPlanTaskInputType;

  constructor(member: Actor, input: GetPlanTaskInputType, dbService: PlanService) {
    super(member, dbService);
    this.input = input ?? {};
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { planId } = this.input;

    const plan = await this.planService.getByPlanId(planId, handler);
    if (!plan) {
      throw new PlanNotFound(planId);
    }

    this._result = plan;

    this.status = TaskStatus.OK;
  }
}
