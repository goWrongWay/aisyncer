import type { SkillSpec, RuleSpec } from "./schema.js";
import { skillConfig, ruleConfig } from "./schema.js";
import { hashResource } from "./resource.js";

export function hashSkill(skill: SkillSpec): string {
  return hashResource(skill, skillConfig);
}

export function hashRule(rule: RuleSpec): string {
  return hashResource(rule, ruleConfig);
}
