import { Actor } from '@graasp/sdk';

import { PlanService } from './db-service';
import { GetPlanTask, GetPlanTaskInputType } from './tasks/get-plan-task';

export class PlanTaskManager {
  private readonly planService = new PlanService();

  getGetPlanTaskName(): string {
    return GetPlanTask.name;
  }

  createGetPlanTask(member: Actor, input?: GetPlanTaskInputType) {
    return new GetPlanTask(member, input, this.planService);
  }
}
