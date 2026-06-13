import { and, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { partnerOrganizations } from "@/db/schema/partner-organizations";
import { partnerReferrals } from "@/db/schema/partner-referrals";
import { recipientProfiles } from "@/db/schema/recipient-profiles";
import { recipientRequests } from "@/db/schema/recipient-requests";
import { requestNeedLines } from "@/db/schema/request-need-lines";
import { userRoles } from "@/db/schema/user-roles";
import { users } from "@/db/schema/users";
import { RECIPIENT_ROLE_ID } from "@/lib/auth/constants";
import type { ReferralFormInput } from "@/lib/validation/referral";
import { logAuditEvent } from "@/services/audit/log-event";
import { logCommunicationEvent } from "@/services/communications/log-event";

const REQUEST_EXPIRY_DAYS = 60;

function buildPartnerReferralNotes(input: ReferralFormInput): string | undefined {
  if (input.intakeMode !== "partner") {
    return undefined;
  }

  const parts: string[] = [];

  if (input.partnerContactName) {
    parts.push(`Partner contact: ${input.partnerContactName}`);
  }

  if (input.partnerContactEmail) {
    parts.push(`Partner contact email: ${input.partnerContactEmail}`);
  }

  if (input.partnerNotes) {
    parts.push(input.partnerNotes);
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join("\n");
}

function buildRequestNotes(input: ReferralFormInput): string | undefined {
  const parts: string[] = [];

  if (input.intakeMode === "self") {
    parts.push("Intake path: direct recipient request (pending verification).");
  }

  if (input.notes) {
    parts.push(input.notes);
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join("\n\n");
}

export async function createReferralFromPublicForm(input: ReferralFormInput) {
  const db = getDb();

  return db.transaction(async (tx) => {
    let partnerOrganizationId: string | null = null;

    if (input.intakeMode === "partner") {
      const normalizedCode = input.referralCode!.trim().toUpperCase();

      const [partnerOrg] = await tx
        .select()
        .from(partnerOrganizations)
        .where(
          and(
            sql`upper(${partnerOrganizations.referralCode}) = ${normalizedCode}`,
            eq(partnerOrganizations.status, "active"),
          ),
        )
        .limit(1);

      if (!partnerOrg) {
        throw new Error("INVALID_PARTNER_CODE");
      }

      partnerOrganizationId = partnerOrg.id;
    }

    const [existingUser] = await tx
      .select()
      .from(users)
      .where(
        and(
          sql`lower(${users.email}) = ${input.email}`,
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    let userId: string;
    let recipientProfileId: string;

    const housingVerified =
      input.intakeMode === "partner" && Boolean(input.housingConfirmed);

    if (existingUser) {
      userId = existingUser.id;

      await tx
        .update(users)
        .set({
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? existingUser.phone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      const [existingProfile] = await tx
        .select()
        .from(recipientProfiles)
        .where(eq(recipientProfiles.userId, userId))
        .limit(1);

      if (existingProfile) {
        recipientProfileId = existingProfile.id;

        await tx
          .update(recipientProfiles)
          .set({
            householdSize: input.householdSize ?? existingProfile.householdSize,
            hasVehicle: input.hasVehicle,
            canPickupLargeItems: input.canPickupLargeItems,
            needsDelivery: input.needsDelivery,
            accessNotes: input.accessNotes ?? existingProfile.accessNotes,
            housingVerified: housingVerified || existingProfile.housingVerified,
            housingVerifiedAt:
              housingVerified && !existingProfile.housingVerified
                ? new Date()
                : existingProfile.housingVerifiedAt,
            primaryPartnerOrgId:
              partnerOrganizationId ?? existingProfile.primaryPartnerOrgId,
            updatedAt: new Date(),
          })
          .where(eq(recipientProfiles.id, recipientProfileId));
      } else {
        const [newProfile] = await tx
          .insert(recipientProfiles)
          .values({
            userId,
            householdSize: input.householdSize,
            hasVehicle: input.hasVehicle,
            canPickupLargeItems: input.canPickupLargeItems,
            needsDelivery: input.needsDelivery,
            accessNotes: input.accessNotes,
            housingVerified,
            housingVerifiedAt: housingVerified ? new Date() : null,
            primaryPartnerOrgId: partnerOrganizationId,
          })
          .returning();

        if (!newProfile) {
          throw new Error("Failed to create recipient profile");
        }

        recipientProfileId = newProfile.id;
        await tx.insert(userRoles).values({ userId, roleId: RECIPIENT_ROLE_ID });
      }
    } else {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: input.email,
          phone: input.phone,
          firstName: input.firstName,
          lastName: input.lastName,
          communicationPreference: "email",
        })
        .returning();

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      userId = newUser.id;

      const [newProfile] = await tx
        .insert(recipientProfiles)
        .values({
          userId,
          householdSize: input.householdSize,
          hasVehicle: input.hasVehicle,
          canPickupLargeItems: input.canPickupLargeItems,
          needsDelivery: input.needsDelivery,
          accessNotes: input.accessNotes,
          housingVerified,
          housingVerifiedAt: housingVerified ? new Date() : null,
          primaryPartnerOrgId: partnerOrganizationId,
        })
        .returning();

      if (!newProfile) {
        throw new Error("Failed to create recipient profile");
      }

      recipientProfileId = newProfile.id;
      await tx.insert(userRoles).values({ userId, roleId: RECIPIENT_ROLE_ID });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REQUEST_EXPIRY_DAYS);

    const requestStatus =
      input.intakeMode === "partner" ? "submitted" : "pending_verification";

    let partnerReferralId: string | null = null;

    if (input.intakeMode === "partner" && partnerOrganizationId) {
      const [referral] = await tx
        .insert(partnerReferrals)
        .values({
          partnerOrganizationId,
          recipientProfileId,
          status: "submitted",
          clientFirstName: input.firstName,
          clientLastName: input.lastName,
          clientPhone: input.phone,
          moveInDate: input.moveInDate ?? null,
          urgency: input.urgency,
          housingConfirmed: input.housingConfirmed ?? false,
          notes: buildPartnerReferralNotes(input),
        })
        .returning();

      if (!referral) {
        throw new Error("Failed to create partner referral");
      }

      partnerReferralId = referral.id;
    }

    const [request] = await tx
      .insert(recipientRequests)
      .values({
        recipientProfileId,
        partnerOrganizationId,
        partnerReferralId,
        status: requestStatus,
        priority: input.urgency,
        moveInDate: input.moveInDate ?? null,
        housingAddressLine1: input.housingAddressLine1 ?? null,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        accessNotes: input.accessNotes ?? null,
        needsDelivery: input.needsDelivery,
        submittedByUserId: userId,
        expiresAt,
        notes: buildRequestNotes(input),
      })
      .returning();

    if (!request) {
      throw new Error("Failed to create recipient request");
    }

    if (partnerReferralId) {
      await tx
        .update(partnerReferrals)
        .set({
          recipientRequestId: request.id,
          updatedAt: new Date(),
        })
        .where(eq(partnerReferrals.id, partnerReferralId));

      await logAuditEvent(tx as unknown as ReturnType<typeof getDb>, {
        action: "partner_referral.submitted",
        entityType: "partner_referral",
        entityId: partnerReferralId,
        newValues: {
          status: "submitted",
          partnerOrganizationId,
          recipientRequestId: request.id,
        },
        metadata: { source: "public_refer_form" },
      });
    }

    for (const need of input.needLines) {
      await tx.insert(requestNeedLines).values({
        recipientRequestId: request.id,
        category: need.category,
        essential: need.essential,
        quantityNeeded: need.quantityNeeded,
        status: "open",
        sizePreference: need.sizePreference ?? null,
        notes: need.notes ?? null,
      });
    }

    await logAuditEvent(tx as unknown as ReturnType<typeof getDb>, {
      action: "recipient_request.submitted",
      entityType: "recipient_request",
      entityId: request.id,
      newValues: {
        status: request.status,
        priority: request.priority,
        zipCode: request.zipCode,
        intakeMode: input.intakeMode,
        needCount: input.needLines.length,
      },
      metadata: { source: "public_refer_form" },
    });

    await logCommunicationEvent(tx as unknown as ReturnType<typeof getDb>, {
      userId,
      channel: "email",
      direction: "outbound",
      templateCode:
        input.intakeMode === "partner"
          ? "referral_received"
          : "recipient_request_received",
      subject: "Sleepwell furniture request received",
      bodyPreview: `Request received with ${input.needLines.length} need line(s).`,
      relatedEntityType: "recipient_request",
      relatedEntityId: request.id,
      status: "queued",
    });

    return {
      requestId: request.id,
      userId,
      partnerReferralId,
    };
  });
}
