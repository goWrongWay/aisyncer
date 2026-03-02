import path from "node:path";
import { validateSkillsDir } from "../../core/validator.js";

export async function validateCommand(): Promise<void> {
  const skillsDir = path.resolve(".my-skills", "skills");

  console.log(`Validating skills in ${skillsDir}...\n`);

  const results = validateSkillsDir(skillsDir);

  if (results.length === 0) {
    console.log("All skills are valid.");
    return;
  }

  for (const result of results) {
    console.error(`[ERROR] ${result.file}`);
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    console.error();
  }

  console.error(`Validation failed with ${results.length} error(s).`);
  process.exit(1);
}
