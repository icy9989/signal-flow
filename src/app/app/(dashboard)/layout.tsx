import { resolveProjectWorkspace } from "@/server/auth/project-context";
import { canCreateProject } from "@/server/services/project-service";
import { ApplicationShell } from "@/components/layout/application-shell";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { memberships, active, projects, activeProject } = await resolveProjectWorkspace();
  return <ApplicationShell
    workspaces={memberships.map(({ organization }) => organization)}
    activeWorkspace={active?.organization}
    projectSelection={{ projects: projects.map(({ id, name }) => ({ id, name })), activeId: activeProject?.project.id, canCreate: !!active && canCreateProject(active.membership.role) }}
  >{children}</ApplicationShell>;
}
