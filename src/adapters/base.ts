import fs from "node:fs";
import path from "node:path";
import type { SkillSpec } from "../core/schema.js";
import { validateSkill } from "../core/schema.js";
import { parseSkill, emitSkill } from "../core/parser.js";

export interface SyncAction {
  skillId: string;
  action: "add" | "skip" | "overwrite";
  targetPath: string;
}

export interface PlatformAdapter {
  name: string;
  /** Resolve the output path for a given skill id */
  skillPath(id: string): string;
  /** Read an existing skill from the platform directory, or null if not found */
  readSkill(id: string): SkillSpec | null;
  /** Write a skill to the platform directory */
  writeSkill(skill: SkillSpec): void;
}

export function createAdapter(name: string, baseDir: string): PlatformAdapter {
  const skillsDir = path.join(baseDir, "skills");

  return {
    name,

    skillPath(id: string): string {
      return path.join(skillsDir, id, "SKILL.md");
    },

    readSkill(id: string): SkillSpec | null {
      const filePath = path.join(skillsDir, id, "SKILL.md");
      if (!fs.existsSync(filePath)) return null;
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = parseSkill(raw);
        const result = validateSkill(parsed);
        return result.success ? result.data : null;
      } catch {
        return null;
      }
    },

    writeSkill(skill: SkillSpec): void {
      const dir = path.join(skillsDir, skill.id);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "SKILL.md"), emitSkill(skill), "utf-8");
    },
  };
}
