import fs from "node:fs";
import path from "node:path";
import { parseSkill, parseRule } from "./parser.js";
import { validateSkill, validateRule } from "./schema.js";

export interface ValidationResult {
  file: string;
  id: string | undefined;
  errors: string[];
}

/**
 * Validate all SKILL.md files under a skills directory.
 * Returns an array of validation results (only entries with errors).
 */
export function validateSkillsDir(skillsDir: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!fs.existsSync(skillsDir)) {
    results.push({
      file: skillsDir,
      id: undefined,
      errors: [`Skills directory not found: ${skillsDir}`],
    });
    return results;
  }

  if (!fs.statSync(skillsDir).isDirectory()) {
    results.push({
      file: skillsDir,
      id: undefined,
      errors: [`Path is not a directory: ${skillsDir}`],
    });
    return results;
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const seenIds = new Map<string, string>(); // id -> first file path

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillFile = path.join(skillsDir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillFile)) {
      results.push({
        file: skillFile,
        id: undefined,
        errors: ["SKILL.md not found"],
      });
      continue;
    }

    const raw = fs.readFileSync(skillFile, "utf-8");

    let parsed: ReturnType<typeof parseSkill>;
    try {
      parsed = parseSkill(raw);
    } catch {
      results.push({
        file: skillFile,
        id: undefined,
        errors: ["Failed to parse frontmatter"],
      });
      continue;
    }

    const validation = validateSkill(parsed);
    if (!validation.success) {
      results.push({
        file: skillFile,
        id: (parsed as Record<string, unknown>).id as string | undefined,
        errors: validation.errors,
      });
      continue;
    }

    const skill = validation.data;

    // Check directory name matches id
    if (entry.name !== skill.id) {
      results.push({
        file: skillFile,
        id: skill.id,
        errors: [
          `Directory name "${entry.name}" does not match skill id "${skill.id}"`,
        ],
      });
    }

    // Check duplicate ids
    const existingFile = seenIds.get(skill.id);
    if (existingFile) {
      results.push({
        file: skillFile,
        id: skill.id,
        errors: [`Duplicate skill id "${skill.id}" (first seen in ${existingFile})`],
      });
    } else {
      seenIds.set(skill.id, skillFile);
    }
  }

  return results;
}

/**
 * Validate all RULE.md files under a rules directory.
 * Returns an array of validation results (only entries with errors).
 */
export function validateRulesDir(rulesDir: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!fs.existsSync(rulesDir)) {
    results.push({
      file: rulesDir,
      id: undefined,
      errors: [`Rules directory not found: ${rulesDir}`],
    });
    return results;
  }

  if (!fs.statSync(rulesDir).isDirectory()) {
    results.push({
      file: rulesDir,
      id: undefined,
      errors: [`Path is not a directory: ${rulesDir}`],
    });
    return results;
  }

  const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
  const seenIds = new Map<string, string>(); // id -> first file path

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const ruleFile = path.join(rulesDir, entry.name, "RULE.md");
    if (!fs.existsSync(ruleFile)) {
      results.push({
        file: ruleFile,
        id: undefined,
        errors: ["RULE.md not found"],
      });
      continue;
    }

    const raw = fs.readFileSync(ruleFile, "utf-8");

    let parsed: ReturnType<typeof parseRule>;
    try {
      parsed = parseRule(raw);
    } catch {
      results.push({
        file: ruleFile,
        id: undefined,
        errors: ["Failed to parse frontmatter"],
      });
      continue;
    }

    const validation = validateRule(parsed);
    if (!validation.success) {
      results.push({
        file: ruleFile,
        id: (parsed as Record<string, unknown>).id as string | undefined,
        errors: validation.errors,
      });
      continue;
    }

    const rule = validation.data;

    // Check directory name matches id
    if (entry.name !== rule.id) {
      results.push({
        file: ruleFile,
        id: rule.id,
        errors: [
          `Directory name "${entry.name}" does not match rule id "${rule.id}"`,
        ],
      });
    }

    // Check duplicate ids
    const existingFile = seenIds.get(rule.id);
    if (existingFile) {
      results.push({
        file: ruleFile,
        id: rule.id,
        errors: [`Duplicate rule id "${rule.id}" (first seen in ${existingFile})`],
      });
    } else {
      seenIds.set(rule.id, ruleFile);
    }
  }

  return results;
}
