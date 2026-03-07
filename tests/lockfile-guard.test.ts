import { describe, it, expect } from "vitest";
import { requiresLockfileUpdate } from "../.github/scripts/check-lockfile-needed.mjs";

describe("requiresLockfileUpdate", () => {
  it("ignores metadata-only package.json changes", () => {
    const basePkg = {
      name: "aisyncer",
      version: "0.2.1",
      description: "Old description",
      keywords: ["ai", "sync"],
    };
    const headPkg = {
      ...basePkg,
      description: "New description",
      keywords: ["ai", "sync", "codex"],
    };

    expect(requiresLockfileUpdate(basePkg, headPkg)).toBe(false);
  });

  it("requires a lockfile update when dependencies change", () => {
    const basePkg = {
      name: "aisyncer",
      version: "0.2.1",
      dependencies: {
        commander: "^12.1.0",
      },
    };
    const headPkg = {
      ...basePkg,
      dependencies: {
        ...basePkg.dependencies,
        zod: "^3.24.0",
      },
    };

    expect(requiresLockfileUpdate(basePkg, headPkg)).toBe(true);
  });

  it("requires a lockfile update when version changes", () => {
    const basePkg = {
      name: "aisyncer",
      version: "0.2.1",
    };
    const headPkg = {
      ...basePkg,
      version: "0.2.2",
    };

    expect(requiresLockfileUpdate(basePkg, headPkg)).toBe(true);
  });

  it("treats reordered dependency keys as equivalent", () => {
    const basePkg = {
      dependencies: {
        commander: "^12.1.0",
        zod: "^3.24.0",
      },
    };
    const headPkg = {
      dependencies: {
        zod: "^3.24.0",
        commander: "^12.1.0",
      },
    };

    expect(requiresLockfileUpdate(basePkg, headPkg)).toBe(false);
  });
});
