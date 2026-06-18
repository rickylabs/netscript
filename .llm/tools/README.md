# .llm/tools README

Reusable Deno utilities for MCP/Codex sessions live here. Keep one-off scripts in `.llm/tmp/`.

## Start Here

- Use `deno task e2e:cli` for the full CLI merge-readiness gate.
- Use `.llm/tools/scaffold-e2e-test.ts` only as a legacy comparison smoke when debugging parity with
  the previous repo checkout.
- Use `.llm/tools/run-deno-check.ts` to run scoped type-checks or summarize noisy deno-check logs.
- Use `.llm/tools/run-deno-lint.ts` to run scoped lint checks and summarize findings as JSON.
- Use `.llm/tools/run-deno-fmt.ts` to run scoped, non-mutating fmt checks by root and extension. Add
  `--ignore-line-endings` for known baseline line-ending drift; add `--show-ignored` only when the
  ignored file list is needed.
- Use `.llm/tools/fitness/*.ts` for doctrine and package-readiness gates; do not duplicate those scripts
  under `.llm/tools`.
- Use `.llm/tools/agentic/*.ts` for Claude Code, skill-mirror, and agent-orchestration checks.

## Common Commands

```powershell
# Full CLI E2E merge gate
deno task e2e:cli

# Explicit full suite with readable output
deno task e2e:cli run scaffold.runtime --cleanup --format pretty

# Scoped check / saved-log check diagnostics
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/logger --pretty
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --input .llm/tmp/check.log --pretty

# Scoped lint/fmt validation
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/logger --pretty
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/logger --ext md --pretty

# Scan text without PowerShell quoting issues
deno run --allow-read .llm/tools/find-lines.ts --root packages/cli --contains "scaffold.runtime"

# Validate Claude Code project surface and generated skill mirror
deno task agentic:check-claude
```

## Tool Index

| Tool                        | Use                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `find-lines.ts`             | Substring or regex scans across one or more roots.                                 |
| `find-import-patterns.ts`   | Import alias and relative-path debt scans.                                         |
| `find-symbol-usages.ts`     | Symbol-boundary usage scans for refactors.                                         |
| `list-exports.ts`           | Export and re-export inventory for package surfaces.                               |
| `compare-export-surface.ts` | Compare actual exports against an expected symbol list.                            |
| `run-deno-doc-lint.ts`      | Structured `deno doc --lint` runner with per-entrypoint + per-file attribution.    |
| `run-deno-check.ts`         | Scoped `deno check` runner and parser for saved, stdin, or wrapped command output. |
| `run-deno-lint.ts`          | Scoped lint runner with grouped JSON findings.                                     |
| `run-deno-fmt.ts`           | Scoped fmt runner with non-mutating `--check` default.                             |
| `git-commit-paths.ts`       | Commit/push selected paths without Windows shell quoting issues.                   |
| `scaffold-e2e-test.ts`      | Legacy full scaffold smoke for CLI/plugin/DB/Aspire parity debugging.              |
| `agentic/sync-claude-skills.ts` | Generate or check `.claude/skills` from `.agents/skills`.                      |
| `agentic/validate-claude-surface.ts` | Validate `CLAUDE.md`, Claude settings, gitignore, and skill mirror.     |
| `agentic/claude-remote-smoke.ts` | Fast Claude CLI/remote-control smoke, with env-aware skip and optional live `--bg` launch. |

See `.llm/tools/entry.md` for examples and selection notes.
