import { describe, it, expect } from "vitest";
import { SkillSpecSchema, validateSkill } from "../src/core/schema.js";

describe("SkillSpecSchema", () => {
  it("accepts a valid minimal skill", () => {
    const data = {
      schemaVersion: 1,
      id: "my-skill",
      name: "My Skill",
      description: "A test skill",
      content: "Some content",
    };
    const result = SkillSpecSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts a valid full skill", () => {
    const data = {
      schemaVersion: 1,
      id: "full-skill",
      name: "Full Skill",
      description: "A fully populated skill",
      allowedTools: ["Edit", "Read"],
      content: "# Content\n\nBody text.",
      metadata: {
        source: "github:test/repo",
        version: "1.0.0",
        tags: ["test", "demo"],
      },
    };
    const result = SkillSpecSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects schemaVersion !== 1", () => {
    const data = {
      schemaVersion: 2,
      id: "bad-version",
      name: "Bad Version",
      description: "Wrong version",
      content: "Content",
    };
    const result = SkillSpecSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid id format (uppercase)", () => {
    const data = {
      schemaVersion: 1,
      id: "Invalid_ID",
      name: "Bad ID",
      description: "Invalid id",
      content: "Content",
    };
    const result = SkillSpecSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const data = {
      schemaVersion: 1,
      id: "no-name",
      name: "",
      description: "No name",
      content: "Content",
    };
    const result = SkillSpecSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    const data = {
      schemaVersion: 1,
      id: "ws-name",
      name: "   ",
      description: "Whitespace name",
      content: "Content",
    };
    const result = SkillSpecSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only description", () => {
    const data = {
      schemaVersion: 1,
      id: "ws-desc",
      name: "Valid",
      description: "  \t\n  ",
      content: "Content",
    };
    const result = SkillSpecSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("trims name and description in output", () => {
    const data = {
      schemaVersion: 1,
      id: "trimmed",
      name: "  Trimmed Name  ",
      description: "  Trimmed Desc  ",
      content: "Content",
    };
    const result = SkillSpecSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Trimmed Name");
      expect(result.data.description).toBe("Trimmed Desc");
    }
  });

  it("rejects empty content", () => {
    const data = {
      schemaVersion: 1,
      id: "no-content",
      name: "No Content",
      description: "No content",
      content: "",
    };
    const result = SkillSpecSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const data = {
      schemaVersion: 1,
      id: "missing-fields",
    };
    const result = SkillSpecSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("validateSkill", () => {
  it("returns success with data for valid input", () => {
    const data = {
      schemaVersion: 1,
      id: "valid",
      name: "Valid",
      description: "Valid skill",
      content: "Content",
    };
    const result = validateSkill(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("valid");
    }
  });

  it("returns errors array for invalid input", () => {
    const result = validateSkill({ schemaVersion: 2 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("schemaVersion"))).toBe(true);
    }
  });
});
