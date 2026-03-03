import path from "node:path";
import { validateSkillsDir, validateRulesDir } from "../../core/validator.js";
import type { ValidationResult } from "../../core/validator.js";

export async function validateCommand(options: { withRules?: boolean }): Promise<void> {
  const skillsDir = path.resolve(".my-ai", "skills");
  const allResults: ValidationResult[] = [];

  console.log(`Validating skills in ${skillsDir}...\n`);

  const skillResults = validateSkillsDir(skillsDir);
  allResults.push(...skillResults);

  if (skillResults.length === 0) {
    console.log("All skills are valid.\n");
  } else {
    for (const result of skillResults) {
      console.error(`[ERROR] ${result.file}`);
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
      console.error();
    }
  }

  if (options.withRules) {
    const rulesDir = path.resolve(".my-ai", "rules");
    console.log(`Validating rules in ${rulesDir}...\n`);

    const ruleResults = validateRulesDir(rulesDir);
    allResults.push(...ruleResults);

    if (ruleResults.length === 0) {
      console.log("All rules are valid.\n");
    } else {
      for (const result of ruleResults) {
        console.error(`[ERROR] ${result.file}`);
        for (const error of result.errors) {
          console.error(`  - ${error}`);
        }
        console.error();
      }
    }
  }

  if (allResults.length > 0) {
    console.error(`Validation failed with ${allResults.length} error(s).`);
    process.exit(1);
  }
}
