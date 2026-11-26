// makefun-x-reposts-02 entry program.
//
// The whole job of this program is deliberately tiny: take the
// POSTS.json file that lives beside it in the repository root and
// place an unchanged copy of it into the output directory, so the
// grader can read the list of X posts that make up the entry.
// Nothing about the posts themselves is computed here.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_NAME = "POSTS.json";
const MAX_POSTS = 15;

function repoRoot(): string {
  // main.ts sits in the repository root, so its own folder is where
  // POSTS.json should be found first.
  return dirname(fileURLToPath(import.meta.url));
}

function findSource(): string {
  const beside = join(repoRoot(), SOURCE_NAME);
  if (existsSync(beside)) return beside;
  const inCwd = join(process.cwd(), SOURCE_NAME);
  if (existsSync(inCwd)) return inCwd;
  throw new Error(`could not find ${SOURCE_NAME} next to main.ts or in the working directory`);
}

function outputDir(): string {
  if (process.argv[2]) return process.argv[2];
  if (process.env.MAKEFUN_OUTPUT_DIR) return process.env.MAKEFUN_OUTPUT_DIR;
  return "/output";
}

// Read-only sanity check of the list before it is copied. The file
// itself is always copied byte for byte; this only catches an
// obviously broken list early, while a placeholder entry (the repo
// waiting for the account owner's real post URLs) is reported as a
// warning instead of failing the run.
function checkList(source: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(source, "utf8"));
  } catch {
    throw new Error(`${SOURCE_NAME} is not valid JSON`);
  }
  const posts = (parsed as { posts?: unknown }).posts;
  if (!Array.isArray(posts) || posts.length < 1 || posts.length > MAX_POSTS) {
    throw new Error(`${SOURCE_NAME} must hold a "posts" list of 1 to ${MAX_POSTS} URLs`);
  }
  for (const item of posts) {
    if (typeof item !== "string" || item.length === 0) {
      throw new Error(`${SOURCE_NAME} entries must be non-empty URL strings`);
    }
    if (item.includes("PLACEHOLDER")) {
      console.error(`warning: placeholder post URL still present: ${item}`);
    }
  }
}

function main(): void {
  const source = findSource();
  checkList(source);
  const targetDir = outputDir();
  mkdirSync(targetDir, { recursive: true });
  const target = join(targetDir, SOURCE_NAME);
  copyFileSync(source, target);
  console.log(`copied ${source} -> ${target}`);
}

main();
