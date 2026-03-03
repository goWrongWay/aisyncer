/**
 * Fetch skills and rules from a GitHub repository using the REST API.
 *
 * Expected remote structure:
 *   skills/<id>/SKILL.md   (at least skills/ or rules/ must exist)
 *   rules/<id>/RULE.md     (optional)
 *
 * Uses the GitHub Contents API. No git clone needed.
 * Supports GITHUB_TOKEN for private repos and rate limits.
 */

export interface GitHubResourceFile {
  id: string;
  content: string;
}

/** @deprecated Use GitHubResourceFile instead */
export type GitHubSkillFile = GitHubResourceFile;

export interface FetchResult {
  skills: GitHubResourceFile[];
  rules: GitHubResourceFile[];
  errors: string[];
}

interface GitHubTreeItem {
  path: string;
  type: string;
  url: string;
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
  truncated: boolean;
}

interface GitHubBlobResponse {
  content: string;
  encoding: string;
}

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "aisyncer-cli",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function githubGet<T>(url: string, token?: string): Promise<T> {
  const res = await fetch(url, { headers: buildHeaders(token) });

  if (res.status === 404) {
    throw new Error(`Not found: ${url}. Check that the repository exists and is accessible.`);
  }
  if (res.status === 401 || res.status === 403) {
    const hint = token
      ? "The provided GITHUB_TOKEN may lack permissions."
      : "Set GITHUB_TOKEN for private repos or if you hit rate limits.";
    throw new Error(`GitHub API ${res.status}: ${res.statusText}. ${hint}`);
  }
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${res.statusText} (${url})`);
  }

  return (await res.json()) as T;
}

/**
 * Parse a source string into owner/repo/ref.
 *
 * Supported formats:
 *   github:owner/repo
 *   github:owner/repo#branch
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/tree/branch
 */
export function parseGitHubSource(source: string): {
  owner: string;
  repo: string;
  ref?: string;
} {
  // Try github: prefix format
  const shortMatch = source.match(/^github:([^/]+)\/([^#]+?)(?:#(.+))?$/);
  if (shortMatch) {
    const repo = shortMatch[2].replace(/\.git$/, "");
    return { owner: shortMatch[1], repo, ref: shortMatch[3] };
  }

  // Try full URL format: https://github.com/owner/repo[.git][/tree/branch]
  const urlMatch = source.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/#]+?)(?:\.git)?(?:\/tree\/(.+?))?\/?\s*$/,
  );
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2], ref: urlMatch[3] };
  }

  throw new Error(
    `Invalid GitHub source: "${source}". Expected format: github:owner/repo, or https://github.com/owner/repo`,
  );
}

async function fetchBlobs(
  blobs: GitHubTreeItem[],
  pattern: RegExp,
  token?: string,
): Promise<{ files: GitHubResourceFile[]; errors: string[] }> {
  const files: GitHubResourceFile[] = [];
  const errors: string[] = [];

  for (const blob of blobs) {
    const match = blob.path.match(pattern)!;
    const id = match[1];

    try {
      const blobData = await githubGet<GitHubBlobResponse>(blob.url, token);
      const content = Buffer.from(blobData.content, blobData.encoding as BufferEncoding).toString("utf-8");
      files.push({ id, content });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to fetch ${blob.path}: ${msg}`);
    }
  }

  return { files, errors };
}

/**
 * Fetch all skills and rules from a GitHub repo.
 *
 * Strategy:
 * 1. GET the default branch's tree recursively.
 * 2. Filter for paths matching skills/<id>/SKILL.md and rules/<id>/RULE.md.
 * 3. GET each blob to retrieve file content.
 */
export async function fetchFromGitHub(
  source: string,
  token?: string,
): Promise<FetchResult> {
  const { owner, repo, ref } = parseGitHubSource(source);
  const errors: string[] = [];

  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  // Resolve the branch SHA
  const branch = ref ?? "main";
  let treeSha: string;
  try {
    const branchData = await githubGet<{ commit: { sha: string } }>(
      `${apiBase}/branches/${encodeURIComponent(branch)}`,
      token,
    );
    treeSha = branchData.commit.sha;
  } catch (err) {
    // Try "master" as fallback if no ref was specified and "main" failed
    if (!ref) {
      try {
        const masterData = await githubGet<{ commit: { sha: string } }>(
          `${apiBase}/branches/master`,
          token,
        );
        treeSha = masterData.commit.sha;
      } catch {
        throw err; // Re-throw original "main" error
      }
    } else {
      throw err;
    }
  }

  // Get the full recursive tree
  const tree = await githubGet<GitHubTreeResponse>(
    `${apiBase}/git/trees/${treeSha}?recursive=1`,
    token,
  );

  if (tree.truncated) {
    errors.push("Warning: Repository tree was truncated. Some resources may be missing.");
  }

  // Find skills/<id>/SKILL.md and rules/<id>/RULE.md blobs
  const skillPattern = /^skills\/([a-z0-9-]+)\/SKILL\.md$/;
  const rulePattern = /^rules\/([a-z0-9-]+)\/RULE\.md$/;

  const skillBlobs = tree.tree.filter(
    (item) => item.type === "blob" && skillPattern.test(item.path),
  );
  const ruleBlobs = tree.tree.filter(
    (item) => item.type === "blob" && rulePattern.test(item.path),
  );

  if (skillBlobs.length === 0 && ruleBlobs.length === 0) {
    errors.push(
      `No skills or rules found in ${owner}/${repo}. Expected structure: skills/<id>/SKILL.md and/or rules/<id>/RULE.md`,
    );
    return { skills: [], rules: [], errors };
  }

  // Fetch blobs
  const skillResult = await fetchBlobs(skillBlobs, skillPattern, token);
  const ruleResult = await fetchBlobs(ruleBlobs, rulePattern, token);

  errors.push(...skillResult.errors, ...ruleResult.errors);

  return { skills: skillResult.files, rules: ruleResult.files, errors };
}

/** @deprecated Use fetchFromGitHub instead */
export const fetchSkillsFromGitHub = fetchFromGitHub;
