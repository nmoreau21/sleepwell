import { count, desc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { impactRecords } from "@/db/schema/impact-records";
import { matches } from "@/db/schema/matches";
import { transfers } from "@/db/schema/transfers";
import { furnitureItems } from "@/db/schema/furniture-items";
import { recipientRequests } from "@/db/schema/recipient-requests";
import { users } from "@/db/schema/users";

export type ImpactRecordRow = {
  id: string;
  matchId: string;
  category: string;
  quantity: number;
  impactSummary: string;
  storyPublicApproved: boolean;
  createdAt: Date;
  donorName: string;
  recipientName: string;
};

export type OperationsMetrics = {
  submittedItems: number;
  availableItems: number;
  queuedRequests: number;
  matchesScheduled: number;
  transfersCompleted: number;
  transfersFailed: number;
  transfersCancelled: number;
  fulfilledRequests: number;
  averageDaysSubmissionToCompletion: number | null;
};

export type ImpactReport = {
  totalCompletedTransfers: number;
  totalImpactRecords: number;
  itemsByCategory: { key: string; count: number }[];
  recipientsSupported: number;
  donorsContributing: number;
  storiesApproved: number;
  storiesPending: number;
  recentRecords: ImpactRecordRow[];
  operations: OperationsMetrics;
};

export async function getImpactReport(): Promise<ImpactReport> {
  const db = getDb();

  const [completedTransfersRow] = await db
    .select({ count: count() })
    .from(transfers)
    .where(eq(transfers.status, "completed"));

  const [impactCountRow] = await db
    .select({ count: count() })
    .from(impactRecords);

  const itemsByCategory = await db
    .select({
      category: impactRecords.category,
      count: count(),
    })
    .from(impactRecords)
    .groupBy(impactRecords.category)
    .orderBy(sql`count(*) desc`);

  const [recipientsRow] = await db
    .select({
      count: sql<number>`count(distinct ${impactRecords.recipientUserId})`,
    })
    .from(impactRecords);

  const [donorsRow] = await db
    .select({
      count: sql<number>`count(distinct ${impactRecords.donorUserId})`,
    })
    .from(impactRecords);

  const [storiesApprovedRow] = await db
    .select({ count: count() })
    .from(impactRecords)
    .where(eq(impactRecords.storyPublicApproved, true));

  const [storiesPendingRow] = await db
    .select({ count: count() })
    .from(impactRecords)
    .where(eq(impactRecords.storyPublicApproved, false));

  const recentRows = await db
    .select({
      id: impactRecords.id,
      matchId: impactRecords.matchId,
      category: impactRecords.category,
      quantity: impactRecords.quantity,
      impactSummary: impactRecords.impactSummary,
      storyPublicApproved: impactRecords.storyPublicApproved,
      createdAt: impactRecords.createdAt,
      donorFirstName: users.firstName,
      donorLastName: users.lastName,
      recipientUserId: impactRecords.recipientUserId,
    })
    .from(impactRecords)
    .innerJoin(users, eq(impactRecords.donorUserId, users.id))
    .orderBy(desc(impactRecords.createdAt))
    .limit(25);

  const recipientIds = recentRows.map((row) => row.recipientUserId);
  const recipientNameMap = new Map<string, string>();

  if (recipientIds.length > 0) {
    const recipientUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(inArray(users.id, recipientIds));

    for (const user of recipientUsers) {
      recipientNameMap.set(user.id, `${user.firstName} ${user.lastName}`);
    }
  }

  const recentRecords: ImpactRecordRow[] = recentRows.map((row) => ({
    id: row.id,
    matchId: row.matchId,
    category: row.category,
    quantity: Number(row.quantity),
    impactSummary: row.impactSummary,
    storyPublicApproved: row.storyPublicApproved,
    createdAt: row.createdAt,
    donorName: `${row.donorFirstName} ${row.donorLastName}`,
    recipientName:
      recipientNameMap.get(row.recipientUserId) ?? "Recipient",
  }));

  const operations = await getOperationsMetrics(db);

  return {
    totalCompletedTransfers: Number(completedTransfersRow?.count ?? 0),
    totalImpactRecords: Number(impactCountRow?.count ?? 0),
    itemsByCategory: itemsByCategory.map((row) => ({
      key: row.category,
      count: Number(row.count),
    })),
    recipientsSupported: Number(recipientsRow?.count ?? 0),
    donorsContributing: Number(donorsRow?.count ?? 0),
    storiesApproved: Number(storiesApprovedRow?.count ?? 0),
    storiesPending: Number(storiesPendingRow?.count ?? 0),
    recentRecords,
    operations,
  };
}

async function getOperationsMetrics(
  db: ReturnType<typeof getDb>,
): Promise<OperationsMetrics> {
  const [submittedRow] = await db
    .select({ count: count() })
    .from(furnitureItems)
    .where(eq(furnitureItems.status, "submitted"));

  const [availableRow] = await db
    .select({ count: count() })
    .from(furnitureItems)
    .where(eq(furnitureItems.status, "available"));

  const [queuedRequestsRow] = await db
    .select({ count: count() })
    .from(recipientRequests)
    .where(eq(recipientRequests.status, "queued"));

  const [scheduledMatchesRow] = await db
    .select({ count: count() })
    .from(matches)
    .where(eq(matches.status, "scheduled"));

  const [completedTransfersRow] = await db
    .select({ count: count() })
    .from(transfers)
    .where(eq(transfers.status, "completed"));

  const [failedTransfersRow] = await db
    .select({ count: count() })
    .from(transfers)
    .where(eq(transfers.status, "failed"));

  const [cancelledTransfersRow] = await db
    .select({ count: count() })
    .from(transfers)
    .where(eq(transfers.status, "cancelled"));

  const [fulfilledRequestsRow] = await db
    .select({ count: count() })
    .from(recipientRequests)
    .where(eq(recipientRequests.status, "fulfilled"));

  const [avgRow] = await db
    .select({
      avgDays: sql<number>`avg(
        extract(epoch from (${transfers.completedAt} - ${furnitureItems.createdAt})) / 86400.0
      )`,
    })
    .from(transfers)
    .innerJoin(matches, eq(transfers.matchId, matches.id))
    .innerJoin(furnitureItems, eq(matches.furnitureItemId, furnitureItems.id))
    .where(eq(transfers.status, "completed"));

  const avgDays = avgRow?.avgDays;
  const averageDaysSubmissionToCompletion =
    avgDays !== null && avgDays !== undefined && Number.isFinite(Number(avgDays))
      ? Math.round(Number(avgDays) * 10) / 10
      : null;

  return {
    submittedItems: Number(submittedRow?.count ?? 0),
    availableItems: Number(availableRow?.count ?? 0),
    queuedRequests: Number(queuedRequestsRow?.count ?? 0),
    matchesScheduled: Number(scheduledMatchesRow?.count ?? 0),
    transfersCompleted: Number(completedTransfersRow?.count ?? 0),
    transfersFailed: Number(failedTransfersRow?.count ?? 0),
    transfersCancelled: Number(cancelledTransfersRow?.count ?? 0),
    fulfilledRequests: Number(fulfilledRequestsRow?.count ?? 0),
    averageDaysSubmissionToCompletion,
  };
}
