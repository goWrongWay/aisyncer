import type { SkillSpec, RuleSpec } from "./schema.js";
import { skillConfig, ruleConfig } from "./schema.js";
import type { PlatformAdapter } from "../adapters/base.js";
import type { ResourceSyncAction } from "./resource.js";
import { loadCanonicalResources, planResourceSync, executeResourceSync } from "./resource.js";

// Re-export for backward compatibility
export type { ResourceSyncAction as SyncAction } from "./resource.js";

// -- Skills --

export function loadCanonicalSkills(skillsDir: string): SkillSpec[] {
  return loadCanonicalResources(skillsDir, skillConfig);
}

export function planSync(
  skills: SkillSpec[],
  adapter: PlatformAdapter,
): ResourceSyncAction[] {
  return planResourceSync(
    skills,
    (id) => adapter.readResource(id, skillConfig),
    (id) => adapter.resourcePath(id, skillConfig),
    skillConfig,
  );
}

export function executeSync(
  skills: SkillSpec[],
  actions: ResourceSyncAction[],
  adapter: PlatformAdapter,
): void {
  executeResourceSync(skills, actions, (skill) => adapter.writeResource(skill, skillConfig));
}

// -- Rules --

export function loadCanonicalRules(rulesDir: string): RuleSpec[] {
  return loadCanonicalResources(rulesDir, ruleConfig);
}

export function planRuleSync(
  rules: RuleSpec[],
  adapter: PlatformAdapter,
): ResourceSyncAction[] {
  return planResourceSync(
    rules,
    (id) => adapter.readResource(id, ruleConfig),
    (id) => adapter.resourcePath(id, ruleConfig),
    ruleConfig,
  );
}

export function executeRuleSync(
  rules: RuleSpec[],
  actions: ResourceSyncAction[],
  adapter: PlatformAdapter,
): void {
  executeResourceSync(rules, actions, (rule) => adapter.writeResource(rule, ruleConfig));
}
