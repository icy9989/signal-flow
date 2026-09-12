import { requireApplicationUser } from "@/server/auth/require-application-user";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  await requireApplicationUser();
  return children;
}
