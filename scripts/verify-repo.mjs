import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const errors = [];

const requiredRootFiles = [
  "AGENTS.md",
  ".cursorignore",
  ".cursorindexingignore",
  ".cursor/rules/00-core.mdc",
  ".cursor/rules/10-extension-architecture.mdc",
  ".cursor/rules/20-design-system.mdc",
  ".cursor/rules/30-third-party-integrations.mdc",
  ".cursor/rules/40-testing-and-qa.mdc",
  "docs/ARCHITECTURE.md",
  "docs/SECURITY.md",
  "docs/QA.md",
  "docs/STORE_POLICY.md",
  "docs/DEVELOPMENT.md",
  "docs/DESIGN_SYSTEM.md",
  "docs/CURSOR.md",
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
