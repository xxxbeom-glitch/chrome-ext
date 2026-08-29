import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const errors = [];

const requiredRootFiles = [
  "AGENTS.md",
  "CURRENT.md",
  ".cursorignore",
  ".cursorindexingignore",
  ".cursor/rules/00-core.mdc",
  ".cursor/rules/05-github-collaboration.mdc",
  ".cursor/rules/10-extension-architecture.mdc",
  ".cursor/rules/20-design-system.mdc",
  ".cursor/rules/30-third-party-integrations.mdc",
  ".cursor/rules/40-testing-and-qa.mdc",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/ISSUE_TEMPLATE/task.yml",
  ".github/ISSUE_TEMPLATE/handoff.yml",
  ".github/ISSUE_TEMPLATE/decision.yml",
  ".github/PULL_REQUEST_TEMPLATE.md",
  "docs/ARCHITECTURE.md",
  "docs/SECURITY.md",
  "docs/QA.md",
  "docs/STORE_POLICY.md",
  "docs/DEVELOPMENT.md",
  "docs/DESIGN_SYSTEM.md",
  "docs/CURSOR.md",
  "docs/COLLABORATION.md",
  "docs/GITHUB_AGENT_SETUP.md",
  "docs/decisions/README.md",
  "docs/decisions/DEC-0001-github-collaboration-hub.md",
  "docs/decisions/DEC-0002-cursor-standalone-review-mode.md",
  "scripts/check-agent-env.mjs",
  "templates/APP_AGENTS.md",
  "packages/design-system/package.json",
  "packages/design-system/tsconfig.json",
  "packages/design-system/src/tokens.css",
  "packages/design-system/src/base.css",
  "packages/design-system/src/theme.ts",
];

for (const path of requiredRootFiles) {
  if (!existsSync(join(root, path))) {
    errors.push(`Missing required repository file: ${path}`);
  }
}

if (existsSync(join(root, ".cursorrules"))) {
  errors.push("Legacy .cursorrules is not allowed; use .cursor/rules/*.mdc.");
}

const cursorRulesDir = join(root, ".cursor", "rules");
if (existsSync(cursorRulesDir)) {
  for (const name of readdirSync(cursorRulesDir)) {
    if (!name.endsWith(".mdc")) {
      errors.push(`Cursor project rule must use .mdc extension: .cursor/rules/${name}`);
      continue;
    }

    const content = readFileSync(join(cursorRulesDir, name), "utf8");
    if (!content.startsWith("---\n") || !content.includes("\ndescription:")) {
      errors.push(`Cursor rule is missing valid frontmatter/description: .cursor/rules/${name}`);
    }
    if (!content.includes("\nalwaysApply:")) {
      errors.push(`Cursor rule is missing alwaysApply frontmatter: .cursor/rules/${name}`);
    }
  }
}

const currentPath = join(root, "CURRENT.md");
if (existsSync(currentPath)) {
  const current = readFileSync(currentPath, "utf8");
  for (const marker of [
    "## Active work",
    "| Issue | App / scope | State | Owner | Review mode | Branch |",
    "## Blockers / decisions needed",
    "## Recovery rule",
  ]) {
    if (!current.includes(marker)) {
      errors.push(`CURRENT.md is missing required marker: ${marker}`);
    }
  }
}

const collaborationPath = join(root, "docs", "COLLABORATION.md");
if (existsSync(collaborationPath)) {
  const collaboration = readFileSync(collaborationPath, "utf8");
  const requiredStates = [
    "`DRAFT`",
    "`READY`",
    "`RUNNING`",
    "`REVIEW`",
    "`FIX_REQUIRED`",
    "`DECISION_NEEDED`",
    "`BLOCKED`",
    "`DONE`",
  ];
  for (const state of requiredStates) {
    if (!collaboration.includes(state)) {
      errors.push(`Collaboration contract is missing state: ${state}`);
    }
  }
  for (const marker of [
    "STATE: RUNNING",
    "OWNER: CURSOR",
    "STATE: REVIEW",
    "REVIEW_MODE: SELF",
    "REVIEW_MODE: CHATGPT",
    "REVIEW_MODE: USER",
    "Cursor SELF-review protocol",
    "latest valid `STATE:` + `OWNER:` pair",
    "write scopes are disjoint",
  ]) {
    if (!collaboration.includes(marker)) {
      errors.push(`Collaboration contract is missing review/handoff/concurrency marker: ${marker}`);
    }
  }
}

const cursorCollaborationRulePath = join(root, ".cursor", "rules", "05-github-collaboration.mdc");
if (existsSync(cursorCollaborationRulePath)) {
  const rule = readFileSync(cursorCollaborationRulePath, "utf8");
  for (const marker of ["REVIEW_MODE: SELF", "distinct second review pass", "STATE: DONE", "DECISION_NEEDED"]) {
    if (!rule.includes(marker)) {
      errors.push(`Cursor collaboration rule is missing standalone-review marker: ${marker}`);
    }
  }
}

const packagePath = join(root, "package.json");
if (existsSync(packagePath)) {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  if (packageJson.scripts?.["agent:check"] !== "node scripts/check-agent-env.mjs") {
    errors.push("Root package.json must expose the canonical `pnpm agent:check` preflight.");
  }
}

const taskFormPath = join(root, ".github", "ISSUE_TEMPLATE", "task.yml");
if (existsSync(taskFormPath)) {
  const form = readFileSync(taskFormPath, "utf8");
  for (const field of ["App / Scope", "Acceptance Criteria", "Do Not Change", "Required QA", "Review Mode", "Initial Owner", "Initial State"]) {
    if (!form.includes(field)) {
      errors.push(`Task issue form is missing required field: ${field}`);
    }
  }
  for (const mode of ["SELF", "CHATGPT", "USER"]) {
    if (!form.includes(`- ${mode}`)) {
      errors.push(`Task issue form is missing review mode option: ${mode}`);
    }
  }
}

const prTemplatePath = join(root, ".github", "PULL_REQUEST_TEMPLATE.md");
if (existsSync(prTemplatePath)) {
  const template = readFileSync(prTemplatePath, "utf8");
  for (const marker of ["## Permission / data impact", "## QA evidence", "## Residual risk", "## Not done"]) {
    if (!template.includes(marker)) {
      errors.push(`PR template is missing required section: ${marker}`);
    }
  }
}

const designPackagePath = join(root, "packages", "design-system", "package.json");
if (existsSync(designPackagePath)) {
  const designPackage = JSON.parse(readFileSync(designPackagePath, "utf8"));
  if (designPackage.dependencies?.pretendard !== "1.3.9") {
    errors.push("Design-system must pin Pretendard to 1.3.9 for reproducible local bundling.");
  }
  for (const requiredExport of ["./tokens.css", "./base.css", "./theme"]) {
    if (!designPackage.exports?.[requiredExport]) {
      errors.push(`Design-system package is missing export: ${requiredExport}`);
    }
  }
}

const tokensPath = join(root, "packages", "design-system", "src", "tokens.css");
if (existsSync(tokensPath)) {
  const tokens = readFileSync(tokensPath, "utf8");
  const requiredTokens = [
    "--ce-ref-font-family-sans",
    "--ce-sys-color-bg-canvas",
    "--ce-sys-color-bg-surface",
    "--ce-sys-color-text-primary",
    "--ce-sys-color-text-secondary",
    "--ce-sys-color-text-disabled",
    "--ce-sys-color-border-default",
    "--ce-sys-color-action-primary",
    "--ce-sys-color-status-info-solid",
    "--ce-sys-color-status-success-solid",
    "--ce-sys-color-status-warning-solid",
    "--ce-sys-color-status-danger-solid",
    "--ce-sys-color-focus-ring",
    "--ce-sys-type-body-md-size",
    "--ce-sys-space-md",
    "--ce-sys-radius-control",
    "--ce-sys-motion-normal",
    "--ce-comp-button-height-md",
    "--ce-comp-input-height-md",
    "--ce-comp-checkbox-size",
    "--ce-comp-popup-width-md",
    "[data-ce-theme=\"dark\"]",
    "prefers-color-scheme: dark",
    "prefers-reduced-motion: reduce",
  ];

  for (const token of requiredTokens) {
    if (!tokens.includes(token)) {
      errors.push(`Design-system contract is missing: ${token}`);
    }
  }
}

const baseCssPath = join(root, "packages", "design-system", "src", "base.css");
if (existsSync(baseCssPath)) {
  const baseCss = readFileSync(baseCssPath, "utf8");
  if (!baseCss.includes('pretendard/dist/web/variable/pretendardvariable.css')) {
    errors.push("Shared base.css must bundle Pretendard from the local npm package.");
  }
  if (/https?:\/\//.test(baseCss)) {
    errors.push("Shared base.css must not load runtime assets from remote URLs.");
  }
}

const appRoot = join(root, "apps");
if (existsSync(appRoot)) {
  for (const entry of readdirSync(appRoot)) {
    const appDir = join(appRoot, entry);
    if (!statSync(appDir).isDirectory()) continue;

    const requiredAppFiles = [
      "AGENTS.md",
      "package.json",
      "wxt.config.ts",
      "docs/SPEC.md",
      "docs/PERMISSIONS.md",
      "docs/QA.md",
    ];

    for (const appFile of requiredAppFiles) {
      if (!existsSync(join(appDir, appFile))) {
        errors.push(`apps/${entry} is missing required file: ${appFile}`);
      }
    }

    scanApp(appDir);
  }
}

function scanApp(appDir) {
  const ignoredDirs = new Set([
    "node_modules",
    ".output",
    "dist",
    "build",
    "coverage",
    "test-results",
    "playwright-report",
    ".wxt",
  ]);
  const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".css"]);

  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const fullPath = join(dir, name);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        if (!ignoredDirs.has(name)) walk(fullPath);
        continue;
      }

      if (!codeExtensions.has(extname(name))) continue;

      const content = readFileSync(fullPath, "utf8");
      const displayPath = relative(root, fullPath).replaceAll("\\", "/");

      if (content.includes("<all_urls>")) {
        errors.push(`${displayPath}: <all_urls> is forbidden by repository policy.`);
      }
      if (/\beval\s*\(/.test(content)) {
        errors.push(`${displayPath}: eval() is forbidden by repository policy.`);
      }
      if (/\bnew\s+Function\s*\(/.test(content)) {
        errors.push(`${displayPath}: new Function() is forbidden by repository policy.`);
      }
      if (/importScripts\s*\(\s*["']https?:\/\//.test(content)) {
        errors.push(`${displayPath}: remote importScripts() is forbidden.`);
      }
      if (/@import\s+(?:url\()?\s*["']https?:\/\//.test(content)) {
        errors.push(`${displayPath}: remote CSS import is forbidden; bundle assets locally.`);
      }
      if (/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard|unpkg\.com\/pretendard|cdnjs\.cloudflare\.com\/.*pretendard/i.test(content)) {
        errors.push(`${displayPath}: Pretendard must come from the shared local design-system package.`);
      }
    }
  };

  walk(appDir);
}

if (errors.length > 0) {
  console.error("Repository verification failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Repository verification passed.");
