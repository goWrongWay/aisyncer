#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { validateCommand } from "./commands/validate.js";
import { syncCommand } from "./commands/sync.js";

const program = new Command();

program
  .name("aisyncer")
  .description("CLI tool for syncing AI skills, rules, and configs across Claude and Windsurf")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a .my-skills directory with an example skill")
  .option("--from <source>", "Import skills from a GitHub repo (github:owner/repo)")
  .option("--with-rules", "Also initialize the rules directory with an example rule")
  .action(initCommand);

program
  .command("validate")
  .description("Validate all skills (and optionally rules) in .my-skills/")
  .option("--with-rules", "Also validate rules in .my-skills/rules")
  .action(validateCommand);

program
  .command("sync")
  .description("Sync skills and rules to platform directories (Claude, Windsurf)")
  .requiredOption("--to <platforms>", "Target platforms: claude, windsurf, or claude,windsurf")
  .option("--write", "Actually write files (default is dry-run)")
  .option("--claude-dir <dir>", "Override Claude output directory (default: .claude)")
  .option("--sync-rules", "Also sync rules from .my-skills/rules")
  .action(syncCommand);

program.parse();
