import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { validateSkillsDir } from "../src/core/validator.js";
import { emitSkill } from "../src/core/parser.js";
import type { SkillSpec } from "../src/core/schema.js";

function createTempSkillsDir(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "my-skills-test-"));
  return tmpDir;
}

function writeSkillToDir(baseDir: string, skill: SkillSpec): void {
  const skillDir = path.join(baseDir, skill.id);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), emitSkill(skill), "utf-8");
}

describe("validateSkillsDir", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempSkillsDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns no errors for valid skills", () => {
    writeSkillToDir(tmpDir, {
      schemaVersion: 1,
      id: "valid-a",
      name: "Valid A",
      description: "Valid skill A",
      content: "# Skill A\n\nContent here.",
    });
    writeSkillToDir(tmpDir, {
      schemaVersion: 1,
      id: "valid-b",
      name: "Valid B",
      description: "Valid skill B",
      content: "# Skill B\n\nContent here.",
    });

    const results = validateSkillsDir(tmpDir);
    expect(results).toHaveLength(0);
  });

  it("detects missing skills directory", () => {
    const results = validateSkillsDir(path.join(tmpDir, "nonexistent"));
    expect(results).toHaveLength(1);
    expect(results[0].errors[0]).toContain("not found");
  });

  it("reports error when path is a file, not a directory", () => {
    const filePath = path.join(tmpDir, "not-a-dir.txt");
    fs.writeFileSync(filePath, "hello", "utf-8");

    const results = validateSkillsDir(filePath);
    expect(results).toHaveLength(1);
    expect(results[0].errors[0]).toContain("not a directory");
  });

  it("detects missing SKILL.md in a subdirectory", () => {
    fs.mkdirSync(path.join(tmpDir, "empty-dir"), { recursive: true });
    const results = validateSkillsDir(tmpDir);
    expect(results).toHaveLength(1);
    expect(results[0].errors[0]).toContain("SKILL.md not found");
  });

  it("detects schema validation errors", () => {
    const skillDir = path.join(tmpDir, "bad-skill");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      `---\nschemaVersion: 2\nid: bad-skill\n---\n\n# Content`,
      "utf-8",
    );
    const results = validateSkillsDir(tmpDir);
    expect(results.length).toBeGreaterThan(0);
  });

  it("detects directory name / id mismatch", () => {
    const skillDir = path.join(tmpDir, "wrong-dir-name");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      emitSkill({
        schemaVersion: 1,
        id: "correct-id",
        name: "Mismatch Test",
        description: "Dir name != id",
        content: "# Content",
      }),
      "utf-8",
    );
    const results = validateSkillsDir(tmpDir);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].errors[0]).toContain("does not match");
  });

  it("detects duplicate skill ids", () => {
    writeSkillToDir(tmpDir, {
      schemaVersion: 1,
      id: "dupe-id",
      name: "First",
      description: "First skill",
      content: "# First",
    });
    const dupeDir = path.join(tmpDir, "dupe-id-copy");
    fs.mkdirSync(dupeDir, { recursive: true });
    fs.writeFileSync(
      path.join(dupeDir, "SKILL.md"),
      emitSkill({
        schemaVersion: 1,
        id: "dupe-id",
        name: "Second",
        description: "Duplicate",
        content: "# Second",
      }),
      "utf-8",
    );
    const results = validateSkillsDir(tmpDir);
    const dupeErrors = results.filter((r) =>
      r.errors.some((e) => e.includes("Duplicate")),
    );
    expect(dupeErrors.length).toBeGreaterThan(0);
  });
});
