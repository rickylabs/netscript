---
name: netscript-tools
description: NetScript repository tooling and validation guide. Use whenever a task involves repo-native Deno wrappers, rtk, raw git verification, gate evidence, PR comments, OpenHands/Copilot automation, lock hygiene, root check/lint/fmt wrappers, doc-lint, publish dry-run, JSR audits, worktree synchronization, or deciding which command is a trustworthy verdict source.
---

# NetScript Tools

Use this skill when choosing commands or recording validation evidence in the NetScript repo. The
goal is to avoid false green gates, stale git reads, and stale automation comments.

## Tool Locations

Use `.llm/tools/` for harness, evaluator, agent, and package-quality helper scripts. Fitness gates
live under `.llm/tools/fitness/`; keep new doctrine, standards, JSR, and release-readiness helpers
there unless they are product-facing CLI features.

Use `tools/` only for reusable product/repository tooling that should ship as part of the public
developer surface. Do not create a parallel fitness tree outside `.llm/tools/`.

## Git And Status

RTK can cache read-heavy git output. For ground-truth branch state, spawn git directly:

```powershell
deno eval 'const p = new Deno.Command("git", { args: ["status", "--short"] }).outputSync(); await Deno.stdout.write(p.stdout); await Deno.stderr.write(p.stderr); Deno.exit(p.code);'
deno eval 'const p = new Deno.Command("git", { args: ["ls-remote", "origin", "refs/heads/<branch>"] }).outputSync(); await Deno.stdout.write(p.stdout); await Deno.stderr.write(p.stderr); Deno.exit(p.code);'
```

Use `rtk` for exploratory read-heavy commands when token reduction matters. Do not use filtered RTK
output as the sole PASS/FAIL source for gates.

## Validation Wrappers

Prefer these root wrappers for package/plugin quality checks:

```powershell
deno task check
deno task lint
deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root <path> --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root <path> --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root <path> --ext ts,tsx
```

For targeted `deno check` commands that touch workspace code, include `--unstable-kv`:

```powershell
deno check --unstable-kv packages/<pkg>/mod.ts
```

Do not run mutating root `deno task fmt` unless the user explicitly asks for repo-wide formatting
changes. Use scoped formatting for owned files only.

## Publish And Docs

Package publishability gates commonly use:

```powershell
deno doc --lint packages/<pkg>/mod.ts
deno publish --dry-run --allow-dirty
deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/<pkg> --text
```

Run `deno publish --dry-run --allow-dirty` from the package directory unless the checked-in task or
plan says otherwise. Treat raw dry-run output as authoritative for slow types; helper scripts may
overcount banner text.

## OpenHands And PR Comments

The `gh` CLI is not reliably available. Use GitHub MCP tools for PR comments. For OpenHands, comment
on the PR with the exact trigger text needed for the run. The persistent
`<!-- openhands-agent-summary -->` comment can be stale; trust committed artifacts like
`plan-eval.md`, `evaluate.md`, and run logs over the summary comment.

When posting automation requests, specify:

- exact one-pass command
- repository root as working directory
- raw exit code requirement
- lock hygiene: do not commit `deno.lock` or source churn unless a reviewed fix requires it

## Lock Hygiene

Do not delete lock files or caches. Do not run `deno cache --reload` without approval. If automation
or validation mutates `deno.lock`, inspect the diff against the true branch base before accepting
it. PLAN-EVAL should not commit lock churn.

## Worktree Sync

If push rejects due to a remote-only evaluator/bot commit, inspect the remote commit before
integrating:

```powershell
deno eval 'const p = new Deno.Command("git", { args: ["show", "--stat", "--oneline", "--name-status", "origin/<branch>"] }).outputSync(); await Deno.stdout.write(p.stdout); await Deno.stderr.write(p.stderr); Deno.exit(p.code);'
```

If the remote commit is unrelated and the local commit should sit on top, use a normal rebase onto
`origin/<branch>` and push. Do not discard user or bot commits.

## Common Gotchas

- `deno task check:packages` and `deno task check:plugins` may not exist; inspect root `deno.json`
  and use the available wrapper plus focused checks.
- Raw root `deno fmt --check` can include generated/scratch/future-wave files. Prefer scoped wrapper
  verdicts.
- `deno check .` can walk generated caches and deferred package surfaces. Prefer explicit roots and
  entrypoints.
- OpenHands may commit `deno.lock` churn; inspect before merging.
- The final full scaffold/plugins E2E command lives in the `netscript-cli` skill.
