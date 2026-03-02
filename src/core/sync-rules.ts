import fs from "node:fs";
import path from "node:path";
import { parseRule } from "../core/parser.js";
import { hashRule } from "../core/hash.js";
import { validateRule } from "../core/schema.js";
import type { RuleSpec } from "../core/schema.js";
import type { PlatformAdapter, RuleSyncAction } from "../adapters/base.js";

/**
 * Load all valid rules from the canonical .my-skills/rules directory.
 */
export function loadCanonicalRules(rulesDir: string): RuleSpec[] {
  if (!fs.existsSync(rulesDir)) return [];

  const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
  const rules: RuleSpec[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const ruleFile = path.join(rulesDir, entry.name, "RULE.md");
    if (!fs.existsSync(ruleFile)) continue;

    try {
      const raw = fs.readFileSync(ruleFile, "utf-8");
      const parsed = parseRule(raw);
      const result = validateRule(parsed);
      if (result.success) {
        rules.push(result.data);
      }
    } catch {
      // Skip unparseable files silently — validate command will report them
      continue;
    }
  }

  return rules;
}

/**
 * Plan sync actions for a list of rules against a platform adapter.
 * Does NOT write anything — pure computation.
 */
export function planRuleSync(
  rules: RuleSpec[],
  adapter: PlatformAdapter,
): RuleSyncAction[] {
  const actions: RuleSyncAction[] = [];

  for (const rule of rules) {
    const existing = adapter.readRule(rule.id);
    const targetPath = adapter.rulePath(rule.id);

    if (!existing) {
      actions.push({ ruleId: rule.id, action: "add", targetPath });
    } else if (hashRule(existing) === hashRule(rule)) {
      actions.push({ ruleId: rule.id, action: "skip", targetPath });
    } else {
      actions.push({ ruleId: rule.id, action: "overwrite", targetPath });
    }
  }

  return actions;
}

/**
 * Execute sync actions: write rules that need add/overwrite.
 */
export function executeRuleSync(
  rules: RuleSpec[],
  actions: RuleSyncAction[],
  adapter: PlatformAdapter,
): void {
  const ruleMap = new Map(rules.map((r) => [r.id, r]));

  for (const action of actions) {
    if (action.action === "skip") continue;
    const rule = ruleMap.get(action.ruleId);
    if (rule) {
      adapter.writeRule(rule);
    }
  }
}
