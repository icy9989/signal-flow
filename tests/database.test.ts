import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { getDb } from "../src/server/db/client";
import { syncClerkUser } from "../src/server/services/sync-clerk-user";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const db = getDb();
after(() => db.$disconnect());

function profile() {
  const id = `test_${randomUUID()}`;
  return {
    id,
    primaryEmailAddressId: "primary",
    emailAddresses: [{ id: "primary", emailAddress: `${id}@example.com`, verification: { status: "verified" } }],
    firstName: "Database",
    lastName: "Test",
    imageUrl: "https://example.com/avatar.png",
  };
}

test("Clerk user creation, repeated entry, and profile refresh preserve local identity", async () => {
  const user = profile();
  const rollback = new Error("Intentional test rollback");
  await assert.rejects(db.$transaction(async (tx) => {
    const first = await syncClerkUser(tx, user.id, user);
    const repeated = await syncClerkUser(tx, user.id, user);
    assert.equal(repeated.id, first.id);
    assert.equal(await tx.user.count({ where: { externalAuthId: user.id } }), 1);

    const updated = await syncClerkUser(tx, user.id, {
      ...user,
      firstName: "Updated",
      lastName: null,
      imageUrl: null,
      emailAddresses: [{ ...user.emailAddresses[0], emailAddress: `updated_${user.id}@example.com` }],
    });
    assert.equal(updated.id, first.id);
    assert.equal(updated.name, "Updated");
    assert.equal(updated.image, null);
    assert.equal(updated.email, `updated_${user.id}@example.com`);
    throw rollback;
  }), (error) => error === rollback);
  assert.equal(await db.user.count({ where: { externalAuthId: user.id } }), 0);
});

test("invalid profiles and mismatched identities cannot write users", async () => {
  const user = profile();
  await assert.rejects(syncClerkUser(db, "different_identity", user));
  await assert.rejects(syncClerkUser(db, user.id, null));
  await assert.rejects(syncClerkUser(db, user.id, { ...user, primaryEmailAddressId: "missing" }));
  await assert.rejects(syncClerkUser(db, user.id, {
    ...user, emailAddresses: [{ ...user.emailAddresses[0], verification: { status: "unverified" } }],
  }));
  assert.equal(await db.user.count({ where: { externalAuthId: user.id } }), 0);
});

test("an email collision cannot link a different Clerk identity", async () => {
  const first = profile();
  const other = { ...first, id: `test_${randomUUID()}` };
  await assert.rejects(db.$transaction(async (tx) => {
    await syncClerkUser(tx, first.id, first);
    await syncClerkUser(tx, other.id, other);
  }), (error: unknown) => (
    typeof error === "object" && error !== null && "code" in error && error.code === "P2002"
  ));
  assert.equal(await db.user.count({ where: { externalAuthId: { in: [first.id, other.id] } } }), 0);
});
