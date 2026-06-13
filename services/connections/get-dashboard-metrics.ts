import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { furnitureItems } from "@/db/schema/furniture-items";
import { recipientRequests } from "@/db/schema/recipient-requests";
import { requestNeedLines } from "@/db/schema/request-need-lines";
import {
  RECIPIENT_REQUEST_QUEUE_STATUSES,
} from "@/types/statuses";

export type CountByKey = {
  key: string;
  count: number;
};

export type LocationCount = {
  city: string;
  state: string;
  zipCode: string;
  count: number;
};

export type ConnectionDashboardMetrics = {
  supply: {
    submitted: number;
    approved: number;
    available: number;
    byCategory: CountByKey[];
    byLocation: LocationCount[];
  };
  demand: {
    pending: number;
    approved: number;
    queued: number;
    needLinesByCategory: CountByKey[];
    byUrgency: CountByKey[];
    byLocation: LocationCount[];
  };
};

const SUPPLY_PIPELINE_STATUSES = ["submitted", "approved", "available"] as const;

const ACTIVE_DEMAND_REQUEST_STATUSES = [
  ...RECIPIENT_REQUEST_QUEUE_STATUSES,
  "approved",
  "queued",
] as const;

export async function getConnectionDashboardMetrics(): Promise<ConnectionDashboardMetrics> {
  const db = getDb();

  const supplyBase = and(
    isNull(furnitureItems.deletedAt),
    inArray(furnitureItems.status, [...SUPPLY_PIPELINE_STATUSES]),
  );

  const [submittedRow] = await db
    .select({ count: count() })
    .from(furnitureItems)
    .where(
      and(isNull(furnitureItems.deletedAt), eq(furnitureItems.status, "submitted")),
    );

  const [approvedRow] = await db
    .select({ count: count() })
    .from(furnitureItems)
    .where(
      and(isNull(furnitureItems.deletedAt), eq(furnitureItems.status, "approved")),
    );

  const [availableRow] = await db
    .select({ count: count() })
    .from(furnitureItems)
    .where(
      and(isNull(furnitureItems.deletedAt), eq(furnitureItems.status, "available")),
    );

  const supplyByCategory = await db
    .select({
      category: furnitureItems.category,
      count: count(),
    })
    .from(furnitureItems)
    .where(supplyBase)
    .groupBy(furnitureItems.category)
    .orderBy(sql`count(*) desc`);

  const supplyByLocation = await db
    .select({
      city: furnitureItems.city,
      state: furnitureItems.state,
      zipCode: furnitureItems.zipCode,
      count: count(),
    })
    .from(furnitureItems)
    .where(supplyBase)
    .groupBy(furnitureItems.city, furnitureItems.state, furnitureItems.zipCode)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  const pendingStatuses = [...RECIPIENT_REQUEST_QUEUE_STATUSES];

  const [pendingRow] = await db
    .select({ count: count() })
    .from(recipientRequests)
    .where(inArray(recipientRequests.status, pendingStatuses));

  const [demandApprovedRow] = await db
    .select({ count: count() })
    .from(recipientRequests)
    .where(eq(recipientRequests.status, "approved"));

  const [queuedRow] = await db
    .select({ count: count() })
    .from(recipientRequests)
    .where(eq(recipientRequests.status, "queued"));

  const activeDemandRequestFilter = inArray(
    recipientRequests.status,
    [...ACTIVE_DEMAND_REQUEST_STATUSES],
  );

  const needLinesByCategory = await db
    .select({
      category: requestNeedLines.category,
      count: count(),
    })
    .from(requestNeedLines)
    .innerJoin(
      recipientRequests,
      eq(requestNeedLines.recipientRequestId, recipientRequests.id),
    )
    .where(
      and(eq(requestNeedLines.status, "open"), activeDemandRequestFilter),
    )
    .groupBy(requestNeedLines.category)
    .orderBy(sql`count(*) desc`);

  const byUrgency = await db
    .select({
      priority: recipientRequests.priority,
      count: count(),
    })
    .from(recipientRequests)
    .where(activeDemandRequestFilter)
    .groupBy(recipientRequests.priority)
    .orderBy(sql`count(*) desc`);

  const demandByLocation = await db
    .select({
      city: recipientRequests.city,
      state: recipientRequests.state,
      zipCode: recipientRequests.zipCode,
      count: count(),
    })
    .from(recipientRequests)
    .where(activeDemandRequestFilter)
    .groupBy(
      recipientRequests.city,
      recipientRequests.state,
      recipientRequests.zipCode,
    )
    .orderBy(sql`count(*) desc`)
    .limit(20);

  return {
    supply: {
      submitted: Number(submittedRow?.count ?? 0),
      approved: Number(approvedRow?.count ?? 0),
      available: Number(availableRow?.count ?? 0),
      byCategory: supplyByCategory.map((row) => ({
        key: row.category,
        count: Number(row.count),
      })),
      byLocation: supplyByLocation.map((row) => ({
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        count: Number(row.count),
      })),
    },
    demand: {
      pending: Number(pendingRow?.count ?? 0),
      approved: Number(demandApprovedRow?.count ?? 0),
      queued: Number(queuedRow?.count ?? 0),
      needLinesByCategory: needLinesByCategory.map((row) => ({
        key: row.category,
        count: Number(row.count),
      })),
      byUrgency: byUrgency.map((row) => ({
        key: row.priority,
        count: Number(row.count),
      })),
      byLocation: demandByLocation.map((row) => ({
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        count: Number(row.count),
      })),
    },
  };
}
