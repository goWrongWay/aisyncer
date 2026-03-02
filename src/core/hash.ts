import { createHash } from "node:crypto";
import type { SkillSpec, RuleSpec } from "./schema.js";

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

/**
 * Compute a SHA-256 hash covering the full semantic fields of a rule:
 * name, description, metadata, and content.
 * Used for sync conflict detection.
 */
export function hashRule(rule: RuleSpec): string {
  const payload = JSON.stringify({
    name: rule.name,
    description: rule.description,
    metadata: rule.metadata ?? null,
    content: rule.content,
  });
  return createHash("sha256").update(payload).digest("hex");
}
