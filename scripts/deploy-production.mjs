import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (result.status !== 0) {
    const detail = options.capture ? `\n${result.stderr || result.stdout}` : "";
    throw new Error(`${command} ${args.join(" ")} failed${detail}`);
  }
  return options.capture ? result.stdout.trim() : "";
}

if (process.env.CONFIRM_PRODUCTION_DEPLOY !== "getgiffgaff") {
  throw new Error(
    "Production deployment is locked. Set CONFIRM_PRODUCTION_DEPLOY=getgiffgaff only after an approved release review.",
  );
}

const status = run("git", ["status", "--porcelain"], { capture: true });
if (status) {
  throw new Error(
    "Production deployment requires a clean, reviewed commit; commit or remove every working-tree change first.",
  );
}

run("npm", ["run", "verify"]);
const commitHash = run("git", ["rev-parse", "HEAD"], { capture: true });
run("wrangler", [
  "pages",
  "deploy",
  "public",
  "--project-name",
  "getgiffgaff",
  "--branch",
  "main",
  "--commit-hash",
  commitHash,
]);
run("npm", ["run", "verify:production"]);
