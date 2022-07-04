import { sql, DatabaseTransactionConnection as TrxHandler } from 'slonik';
import { Subscription } from './interfaces/subscription';

/**
 * Database's first layer of abstraction for Invitations
 */
export class SubscriptionService {
  // the 'safe' way to dynamically generate the columns names:
  private static allColumns = sql.join(
    [
      'id',
      ['creator', 'creator'],
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

  /**
   * Create invitation and return it.
   * @param invitation Invitation to create
   * @param transactionHandler Database transaction handler
   */
  async create(invitation: Partial<Subscription>, transactionHandler: TrxHandler): Promise<Subscription> {
    return transactionHandler
      .query<Subscription>(
        sql`
        INSERT INTO "member_plan" (
          "creator",
          "plan_id",
          "customer_id",
          "subscription_id"
        )
        VALUES (
            ${invitation.creator},
            ${invitation.planId},
            ${invitation.customerId},
            ${invitation.subscriptionId},
        )
        RETURNING ${SubscriptionService.allColumns}
      `,
      )
      .then(({ rows }) => rows[0]);
  }

  /**
   * Get invitation by id or null if it is not found
   * @param id Invitation id
   * @param transactionHandler Database transaction handler
   */
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

   async update(
    id: string,
    data: Partial<Subscription>,
    transactionHandler: TrxHandler,
  ): Promise<Subscription> {
    // dynamically build "column1 = value1, column2 = value2, ..." based on the
    // properties present in data
    const setValues = sql.join(
      Object.keys(data).map((key: keyof Subscription) =>
        sql.join([sql.identifier([key]), sql`${data[key]}`], sql` = `),
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