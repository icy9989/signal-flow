import { resolveActiveOrganization } from "@/server/auth/organization-context";
import { ApplicationShell } from "@/components/layout/application-shell";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { memberships, active } = await resolveActiveOrganization();

  return <ApplicationShell workspaces={memberships.map(({ organization }) => organization)} activeWorkspace={active?.organization}>{children}</ApplicationShell>;
}
