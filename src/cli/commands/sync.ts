import path from "node:path";
import { createClaudeAdapter } from "../../adapters/claude.js";
import { createWindsurfAdapter } from "../../adapters/windsurf.js";
import type { PlatformAdapter } from "../../adapters/base.js";
import { loadCanonicalSkills, planSync, executeSync } from "../../core/sync.js";
import { loadCanonicalRules, planRuleSync, executeRuleSync } from "../../core/sync.js";


interface SyncOptions {
  to: string;
  write?: boolean;
  claudeDir?: string;
  syncRules?: boolean;
}

const SUPPORTED_PLATFORMS = ["claude", "windsurf"];

export async function syncCommand(options: SyncOptions): Promise<void> {
  if (!options.to) {
    console.error("Error: --to is required. Use --to claude, --to windsurf, or --to claude,windsurf");
    process.exit(1);
  }

  const platforms = options.to.split(",").map((p) => p.trim());
  for (const p of platforms) {
    if (!SUPPORTED_PLATFORMS.includes(p)) {
      console.error(`Error: Unknown platform "${p}". Supported: ${SUPPORTED_PLATFORMS.join(", ")}`);
      process.exit(1);
    }
  }

  const skillsDir = path.resolve(".my-skills", "skills");
  const skills = loadCanonicalSkills(skillsDir);

  const rules = options.syncRules
    ? loadCanonicalRules(path.resolve(".my-skills", "rules"))
    : [];

  if (skills.length === 0 && rules.length === 0) {
    console.log("No valid skills found in .my-skills/skills. Run 'aisyncer init' first.");
    return;
  }

  const dryRun = !options.write;
  if (dryRun) {
    console.log("[dry-run] No files will be written. Use --write to apply changes.\n");
  }

  let hasChanges = false;

  for (const platform of platforms) {
    const adapter = resolveAdapter(platform, options);

    // Sync skills
    if (skills.length > 0) {
      console.log(`Syncing skills to ${adapter.name}...`);
      const actions = planSync(skills, adapter);
      for (const action of actions) {
        const label = actionLabel(action.action);
        console.log(`  ${label} ${action.id} → ${action.targetPath}`);
        if (action.action !== "skip") hasChanges = true;
      }
      if (!dryRun) {
        executeSync(skills, actions, adapter);
      }
      console.log();
    }

    // Sync rules
    if (rules.length > 0) {
      console.log(`Syncing rules to ${adapter.name}...`);
      const actions = planRuleSync(rules, adapter);
      for (const action of actions) {
        const label = actionLabel(action.action);
        console.log(`  ${label} ${action.id} → ${action.targetPath}`);
        if (action.action !== "skip") hasChanges = true;
      }
      if (!dryRun) {
        executeRuleSync(rules, actions, adapter);
      }
      console.log();
    }
  }

  if (dryRun && hasChanges) {
    console.log("Run with --write to apply these changes.");
  } else if (!hasChanges) {
    console.log("Everything is up to date.");
  } else {
    console.log("Sync complete.");
  }
}

function resolveAdapter(platform: string, options: SyncOptions): PlatformAdapter {
  switch (platform) {
    case "claude":
      return createClaudeAdapter(options.claudeDir);
    case "windsurf":
      return createWindsurfAdapter();
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

function actionLabel(action: string): string {
  switch (action) {
    case "add":
      return "[ADD]      ";
    case "skip":
      return "[SKIP]     ";
    case "overwrite":
      return "[OVERWRITE]";
    default:
      return `[${action.toUpperCase()}]`;
  }
}
