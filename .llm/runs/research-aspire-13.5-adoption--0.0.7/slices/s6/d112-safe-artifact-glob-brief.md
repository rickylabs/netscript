use harness

## SKILL

- netscript-harness — run loop, commit-by-slice + push, run-dir artifacts.
- netscript-tools — CI/workflow evidence-carrier correctness; classifier self-test contract.

## D-112 bounded correction: broad recursive globs traverse protected Postgres data files

Run `33342459451` (exact head `235631d63`): classifier/static/desktop/SQLite jobs all succeeded, and
the Postgres runtime test itself passed (product green), but the `Upload E2E report artifact` step
for the `scaffold-runtime` job failed with `EACCES` while scanning
`.llm/tmp/cli-e2e/.../.data/postgres/18/docker` — `include-hidden-files: true` combined with the
broad recursive `.llm/tmp/**/report*.json` / `.llm/tmp/**/report*.ndjson` / `**/e2e-report*.json` /
`**/listener-unreachable-receipt.json` globs now descends into the scaffolded project's Postgres
data directory (permission-restricted files owned by the Postgres process), which it never did
before `include-hidden-files: true` was added (hidden dirs were previously skipped entirely, masking
this traversal).

### Scope (bounded, CI-only)

In `.github/workflows/e2e-cli.yml`, in **both** the `scaffold-runtime` and `scaffold-runtime-sqlite`
jobs' `Upload E2E report artifact` step, replace the `path:` list with narrow, non-recursive patterns
that cannot descend into `.data`:

- `scaffold-runtime` job:
  ```
  .llm/tmp/e2e-report-scaffold-runtime*.json
  .llm/tmp/e2e-report-scaffold-runtime*.ndjson
  .llm/tmp/cli-e2e/*/.netscript/e2e/listener-unreachable-receipt.json
  ```
- `scaffold-runtime-sqlite` job (sqlite-suffixed report prefix):
  ```
  .llm/tmp/e2e-report-scaffold-runtime-sqlite*.json
  .llm/tmp/e2e-report-scaffold-runtime-sqlite*.ndjson
  .llm/tmp/cli-e2e/*/.netscript/e2e/listener-unreachable-receipt.json
  ```

Keep `include-hidden-files: true` in both (still required — `.llm` and `.netscript` are both
dot-prefixed). The single `*` wildcard in `cli-e2e/*/...` matches exactly the one generated project
directory under the smoke root without recursing further into it, so it can never reach `.data/...`.

### Also update the classifier self-test

`.github/scripts/ci-classify-changes.test.ts` (the assertion around line 862, test
"workflow: sqlite runtime uses sibling diff guard and fails closed") currently asserts against the
old broad `.llm/tmp/**/report*.ndjson` glob. Update that assertion to check for the new safe/narrow
patterns above (report json+ndjson prefix patterns and the receipt pattern) plus
`include-hidden-files: true`, instead of the obsolete broad glob. Run
`deno test --allow-read --allow-env .github/scripts/ci-classify-changes.test.ts` locally and confirm
all tests pass before pushing.

### Do not

- Change gate logic, receipt shape, health-check behavior, exit-code semantics, or the fixture's
  write location.
- Touch runtime/Aspire/Docker in this correction — CI-only.
- Re-run or request any evaluator (native or OpenRouter) — the S6 slice's product commits' existing
  evaluation stands; this run's runtime product evidence (Postgres test passed) is already accepted
  as valid.

### After this change

Commit and push. The coordinator will dispatch exactly one fresh exact-head `workflow_dispatch` run
and inspect both uploaded artifact archives directly to confirm receipts/reports are present with no
`EACCES` and the classifier self-test green.
