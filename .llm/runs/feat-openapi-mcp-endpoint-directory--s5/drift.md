# Drift Log: OMB S5 ServiceEndpointDirectoryPort + adapters

Drift is append-only.

## 2026-08-04 — Attached implementation uses a run-owned staging worktree

- **What:** The canonical implementation lane runs in `/home/codex/repos/ns005-s5-impl` on local
  branch `agent/openapi-mcp-endpoint-directory-s5`, then pushes each slice to the required PR ref.
- **Source:** The agentic sender registry refused a rival sender because the provided worktree is
  durably owned by the live Desktop supervisor thread.
- **Expected:** The implementation lane would attach directly to the provided PR worktree.
- **Actual:** A separate run-owned worktree preserves the one-sender invariant; the PR branch,
  explicit push refspec, commit order, and review surface remain unchanged.
- **Severity:** minor
- **Action:** accept
- **Evidence:** agentic launcher `duplicate_sender_risk`; implementation brief path/branch contract.

## 2026-08-04 — Milestone evaluator composition replaces local formal PLAN-EVAL

- **What:** No local formal PLAN-EVAL is launched; the plan gate is recorded as composed waiver.
- **Source:** User-relayed `.llm/harness/workflow/milestone-run.md` evaluator rule and orchestrator D6.
- **Expected:** Normal run-loop would require a separate local formal PLAN-EVAL.
- **Actual:** Draft→ready augment + OpenHands + orchestrator pre-merge evaluation compose per-PR
  evaluation; implementation proceeds in the same run after plan lock.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `supervisor.md`, `plan-eval.md`, `worklog.md` Plan Gate row.

## 2026-08-04 — True baseline is fetched origin/main

- **What:** Local `main` pointed to an older commit while this branch matched remote `main`.
- **Source:** raw git rev-parse/fetch/ls-remote.
- **Expected:** re-baseline against current `main`.
- **Actual:** fetched `origin/main` is `2c8865e8c`; branch is identical and clean.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `research.md` re-baseline.

## 2026-08-04 — Current manifest run id must be injected

- **What:** S-8 says a manifest is eligible only when `runId` is current, but S5 has no independent
  current-run token source; trusting the file's own token or wall clock would not prove currency.
- **Source:** canonical discovery design vs P1 experiment/evidence and S7 ownership boundary.
- **Expected:** identity binding `projectRoot + runId` before use.
- **Actual:** S5 will require an expected current run id at composition. A present manifest without
  it, or with a mismatch, reports a failed source outcome. S7 can wire the token later.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `research.md` finding 8/open-question resolution; `plan.md` D4.

## 2026-08-04 — Scoped lint and format need the package config

- **What:** The scoped lint/fmt wrappers failed before source analysis when Deno parsed the root
  workspace glob entries; rerunning the same wrapper selections with
  `--config packages/mcp/deno.json` passed with zero findings.
- **Source:** Slice 1 validation output from `run-deno-lint.ts` and `run-deno-fmt.ts`.
- **Expected:** The plan's wrapper commands would run from the repository root without an explicit
  config.
- **Actual:** `deno check` accepted the selection, while `deno lint`/`deno fmt` reported
  `invalid type: string "packages/*", expected struct WorkspaceConfig` until the package config was
  supplied.
- **Severity:** minor
- **Action:** accept for this lane; use the package config for exact lint/fmt evidence and leave root
  configuration changes out of scope.
- **Evidence:** `worklog.md` Slice 1 gate table; package-configured lint/fmt exit 0 over 76 files.

## 2026-08-04 — Package test task omitted test-only write permission

- **What:** The locked package-test command initially failed three pre-existing tests before their
  assertions because they create temporary directories, while the task omitted `--allow-write`.
- **Source:** Slice 2 `deno task --cwd packages/mcp test` output for `drift-evidence_test.ts` and
  `stdio_test.ts`.
- **Expected:** The package task would execute its complete test corpus and exit 0.
- **Actual:** The task definition now grants write access only to the test process; runtime and
  published package permissions are unchanged. The exact task then passed 78/78.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `packages/mcp/deno.json`; `worklog.md` Slice 2 package-test gate.

## 2026-08-04 — A2 port and adapters grouped after cardinality audit

- **What:** The Design file list described a flat domain contract and flat infrastructure adapters;
  the first Slice 3 audit showed the five owned adapters would add a new `src/infrastructure`
  cardinality warning and increase the inherited domain count.
- **Source:** Archetype-2 port ownership plus F-16/R-FOLD-CARD and the Slice 3 JSR audit.
- **Expected:** Preserve existing horizontal package debt without adding or deepening a violation.
- **Actual:** The consumed contract lives in `src/ports/`; owned source/probe adapters and their URL
  policy live in `src/infrastructure/service-endpoints/` without a sub-barrel. Public exports and
  behavior are unchanged. Final audit restores inherited `src/domain` and
  `src/application/flows` counts to their baseline 13 and introduces no infrastructure warning.
- **Severity:** minor
- **Action:** fix
- **Evidence:** final JSR audit; zero-diagnostic scoped/doc gates in `worklog.md` Slice 3.

## 2026-08-04 — JSR audit matches Deno's slow-type progress banner

- **What:** `audit-jsr-package.ts` reports `slowTypeWarnings=1` because its `/slow type/i` matcher
  captures Deno's neutral `Checking for slow types in the public API...` progress line.
- **Source:** Slice 3 audit output and the helper's `runDryRun()` matcher.
- **Expected:** Only an actual slow-type diagnostic would produce an audit warning.
- **Actual:** Raw `deno doc --lint` for both entrypoints and `deno publish --dry-run --allow-dirty`
  pass; Deno emits no slow-type error/warning after the progress line. The shared audit helper was
  not changed by this package-scoped lane.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `worklog.md` Slice 3 doc/audit/publish rows.

## 2026-08-04 — Fable review primary unavailable at provider

- **What:** The canonical `review_codex_complex` primary could not start because the native provider
  returned `model_not_found` for `fable-5` before review work or token use.
- **Source:** Claude session `1abc6d8e-4c4a-4677-81dd-057eaab9145d` launch result.
- **Expected:** Anthropic Fable 5 at medium effort performs the opposite-family substantive review.
- **Actual:** The configured Claude-family Opus 4.8 fallback ran at medium effort in separate session
  `a5d06fbf-041d-4d6a-a4d1-a69fce9ed447`; it returned PASS, then re-reviewed its three addressed
  findings and retained PASS. Generator/evaluator family separation remained intact.
- **Severity:** minor
- **Action:** accept for this run; preserve both route identities in the review artifact.
- **Evidence:** `review-codex-complex.md` §§1 and 6.

## 2026-08-04 — OpenHands completion used the verdict artifact, not its stale status comment

- **What:** The OpenHands workflow emitted an exact PASS verdict and committed `evaluate.md`, while
  its earlier persistent status comment remained on `Running`; the workflow also did not emit the
  optional trace directory.
- **Source:** Agentic watcher result, PR comments, Actions run `30862805934`, and commit
  `3e26b2bee`.
- **Expected:** The persistent comment transitions to the terminal state and trace output accompanies
  the evaluator artifact.
- **Actual:** The later verdict comment and tracked evaluator artifact are terminal and internally
  consistent; the stale progress comment and absent optional trace do not weaken acceptance proof.
- **Severity:** minor
- **Action:** accept for this run; use the exact watcher verdict, final PR comment, and tracked
  `evaluate.md` as the authoritative evidence.
- **Evidence:** https://github.com/rickylabs/netscript/pull/1194#issuecomment-5172905933;
  `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/evaluate.md`.

## 2026-08-04 — Evaluator retained a stale identity-JSDoc advisory

- **What:** OpenHands says `FetchServiceEndpointProbe` JSDoc does not repeat the root identity JSON
  contract, but the reviewed source already documents that the root endpoint must return a JSON
  `service` field matching the candidate name.
- **Source:** `evaluate.md` finding F-3 compared with
  `packages/mcp/src/infrastructure/service-endpoints/fetch-service-endpoint-probe.ts`.
- **Expected:** The final evaluator narrative reflects the post-review source fix.
- **Actual:** The advisory is factually stale but explicitly non-blocking; executable verification,
  product behavior, and the PASS verdict are unaffected.
- **Severity:** minor
- **Action:** accept the immutable evaluator artifact and record the correction here.
- **Evidence:** OpenHands PASS artifact; current `FetchServiceEndpointProbe` JSDoc.
