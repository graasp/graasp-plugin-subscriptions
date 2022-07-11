import { DatabaseTransactionConnection as TrxHandler, sql } from 'slonik';

import { Subscription } from './interfaces/subscription';

/**
 * Database's first layer of abstraction for Invitations
 */
export class SubscriptionService {
  // the 'safe' way to dynamically generate the columns names:
  private static allColumns = sql.join(
    [
      'id',
      ['member_id', 'memberId'],
      ['customer_id', 'customerId'],
      ['subscription_id', 'subscriptionId'],
      ['plan_id', 'planId'],
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

  private static ReverseColumns = new Map<string, string>([
    ['id', 'id'],
    ['memberId', 'member_id'],
    ['customerId', 'customer_id'],
    ['subscriptionId', 'subscription_id'],
    ['planId', 'plan_id'],
    ['createdAt', 'created_at'],
    ['updatedAt', 'updated_at'],
  ]);

  async create(
    subscription: Partial<Subscription>,
    transactionHandler: TrxHandler,
  ): Promise<Subscription> {
    return transactionHandler
      .query<Subscription>(
        sql`
        INSERT INTO "member_plan" (
          "member_id",
          "plan_id"
        )
        VALUES (
            ${subscription.memberId},
            ${subscription.planId}
        )
        RETURNING ${SubscriptionService.allColumns}
      `,
      )
      .then(({ rows }) => rows[0]);
  }

  async get(id: string, transactionHandler: TrxHandler): Promise<Subscription> {
    return transactionHandler
      .query<Subscription>(
        sql`
        SELECT ${SubscriptionService.allColumns}
        FROM member_plan
        WHERE id = ${id}
      `,
      )
      .then(({ rows }) => rows[0] || null);
  }

  async getByMemberId(id: string, transactionHandler: TrxHandler): Promise<Subscription> {
    return transactionHandler
      .query<Subscription>(
        sql`
        SELECT ${SubscriptionService.allColumns}
        FROM member_plan
        WHERE member_id = ${id}
      `,
      )
      .then(({ rows }) => rows[0] || null);
  }

  async update(
    id: string,
    data: Partial<Subscription>,
    transactionHandler: TrxHandler,
  ): Promise<Subscription> {
    // dynamically build "column1 = value1, column2 = value2, ..." based on the
    // properties present in data
    const setValues = sql.join(
      Object.keys(data).map((key: keyof Subscription) =>
        sql.join(
          [sql.identifier([SubscriptionService.ReverseColumns.get(key)]), sql`${data[key]}`],
          sql` = `,
        ),
      ),
      sql`, `,
    );

    return transactionHandler
      .query<Subscription>(
        sql`
        UPDATE member_plan
        SET ${setValues}
        WHERE id = ${id}
        RETURNING ${SubscriptionService.allColumns}
      `,
      )
      .then(({ rows }) => rows[0] || null);
  }
}
