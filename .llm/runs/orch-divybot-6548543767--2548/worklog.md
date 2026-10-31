# Worklog

## Design

1. Public surface: coordinated stable/canary release now updates item dependencies in `packages/fresh-ui/registry.json`; installer contract stays exact pinned JSR.
2. Domain vocabulary: maintained release asset, canonical registry, historical v1 fixture. Existing BumpResult/discovery interfaces suffice.
3. Ports: existing filesystem and Git discovery; no new port.
4. Constants: explicit maintained release asset path list; fixture uses `0.0.0-fixture`. Existing canonical specifier matcher owns version syntax.
5. Commit slices: bootstrap run; implementation (bump discovery/tests, specifier regression, v1 fixture, registry README, required generated carriers) proved by focused tests, scoped gates and release rehearsal; evaluation and evidence follow.
6. Deferred scope: installer/schema changes, publication, merging.
7. Contributor path: `packages/fresh-ui/src/registry/README.md` explains exact first-party pin ownership and validation.

PLAN-EVAL: N/A; routine bounded release-file discovery repair with supplied acceptance.

## Bootstrap

Routing queried as feature JSON. Owner overrides evaluator to Claude Opus 5.5 high, read-only; public artifacts omit session identifiers and use repo-relative paths only. rtk absent; direct commands used. Owner directive `Refs #2548` and draft/no labels overrides generic delivery boilerplate.

## Regression evidence

Before the discovery fix, the structured test wrapper ran `bump-version-registry_test.ts`: exit 1, both stable and canary cases failed because the tracked registry was absent from discovered release files.

Fixture comparison requires normalizing only first-party fixture versions to package metadata; the existing live registry version assertion remains intact. Canonical registry bytes already match 0.0.8, so no edit or carrier regeneration is required for the implementation itself.

## Local gates

- Release/specifier wrapper suite: 52 passed, 0 failed (including red-before-fix proof).
- Structured scoped check, lint, fmt: exit 0. Lint uses root rules with global .llm exclusion removed only for selected files.
- release:preflight: exit 0, all four policies pass.
- check:netscript-jsr-specifiers: exit 0, 3040 files, 0 failures.
- quality:gate: exit 0, durable receipt `.llm/tmp/gate-receipts/registry-2548/quality.json`.
- All five carrier checks: exit 0 (agent-docs-prose, mcp-export-corpus, assets-barrel, publish-assets, aspire-version-parity). No tracked carriers changed.
- Fresh UI JSR audit: exit 0; pre-existing folder/cardinality/slow-type warnings only, no new public surface.

## Rehearsal and runtime environment

Disposable-clone command: `deno task release:canary -- 0.0.9 --dry-run`. Passed residue and reached `publish:readiness`. Built docs-site registry inspection: 93 JSON files, 6 first-party pins, all match 0.0.9-canary.1, zero stale pins. Built copies were generated normally.

Local `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`: exit 1 at preflight.aspire; Docker socket absent, aspire doctor exit 1, cleanup cannot inspect Docker. No scaffold runtime was started. Runtime verdict is UNPROVEN locally, never claimed green. Read-only leak-check found an unrelated AppHost/process outside this run; left untouched. Await remote runtime gates for final readiness.

Report snapshots in `reports/` preserve structured wrapper results using repo-relative paths. Durable gate summary references the raw receipt hashes; these precommit receipts prove processes against the working tree at the recorded bootstrap HEAD, not a clean committed tree. Final current-head checks will be distinguished.

## Completed acceptance proof

- Disposable `deno task release:canary -- 0.0.9 --dry-run`: **exit 0**, selected 0.0.9-canary.1; residue, publish:readiness, publish:dry-run and deno ci --prod all pass. No refs or publication. See reports/canary-dry-run.json.
- Registry/ui:add/CLI init/preset wrapper suite: **83 passed, 0 failed**, exit 0; exact file/argv selection in reports/registry-cli-tests.json.
- Standalone authoring comparison: 5 passed; release/specifier suite: 52 passed.
- Root/generated source current after carriers; docs/site/deno.lock has no delta. Canonical registry was not edited because it already matches the current train, and each release now owns its update.

Reconcile: origin/main fetched and has no commits ahead of this baseline. PR #2549 remains reference-only. Source implementation is awaiting independent slice sign-off; no source commit yet.

Additional executable negative control in disposable bumped checkout: replaced one sdk dependency in actual `packages/fresh-ui/registry.json` with stale 0.0.8; `deno task check:netscript-jsr-specifiers` exited 1 and named that file/line. Restored the source; same gate exited 0. See reports/registry-negative-control.json.

## Independent slice review repair

Claude Opus 5.5 high (observed model identity matches request) returned FAIL_FIX for the precommit source review: release staging omitted the compressed registry asset. Added the carrier to PREPARED_RELEASE_GENERATED_OUTPUTS and its staging contract test. The new staged-file assertion failed for both stable/canary before that fix; after it, all 52 release/specifier tests pass again. Production embed script now runs inside both regression cases; gzip-decoded registryJson equals the fully bumped authoring registry. Scoped check/lint/fmt rerun over six files. F2 future meta.version coupling is explicitly recorded in drift.md as requested by review.

## Accepted tooling debt

F2 (independent catalog version): generic JSON version-field rewriting currently also owns a matching registry meta.version. Cost: before a release FROM 0.1.0, maintainers must decide whether catalog metadata follows the release or introduce field-aware rewrite/residue handling and tests. Current canary train is unaffected. This is a documented tooling limitation, not a new package architecture exception.

## Stable freshness correction

Second source review identified that PREPARED_RELEASE_GENERATED_OUTPUTS also authorizes stable generated-output deltas. Added `deno task --cwd packages/fresh-ui registry:embed:check` to assertPreparedReleaseGeneratedOutputsFresh before the downstream barrel checker. New negative regression and expected command list both fail before the added check (structured red proof). Evaluator loop stops at two FAIL_FIX verdicts under supplied leaf policy; no third evaluation or self-certified PASS. Full release tests/scoped gates finish before commit; see evaluation-decision.md for the review handoff.

## Implementation delivery

Final focused release/specifier/publication wrapper suite: **92 passed, 0 failed**, exit 0. Registry/CLI selection remains **83 passed**, exit 0. Eight-file scoped check/lint/fmt: exit 0; full carrier/preflight/specifier set repeated, all seven commands exit 0. Second disposable canary rehearsal includes staged carrier repair and exits 0 through residue/readiness/dry-run/prod install. No docs-site lock or generated carrier churn in the source worktree.

Source hashes in reports/source-hashes.json identify the validated implementation independently of later run-artifact commits. Evaluation decision: both source-review findings repaired, no third evaluation under supplied leaf stop rule. Draft implementation delivery is **review-required**, never self-signed-off or READY.

Reconcile: source scope includes release staging and stable freshness dependencies found by independent review; no labels, no merge, no publication. Canonical final report will use the excluded atomic file handoff to Orchid.

## Continuation — production stable-freshness proof

Revalidated PR #2549 remains open draft at e9236a3, with no new independent review or owner decision; main fetch shows no conflicts. Source hashes match the tested implementation. Previous turn classified as progress.

Executed assertPreparedReleaseGeneratedOutputsFresh with its default production dependencies in a disposable clean checkout: exit 0. Then changed only the encoded registry carrier to contain a stale sdk pin, committed that fixture only inside the disposable clone, and ran the entire production verifier again. It rejected at registry:embed:check with Stale embedded registry assets; the expected-rejection harness exited 0. No publication invoked. See reports/stable-freshness-production.json and completion-audit.md.

Independent PASS and non-draft CI remain unproven. The two-failure stop is still in force; no third evaluator or READY claim.
