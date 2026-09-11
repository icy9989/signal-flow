import { loadEnvConfig } from "@next/env";
import { getDb } from "../src/server/db/client";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const db = getDb();
  try {
    await db.$queryRaw`SELECT 1`;
    const extensions = await db.$queryRaw<{ extversion: string }[]>`
      SELECT extversion FROM pg_extension WHERE extname = 'vector'
    `;
    if (extensions.length !== 1) throw new Error("Missing vector extension");
    // Verify all generated model tables, including Unsupported vector storage.
    await Promise.all([
      db.user.count(), db.organization.count(), db.organizationMember.count(),
      db.project.count(), db.feedbackImport.count(), db.feedback.count(),
      db.feedbackAnalysis.count(), db.feedbackEmbedding.count(), db.topic.count(),
      db.topicFeedback.count(), db.insight.count(),
    ]);
    console.log("Database connected; all 11 model tables are queryable; pgvector is installed.");
  } finally {
    await db.$disconnect();
  }
}

main().catch(() => {
  console.error("Database check failed. Verify DATABASE_URL and run npm run db:status.");
  process.exitCode = 1;
});
