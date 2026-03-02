import { describe, it, expect } from "vitest";
import { parseGitHubSource } from "../src/github/fetch.js";

describe("parseGitHubSource", () => {
  it("parses github:owner/repo", () => {
    const result = parseGitHubSource("github:my-org/my-repo");
    expect(result.owner).toBe("my-org");
    expect(result.repo).toBe("my-repo");
    expect(result.ref).toBeUndefined();
  });

  it("parses github:owner/repo#branch", () => {
    const result = parseGitHubSource("github:my-org/my-repo#develop");
    expect(result.owner).toBe("my-org");
    expect(result.repo).toBe("my-repo");
    expect(result.ref).toBe("develop");
  });

  it("parses github:owner/repo#refs/tags/v1", () => {
    const result = parseGitHubSource("github:my-org/my-repo#v1.0.0");
    expect(result.owner).toBe("my-org");
    expect(result.repo).toBe("my-repo");
    expect(result.ref).toBe("v1.0.0");
  });

  it("strips .git suffix from repo name", () => {
    const result = parseGitHubSource("github:my-org/my-repo.git");
    expect(result.owner).toBe("my-org");
    expect(result.repo).toBe("my-repo");
    expect(result.ref).toBeUndefined();
  });

  it("strips .git suffix with branch", () => {
    const result = parseGitHubSource("github:my-org/my-repo.git#main");
    expect(result.owner).toBe("my-org");
    expect(result.repo).toBe("my-repo");
    expect(result.ref).toBe("main");
  });

  // Full URL format
  it("parses https://github.com/owner/repo", () => {
    const result = parseGitHubSource("https://github.com/my-org/my-repo");
    expect(result.owner).toBe("my-org");
    expect(result.repo).toBe("my-repo");
    expect(result.ref).toBeUndefined();
  });

  it("parses https://github.com/owner/repo.git", () => {
    const result = parseGitHubSource("https://github.com/owner/repo.git");
    expect(result.owner).toBe("owner");
    expect(result.repo).toBe("repo");
    expect(result.ref).toBeUndefined();
  });

  it("parses https://github.com/owner/repo/tree/branch", () => {
    const result = parseGitHubSource("https://github.com/my-org/my-repo/tree/develop");
    expect(result.owner).toBe("my-org");
    expect(result.repo).toBe("my-repo");
    expect(result.ref).toBe("develop");
  });

  it("parses URL with trailing slash", () => {
    const result = parseGitHubSource("https://github.com/my-org/my-repo/");
    expect(result.owner).toBe("my-org");
    expect(result.repo).toBe("my-repo");
    expect(result.ref).toBeUndefined();
  });

  it("throws on invalid format (no prefix)", () => {
    expect(() => parseGitHubSource("my-org/my-repo")).toThrow("Invalid GitHub source");
  });

  it("throws on invalid format (no repo)", () => {
    expect(() => parseGitHubSource("github:my-org")).toThrow("Invalid GitHub source");
  });

  it("throws on empty string", () => {
    expect(() => parseGitHubSource("")).toThrow("Invalid GitHub source");
  });

  it("throws on wrong prefix", () => {
    expect(() => parseGitHubSource("gitlab:my-org/my-repo")).toThrow("Invalid GitHub source");
  });
});
