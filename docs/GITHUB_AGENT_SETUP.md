# GitHub Agent Setup

This repository assumes Cursor can read and write GitHub task state without the user copying messages between tools.

## Recommended local setup

### 1. GitHub CLI

Install GitHub CLI (`gh`) and authenticate once on the development machine.

Verify:

```bash
gh --version
gh auth status
gh repo view xxxbeom-glitch/chrome-ext
```

Cursor agents with terminal access can then use:

```bash
gh issue list -R xxxbeom-glitch/chrome-ext
gh issue view <number> -R xxxbeom-glitch/chrome-ext
gh issue create -R xxxbeom-glitch/chrome-ext --title "..." --body-file <file>
gh issue comment <number> -R xxxbeom-glitch/chrome-ext --body-file <file>
gh pr create -R xxxbeom-glitch/chrome-ext
gh pr view <number> -R xxxbeom-glitch/chrome-ext
gh run list -R xxxbeom-glitch/chrome-ext
```

Run the repository preflight:

```bash
pnpm agent:check
```

Cursor must not claim it can perform GitHub handoff work if this check fails.

## Optional: official GitHub MCP Server

GitHub also provides an official MCP server and documents Cursor integration. This is optional; the collaboration protocol does not depend on it because `gh` CLI is sufficient.

Recommended remote server endpoint from GitHub's current Cursor installation guide:

```text
https://api.githubcopilot.com/mcp/
```

Authentication material belongs in the user's global Cursor/MCP configuration, never in this repository.

Do not commit PATs or copy them into `.cursor/` project files.

## Cursor startup check

At the start of a repo task, Cursor should confirm:

1. repository root is `chrome-ext`;
2. `git remote get-url origin` points to `xxxbeom-glitch/chrome-ext`;
3. `gh auth status` succeeds;
4. `CURRENT.md` is readable;
5. the active Issue can be read;
6. working tree status is understood before edits.

## If GitHub access is unavailable

Do not create a shadow workflow in local notes.

- Code-only investigation may continue if it does not change task state.
- Do not claim/complete/handoff a task without recording it in GitHub.
- Report `BLOCKED: GitHub agent access unavailable` to the user and restore GitHub access first.

## Security

The repository is public as of the creation of this workflow. GitHub task comments and PRs must contain only public-safe project information.

If private operational context is required, make the repository private before adding that material.
