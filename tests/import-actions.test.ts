import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, mock, test } from "node:test";

let signedIn = true;
let role = "OWNER";
let databaseFails = false;
let reads = 0;
const id = randomUUID();
class Redirect extends Error {}
mock.module("../src/server/auth/project-context.ts", { namedExports: { requireProjectAccess: async () => {
  if (!signedIn) throw new Redirect("sign-in");
  return { user: { id: "trusted-user" }, organization: { id: "trusted-org" }, project: { id: "trusted-project" }, membership: { role } };
} } });
mock.module("next/navigation", { namedExports: { unstable_rethrow: (error: unknown) => { if (error instanceof Redirect) throw error; } } });
mock.module("../src/server/db/client.ts", { namedExports: { getDb: () => ({ feedbackImport: { findFirst: async ({ where }: { where: Record<string, string> }) => {
  reads++;
  assert.equal(where.organizationId, "trusted-org");
  assert.equal(where.projectId, "trusted-project");
  if (databaseFails) throw new Error("private SQL and credentials");
  return { id, status: "COMPLETED", importedRows: 3 };
} } }) } });
let execute: typeof import("../src/app/app/import-execution-actions").executeCsvAction;
before(async () => { execute = (await import("../src/app/app/import-execution-actions")).executeCsvAction; });
function form() {
  const input = new FormData();
  input.set("mapping", JSON.stringify({ content: "column_0" }));
  input.set("executionId", id);
  input.set("organizationId", "untrusted-org"); input.set("projectId", "untrusted-project");
  return input;
}
test("execution action preserves authentication redirects and denies MEMBER before persistence", async () => {
  signedIn = false;
  await assert.rejects(execute(form()), Redirect);
  signedIn = true; role = "MEMBER";
  assert.match((await execute(form())).error ?? "", /owners and admins/);
  assert.equal(reads, 0);
  role = "OWNER";
});
test("execution action validates mapping JSON and execution identifiers", async () => {
  const malformed = form(); malformed.set("mapping", "not json");
  assert.match((await execute(malformed)).error ?? "", /mapping/);
  const invalidId = form(); invalidId.set("executionId", "forged");
  assert.match((await execute(invalidId)).error ?? "", /not ready/);
  assert.equal(reads, 0);
});
test("execution action returns a scoped persisted retry with a minimal response", async () => {
  assert.deepEqual(await execute(form()), { data: { importId: id } });
});
test("execution action sanitizes failures and avoids claiming rollback for unknown outcomes", async () => {
  databaseFails = true;
  const response = await execute(form());
  assert.match(response.error ?? "", /couldn't confirm/);
  assert.ok(!JSON.stringify(response).includes("private"));
  assert.ok(!JSON.stringify(response).includes("No feedback"));
});
