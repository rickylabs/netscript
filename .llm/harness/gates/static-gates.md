# Static Gates

Static gates prove the changed files compile, format, lint, document, and remain
publishable when package scope is involved.

## Gate Definitions

| Gate | Default command | Required when | Evidence |
|------|-----------------|---------------|----------|
| Narrow typecheck | `deno check --unstable-kv <file-or-entry>` | Small focused changes where workspace config is not required | command output or parser JSON |
| Slice typecheck | `deno task check:<slice>` piped to `.llm/tools/parse-deno-check-errors.ts` | Significant work or workspace-config-sensitive code | parser JSON summary |
| Format check | `deno task fmt --check` or targeted equivalent | Any committed docs/code where formatting matters | command output |
| Lint | `deno task lint` or narrow lint target | Code changes; docs-only runs may skip with rationale | command output |
| Doc lint | `deno doc --lint <module>` | Public package exports, README/API docs, JSR work | command output |
| Publish dry-run | `deno publish --dry-run` from package | Published package/plugin changes | command output |
| Link/path check | focused filesystem check | Docs that reference local paths | list of checked paths |

## Parser Preference

Use `.llm/tools/parse-deno-check-errors.ts` for `deno check` and
`deno task check:<slice>` output when possible. Fall back to raw output only if
the parser cannot run.

## Documentation-Only Runs

Docs-only runs validate by:

- checking referenced local paths exist,
- verifying docs do not contradict the authoritative source,
- checking Markdown formatting when a repo task exists,
- running no code typecheck unless docs generate or modify code examples that
  can be checked.

## Failure Handling

A static gate failure is normally `FAIL_FIX`. It becomes `FAIL_RESCOPE` when the
failure proves the plan omitted a necessary package/API redesign.
