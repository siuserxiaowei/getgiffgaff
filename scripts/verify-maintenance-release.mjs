#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DEFAULT_RELEASE_ROOT = path.join(ROOT, ".release");
const SCANNED_EXTENSIONS = new Set([".html", ".js", ".json", ".txt", ".xml"]);
const UNSUPPORTED_COMMERCIAL_ASSERTIONS = Object.freeze([
  /主卖/u,
  /国内发货/u,
  /浙江发货/u,
  /圆通包邮/u,
  /顺丰可到付/u,
  /5\s*张起卖/u,
  /5\s*张起发/u,
  /适合第一次购买或急用/u,
  /全新未激活/u,
  /购买保障/u,
  /省去首次充值麻烦/u,
  /常规库存/u,
  /现货充足/u,
  /库存充足/u,
  /(?:客服|微信)(?:小玉|联系小玉)/u,
  /快团团(?:商品页|店铺|下单)/u,
  /通过快团团或客服入口下单/u,
  /进店确认库存/u,
  /\b(?:in[ -]?stock|available\s+now|ships?\s+from|free\s+shipping)\b/iu,
]);
const POLICY_STATUS_FILES = new Set([
  "privacy/index.html",
  "terms/index.html",
  "refund/index.html",
  "shipping/index.html",
]);
const BLANKET_PAYMENT_DETERRENTS = Object.freeze([
  /(?:资料|证据)(?:未齐|补齐前)[^。；\n]{0,16}请勿付款/u,
  /未核验[^。；\n]{0,24}(?:请勿|不要)付款/u,
  /缺少(?:书面订单说明|逐批证据)时不要付款/u,
  /请暂停付款/u,
  /无法取得时请勿付款/u,
  /未取得前请勿付款/u,
]);

function help() {
  return `Usage:
  node scripts/verify-maintenance-release.mjs --mode maintenance
  node scripts/verify-maintenance-release.mjs --mode commerce
  node scripts/verify-maintenance-release.mjs --scan-release-only [release-root]

Both deployment modes run verify, outreach validation, the static release assertion
scan and the clean-worktree gate. Commerce mode additionally requires and validates
COMMERCE_EVIDENCE_FILE with the strict commerce evidence validator.`;
}

export function parseDeploymentGateCliOptions(args = []) {
  const options = { help: false, mode: "" };
  let modeSeen = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--mode") {
      if (modeSeen) throw new TypeError("--mode may only be specified once");
      modeSeen = true;
      options.mode = args[index + 1] || "";
      index += 1;
    } else if (argument.startsWith("--mode=")) {
      if (modeSeen) throw new TypeError("--mode may only be specified once");
      modeSeen = true;
      options.mode = argument.slice("--mode=".length);
    } else {
      throw new TypeError(`Unknown option: ${argument}`);
    }
  }

  if (!options.help && !new Set(["maintenance", "commerce"]).has(options.mode)) {
    throw new TypeError("--mode must be either maintenance or commerce");
  }
  return options;
}

async function releaseFiles(root, directory = root) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await releaseFiles(root, absolute));
    } else if (entry.isFile() && SCANNED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push({
        path: path.relative(root, absolute).split(path.sep).join("/"),
        text: await readFile(absolute, "utf8"),
      });
    }
  }
  return files;
}

export function scanStaticReleaseAssertions(files) {
  if (!Array.isArray(files)) throw new TypeError("files must be an array");
  const errors = [];
  for (const file of files) {
    const filename = String(file?.path || "<unknown>");
    const permitsNarrowPolicyWarning = POLICY_STATUS_FILES.has(filename);
    const lines = String(file?.text || "").split(/\r?\n/u);
    for (const [index, line] of lines.entries()) {
      for (const pattern of UNSUPPORTED_COMMERCIAL_ASSERTIONS) {
        const match = pattern.exec(line);
        if (match) {
          const excerpt = line.trim().slice(Math.max(0, match.index - 80), match.index + match[0].length + 80);
          errors.push(`${filename}:${index + 1}: unsupported commercial assertion ${JSON.stringify(match[0])}: ${excerpt}`);
          break;
        }
      }
      if (!permitsNarrowPolicyWarning) {
        for (const pattern of BLANKET_PAYMENT_DETERRENTS) {
          const match = pattern.exec(line);
          if (match) {
            const excerpt = line.trim().slice(Math.max(0, match.index - 80), match.index + match[0].length + 80);
            errors.push(`${filename}:${index + 1}: blanket payment deterrent ${JSON.stringify(match[0])}: ${excerpt}`);
            break;
          }
        }
      }
    }
  }
  return { errors, scannedFiles: files.length };
}

export async function verifyStaticReleaseAssertions({ releaseRoot = DEFAULT_RELEASE_ROOT } = {}) {
  const files = await releaseFiles(path.resolve(releaseRoot));
  const result = scanStaticReleaseAssertions(files);
  if (result.errors.length) {
    throw new Error(
      `Static release assertion scan failed with ${result.errors.length} issue(s):\n${result.errors.join("\n")}`,
    );
  }
  return result;
}

export function executeCommand(command, args, { cwd = ROOT, env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: env || process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const suffix = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`Deployment gate command failed (${suffix}): ${[command, ...args].join(" ")}`));
    });
  });
}

export async function runDeploymentGate({
  mode,
  cwd = ROOT,
  env = process.env,
  runCommand = executeCommand,
} = {}) {
  if (!new Set(["maintenance", "commerce"]).has(mode)) {
    throw new TypeError("mode must be either maintenance or commerce");
  }

  const evidenceFile = mode === "commerce"
    ? String(env.COMMERCE_EVIDENCE_FILE || "").trim()
    : "";
  if (mode === "commerce" && !evidenceFile) {
    throw new Error(
      "Commerce deployment requires COMMERCE_EVIDENCE_FILE pointing to the private validated evidence package.",
    );
  }

  const sharedEnvironment = mode === "maintenance"
    ? Object.fromEntries(Object.entries(env).filter(([name]) => name !== "COMMERCE_EVIDENCE_FILE"))
    : env;
  const commandOptions = { cwd, env: sharedEnvironment };

  await runCommand("npm", ["run", "verify"], commandOptions);
  await runCommand("npm", ["run", "validate:outreach"], commandOptions);
  await runCommand(
    "node",
    ["scripts/verify-maintenance-release.mjs", "--scan-release-only"],
    commandOptions,
  );
  if (mode === "commerce") {
    await runCommand(
      "npm",
      ["run", "validate:commerce-evidence", "--", "--file", evidenceFile],
      { cwd, env },
    );
  }
  await runCommand("node", ["scripts/assert-clean-worktree.mjs"], commandOptions);

  return {
    mode,
    commerceEvidenceValidated: mode === "commerce",
    gates: [
      "verify",
      "validate:outreach",
      "static-release-assertions",
      ...(mode === "commerce" ? ["validate:commerce-evidence"] : []),
      "clean-worktree",
    ],
  };
}

export async function runDeploymentGateCli(
  args = process.argv.slice(2),
  {
    runGate = runDeploymentGate,
    scanRelease = verifyStaticReleaseAssertions,
    write = (value) => process.stdout.write(value),
  } = {},
) {
  if (args[0] === "--scan-release-only") {
    if (args.length > 2) throw new TypeError(help());
    const report = await scanRelease({
      releaseRoot: args[1] ? path.resolve(args[1]) : DEFAULT_RELEASE_ROOT,
    });
    write(`Static release assertions valid: ${report.scannedFiles} files scanned.\n`);
    return;
  }

  const options = parseDeploymentGateCliOptions(args);
  if (options.help) {
    write(`${help()}\n`);
    return;
  }
  const report = await runGate({ mode: options.mode });
  write(`${JSON.stringify(report)}\n`);
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  runDeploymentGateCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
