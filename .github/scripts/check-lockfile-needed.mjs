import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const LOCKFILE_RELEVANT_FIELDS = [
  "name",
  "version",
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "bundleDependencies",
  "bundledDependencies",
  "overrides",
  "workspaces",
];

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

export function pickLockfileRelevantFields(pkg) {
  return Object.fromEntries(
    LOCKFILE_RELEVANT_FIELDS
      .filter((field) => field in pkg)
      .map((field) => [field, pkg[field]]),
  );
}

export function requiresLockfileUpdate(basePkg, headPkg) {
  return stableStringify(pickLockfileRelevantFields(basePkg)) !== stableStringify(pickLockfileRelevantFields(headPkg));
}

function readPackageJson(ref) {
  if (ref === "HEAD") {
    return JSON.parse(fs.readFileSync("package.json", "utf-8"));
  }

  const raw = execFileSync("git", ["show", `${ref}:package.json`], { encoding: "utf-8" });
  return JSON.parse(raw);
}

function main() {
  const [baseRef, headRef] = process.argv.slice(2);

  if (!baseRef || !headRef) {
    console.error("Usage: node .github/scripts/check-lockfile-needed.mjs <base-ref> <head-ref>");
    process.exit(1);
  }

  const basePkg = readPackageJson(baseRef);
  const headPkg = readPackageJson(headRef);
  console.log(requiresLockfileUpdate(basePkg, headPkg) ? "true" : "false");
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main();
}
