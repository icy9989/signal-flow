import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string({ error: "Enter a project name." }).trim().min(1, "Enter a project name."),
  description: z.string({ error: "Enter a text description." }).trim().optional(),
});

export type ProjectActionState = {
  error?: { code: string; message: string; field?: "name" | "description" };
};
