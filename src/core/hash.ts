import { createHash } from "node:crypto";
import type { SkillSpec } from "./schema.js";

/**
 * Compute a SHA-256 hash covering the full semantic fields of a skill:
 * name, description, allowedTools, metadata, and content.
 * Used for sync conflict detection.
 */
export function hashSkill(skill: SkillSpec): string {
  const payload = JSON.stringify({
    name: skill.name,
    description: skill.description,
    allowedTools: skill.allowedTools ?? null,
    metadata: skill.metadata ?? null,
    content: skill.content,
  });
  return createHash("sha256").update(payload).digest("hex");
}
