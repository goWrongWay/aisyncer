import { z } from "zod";

export const SkillSpecSchema = z.object({
  schemaVersion: z.literal(1),

  id: z.string().regex(/^[a-z0-9-]+$/, "id must be lowercase alphanumeric with hyphens"),

  name: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "name is required")),

  description: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "description is required")),

  allowedTools: z.array(z.string()).optional(),

  content: z.string().min(1, "content is required"),

  metadata: z
    .object({
      source: z.string().optional(),
      version: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export type SkillSpec = z.infer<typeof SkillSpecSchema>;

export function validateSkill(data: unknown): {
  success: true;
  data: SkillSpec;
} | {
  success: false;
  errors: string[];
} {
  const result = SkillSpecSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );
  return { success: false, errors };
}

// Rule spec for AI rules (similar structure to skills but simpler)
export const RuleSpecSchema = z.object({
  schemaVersion: z.literal(1),

  id: z.string().regex(/^[a-z0-9-]+$/, "id must be lowercase alphanumeric with hyphens"),

  name: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "name is required")),

  description: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "description is required")),

  content: z.string().min(1, "content is required"),

  metadata: z
    .object({
      source: z.string().optional(),
      version: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export type RuleSpec = z.infer<typeof RuleSpecSchema>;

export function validateRule(data: unknown): {
  success: true;
  data: RuleSpec;
} | {
  success: false;
  errors: string[];
} {
  const result = RuleSpecSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );
  return { success: false, errors };
}
