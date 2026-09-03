# Evaluation: PR #1978 — test(e2e): observe fenced Aspire resource transitions and dispose Bucket C

IMPL-EVAL for issue #1906 slice 3 (fenced Bucket A + Bucket C). Transport: OpenHands cloud
(open-model-only), model `openrouter/z-ai/glm-5.3-flash`; reasoning effort not attested — the
OpenHands adapter does not expose it (reporting per protocol.md; never claimed as `max`).
Generator ≠ evaluator: this session implemented nothing; `git status` stayed clean throughout.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `test-aspire-event-observation-s3--0.0.7` |
| Target         | PR #1978 head `46ebca6eb` (base `test/aspire-event-observation-s3` → `main`) |
| Archetype      | Archetype 6 (scaffold generators / e2e harness surface) |
| Scope overlays | none (no frontend/service/docs prose in scope) |
| Evaluator      | OpenHands session (IMPL-EVAL), hosted run 33711969150, 2026-09-03 |

## Scope Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| PLAN-EVAL disposition | PASS | Owner-authored brief #1906 slice 3 locked scope; `PLAN-EVAL: N/A` per plan-protocol.md "small/mechanical issues with complete contract, scope, acceptance, gate information" |
| Design checkpoint | PASS | `worklog.md` Design section present at base commit; final commit `46ebca6eb` is comments-only rewording + run-artifact recording |
| Diff bounded to brief | PASS | `git diff 3149d18e1..46ebca6eb --stat` = 15 files: 13 substantive (polling guard + test, `e2e/src/application/gates/scaffold/runtime/{verify-listener-readiness,listener-readiness-gates}.ts`, 8 Bucket-C comment sites, validation tooling) + `worklog.md` + `receipts/`. Pinned base `3149d18e1` = merge-base(origin/main `3903feea6`, head); origin/main is 4 commits ahead and NOT an ancestor — fenced set holds against pinned base |
| No forbidden files | PASS | No docs/site prose, no skill behaviour text, no version pins, no resource emission, no lockfile, no `ci.yml` flip, no lint ignores, no `any`/unsafe casts in diff |
| Closing keyword | PASS (correctly absent) | Partial slice of umbrella #1906; supervisor owns umbrella lifecycle; `Closes #N` correctly NOT used |

## Core Change Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Describe-poll loop removed | PASS | `verify-listener-readiness.ts` / `listener-readiness-gates.ts`: timed `aspire describe` loop fully removed; replaced by buffered `watchResourceUpdates` (`aspire describe --follow` NDJSON) + `waitFor(predicate, ceilingMs)` + exactly one post-event snapshot for healthy-detail verification |
| Distinct failure semantics | PASS | Absent-event timeout vs wrong post-event detail produce distinct failure text; observer timing error surfaces on its own |
| Durations preserved | PASS | 300s default / 30s Garnet / 600s MSSQL ceilings retained from pre-slice behavior |
| Polling guard emptied + pinned | PASS | `ASPIRE_RESOURCE_POLLING_ALLOWLIST` = `[]` in `check-aspire-resource-polling.ts`; allowlist test updated; guard green at head (regression to timed polling now fails the guard) |
| Bucket C disposition | PASS | All 8 sites Retain with per-site rationale (`http-gate`, `consume-flow-b-stream`, `durable-cli-parity`, …); none stands in for Aspire resource readiness; recorded in `bucket-c-disposition.md` |
| S1 RED non-vacuous | PASS | RED receipt at brief head `ea2c912b4` names `verify-listener-readiness.ts:187` (the timed loop) and genuinely fails; S2 GREEN follows |
| Port surface | PASS | `ResourceUpdate{rawLine, resource}` / `ResourceUpdateSubscription{waitFor, close}`; injected, testable, no hidden globals |
| Residual `aspire wait` | N/A | Only `quickstart/aspire-walk.ts:62` — verbatim README-quickstart replay (#863), outside fenced inventory and Bucket C's 8-site disposition; not an induced-transition observer |

## Static Gates (independently re-run at head `46ebca6eb`)

| Gate | Command | Result | Evidence |
| ---- | ------- | ------ | -------- |
| Check | `deno task check` | PASS | 3110 files, 26 batches, 0 failed batches (exit 0) |
| Lint | `deno task lint` | PASS | 2127 files, 0 findings, no refusal |
| Fmt | `deno task fmt` | PASS | 2127 files, 0 findings |
| Composite | `deno task quality:gate` | PASS | FAIL=0 across all subsections, exit 0 (some WARNs, pre-existing) |

## Runtime / Consumer Gates (hosted, at exact head)

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| check-runs at head | PASS | 0 failures across 29 completed check-runs (GitHub API, `commits/46ebca6eb/check-runs`) |
| scaffold-runtime (aspire + docker + postgres) | PASS | run 33711956962 job success; `Summary: passed=101 failed=0 skipped=0` |
| scaffold-runtime-sqlite (aspire + sqlite + garnet) | PASS | run 33711956962 job success; `Summary: passed=96 failed=0 skipped=0` |
| runtime.typed-db-phase-b executed | PASS | present in head run log: "runtime.typed-db-phase-b: Verify typed database commands and bounded unhealthy wait"; lane green — the #1906-family flake absent on the exact bug family this slice targets, on the converted code |
| e2e-cli (hosted) | PASS | run 33711956962 conclusion success |
| Local full suite | NOT_RUN (compensated) | local `deno task test` exceeded session timeout (exit 124); focused slice tests passed; hosted lanes above provide stronger runtime evidence on the same commit |

## Doctrine / Anti-patterns

| Pattern | Status | Notes |
| ------- | ------ | ----- |
| AP-9 premature abstraction | CLEAR | port is consumed by two conversion sites with real divergent behavior (event stream vs snapshot) |
| AP-10/AP-25 side effects | CLEAR | process IO via injected edge ports; no console/`Date.now` in non-edge code |
| AP-15 naming | CLEAR | no `IFoo`/suffix types introduced |
| F-1 file size | CLEAR | converted files within doctrine thresholds |
| F-5 public surface | CLEAR | no exported package surface changed; surface-diff lane green |
| Debt delta | PASS | no `arch-debt.md` change required; polling-conversion debt retired by this slice (registry retains unrelated open entries) |

## PR / Issue Hygiene (read-only)

| Check | Result |
| ----- | ------ |
| Body refs #1906 as partial slice | PASS (explicitly partial, following #1909/#1969) |
| Labels/milestone per netscript-pr | PASS (`type:test`, `epic:aspire-13-5`, exactly one `status:`, milestone `0.0.7`) |
| Brief `## SKILL` chapter | PASS (harness, handoff, tools, doctrine named) |
| No workflow-owned status marker imitation | PASS |

## Findings (severity-ranked; none blocking)

1. **INFO — workflow tolerance surface (pre-existing, out of diff).** `desktop-native-linux` step
   "Native desktop package…" logged `##[error]` + `passed=2 failed=1` ("v1 failed to stage v2",
   headless-display AT-SPI/EGL environment) yet concluded `success` via `continue-on-error`.
   Unrelated to this PR's surface; tracked by the #859 exception-boundary step. Required action:
   none for this PR; keep on the desktop-lane backlog.
2. **INFO — summary-path env variance.** `OPENHANDS_SUMMARY_PATH` was set in the environment for
   this transport; trigger text supplied only the default fallback path. Self-remediated: summary
   written to the env-provided run-scoped path. Required action: none.
3. **INFO — template vocabulary.** `templates/evaluate.md` uses binary `PASS/FAIL` rows while
   `verdict-definitions.md` defines stable `PASS / FAIL_*` verdicts. Interpreted rows as evidence
   status and emitted the stable verdict only. Required action: optional template wording cleanup.

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | At exact head `46ebca6eb`: the fenced six-file listener-readiness surface is fully event-driven (describe-poll loop removed; buffered `watchResourceUpdates` + one post-event snapshot; 300s/30s/600s ceilings preserved; distinct absent-event vs wrong-detail failures), the polling guard allowlist is emptied and pinned, Bucket C is dispositioned Retain at all 8 sites with per-site rationale and none standing in for Aspire readiness, S1 RED is non-vacuous and S2 GREEN follows, PLAN-EVAL: N/A is justified under the owner-locked brief, the diff stays inside the brief's file set against the pinned merge-base `3149d18e1`, all static gates independently re-run green at head, hosted CI at head shows 0 failures across 29 completed check-runs with both live Aspire lanes green (postgres 101/0, sqlite/garnet 96/0) and `runtime.typed-db-phase-b` executed green — the exact #1906-family defect — and no unrecorded doctrine violation or debt delta was introduced. Findings are info-level and non-blocking. |
| Scope     | Slice 3 (fenced Bucket A + Bucket C) complete per brief; umbrella #1906 lifecycle remains supervisor-owned. |
| Posted    | Verdict comment `issuecomment-5520269293` on PR #1978 (first line: `OPENHANDS_VERDICT: PASS`; AI-agent disclosure footer; effort-attestation limitation stated). |
