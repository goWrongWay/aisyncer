import { describe, it, expect } from "vitest";
import { RuleSpecSchema, validateRule } from "../src/core/schema.js";
import { parseRule, emitRule } from "../src/core/parser.js";
import { hashRule } from "../src/core/hash.js";

describe("RuleSpecSchema", () => {
  it("accepts a valid minimal rule", () => {
    const data = {
      schemaVersion: 1,
      id: "my-rule",
      name: "My Rule",
      description: "A test rule",
      content: "Some content",
    };
    const result = RuleSpecSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts a valid full rule", () => {
    const data = {
      schemaVersion: 1,
      id: "full-rule",
      name: "Full Rule",
      description: "A fully populated rule",
      content: "# Content\n\nBody text.",
      metadata: {
        source: "github:test/repo",
        version: "1.0.0",
        tags: ["test", "demo"],
      },
    };
    const result = RuleSpecSchema.safeParse(data);
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
    const result = RuleSpecSchema.safeParse(data);
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
    const result = RuleSpecSchema.safeParse(data);
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
    const result = RuleSpecSchema.safeParse(data);
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
    const result = RuleSpecSchema.safeParse(data);
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
    const result = RuleSpecSchema.safeParse(data);
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
    const result = RuleSpecSchema.safeParse(data);
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
    const result = RuleSpecSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const data = {
      schemaVersion: 1,
      id: "missing-fields",
    };
    const result = RuleSpecSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("validateRule", () => {
  it("returns success with data for valid input", () => {
    const data = {
      schemaVersion: 1,
      id: "valid",
      name: "Valid",
      description: "Valid rule",
      content: "Content",
    };
    const result = validateRule(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("valid");
    }
  });

  it("returns errors array for invalid input", () => {
    const result = validateRule({ schemaVersion: 2 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("schemaVersion"))).toBe(true);
    }
  });
});

describe("parseRule", () => {
  it("parses frontmatter and content correctly", () => {
    const raw = `---
schemaVersion: 1
id: test-rule
name: Test Rule
description: A test rule
---

This is the rule content.

More content here.`;
    const result = parseRule(raw);
    expect(result.schemaVersion).toBe(1);
    expect(result.id).toBe("test-rule");
    expect(result.name).toBe("Test Rule");
    expect(result.description).toBe("A test rule");
    expect(result.content).toBe("This is the rule content.\n\nMore content here.");
  });

  it("handles rules without metadata", () => {
    const raw = `---
schemaVersion: 1
id: simple-rule
name: Simple Rule
description: Just a simple rule
---
Simple content.`;
    const result = parseRule(raw);
    expect(result.metadata).toBeUndefined();
    expect(result.content).toBe("Simple content.");
  });
});

describe("emitRule", () => {
  it("emits valid RULE.md format", () => {
    const rule = {
      schemaVersion: 1 as const,
      id: "emit-test",
      name: "Emit Test",
      description: "Testing emit",
      content: "Test content.",
    };
    const emitted = emitRule(rule);
    expect(emitted).toContain("---");
    expect(emitted).toContain("schemaVersion: 1");
    expect(emitted).toContain("id: emit-test");
    expect(emitted).toContain("name: Emit Test");
    expect(emitted).toContain("description: Testing emit");
    expect(emitted).toContain("Test content.");
  });

  it("round-trips correctly through parse/emit", () => {
    const original = {
      schemaVersion: 1 as const,
      id: "round-trip",
      name: "Round Trip",
      description: "Testing round trip",
      content: "Original content here.",
      metadata: {
        version: "1.0.0",
        tags: ["test"],
      },
    };
    const emitted = emitRule(original);
    const reparsed = parseRule(emitted);
    expect(reparsed.id).toBe(original.id);
    expect(reparsed.name).toBe(original.name);
    expect(reparsed.description).toBe(original.description);
    expect(reparsed.content).toBe(original.content);
  });
});

describe("hashRule", () => {
  it("produces consistent hashes for identical rules", () => {
    const rule = {
      schemaVersion: 1 as const,
      id: "hash-test",
      name: "Hash Test",
      description: "Testing hash",
      content: "Content to hash.",
    };
    const hash1 = hashRule(rule);
    const hash2 = hashRule(rule);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });

  it("produces different hashes for different content", () => {
    const rule1 = {
      schemaVersion: 1 as const,
      id: "rule-1",
      name: "Rule One",
      description: "First rule",
      content: "First content.",
    };
    const rule2 = {
      schemaVersion: 1 as const,
      id: "rule-2",
      name: "Rule Two",
      description: "Second rule",
      content: "Second content.",
    };
    const hash1 = hashRule(rule1);
    const hash2 = hashRule(rule2);
    expect(hash1).not.toBe(hash2);
  });

  it("produces same hash regardless of id", () => {
    const rule1 = {
      schemaVersion: 1 as const,
      id: "id-a",
      name: "Same Name",
      description: "Same description",
      content: "Same content.",
    };
    const rule2 = {
      schemaVersion: 1 as const,
      id: "id-b",
      name: "Same Name",
      description: "Same description",
      content: "Same content.",
    };
    // Hash should be based on semantic content, not id
    const hash1 = hashRule(rule1);
    const hash2 = hashRule(rule2);
    expect(hash1).toBe(hash2);
  });
});
