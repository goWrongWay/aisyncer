import { describe, it, expect } from "vitest";
import { hashSkill } from "../src/core/hash.js";
import type { SkillSpec } from "../src/core/schema.js";

describe("hashSkill", () => {
  it("returns a 64-char hex string (SHA-256)", () => {
    const skill: SkillSpec = {
      schemaVersion: 1,
      id: "hash-test",
      name: "Hash Test",
      description: "Testing hash",
      content: "Some content",
    };
    const hash = hashSkill(skill);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns the same hash for semantically identical skills", () => {
    const skill1: SkillSpec = {
      schemaVersion: 1,
      id: "a",
      name: "Same Name",
      description: "Same Desc",
      content: "identical content",
    };
    const skill2: SkillSpec = {
      schemaVersion: 1,
      id: "b",
      name: "Same Name",
      description: "Same Desc",
      content: "identical content",
    };
    expect(hashSkill(skill1)).toBe(hashSkill(skill2));
  });

  it("returns different hashes for different content", () => {
    const base: SkillSpec = {
      schemaVersion: 1,
      id: "a",
      name: "A",
      description: "Desc",
      content: "content version 1",
    };
    const modified: SkillSpec = { ...base, content: "content version 2" };
    expect(hashSkill(base)).not.toBe(hashSkill(modified));
  });

  it("returns different hashes when name differs", () => {
    const base: SkillSpec = {
      schemaVersion: 1,
      id: "a",
      name: "Name A",
      description: "Desc",
      content: "same content",
    };
    const modified: SkillSpec = { ...base, name: "Name B" };
    expect(hashSkill(base)).not.toBe(hashSkill(modified));
  });

  it("returns different hashes when description differs", () => {
    const base: SkillSpec = {
      schemaVersion: 1,
      id: "a",
      name: "Name",
      description: "Desc A",
      content: "same content",
    };
    const modified: SkillSpec = { ...base, description: "Desc B" };
    expect(hashSkill(base)).not.toBe(hashSkill(modified));
  });

  it("returns different hashes when allowedTools differs", () => {
    const base: SkillSpec = {
      schemaVersion: 1,
      id: "a",
      name: "Name",
      description: "Desc",
      content: "same content",
      allowedTools: ["Edit"],
    };
    const modified: SkillSpec = { ...base, allowedTools: ["Edit", "Read"] };
    expect(hashSkill(base)).not.toBe(hashSkill(modified));
  });

  it("returns different hashes when metadata differs", () => {
    const base: SkillSpec = {
      schemaVersion: 1,
      id: "a",
      name: "Name",
      description: "Desc",
      content: "same content",
      metadata: { version: "1.0.0" },
    };
    const modified: SkillSpec = {
      ...base,
      metadata: { version: "2.0.0" },
    };
    expect(hashSkill(base)).not.toBe(hashSkill(modified));
  });

  it("treats missing optional fields consistently", () => {
    const withoutOptionals: SkillSpec = {
      schemaVersion: 1,
      id: "a",
      name: "Name",
      description: "Desc",
      content: "content",
    };
    const withUndefined: SkillSpec = {
      schemaVersion: 1,
      id: "a",
      name: "Name",
      description: "Desc",
      content: "content",
      allowedTools: undefined,
      metadata: undefined,
    };
    expect(hashSkill(withoutOptionals)).toBe(hashSkill(withUndefined));
  });
});
