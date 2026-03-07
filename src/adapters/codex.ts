import path from "node:path";
import { createAdapter, type PlatformAdapter } from "./base.js";

const DEFAULT_CODEX_DIR = ".agents";

export function createCodexAdapter(codexDir?: string): PlatformAdapter {
  const baseDir = path.resolve(codexDir ?? DEFAULT_CODEX_DIR);

  return createAdapter("codex", baseDir);
}
