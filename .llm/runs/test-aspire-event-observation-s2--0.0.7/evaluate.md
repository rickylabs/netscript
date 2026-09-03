# IMPL-EVAL — PR #1969 (test/aspire-event-observation-s2, #1906 slice 2)

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-aspire-event-observation-s2--0.0.7` |
| Target | PR #1969 at `f9406dec6d35305b5ed4874ab9c61a4ec532a75e` (trusted base `574e9ce57b24698aa430b796b036cb5551d9f247`) |
| Archetype | Archetype 6-adjacent (CLI/tooling E2E harness) + service overlay; not a published doctrine unit |
| Scope overlays | service (Aspire runtime behavior) |
| Evaluator | OpenHands · openrouter/z-ai/glm-5.3-flash · cloud phase run · generation 30457117780 · 2026-09-03 |
| Session separation | Generator: Codex GPT-5.6 Sol (`supervisor.md`); evaluator: this fresh OpenHands session — generator ≠ evaluator honored |
| Effort attestation | Not attested; the OpenHands adapter does not expose reasoning-effort identity |

## Verdict

**OPENHANDS_VERDICT: PASS**

No blocking findings. One low-severity observation (stale allowlist entries) recorded for follow-up
scope; it does not indicate a protection hole and does not block the slice.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed or justified `PLAN-EVAL: N/A` before implementation | PASS | `worklog.md` line 11 records `PLAN-EVAL: N/A` with justification (issue #1906 + owner-authored brief lock primitive, scope, RED→GREEN order, gates, PR metadata); recorded before implementation |
| Design section exists in worklog | PASS | `worklog.md` `## Design` at line 16: public surface (none), ports (`watchResourceUpdates` sole event port), constants, slices, deferred scope, contributor path |
| Commit slices match design plan | PASS | `9059e2042` (brief) → `48c32cc6c` (S1 guard RED) → `9e20929a9` (S2 conversions GREEN) → `0f4588e15` (S3 cap audit) → `c798f3961` (receipts) → `cce7b34d2` (pr-body doc) — exactly the S1/S2/S3 order in plan.md |
| Each slice has its named gate | PASS | S1: EXPECTED-FAIL receipt `s1-red-polling-guard.json` (exit 1, exactly one offender `verify-endpoint-readiness.ts:8`); S2: `s2-focused-green.json` 63/63; S3: `s3-policy-green.json` 4/4 + `s3-e2e-tests.json` 309/309 + `s3-quality-gate.json` exit 0, all at implementation head `0f4588e15` |
| Receipt integrity | PASS | All 5 receipts: `outcome`/`exitCode` coherent (S1 FAIL/1 intentional; four PASS/0); `actualGitHead` matches `gitHead`; each S1/S2/S3 baseline is a real ancestor of head (verified via `git merge-base --is-ancestor 48c32cc6c f9406dec6` → yes) |
| Drift log present and honest | PASS | `drift.md`: two entries — (1) brief inventory predated landed main changes; implementation re-baselined, no scope expansion; (2) pre-existing Deno 2.9.5 lint config-boundary crash for 7 desktop fixtures, unchanged configs, equivalent complete 218+7 split lint run recorded |
| No speculative seams / dead code | PASS | New files (`check-aspire-resource-polling{,_test}.ts`, `capture-db-endpoint-allocation_test.ts`, `verify-endpoint-readiness_test.ts`) all referenced; all 4 manifest-registered paths exist at head |
| Constants for finite vocabularies | PASS | `READINESS_EVENT_FAILURE_CEILING_MS = 120_000` (verify-endpoint-readiness.ts:5) labeled "Test-failure ceiling … not an Aspire evaluation schedule" |
| Agent brief carries `## SKILL` chapter | PASS | `implement-brief.md` line 3 |
| Lock hygiene | PASS | `git diff --name-only 574e9ce5..f9406dec6` contains no `deno.lock` |
| Close-gate | PASS | PR body uses `Refs #1906` without closing keyword — correct for a partial slice (doctrine: never put a closing keyword on partial scope); issue #1906 remains OPEN |
| Debt | PASS | No doctrine violation introduced; plan records "no new architecture debt is planned"; nothing in this diff requires an `arch-debt.md` entry |

## Locked-Decision Parity (plan.md → head)

| # | Locked decision | Verified at head |
| --- | --- | --- |
| 1 | Extend `watchResourceUpdates`; no new follower | `resource-state-stream.ts` `watchResourceUpdates` (pre-existing, #1909 lineage); `verify-endpoint-readiness.ts` imports it and takes `watch: typeof watchResourceUpdates` as its seam |
| 2 | Guard signature = `aspire` + `describe` + loop + timing; final exemptions only concurrency-fenced files | `check-aspire-resource-polling.ts`: `unexpectedAspireResourcePolling` + `ASPIRE_RESOURCE_POLL_ALLOWLIST` (6 fenced files); 3 unit cases incl. follow-stream negative fixture; final tree has exactly 1 active exemption (fenced `runtime/verify-listener-readiness.ts:101`), 5 stale entries |
| 3 | Subscribe before producer stop; observe stop + recovery | `verify-producer-reconnect.ts` buffered subscription established before stop command; worklog S2 GREEN documents guaranteed follower close even when probe/OTLP cleanup throws |
| 4 | URLs from scoped follow update; full topology once, only after endpoint evidence | `runtime/capture-db-endpoint-allocation.ts`: `await resolveUrls(...)` then exactly one `describe(appHost)` snapshot with inline comment "This snapshot does not discover endpoint allocation…"; tested in `capture-db-endpoint-allocation_test.ts` |
| 5 | Retain HTTP retries asserting application behavior, documented as such | `runtime/verify-live-db-endpoint.ts:564` `pollUsersTelemetryCorrelation` polls dashboard logs/traces (application effects), not Aspire resource state; PR body "Inventory disposition" documents the classification |
| 6 | Every stream cap is a test-failure ceiling | `READINESS_EVENT_FAILURE_CEILING_MS`/`ENDPOINT_EVENT_FAILURE_CEILING_MS`/`RESOURCE_EVENT_FAILURE_CEILING_MS` = 120_000, each commented as a hung-follower failure ceiling; worklog S3 cap-audit table classifies every retained bound |

## Gates at the evaluated head

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused policy tests (evaluator rerun from repo root) | PASS | `deno task test .llm/tools/validation/check-aspire-resource-polling_test.ts` → 4 passed / 0 failed, exit 0 |
| Aspire version/manifest parity (evaluator rerun) | PASS | `deno task quality:aspire-version-parity` → `ok: true, phase 1, manifestFresh: true, checked: 931, fail: 0, expectedVersion: 13.5.3` |
| `quality:gate` | PASS | `s3-quality-gate.json` (exit 0) + repo `quality` CI check (run 33703475115) at head |
| Full e2e unit tests | PASS | `s3-e2e-tests.json` 309/309 + `check-test` CI job (12m52s) at head |
| Hosted runtime gates | PASS | `scaffold-runtime (aspire + docker + postgres)` 8m12s, `scaffold-runtime-sqlite` 7m3s, `scaffold-static` 1m44s — all pass on head push (run 33705296640) |
| `close-gate` / `deps-report` / `code-quality` / `dispatch` CI | PASS | run 33703475115 / 33705296661 |
| Public surface | N/A | No published package, export, or product-CLI surface changes; plan records `packages/cli` verdict Keep, JSR audit N/A |

## Findings (severity-ranked)

1. **LOW — stale allowlist entries in `ASPIRE_RESOURCE_POLL_ALLOWLIST`** (`.llm/tools/validation/check-aspire-resource-polling.ts`). 5 of 6 allowlisted paths no longer trigger the polling signature at head (`listener-readiness-gates.ts`, `listener-unreachable-fixture.ts`, `readiness-disagreement.ts`, `owned-container-log.ts`, `verify-live-db-endpoint.ts`); only the concurrency-fenced `runtime/verify-listener-readiness.ts:101` still matches. Spot-checks confirm the stale files are genuinely converted (e.g. `verify-live-db-endpoint.ts` now does one `describe` read; its retry loop targets dashboard logs/traces), and none of the five files appears in this PR's source diff — the staleness is pre-existing, inherited via the `origin/main` merge (`ce8422e20`). Required action: none for this PR. The relevant policy (`issues/762-aspire-surface-policy.md`) says the list may only shrink as owning PRs land, so the next touching PR should prune the dead entries. Recorded here so the follow-up is not lost.
2. **INFO — reasoning-effort attestation unavailable.** The OpenHands adapter does not expose effort identity; no `max` claim is made for this run. Per `lane-policy`/`openhands-handoff`, the model is an approved open model with verified agentic turn capability, and all decisive evidence above is command/file/CI-verifiable, not model-attested.

## False-done scan

None present. No test was deleted, skipped, or de-cataloged; the guard's allowlist is bounded to
fenced files; deferred scope (Bucket B/C, fenced files, local runtime) is named in plan, PR body,
and issue — and the PR deliberately uses `Refs #1906` rather than a closing keyword.

## Docs claims

Not a docs-primary change. All executable claims in the PR body (receipt heads, test counts, gate
results, lint split 218+7, cap-audit ranges) were cross-checked against receipts, worklog, and CI;
no claim failed verification. PR body and `pr-body.md` artifact agree.
