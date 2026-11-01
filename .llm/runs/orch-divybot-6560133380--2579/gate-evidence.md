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
