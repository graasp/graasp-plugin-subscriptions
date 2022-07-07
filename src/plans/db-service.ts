import { DatabaseTransactionConnection as TrxHandler, sql } from 'slonik';

import { Plan } from './interfaces/plan';

/**
 * Database's first layer of abstraction for Invitations
 */
export class PlanService {
  // the 'safe' way to dynamically generate the columns names:
  private static allColumns = sql.join(
    [
      'id',
      ['plan_id', 'planId'],
      'storage',
      ['created_at', 'createdAt'],
      ['updated_at', 'updatedAt'],
    ].map((c) =>
      !Array.isArray(c)
        ? sql.identifier([c])
        : sql.join(
            c.map((cwa) => sql.identifier([cwa])),
            sql` AS `,
          ),
    ),
    sql`, `,
  );

  async create(plan: Partial<Plan>, transactionHandler: TrxHandler): Promise<Plan> {
    return transactionHandler
      .query<Plan>(
        sql`
        INSERT INTO "plan" (
          "plan_id",
          "storage",
        )
        VALUES (,
            ${plan.planId},
            ${plan.storage},
        )
        RETURNING ${PlanService.allColumns}
      `,
      )
      .then(({ rows }) => rows[0]);
  }

  async get(id: string, transactionHandler: TrxHandler): Promise<Plan> {
    return transactionHandler
      .query<Plan>(
        sql`
        SELECT ${PlanService.allColumns}
        FROM plan
        WHERE id = ${id}
      `,
      )
      .then(({ rows }) => rows[0] || null);
  }

  async getByPlanId(planId: string, transactionHandler: TrxHandler): Promise<Plan> {
    return transactionHandler
      .query<Plan>(
        sql`
        SELECT ${PlanService.allColumns}
        FROM plan
        WHERE plan_id = ${planId}
      `,
      )
      .then(({ rows }) => rows[0] || null);
  }

  async update(id: string, data: Partial<Plan>, transactionHandler: TrxHandler): Promise<Plan> {
    // dynamically build "column1 = value1, column2 = value2, ..." based on the
    // properties present in data
    const setValues = sql.join(
      Object.keys(data).map((key: keyof Plan) =>
        sql.join([sql.identifier([key]), sql`${data[key]}`], sql` = `),
      ),
      sql`, `,
    );

    return transactionHandler
      .query<Plan>(
        sql`
        UPDATE plan
        SET ${setValues}
        WHERE id = ${id}
        RETURNING ${PlanService.allColumns}
      `,
      )
      .then(({ rows }) => rows[0] || null);
  }
}
