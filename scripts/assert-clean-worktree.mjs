import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function assertCleanWorktree({ cwd = process.cwd() } = {}) {
  const result = spawnSync(
    "git",
    ["status", "--porcelain", "--untracked-files=all"],
    { cwd, encoding: "utf8" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "Unable to inspect Git worktree");
  }
  const changes = result.stdout.trim();
  if (changes) {
    throw new Error(`Deployment requires a clean worktree:\n${changes}`);
  }
  return true;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  assertCleanWorktree();
  process.stdout.write("worktree clean\n");
}
