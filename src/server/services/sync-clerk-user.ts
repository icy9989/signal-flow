import "server-only";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const clerkProfileSchema = z.object({
  id: z.string().min(1),
  primaryEmailAddressId: z.string().min(1),
  emailAddresses: z.array(z.object({
    id: z.string(),
    emailAddress: z.email(),
    verification: z.object({ status: z.string() }).nullable(),
  })),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.url().nullable(),
});

// Only call with identity and profile obtained from Clerk on the server.
// The database argument also permits rollback-only integration verification.
export async function syncClerkUser(
  db: Pick<Prisma.TransactionClient, "user">,
  authenticatedUserId: string,
  profile: unknown,
) {
  const result = clerkProfileSchema.safeParse(profile);
  if (!result.success || result.data.id !== authenticatedUserId) {
    throw new Error("Unable to verify the authenticated account profile.");
  }

  const user = result.data;
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  if (!primaryEmail || primaryEmail.verification?.status !== "verified") {
    throw new Error("A verified primary email is required to access SignalFlow.");
  }

  const data = {
    email: primaryEmail.emailAddress,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null,
    image: user.imageUrl,
  };

  // A single native upsert makes repeated/concurrent entry idempotent.
  // Never link accounts by email or overwrite another externalAuthId.
  return db.user.upsert({
    where: { externalAuthId: authenticatedUserId },
    create: { externalAuthId: authenticatedUserId, ...data },
    update: data,
    select: { id: true, externalAuthId: true, email: true, name: true, image: true },
  });
}
