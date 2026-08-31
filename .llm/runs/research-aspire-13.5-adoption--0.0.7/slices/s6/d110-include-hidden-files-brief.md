use harness

## SKILL

- netscript-harness — run loop, commit-by-slice + push, run-dir artifacts.
- netscript-tools — CI/workflow evidence-carrier correctness.

## D-110 bounded correction: `upload-artifact@v5` drops everything under `.llm/`

Run 33341398265 (exact head `81a85f12e`, pre-D-109-reconstruction) proved both runtime jobs green
(Postgres 90/90, SQLite/Garnet 85/85) but **both** `Upload E2E report artifact` steps logged
`No files were found` for every one of their four glob patterns — not just the D-107 receipt glob,
the base `report*.json`/`e2e-report*.json` globs matched nothing either. Root cause: `.llm` is a
dot-prefixed (hidden) top-level directory, and `actions/upload-artifact@v5` defaults
`include-hidden-files: false`, so it silently excludes every path under `.llm/tmp/...` regardless of
glob match. D-107's glob addition was correct but could never have worked without this.

### Scope (bounded, CI-only, no product semantic change)

In `.github/workflows/e2e-cli.yml`, in **both** the `scaffold-runtime` and `scaffold-runtime-sqlite`
jobs' `Upload E2E report artifact` step:

1. Add `include-hidden-files: true`.
2. Narrow/replace the `path:` list to exactly:
   ```
   .llm/tmp/e2e-report-scaffold-runtime*.json
   .llm/tmp/cli-e2e/**/.netscript/e2e/listener-unreachable-receipt.json
   ```
   (use the sqlite-suffixed report filename for the sqlite job, i.e.
   `.llm/tmp/e2e-report-scaffold-runtime-sqlite*.json`). Drop the old overly-broad
   `.llm/tmp/**/report*.json` / `.llm/tmp/**/report*.ndjson` / `**/e2e-report*.json` /
   `**/listener-unreachable-receipt.json` globs in favor of these narrowed, confirmed-correct paths.
   If the scaffolded project's actual smoke-root differs from `.llm/tmp/cli-e2e/...` in this
   workflow (check how `scaffold.runtime`'s default `smokeRoot` resolves when no `--smoke-root` flag
   is passed — grep `run-context.ts`/the suite defaults), adjust the second glob to match the real
   default location; do not guess if the default differs from what's stated here — verify against
   the actual default `smokeRoot` resolution in code before finalizing the glob.
3. Do not change gate logic, receipt shape, health-check behavior, or the fixture's write location.
   No PLAN-EVAL, no DeepSeek/OpenRouter rerun — existing evaluation stands.

### After this change

Commit and push. The coordinator will retarget PR #1743's base to `main`, dispatch exactly one fresh
exact-head `workflow_dispatch` run, and inspect both uploaded artifact archives directly to confirm
the receipt and report JSON are now present.
