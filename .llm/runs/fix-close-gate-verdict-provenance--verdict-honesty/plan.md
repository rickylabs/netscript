# Plan: close-gate verdict honesty (#1171 + #1105)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-close-gate-verdict-provenance--verdict-honesty` |
| Branch | `fix/close-gate-verdict-provenance` |
| Phase | `plan` |
| Target | repository validation tooling + PR convention/template |
| Archetype | `N/A` — `.llm/tools` repo tooling, not a package/plugin framework surface |
| Scope overlays | `none` |

## Archetype

N/A. The task changes one repo-native CI validator and the PR authoring convention/template it
enforces. The user explicitly excludes `packages/**`; no Architecture Doctrine archetype applies.

## Current Doctrine Verdict

N/A for repository tooling outside `packages/**` and `plugins/**`.

## Goal

Make every close-gate verdict identify the exact PR/issue state it evaluated, make stale issue-body
verdicts mechanically detectable, and enforce the repository's existing rule that authoritative
PR-body Definition-of-Done/Acceptance checklists are complete before merge.

## Scope

- Add `headSha`, `evaluatedAt`, and per-issue `{number, updatedAt, bodySha256}` snapshots to report
  JSON and pretty logs.
- Add a pure current-vs-evaluated snapshot comparison with a negative stale-body test.
- Fail close-gate when the PR body contains an unchecked checkbox beneath a Definition-of-Done or
  Acceptance heading; keep other PR checklists non-authoritative.
- Rename the shipped template section to `## Definition of Done` and align `netscript-pr` prose.
- Add regression tests for existing issue pass/fail and override semantics.
- Update only workflow annotation text if needed; do not restructure CI.

## Non-Scope

- No package/plugin/framework changes.
- No acceptance-evidence mirror redesign or mutation behavior changes.
- No CI workflow restructuring.
- No enforcement of arbitrary checklists outside PR Definition-of-Done/Acceptance sections.
- No lockfile or dependency changes.

## Hidden Scope

- GitHub PR reads must include `head.sha`; issue reads must include `updated_at`.
- Issue-only CLI runs do not have a PR head, so `headSha` uses `GITHUB_SHA` when available and
  otherwise records `null` explicitly.
- Pretty output is a first-class artifact and must print the same provenance carried by JSON.
- The PR used to ship this change must itself use the new authoritative heading and have every DoD
  box truthfully checked before `status:ready-merge`.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | ENFORCE unchecked PR boxes only under headings containing `Definition of Done` or `Acceptance`. | Implements #1105's durable-record requirement without turning unrelated planning/rollout checklists into blockers. |
| D2 | Rename `.github/pull_request_template.md`'s `## Checklist` to `## Definition of Done`. | Makes the shipped template match the already-documented merge rule and gives the parser an unambiguous authoritative section. |
| D3 | Store evaluated issue snapshots as `evaluatedIssues` in the report. | The name distinguishes evaluated identity from `closingIssues` while keeping the existing field unchanged. |
| D4 | SHA-256 hashes the exact API body text with `null` treated as `''`. | Stable, portable Web Crypto behavior and no normalization that could hide edits. |
| D5 | Staleness is `updatedAt` mismatch OR body hash mismatch for the same issue. | Timestamp catches edits cheaply; content hash supplies state identity even when timestamps are copied or fixtures are synthetic. |
| D6 | Existing issue finding shape, closing-issue extraction, override behavior, and exit semantics stay intact; PR DoD findings are additive. | Satisfies #1171's regression constraint. |
| D7 | `headSha` is PR `head.sha` in PR mode; in issue-only mode it is `GITHUB_SHA ?? null`. | Every artifact carries the field without inventing a PR identity where none exists. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Enforce every checkbox in the entire PR body? | safe to defer / resolved against | Rejected by D1 because legitimate non-DoD checklists exist and the owner specifically names DoD boxes. |
| Add a second post-verdict GitHub fetch inside the same run? | safe to defer | The requirement is artifact provenance and mechanical comparison; double-fetching would narrow but not eliminate races. |
| Restructure CI annotations? | safe to defer | User permits annotation text only and pretty output already owns the job log. |

## Commit Slices

| # | Slice | Proves | Gate | Files |
| - | ----- | ------ | ---- | ----- |
| S0 | Harness research, plan, and evaluator handoff | Scope and decisions pass Plan-Gate before implementation | separate PLAN-EVAL | `.llm/runs/fix-close-gate-verdict-provenance--verdict-honesty/**` |
| S1 | Additive verdict provenance and stale-snapshot detection | #1171 fields appear in JSON/logs; pre-edit verdict is stale against post-edit body; old issue semantics regress green | targeted tests + scoped check/lint/fmt | `.llm/tools/validation/check-close-gate.ts`, `.llm/tools/validation/check-close-gate_test.ts`, run artifacts |
| S2 | Authoritative PR-body DoD enforcement and convention alignment | Unticked DoD fails; non-DoD checkbox does not; template/skill name the same convention | targeted tests + scoped check/lint/fmt + template inspection | prior files, `.github/pull_request_template.md`, `.agents/skills/netscript-pr/SKILL.md`, optional CI annotation text, run artifacts |
| S3 | Merge-readiness evidence and truthful PR state | Full targeted suite and scoped wrappers pass; PR has real labels/milestone/body; shipped checker passes against the live PR | targeted tests, scoped wrappers, live close-gate, review-thread gate, IMPL-EVAL | run artifacts and PR metadata only |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Hash calculation makes report assembly async and accidentally changes exit behavior. | Keep verdict calculation explicit; unit-test pass/fail and override truth table. |
| PR progress lists become accidental blockers. | Restrict authority to Definition-of-Done/Acceptance headings and test a non-authoritative unchecked list. |
| Report JSON breaks consumers expecting exact shape. | Changes are additive; preserve all existing field names and finding shapes. |
| Pretty logs omit fields that JSON carries. | Assert/render every provenance field in the pretty path and add log-focused test coverage where practical. |
| Staleness helper false-negatives when timestamp is unchanged. | Compare both timestamp and SHA-256 body hash. |
| Evaluator or implementation route is unavailable. | Record the blocked route; do not implement before PLAN-EVAL PASS or self-certify. |
| Validation mutates `deno.lock`. | Use existing dependencies only; inspect raw git state after each gate and reject lock churn. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| N/A | repo-tooling slice | Keep helpers pure and narrowly exported for tests; do not create a parallel validation framework. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Plan-Gate | yes | separate-session `plan-eval.md` PASS |
| Targeted behavior | yes | `deno test .llm/tools/validation/check-close-gate_test.ts` |
| Scoped type-check | yes | `run-deno-check.ts` over the two touched TS files |
| Scoped lint | yes | `run-deno-lint.ts` over the two touched TS files |
| Scoped format | yes | `run-deno-fmt.ts` over the two touched TS files |
| Template/convention consistency | yes | focused diff/manual inspection + behavior test fixture |
| Live close-gate | merge readiness | shipped checker against the real PR after `status:ready-merge` and truthful boxes |
| Review threads | merge readiness | `agentic:review-threads` reports no unanswered current thread |
| Package fitness / JSR / CLI E2E | no | No package/plugin, scaffold, DB, Aspire, or published CLI surface is touched. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `arch-debt.md` | none | No framework doctrine surface or deferred violation. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Existing baseline | `deno test .llm/tools/validation/check-close-gate_test.ts` | 3/3 baseline pass before edits |
| 2 | Targeted behavior | same test command after implementation | all provenance, stale, DoD, and regression tests pass |
| 3 | Scoped check | wrapper with explicit `--file` for touched TS files | PASS |
| 4 | Scoped lint | wrapper with explicit `--file` for touched TS files | PASS |
| 5 | Scoped format | wrapper with explicit `--file` for touched TS files | PASS |
| 6 | Convention consistency | inspect template + `netscript-pr` diff | both describe Definition-of-Done/Acceptance authority |
| 7 | Live PR | checker + review-thread gate on the labeled real PR | PASS before ready-merge |
| 8 | Formal evaluation | separate local Qwen IMPL-EVAL | PASS |

## Dependencies

- GitHub REST PR and issue payloads already consumed by the checker.
- Web Crypto, `TextEncoder`, and ISO timestamps from the Deno/Web Platform runtime.

## Deferred Scope

- Automatic rerun cancellation/restart for in-flight stale jobs remains outside this slice; the
  verdict becomes diagnosable without altering Actions concurrency.
- Generic PR-body policy beyond Definition-of-Done/Acceptance sections remains outside this slice.
- Acceptance-evidence mirroring continues to own issue checkbox mutation.

## Drift Watch

- Any need to enforce arbitrary non-DoD PR lists rather than D1.
- Any report consumer requiring a versioned schema rather than additive fields.
- Any implementation or evaluation route that cannot provide the recorded identity.
- Any `deno.lock` or unrelated worktree change.
