import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const expectedRepo = "xxxbeom-glitch/chrome-ext";
const failures = [];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  return {
    ok: result.status === 0,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

for (const required of ["CURRENT.md", "AGENTS.md", "docs/COLLABORATION.md"]) {
  if (!existsSync(resolve(process.cwd(), required))) {
    failures.push(`Missing required collaboration file: ${required}`);
  }
}

const root = run("git", ["rev-parse", "--show-toplevel"]);
if (!root.ok) {
  failures.push("Git repository could not be resolved.");
}

const remote = run("git", ["remote", "get-url", "origin"]);
if (!remote.ok) {
  failures.push("Git remote 'origin' is unavailable.");
} else if (!remote.stdout.includes(expectedRepo)) {
  failures.push(`Unexpected origin remote: ${remote.stdout}`);
}

const status = run("git", ["status", "--short"]);
if (!status.ok) {
  failures.push("git status could not be read.");
}

const currentBranch = run("git", ["branch", "--show-current"]);
if (!currentBranch.ok || !currentBranch.stdout) {
  failures.push("Current Git branch could not be determined.");
}

if (remote.ok) {
  const fetchMain = run("git", ["fetch", "--quiet", "origin", "main"]);
  if (!fetchMain.ok) {
    failures.push("Could not fetch origin/main. Task work must not start from an unverified stale base.");
  } else {
    const containsMain = run("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"]);
    if (!containsMain.ok) {
      failures.push("Current HEAD does not contain the latest origin/main. Rebase/update before claiming a task.");
    }
  }
}

const ghVersion = run("gh", ["--version"]);
if (!ghVersion.ok) {
  failures.push("GitHub CLI (gh) is unavailable. Install it before agent handoff work.");
}

if (ghVersion.ok) {
  const auth = run("gh", ["auth", "status"]);
  if (!auth.ok) {
    failures.push("GitHub CLI is not authenticated. Run: gh auth login");
  }

  const repo = run("gh", ["repo", "view", expectedRepo, "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
  if (!repo.ok || repo.stdout !== expectedRepo) {
    failures.push(`Authenticated GitHub access to ${expectedRepo} could not be verified.`);
  }
}

if (failures.length > 0) {
  console.error("Agent environment check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Agent environment check passed.");
console.log(`Branch: ${currentBranch.stdout}`);
if (status.stdout) {
  console.log("Working tree has local changes; inspect before editing:");
  console.log(status.stdout);
} else {
  console.log("Working tree is clean.");
}
