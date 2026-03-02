import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseSkill, emitSkill } from "../src/core/parser.js";

const fixturesDir = path.join(import.meta.dirname, "fixtures");

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), "utf-8");
}

describe("parseSkill", () => {
  it("parses a valid basic SKILL.md", () => {
    const raw = readFixture("valid-basic.md");
    const skill = parseSkill(raw);
    expect(skill.schemaVersion).toBe(1);
    expect(skill.id).toBe("valid-basic");
    expect(skill.name).toBe("Valid Basic Skill");
    expect(skill.description).toBe("A valid basic skill for testing");
    expect(skill.content).toContain("# Valid Basic Skill");
  });

  it("parses a valid full SKILL.md with all fields", () => {
    const raw = readFixture("valid-full.md");
    const skill = parseSkill(raw);
    expect(skill.schemaVersion).toBe(1);
    expect(skill.id).toBe("valid-full");
    expect(skill.allowedTools).toEqual(["Edit", "Read", "Bash"]);
    expect(skill.metadata?.source).toBe("github:test/repo");
    expect(skill.metadata?.version).toBe("2.0.0");
    expect(skill.metadata?.tags).toEqual(["testing", "full"]);
    expect(skill.content).toContain("# Valid Full Skill");
  });

  it("parses a file with empty content body", () => {
    const raw = readFixture("empty-content.md");
    const skill = parseSkill(raw);
    expect(skill.id).toBe("empty-content");
    expect(skill.content).toBe("");
  });

  it("parses a file with invalid schema version (parsing still works)", () => {
    const raw = readFixture("invalid-version.md");
    const skill = parseSkill(raw);
    expect(skill.schemaVersion).toBe(2);
    expect(skill.id).toBe("invalid-version");
  });
});

describe("emitSkill", () => {
  it("round-trips a valid skill through parse → emit → parse", () => {
    const raw = readFixture("valid-full.md");
    const skill = parseSkill(raw);
    const emitted = emitSkill(skill);
    const reparsed = parseSkill(emitted);

    expect(reparsed.schemaVersion).toBe(skill.schemaVersion);
    expect(reparsed.id).toBe(skill.id);
    expect(reparsed.name).toBe(skill.name);
    expect(reparsed.description).toBe(skill.description);
    expect(reparsed.allowedTools).toEqual(skill.allowedTools);
    expect(reparsed.metadata).toEqual(skill.metadata);
    expect(reparsed.content).toBe(skill.content);
  });

  it("emits correct frontmatter format", () => {
    const skill = {
      schemaVersion: 1 as const,
      id: "test-emit",
      name: "Test Emit",
      description: "Testing emitter",
      content: "# Hello\n\nWorld",
    };
    const output = emitSkill(skill);
    expect(output).toContain("---");
    expect(output).toContain("schemaVersion: 1");
    expect(output).toContain("id: test-emit");
    expect(output).toContain("# Hello\n\nWorld");
  });
});
