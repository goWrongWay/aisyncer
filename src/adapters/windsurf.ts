import path from "node:path";
import { createAdapter, type PlatformAdapter } from "./base.js";

const DEFAULT_WINDSURF_DIR = ".windsurf";

export function createWindsurfAdapter(windsurfDir?: string): PlatformAdapter {
  const baseDir = path.resolve(windsurfDir ?? DEFAULT_WINDSURF_DIR);
  return createAdapter("windsurf", baseDir);
}
