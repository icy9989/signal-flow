import { redirect } from "next/navigation";
import { requireApplicationUser } from "@/server/auth/require-application-user";

export default async function WorkspacePage() {
  await requireApplicationUser();
  redirect("/app/overview");
}
