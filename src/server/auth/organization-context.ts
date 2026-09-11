import "server-only";

import { cookies } from "next/headers";
import { requireApplicationUser } from "@/server/auth/require-application-user";
import { getDb } from "@/server/db/client";
import { createOrganizationService } from "@/server/services/organization-service";

export const ACTIVE_WORKSPACE_COOKIE = "signalflow-workspace";
export const organizationService = createOrganizationService({ requireUser: requireApplicationUser, database: getDb });
export const requireOrganizationMembership = organizationService.requireOrganizationMembership;
export const requireOrganizationRole = organizationService.requireOrganizationRole;

export async function resolveActiveOrganization() {
  const preference = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  return organizationService.resolveActiveOrganization(preference);
}

export async function switchActiveOrganization(organizationId: unknown) {
  const context = await requireOrganizationMembership({ organizationId });
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, context.organization.id, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/app", maxAge: 60 * 60 * 24 * 30,
  });
}
