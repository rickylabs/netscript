# Gate evidence

Implementation head: `2b1db077b01eb0c1f06b51d336280c0438f22866`. Deno 2.9.7. All commands ran at the repository root unless a generated-workspace scope is stated. Raw bounded command receipts and logs are retained privately; public artifacts contain repository-relative paths only.

## Required static and carrier checks

| Command | Result |
| --- | --- |
| `deno task check:desktop-native-fixture` | PASS, exit 0 |
| `deno task check:emitted-samples` | PASS, exit 0 |
| `deno task check:streams-types` | PASS, exit 0 |
| `deno task check:child-health-docs` | PASS, exit 0 |
| `deno task check:mcp-export-corpus` | PASS, exit 0 |
| `deno task check:agent-docs-prose` | PASS, exit 0 |
| `deno task check:publish-assets` | PASS, exit 0 |
| `deno task check:scaffold-versions` | PASS, exit 0 |
| `deno task check:aspire-version-parity` | PASS, exit 0 |
| `deno task check:netscript-jsr-specifiers` | PASS, exit 0 |
| `deno task check:aspire-host-ports` | PASS, exit 0 |
| `deno task check:figma-names` | PASS, exit 0 |
| `deno task check:review-threads -- --repo rickylabs/netscript --pr 2583 --pretty` | PASS, exit 0 |
| `deno task check:design-skill` | PASS, exit 0 |
| `deno task check:assets-barrel` | PASS, exit 0; durable receipt at committed head |

The complete carrier chain ran in order: `gen:agent-docs-prose` → `gen:mcp-export-corpus --allow-dirty` → `gen:assets-barrel` → `gen:publish-assets`. Post-commit assets and publish checks are green; no lock file changed.

| Additional gate | Result |
| --- | --- |
| Root `deno task check` | PASS, 4,140 files / 35 batches |
| Root `deno task lint` and `fmt:check` | PASS, durable command receipts |
| Scoped CLI check/lint/fmt wrappers | PASS; all selected files processed, no exclusions/findings |
| `deno task quality:gate` | PASS; existing architecture warnings retained |
| CLI JSR audit | Exit 0; existing package warnings, no new package export or dependency |
| Focused CLI tests through test wrapper | 219 passed, 0 failed |
| SQLite emitted source wrapper | PASS, 133 files against real Prisma/Zod output |
| Memory emitted source wrapper/application test | PASS, 125 files and 1 emitted application test |
| `deno task e2e:cli run scaffold.service --format pretty` | PASS, 8/8 gates after CI repair |
| `deno task docs:snippets` | PASS, 36 compiled fences, no exemption change |
| `deno task docs:readme-fences` | PASS under existing baseline policy |

## Live seeded proof

See live-proof.md and records-desktop.png. Real SQLite seed/rerun, typed-client aggregates and Chromium cell assertions passed. After the CI repair, the live detail page used the readable Awaiting payment label and the next-page link retained amount sorting. The four run-owned Deno processes were stopped after proof; both proof ports closed. No containers were started locally.

The read-only resource report found 24 unknown/foreign entries and left all untouched; Docker inventory was unavailable because the local daemon was not running. This does not affect the Docker proof on the isolated CI runner. The optional `maint:dogfood-skills` helper could not complete: its old expected Aspire workflow skill names disagree with the current consolidated skills manifest. Existing generated skills were preserved; no unrelated tool repair or resource mutation was made.

## CI evidence

- Full current-source CI: [e2e-cli run 41327413127](https://github.com/rickylabs/netscript/actions/runs/41327413127), head `2b1db077b01eb0c1f06b51d336280c0438f22866`, SUCCESS.
- PostgreSQL `scaffold.runtime`: **122 passed, 0 failed, 0 skipped**, `ok: true`. The job runs the canonical `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` with only a report-output argument added.
- SQLite runtime: **115 passed, 0 failed, 0 skipped**, `ok: true`.
- Both downloaded suite reports include passing `generated.quality-negative`, `behavior.app-reference` and cleanup. The app-reference assertion requires reference, owner name/email, status and amount in real cells, not hydration scripts.
- Static scaffold and native packaging jobs: SUCCESS in the same workflow.
- [Pages run 41327353410](https://github.com/rickylabs/netscript/actions/runs/41327353410): SUCCESS; build and Utility docs browser/style checks passed, deployment skipped by policy.
- Earlier fixture/test/lint failures were repaired and re-reviewed; they were not waived.
- Ordinary draft PR policy skips core CI and opt-in runtime jobs. Owner requires draft/no labels, so runtime proof came from explicit workflow dispatch. A final evidence-only commit preserves source identity and uses the existing draft workflow policy for its ordinary jobs.

## Source identity for the final evidence commit

The evaluated implementation is `2b1db077b01eb0c1f06b51d336280c0438f22866`. Its CLI tree is `151783017e9e384673f9564bcd04442488e36a81`; the docs support fixture blob is `8683f31376afddd44dc2a7038797a205550de57f`. The final evidence commit must change only this scoped run directory. Compare all other tracked paths against this implementation head before READY. Independent final evaluation is recorded in evaluate.md and the PR phase comment.
## Ready-mode CI repair evidence

Original evaluation at 2b1db07 and evidence delivery c688757 predate core CI: draft policy
skipped those tests. Owner-authorized readiness triggered run 41330651017. Its test-1
reported 840 pass / 1 fail (stale synchronous callback regex); test-4 reported 1,479 pass /
1 fail / 20 ignored (removed archived status in a generated missing-record fixture).
Both are repaired in tests, with no runtime, contract, carrier or gate-policy changes.

Local Deno 2.9.7 structured reports: three template tests pass after a reproduced 2-pass /
1-fail red; combined real memory/SQLite Prisma generation and template tests pass 5/5.
Sample/projection semantic tests pass 14/14, including explicit ascending/descending ID
ties and a descending page boundary. Scoped type check, lint and format process all three
changed test files with zero findings and no dropped selections. Review threads: 0/0.
Same-session independent SLICE_REVIEW_PASS and IMPL_EVAL_PASS are recorded in evaluate.md.
The new head's ready-mode CI is pending; READY is withheld until it is green.

Core run 41331736013 at b0b6326 subsequently passed test-1 (841/0/0) and test-4
(1,480/0/20), check, quality and the other unaffected shards, but exposed test-2's two
auth-policy CRUD stub failures (1,798/2/5) and test-6's seed-text failure (1,578/1/4).
Pages 41331736009 and Fresh UI 41331736197 succeeded. Counts are pass/fail/ignored.
Those remaining fixtures are now repaired without production changes. Both complete
targeted modules pass locally (6/6, no ignored tests); scoped check/lint/fmt process all
selected files, and the same independent static evaluator returned both PASS verdicts.
Fresh ready-mode CI must prove the next head before the report is published.

Owner-requested main merge: 48905de + main 4a2dae3. Canonical carrier chain regenerated
successfully. Merged structured tests: 231 passed, zero failed/ignored. Scoped check/lint/fmt
process the resolved tests and merged writer without findings/drops. quality:gate passes
with existing warnings. Same-session independent SLICE_REVIEW_PASS confirms conflict
resolutions preserve both branches. All current-head check:* tasks, core/Pages/Fresh UI CI
and a fresh full manual PostgreSQL/SQLite runtime run are required after the merge commit.
Previous unchanged-source runtime evidence is historical, not a verdict for the new merge.
