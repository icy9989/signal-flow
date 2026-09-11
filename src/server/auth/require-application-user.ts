import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { getDb } from "@/server/db/client";
import { syncClerkUser } from "@/server/services/sync-clerk-user";

export const requireApplicationUser = cache(async () => {
  // Keep Clerk's redirect/control-flow errors outside the synchronization catch.
  const { userId } = await auth.protect();
  try {
    const profile = await currentUser();
    return await syncClerkUser(getDb(), userId, profile);
  } catch {
    // Do not log the provider payload, query parameters, email, or credentials.
    console.error({ operation: "sync_clerk_user", status: "failed", userId });
    throw new Error("We couldn't prepare your account. Please try again.");
  }
});
