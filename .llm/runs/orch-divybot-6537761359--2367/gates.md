# Gate evidence

Commands ran against the implementation working tree after the negative-control restoration.
Structured JSON reports and durable gate receipts are retained outside the public tree; this record
contains only repository-relative commands, results and safe summaries. No lock changes occurred.

| Gate | Command / result |
| --- | --- |
| Tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/database/tests/postgres-connection-string_test.ts packages/cli/src/kernel/templates/database/postgres-normalizer_test.ts` — exit 0, 213 passed, 0 failed |
| Negative control: public helper | Same structured test wrapper with `--filter 'Postgres duplicate refusal:'` and baseline normalizer restored — exit 1, 195 failed, 0 passed |
| Negative control: generated consumers | Restore baseline normalizer and regenerate assets; same test wrapper with `--filter 'duplicate refusal'` on CLI normalizer test — exit 1, all 3 new refusal tests failed |
| Type check | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-check.ts --root packages/database --file packages/cli/src/kernel/templates/database/postgres-normalizer_test.ts --ext ts,tsx` — exit 0, no diagnostics; includes unstable-kv by default |
| Lint | Structured lint wrapper on the two changed database implementation files plus database test, and separately CLI normalizer test — both exit 0, no diagnostics |
| Format | Structured fmt wrapper on the same four owned source TS files — exit 0, all selected files processed, no findings |
| Docs | `deno task doc:lint --root packages/database --pretty` through durable gate runner — exit 0, PASS across package export map |
| Publish | `deno task publish:dry-run --member packages/database` — exit 0, `Success Dry run complete`; no slow-type warnings |
| JSR audit | `deno run --allow-read --allow-run --allow-env --allow-write .llm/tools/fitness/audit-jsr-package.ts --root packages/database --no-dry-run` — exit 0, one existing directory-cardinality warning; dry-run delegated to the real package publish task above |
| Quality / architecture / dependencies | `deno task quality:gate` through durable gate runner — exit 0, PASS; also passed before source changes |
| Generated assets | `deno task gen:assets-barrel` — exit 0; second invocation produces byte-identical tracked generated assets |
| Diff | `git diff --check` — exit 0 |
| Full scaffold runtime | Not run locally, as expressly prohibited by owner. **Required in coordinator-armed e2e-cli CI; unproven until that CI reports at the head.** |

## Exact negative controls

`negative-controls.json` lists every failing test name plus the original structured report digests.
The 195 public tests cover all 47 ordered alias/self pairs, each with original/case-variant spelling
and identical/different values (188), plus 7 targeted refusals. Three generated tests exercise actual
Prisma/jiti config loading in local and JSR modes and the generated local engine's environment safety.
All 198 new refusal tests fail with the original parser. Fixed source and assets were restored and
the combined 213-test suite passed afterward.

## Scoped CLI style configuration

Root `fmt` and `lint` intentionally exclude CLI sources. The first scoped fmt run correctly failed
coverage when the explicitly selected CLI test was excluded. Passing the CLI member config still
inherits the root exclusion. Use a standalone temporary config with the repository's same formatting
values (lineWidth 100, indentWidth 2, semiColons true, singleQuote true), explicitly select only the CLI
test, and run the structured wrappers with `--config`. Both final wrappers processed that file with
zero refusals. No repository configuration or blanket exclusion was changed.

Existing Markdown table formatting in the public reference was preserved; only its normalization
paragraph changes. Generated barrels remain canonical generator output, excluded from source-style
gates per repository policy.

## CI freshness repair

Quality CI at the first implementation head failed `Agent docs corpus freshness`; no parser defect.
Canonical prose generation changes only `pages/reference/database/index.md` among 202 transported
pages. Export-corpus generation changes only `database ./connection-strings/postgres` among 301
transported surfaces. Other compressed rows are byte-identical. No lock change.

- `deno task gen:agent-docs-prose` then durable `check:agent-docs-prose` — exit 0, PASS.
- `deno task gen:mcp-export-corpus --allow-dirty` then `check:mcp-export-corpus` — exit 0; dirty
  override covers only reviewed generated-doc changes; maintained parser source already committed.
- Structured check wrapper selecting the two changed generated TS corpus files — exit 0,
  zero diagnostics.
- `deno task check:publish-assets` — exit 0.
- `deno task gen:assets-barrel` — exit 0, no additional tracked delta.
- `git diff --check` — exit 0.

Runtime CI is being completed through the existing manual GitHub workflow at the pushed branch,
after the user's explicit follow-up to fix red CI. No local runtime or label mutations. Final-head
CI links and evaluator verdict belong in the PR phase comment/final report to keep their SHA stable.
