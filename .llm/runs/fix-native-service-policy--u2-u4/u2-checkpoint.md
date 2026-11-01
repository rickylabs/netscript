# U2 source checkpoint

Root accepted the four U2 source owners on 2026-10-28 after reading the complete middleware,
480-line regression, README and CHANGELOG. This records source acceptance and the exact gates; it is
not an independent IMPL verdict or merge-readiness claim.

## Behavior and footprint

Native Hono remains the only CORS resolver. Before downstream handling, the wrapper checkpoints all
six access-control headers including absence, plus Vary. It restores each final set/delete decision
and unions checkpoint/final Vary tokens case-insensitively, preserving first spelling and order,
with `*` winning. One finalized-safe header operation makes immutable response headers writable.
Body identity/bytes, status, cookies, unrelated headers, native OPTIONS, no-withCors and standalone
handler behavior are covered.

Four source owners, +549/-5: middleware +55/-5, new regression 480 lines, README +7 and CHANGELOG
+7. Pinned 0.0.8 migration snippets remain. The new test's private registration helper fixes
operation/resource/exit sanitizers to true; all seven registration sites use it, registering eight
tests and 190 named steps. No skip, cast or weakened oracle was introduced.

Final SHA256 values are recorded in
[source-hashes.json](evidence/u2-astra-20261028/source-hashes.json). The accepted source and docs
diffs are [owned-tracked.diff](evidence/u2-astra-20261028/owned-tracked.diff) and
[new-regression.diff](evidence/u2-astra-20261028/new-regression.diff).

## Actual RED and GREEN

The corrected baseline with production unchanged reported **132 passed / 66 failed / 0 ignored**.
After the minimal production fix, the new regression reported **198 / 0 / 0**. The final owning set,
including three existing owners and the explicit sanitizer helper, reports **221 / 0 / 0**. The
original missing-cache/setup/type failures, first fixture-error RED, corrected behavior RED,
intermediate production type failure and all subsequent results are preserved byte-for-byte.

| Gate                               | Result                                           | Evidence                                                                                                                     |
| ---------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Corrected behavior RED             | 132 pass / 66 fail / 0 ignored                   | [report](evidence/u2-astra-20261028/red-baseline-corrected.json)                                                             |
| Final owning tests                 | 221 pass / 0 fail / 0 ignored                    | [report](evidence/u2-astra-20261028/owning-sanitizers.json)                                                                  |
| Final selected types               | 125 files, 2 batches, 0 errors                   | [report](evidence/u2-astra-20261028/service-check-sanitizers.log)                                                            |
| Final lint / fmt                   | 125 selected, 0 dropped/refused/findings         | [lint](evidence/u2-astra-20261028/service-lint-sanitizers.log), [fmt](evidence/u2-astra-20261028/service-fmt-sanitizers.log) |
| Public doc lint                    | 8 export roots, 0 errors                         | [receipt](evidence/u2-astra-20261028/doc-lint-receipt.json)                                                                  |
| Quality scan                       | PASS, 0 findings, 7 existing allowances          | [receipt](evidence/u2-astra-20261028/quality-scan-receipt.json)                                                              |
| Direct doctrine                    | exit 0; service FAIL 0 / WARN 5 / INFO 1         | [output](evidence/u2-astra-20261028/doctrine-direct.log)                                                                     |
| Full workspace publication dry-run | PASS, exit 0; temporary workspace removed        | [receipt](evidence/u2-astra-20261028/publish-dry-run-receipt.json), [cleanup](evidence/u2-astra-20261028/final-state.json)   |
| JSR surface audit                  | exit 0, 0 findings, `--no-dry-run`               | [output](evidence/u2-astra-20261028/jsr-audit.json)                                                                          |
| Full service                       | 521 pass / 8 fail / 0 ignored                    | [report](evidence/u2-astra-20261028/service-tests.json)                                                                      |
| Consumers                          | 25 pass / 1 fail / 0 ignored                     | [report](evidence/u2-astra-20261028/consumer-tests.json)                                                                     |
| arch:check                         | FAIL at DB identity prerequisite before doctrine | [receipt](evidence/u2-astra-20261028/arch-check-receipt.json)                                                                |

The eight service failures and one consumer failure reproduce in U1 at
`b8168c2c9e4352c7354dcd2e47a181f76d986698`, whose service source is unchanged from the base. Five
test-owner hashes match. Names, counts and error categories agree; full error objects are not
claimed byte-identical across checkout/runtime contexts. The failures concern child stdout,
request-body and timer leaks, mapped IPv4 connection refusal, and a Windows child-test URL path.
[Service baseline](evidence/u2-astra-20261028/baseline-service-failures.json),
[consumer baseline](evidence/u2-astra-20261028/baseline-consumer-failure.json), and
[owner hashes](evidence/u2-astra-20261028/baseline-owner-hashes.json) retain the comparison. The DB
identity prerequisite, eight service failures and one consumer failure remain **unwaived**. Direct
doctrine PASS does not convert arch:check into PASS.

All test reports retain exact command, cwd, exit and counts. Portable Deno 2.9.7 ran first on the
child PATH with frozen, cached product graphs and explicit sanitizers. No configuration, version,
lock, dependency-age policy or baseline test was changed. Expensive e2e:cli, apps, CEF, providers
and installer acceptance were not launched. Publication was dry-run only.

## Retention and next step

The [manifest](evidence/u2-astra-20261028/manifest.json) records 58 copied files with original byte
lengths/hashes and three excluded public cached graph/vendor extracts retained in ignored scratch
with their hashes. The original scratch remains intact. A bounded credential-pattern scan found no
candidates in run provenance or evidence. Session identifiers and isolated paths are intentional
harness provenance.

Run-local Git attributes preserve receipt bytes, including CRLF, and exclude only saved patch
context from whitespace lint. Product source whitespace checks remain unchanged.

Commit only these four source owners plus this scoped run/evidence. Keep the existing U4 debt delta
unstaged. Open a draft PR with type/area/status labels and an unscheduled Backlog / Triage milestone
until release ownership is selected. Independent IMPL evaluation and a disposition of the open gates
must precede any readiness/merge claim. Prepare the accepted U4 owner/gate brief next for root scope
review; no U4 implementation is authorized by this checkpoint.
