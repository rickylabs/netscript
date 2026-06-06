# .llm/tools README

Reusable Deno utilities for MCP/Codex sessions live here. Keep one-off scripts in `.llm/tmp/`.

## Start Here

- Use `deno task e2e:cli` for the full CLI merge-readiness gate.
- Use `.llm/tools/scaffold-e2e-test.ts` only as a legacy comparison smoke when debugging parity with
  the previous repo checkout.
- Use `.llm/tools/parse-deno-check-errors.ts` to summarize noisy generated-project type-check logs.
- Use `tools/fitness/*.ts` for doctrine and package-readiness gates; do not duplicate those scripts
  under `.llm/tools`.

## Common Commands

```powershell
# Full CLI E2E merge gate
deno task e2e:cli

# Explicit full suite with readable output
deno task e2e:cli run scaffold.runtime --cleanup --format pretty

# Parse a saved deno-check log
deno run --allow-read .llm/tools/parse-deno-check-errors.ts --input .llm/tmp/check.log --pretty

# Scan text without PowerShell quoting issues
deno run --allow-read .llm/tools/find-lines.ts --root packages/cli --contains "scaffold.runtime"
```

## Tool Index

| Tool                         | Use                                                                   |
| ---------------------------- | --------------------------------------------------------------------- |
| `find-lines.ts`              | Substring or regex scans across one or more roots.                    |
| `find-import-patterns.ts`    | Import alias and relative-path debt scans.                            |
| `find-symbol-usages.ts`      | Symbol-boundary usage scans for refactors.                            |
| `list-exports.ts`            | Export and re-export inventory for package surfaces.                  |
| `compare-export-surface.ts`  | Compare actual exports against an expected symbol list.               |
| `parse-deno-check-errors.ts` | Group Deno/TypeScript errors by kind, message, and path.              |
| `git-commit-paths.ts`        | Commit/push selected paths without Windows shell quoting issues.      |
| `scaffold-e2e-test.ts`       | Legacy full scaffold smoke for CLI/plugin/DB/Aspire parity debugging. |

See `.llm/tools/entry.md` for examples and selection notes.
