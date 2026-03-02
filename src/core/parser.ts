import matter from "gray-matter";
import { stringify as yamlStringify } from "yaml";
import type { SkillSpec } from "./schema.js";

/**
 * Parse a SKILL.md file (frontmatter + markdown content) into a SkillSpec object.
 */
export function parseSkill(raw: string): SkillSpec {
  const { data, content } = matter(raw);
  return {
    ...data,
    content: content.trim(),
  } as SkillSpec;
}

/**
 * Emit a SkillSpec object back into SKILL.md format (frontmatter + markdown).
 */
export function emitSkill(skill: SkillSpec): string {
  const { content, ...frontmatter } = skill;
  const yaml = yamlStringify(frontmatter, { lineWidth: 0 }).trim();
  return `---\n${yaml}\n---\n\n${content}\n`;
}
