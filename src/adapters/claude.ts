import path from "node:path";
import { createAdapter, type PlatformAdapter } from "./base.js";

const DEFAULT_CLAUDE_DIR = ".claude";

export function createClaudeAdapter(claudeDir?: string): PlatformAdapter {
  const baseDir = path.resolve(claudeDir ?? DEFAULT_CLAUDE_DIR);
  return createAdapter("claude", baseDir);
}
