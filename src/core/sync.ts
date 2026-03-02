import fs from "node:fs";
import path from "node:path";
import { parseSkill } from "../core/parser.js";
import { hashSkill } from "../core/hash.js";
import { validateSkill } from "../core/schema.js";
import type { SkillSpec } from "../core/schema.js";
import type { PlatformAdapter, SyncAction } from "../adapters/base.js";

/**
 * Load all valid skills from the canonical .my-skills/skills directory.
 */
export function loadCanonicalSkills(skillsDir: string): SkillSpec[] {
  if (!fs.existsSync(skillsDir)) return [];

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skills: SkillSpec[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(skillsDir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillFile)) continue;

    try {
      const raw = fs.readFileSync(skillFile, "utf-8");
      const parsed = parseSkill(raw);
      const result = validateSkill(parsed);
      if (result.success) {
        skills.push(result.data);
      }
    } catch {
      // Skip unparseable files silently — validate command will report them
      continue;
    }
  }

  return skills;
}

/**
 * Plan sync actions for a list of skills against a platform adapter.
 * Does NOT write anything — pure computation.
 */
export function planSync(
  skills: SkillSpec[],
  adapter: PlatformAdapter,
): SyncAction[] {
  const actions: SyncAction[] = [];

  for (const skill of skills) {
    const existing = adapter.readSkill(skill.id);
    const targetPath = adapter.skillPath(skill.id);

    if (!existing) {
      actions.push({ skillId: skill.id, action: "add", targetPath });
    } else if (hashSkill(existing) === hashSkill(skill)) {
      actions.push({ skillId: skill.id, action: "skip", targetPath });
    } else {
      actions.push({ skillId: skill.id, action: "overwrite", targetPath });
    }
  }

  return actions;
}

/**
 * Execute sync actions: write skills that need add/overwrite.
 */
export function executeSync(
  skills: SkillSpec[],
  actions: SyncAction[],
  adapter: PlatformAdapter,
): void {
  const skillMap = new Map(skills.map((s) => [s.id, s]));

  for (const action of actions) {
    if (action.action === "skip") continue;
    const skill = skillMap.get(action.skillId);
    if (skill) {
      adapter.writeSkill(skill);
    }
  }
}
