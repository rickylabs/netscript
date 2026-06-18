# Static Gates

Static gates prove the changed files compile, format, lint, document, and remain publishable when
package scope is involved.

## Gate Definitions

| Gate             | Default command                                   | Required when                                                | Evidence                      |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| Narrow typecheck | `deno check --unstable-kv <file-or-entry>`        | Small focused changes where workspace config is not required | command output or parser JSON |
| Slice typecheck  | `.llm/tools/run-deno-check.ts -- <check command>` | Significant work or workspace-config-sensitive code          | wrapper JSON summary          |
| Format check     | `deno task fmt --check` or targeted equivalent    | Any committed docs/code where formatting matters             | command output                |
| Lint             | `deno task lint` or narrow lint target            | Code changes; docs-only runs may skip with rationale         | command output                |
| Doc lint         | `deno doc --lint <module>`                        | Public package exports, README/API docs, JSR work            | command output                |
| Publish dry-run  | `deno publish --dry-run` from package             | Published package/plugin changes                             | command output                |
| Link/path check  | `deno task docs:links`                            | Docs that reference local paths                              | checker report                |
| Doc-maintenance  | `deno task docs:maintenance`                      | Internal/contributor doc changes (links, mirrors, surface)   | composite checker report      |

## Parser Preference

Use `.llm/tools/run-deno-check.ts` for `deno check` and `deno task check:<slice>` output when
possible. It can run a scoped file selection directly, parse a saved log with `--input`, parse stdin
with `--stdin`, or wrap a command after `--`. Fall back to raw output only if the wrapper cannot
run.

## Doc-Maintenance Gate (internal/contributor docs)

`deno task docs:maintenance` is the composite fitness gate that keeps the internal/contributor doc
surface from silently rotting. It runs three checks in order and fails on the first violation:

| Step | Task                          | Proves                                                                 |
| ---- | ----------------------------- | ---------------------------------------------------------------------- |
| 1    | `agentic:check-claude`        | the generated Claude agent surface validates (`validate-claude-surface.ts`) |
| 2    | `agentic:sync-claude:check`   | `.claude/skills/` mirrors are in sync with `.agents/skills/` source (no stale mirror) |
| 3    | `docs:links`                  | internal Markdown links and `#anchor` fragments resolve to real files/headings |

Run order in the task is `docs:links && agentic:sync-claude:check && agentic:check-claude`. The
link checker (`.llm/tools/check-internal-doc-links.ts`) scans `.llm/harness/`,
`docs/architecture/doctrine/`, `.agents/skills/`, and the root agent-surface files; it enforces
broken-link and broken-anchor findings by default. Orphan detection (docs unreferenced by any other
internal doc, counting both Markdown links and backtick code-span path references) is opt-in via
`--check-orphans` because internal cross-reference style varies. Never point the link checker at the
generated `.claude/skills/` mirror — mirror staleness is owned by `agentic:sync-claude:check`.

## Documentation-Only Runs

Docs-only runs validate by:

- checking referenced local paths exist,
- verifying docs do not contradict the authoritative source,
- checking Markdown formatting when a repo task exists,
- running no code typecheck unless docs generate or modify code examples that can be checked.

## Failure Handling

A static gate failure is normally `FAIL_FIX`. It becomes `FAIL_RESCOPE` when the failure proves the
plan omitted a necessary package/API redesign.
