import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string({ error: "Enter a workspace name." }).trim().min(1, "Enter a workspace name.").max(100, "Use 100 characters or fewer."),
});

export const organizationIdSchema = z.string().trim().min(1).max(128);

export type WorkspaceActionState = {
  error?: { code: string; message: string; field?: "name" };
};
