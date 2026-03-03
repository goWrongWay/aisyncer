import fs from "node:fs";
import path from "node:path";
import { emitSkill, emitRule } from "../../core/parser.js";
import { parseSkill } from "../../core/parser.js";
import { validateSkill } from "../../core/schema.js";
import type { SkillSpec, RuleSpec } from "../../core/schema.js";
import { fetchSkillsFromGitHub } from "../../github/fetch.js";

const EXAMPLE_SKILL: SkillSpec = {
  schemaVersion: 1,
  id: "example-skill",
  name: "Example Skill",
  description: "An example skill to get you started",
  allowedTools: ["Edit", "Read"],
  content: `# Example Skill

You are a helpful assistant. Follow the user's instructions carefully.

## Guidelines

- Be concise and clear
- Ask for clarification when needed`,
  metadata: {
    version: "1.0.0",
    tags: ["example"],
  },
};

const EXAMPLE_RULE: RuleSpec = {
  schemaVersion: 1,
  id: "example-rule",
  name: "Example Rule",
  description: "An example rule to get you started",
  content: `# Example Rule

This is an example rule that demonstrates how to write rules for AI assistants.

## When to Apply

- Use this rule as a template for creating new rules
- Follow the structure shown here

## Guidelines

- Keep rules concise and focused
- Use clear examples where appropriate`,
  metadata: {
    version: "1.0.0",
    tags: ["example"],
  },
};

export async function initCommand(options: { from?: string; withRules?: boolean }): Promise<void> {
  const baseDir = path.resolve(".my-skills");
  const skillsDir = path.join(baseDir, "skills");

  if (fs.existsSync(baseDir)) {
    console.log(".my-skills directory already exists. Skipping init.");
    return;
  }

  if (options.from) {
    await initFromGitHub(options.from, skillsDir);
  } else {
    initLocal(skillsDir, options.withRules ?? false);
  }
}

function initLocal(skillsDir: string, withRules: boolean): void {
  const exampleDir = path.join(skillsDir, EXAMPLE_SKILL.id);
  const skillFile = path.join(exampleDir, "SKILL.md");

  fs.mkdirSync(exampleDir, { recursive: true });
  fs.writeFileSync(skillFile, emitSkill(EXAMPLE_SKILL), "utf-8");

  console.log("Initialized .my-skills with example skill:");
  console.log(`  ${skillFile}`);

  if (withRules) {
    const rulesDir = path.join(path.dirname(skillsDir), "rules");
    const exampleRuleDir = path.join(rulesDir, EXAMPLE_RULE.id);
    const ruleFile = path.join(exampleRuleDir, "RULE.md");

    fs.mkdirSync(exampleRuleDir, { recursive: true });
    fs.writeFileSync(ruleFile, emitRule(EXAMPLE_RULE), "utf-8");

    console.log("\nInitialized rules with example rule:");
    console.log(`  ${ruleFile}`);
  }
}

async function initFromGitHub(source: string, skillsDir: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN;

  console.log(`Fetching skills from ${source}...`);
  if (token) {
    console.log("Using GITHUB_TOKEN for authentication.");
  }

  let result;
  try {
    result = await fetchSkillsFromGitHub(source, token);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${msg}`);
    process.exit(1);
  }

  for (const warning of result.errors) {
    console.warn(`Warning: ${warning}`);
  }

  if (result.skills.length === 0) {
    console.error("No skills were fetched. Aborting init.");
    process.exit(1);
  }

  let written = 0;
  const validationErrors: string[] = [];

  for (const remote of result.skills) {
    let skill: SkillSpec;
    try {
      skill = parseSkill(remote.content);
    } catch {
      validationErrors.push(`${remote.id}: Failed to parse frontmatter`);
      continue;
    }

    const validation = validateSkill(skill);
    if (!validation.success) {
      validationErrors.push(
        `${remote.id}: ${validation.errors.join("; ")}`,
      );
      continue;
    }

    const dir = path.join(skillsDir, validation.data.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "SKILL.md"), remote.content, "utf-8");
    written++;
    console.log(`  + ${validation.data.id}`);
  }

  if (validationErrors.length > 0) {
    console.warn(`\nSkipped ${validationErrors.length} invalid skill(s):`);
    for (const err of validationErrors) {
      console.warn(`  - ${err}`);
    }
  }

  console.log(`\nInitialized .my-skills with ${written} skill(s) from ${source}.`);

  if (written === 0) {
    console.error("No valid skills were imported. Removing .my-skills directory.");
    fs.rmSync(path.resolve(".my-skills"), { recursive: true, force: true });
    process.exit(1);
  }
}
