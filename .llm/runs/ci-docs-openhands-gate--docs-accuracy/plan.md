# Plan: automatic OpenHands docs-accuracy gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `ci-docs-openhands-gate--docs-accuracy` |
| Branch | `ci/docs-openhands-gate` |
| Phase | `plan` |
| Target | GitHub Actions / harness docs / label taxonomy |
| Archetype | N/A — no package or plugin surface |
| Scope overlays | `SCOPE-docs.md` |

## Archetype

N/A. This is repository CI and operating-documentation work. The docs overlay governs source
alignment, link integrity, terminology, and drift recording.

## Current Doctrine Verdict

N/A: no package/plugin framework layer changes.

## Goal

Automatically post one cheap, open-model Minimax M3 docs-accuracy trigger for every PR carrying
`type:docs` or `area:docs`, with an explicit `docs-eval:skip` escape hatch and no duplicate pending
trigger for the same head SHA.

## Scope

- Add the docs-labeled PR workflow and its open-model hard guard.
- Add the compact docs-evaluation prompt with conditional executable-claim testing.
- Add the skip label to the machine and narrative taxonomy, then regenerate the skill mirror.
- Add the CI-backstop note in the requested fallback audit document.
- Track and validate the work through this harness run.

## Non-Scope

- Do not dispatch an OpenHands or formal cloud evaluation from this run.
- Do not change the existing OpenHands runner, its model defaults, or its output contract.
- Do not make the new docs gate a package/plugin, scaffold-runtime, or release gate.
- Do not merge the resulting draft PR.

## Hidden Scope

- Use `PAT_TOKEN`, not `GITHUB_TOKEN`, so the posted comment can create a chained workflow event.
- Fail visibly when the chainable token is unavailable.
- Treat pure prose as reviewable without inventing a scaffold test; require the exact no-executable-
  claims note in that case.
- Dedupe the exact prompt + head-SHA identity only while no later OpenHands summary response exists.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Trigger on `pull_request` opened, synchronize, and labeled; run only when either docs label is present. | Matches the ratified applicability contract. |
| D2 | Keep `docs-eval:skip` inside a started job and write actor/reason to `$GITHUB_STEP_SUMMARY`. | The escape hatch must be visible, never a silent job skip. |
| D3 | Set model to `openrouter/minimax/minimax-m3` and accept only that exact value in a hard guard before commenting. | Enforces the owner-ratified open-model route and fails closed on future drift. |
| D4 | Post through `PAT_TOKEN` only and fail with a summary if it is absent. | Default Actions tokens do not chain `issue_comment` workflows. |
| D5 | Mark the trigger with its head SHA and compare the complete comment body; suppress repost only when an identical trigger has no later OpenHands summary response. | Provides precise pending-run dedupe without permanently suppressing reruns. |
| D6 | Use a checked-in prompt with `iterations=100`; executable testing is conditional, all accuracy/hallucination checks are mandatory. | Keeps the gate cheap while preserving the owner-refined accuracy contract. |
| D7 | Create `doc-audit-openhands-gate.md` because `doc-audit.md` is absent and explicitly note pending consolidation. | Follows the requested fallback. |
| D8 | Add `docs-eval:skip` to `.github/labels.yml` and the source PR skill, then regenerate the Claude mirror. | Keeps machine and human taxonomy synchronized. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| All behavior-affecting decisions | safe to defer: none | The owner has locked every behavior needed for implementation. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A closed model is substituted later. | Exact-value guard exits nonzero before posting. |
| Skip label silently removes the check. | Job starts and writes an explicit skipped-on-demand summary. |
| Repeated events create concurrent duplicate triggers. | Concurrency per PR plus exact unanswered-trigger dedupe. |
| Comment fails to start OpenHands. | Require `PAT_TOKEN`; never fall back to `GITHUB_TOKEN`. |
| Conceptual docs waste time on irrelevant scaffolds. | Prompt branches on executable claims and requires the owner-specified one-line note when absent. |
| Workflow YAML looks valid but encodes the wrong shape. | Parse all workflows and structurally assert events, label gates, skip step, model guard, trigger, dedupe markers, and prompt contract. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| N/A | no package/plugin doctrine surface | Apply docs-overlay false-done checks instead. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Source alignment | yes | Exact model/config and OpenHands contract inspection. |
| Scope separation | yes | Audit note identifies this as a CI backstop, not agent-level doctrine. |
| Link integrity | yes | All referenced local paths exist. |
| Terminology | yes | Labels, output mode, markers, and model IDs match canonical sources. |
| Drift log | yes | Append only if implementation diverges. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No architecture debt introduced or resolved. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Workflow YAML + structure | Deno YAML parse with focused assertions | All workflows parse; new contract assertions pass. |
| 2 | Label schema consistency | Deno YAML parse/assert unique name, color, description and new label | PASS. |
| 3 | Prompt contract | Focused text assertions | Conditional executable testing and mandatory review split both present. |
| 4 | Skill mirror | `deno task agentic:sync-claude` then `agentic:sync-claude:check` | Generated mirror clean. |
| 5 | Formatting/link review | scoped changed-file checks | PASS; no broken local pointer. |

## Deferred Scope

- Consolidate the fallback audit note into `.llm/harness/workflow/doc-audit.md` when that document
  lands on `main` (reported as pending, not silently duplicated).
- Live execution of the new automatic docs eval occurs only after merge and a future docs-labeled PR.

## Dependencies

- Existing `OpenHands Agent` issue-comment trigger workflow.
- Repository `PAT_TOKEN` secret and `LLM_API_KEY_OPENROUTER` configuration.

## Drift Watch

- `doc-audit.md` appearing before implementation, exact model constant changes, OpenHands marker or
  token rules changing, or an existing label-sync task beyond the Claude skill mirror.
