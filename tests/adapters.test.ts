import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createAdapter } from "../src/adapters/base.js";
import { createClaudeAdapter } from "../src/adapters/claude.js";
import { createWindsurfAdapter } from "../src/adapters/windsurf.js";
import { emitSkill } from "../src/core/parser.js";
import type { SkillSpec } from "../src/core/schema.js";

const SAMPLE_SKILL: SkillSpec = {
  schemaVersion: 1,
  id: "test-skill",
  name: "Test Skill",
  description: "A test skill",
  content: "# Test\n\nContent here.",
};

describe("createAdapter", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "adapter-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns null for non-existent skill", () => {
    const adapter = createAdapter("test", tmpDir);
    expect(adapter.readSkill("nonexistent")).toBeNull();
  });

  it("writes and reads back a skill", () => {
    const adapter = createAdapter("test", tmpDir);
    adapter.writeSkill(SAMPLE_SKILL);

    const read = adapter.readSkill(SAMPLE_SKILL.id);
    expect(read).not.toBeNull();
    expect(read!.id).toBe(SAMPLE_SKILL.id);
    expect(read!.name).toBe(SAMPLE_SKILL.name);
    expect(read!.content).toBe(SAMPLE_SKILL.content);
  });

  it("creates the correct file path", () => {
    const adapter = createAdapter("test", tmpDir);
    adapter.writeSkill(SAMPLE_SKILL);

    const expectedPath = path.join(tmpDir, "skills", SAMPLE_SKILL.id, "SKILL.md");
    expect(fs.existsSync(expectedPath)).toBe(true);
  });

  it("skillPath returns expected path", () => {
    const adapter = createAdapter("test", tmpDir);
    const p = adapter.skillPath("my-id");
    expect(p).toBe(path.join(tmpDir, "skills", "my-id", "SKILL.md"));
  });

  it("returns null for corrupted frontmatter instead of throwing", () => {
    const adapter = createAdapter("test", tmpDir);
    const corruptDir = path.join(tmpDir, "skills", "corrupt-skill");
    fs.mkdirSync(corruptDir, { recursive: true });
    fs.writeFileSync(
      path.join(corruptDir, "SKILL.md"),
      "this is not yaml frontmatter at all {{{",
      "utf-8",
    );
    expect(adapter.readSkill("corrupt-skill")).toBeNull();
  });
});

describe("createClaudeAdapter", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("uses custom directory when provided", () => {
    const adapter = createClaudeAdapter(tmpDir);
    expect(adapter.name).toBe("claude");
    adapter.writeSkill(SAMPLE_SKILL);
    expect(fs.existsSync(path.join(tmpDir, "skills", SAMPLE_SKILL.id, "SKILL.md"))).toBe(true);
  });
});

describe("createWindsurfAdapter", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "windsurf-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("uses custom directory when provided", () => {
    const adapter = createWindsurfAdapter(tmpDir);
    expect(adapter.name).toBe("windsurf");
    adapter.writeSkill(SAMPLE_SKILL);
    expect(fs.existsSync(path.join(tmpDir, "skills", SAMPLE_SKILL.id, "SKILL.md"))).toBe(true);
  });
});
