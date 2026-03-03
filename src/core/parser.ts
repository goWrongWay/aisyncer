import type { SkillSpec, RuleSpec } from "./schema.js";
import { parseResource, emitResource } from "./resource.js";

export function parseSkill(raw: string): SkillSpec {
  return parseResource<SkillSpec>(raw);
}

export function emitSkill(skill: SkillSpec): string {
  return emitResource(skill);
}

export function parseRule(raw: string): RuleSpec {
  return parseResource<RuleSpec>(raw);
}

export function emitRule(rule: RuleSpec): string {
  return emitResource(rule);
}
