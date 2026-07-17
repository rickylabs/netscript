# Worklog: automatic OpenHands docs-accuracy gate

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `ci-docs-openhands-gate--docs-accuracy` |
| Branch         | `ci/docs-openhands-gate`                |
| Archetype      | N/A                                     |
| Scope overlays | `SCOPE-docs.md`                         |

## Design

### Public Surface

- `.github/workflows/docs-openhands-eval.yml` — automatic docs-label gate and visible skip result.
- `.llm/tools/agentic/openhands/docs-eval-prompt.md` — cloud evaluator request contract.
- `docs-eval:skip` — on-demand escape-hatch label.
- `.llm/harness/workflow/doc-audit-openhands-gate.md` — pending-consolidation CI backstop note.

### Domain Vocabulary

- **docs labels** — `type:docs`, `area:docs`; either activates the gate.
- **skip label** — `docs-eval:skip`; makes the started job report skipped on demand.
- **trigger identity** — exact comment body plus PR head SHA.
- **unanswered trigger** — identical trigger with no later `openhands-agent-summary` comment.
- **executable claim** — command, snippet, or generated-output assertion suitable for quick manual
  execution.

### Ports

- GitHub pull-request event payload — labels, actor, PR number, and head SHA.
- GitHub issue-comments REST API — list and post PR conversation comments.
- `PAT_TOKEN` — chainable identity required to fire the downstream `issue_comment` workflow.

### Constants

- `DOCS_LABELS` — `type:docs`, `area:docs` (represented in the job expression).
- `SKIP_LABEL` — `docs-eval:skip`.
- `MODEL` — `openrouter/minimax/minimax-m3`.
- `ITERATIONS` — `100`.
- `TRIGGER_MARKER` — docs-eval marker carrying the head SHA.
- `ANSWER_MARKER` — `<!-- openhands-agent-summary -->`.

### Commit Slices

| # | Slice                                                                                                | Gate                                                         | Files                                                                                                    |
| - | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 0 | Prove and approve the docs-gate design before implementation.                                        | PLAN-EVAL `PASS`                                             | run `supervisor.md`, `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `pr-body.md` |
| 1 | Land the automatic trigger, conditional-testing prompt, audit note, and synchronized label taxonomy. | YAML/structure, label schema, prompt assertions, mirror sync | workflow, prompt, audit note, labels, PR skill + mirror, run artifacts                                   |
| 2 | Independently evaluate the complete implementation and evidence.                                     | IMPL-EVAL `PASS`                                             | run `evaluate.md`, `worklog.md`, `context-pack.md`                                                       |

### Deferred Scope

- Live OpenHands dispatch — explicitly prohibited for this implementation run.
- Audit-note consolidation — deferred until the absent canonical document lands.

### Contributor Path

Start at the workflow header, follow its pointer to the audit note, then edit the checked-in prompt;
change model IDs only through the canonical agentic config and update the exact workflow allow guard
in the same reviewed slice.

## Progress Log

| Time       | Slice | Step             | Notes                                                                                                                                                                                                                                                   |
| ---------- | ----- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-17 | 0     | Research         | Re-baselined clean target branch at current remote main; verified model, token, trigger, marker, mirror, and validation contracts.                                                                                                                      |
| 2026-07-17 | 0     | Owner refinement | Locked conditional executable-claim testing while retaining mandatory full-set accuracy and hallucination review.                                                                                                                                       |
| 2026-07-17 | 0     | PLAN-EVAL        | Fresh local Qwen session `d50d8e9b-a3f5-465a-8dcb-15785de620b7` evaluated the settled D1-D8 plan and returned `PASS`.                                                                                                                                   |
| 2026-07-17 | 0     | Draft PR         | Committed/pushed planning slice `820f38a4`; opened draft PR #806 to `main`, applied milestone 13 and implementation-phase taxonomy, and posted the PLAN-EVAL phase comment.                                                                             |
| 2026-07-17 | 1     | Implement        | Added the label-gated PAT-only workflow, trusted-base prompt, quick manual-test contract, fallback audit note, skip label, and synchronized skill mirror.                                                                                               |
| 2026-07-17 | 1     | Validate         | Parsed/asserted 11 workflows, 69 labels, and prompt contract; volatile-config tests 4/4; mirror and focused new-file format checks passed.                                                                                                              |
| 2026-07-17 | 1     | Slice review     | Separate Claude Opus 4.8 high session `aecf5196-28e3-4e9e-9158-6f5ee4e2f3f2` returned `PASS` with no blockers. The first routing-id launch (`opus-4.8`) failed before review and is a non-verdict; the canonical native id `claude-opus-4-8` succeeded. |
| 2026-07-17 | 1     | Reconcile        | PR #806 remains draft at planning head `820f38a4`, milestone 13, exactly one `status:impl`, requested type/area/gate/priority labels, and no new reviewer/automation comments beyond PLAN-EVAL. No issue closing keyword applies.                       |
| 2026-07-17 | 1     | Sign off         | Committed and explicitly pushed implementation slice `4eeb4479`; updated PR #806 to exactly the requested `status:impl-eval` taxonomy while keeping it draft.                                                                                           |
| 2026-07-17 | 2     | IMPL-EVAL        | Separate local Qwen session `83719d9f-797c-448c-96b7-d1b1d3d49024` independently verified D1-D8, remote/head parity, PR metadata, lock hygiene, and focused gates; `evaluate.md` records `PASS`. Live OpenHands dispatch remained owner-prohibited N/A. |

## Decisions

| Decision                | Reason                                                             | Source  |
| ----------------------- | ------------------------------------------------------------------ | ------- |
| Use a checked-in prompt | Keeps the detailed evaluation contract reviewable and testable.    | plan D6 |
| Require a PAT           | A default workflow token cannot chain the OpenHands comment event. | plan D4 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| none  | N/A      | N/A                |

## Gate Results

### Static Gates

| Gate                      | Command or check                                                                           | Result  | Notes                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PLAN-EVAL                 | separate local open-model session                                                          | PASS    | `plan-eval.md`; session `d50d8e9b-a3f5-465a-8dcb-15785de620b7`.                                                                                                                    |
| Workflow YAML + structure | `deno eval --no-lock` with `jsr:@std/yaml`                                                 | PASS    | Parsed 11 workflows; asserted events, docs-label OR, skip summary, exact model/closed-model guard, PAT-only token, trusted-base prompt, and exact-body/head-SHA unanswered dedupe. |
| Labels schema             | same focused Deno assertion                                                                | PASS    | 69 unique records; every label has name/color/description and six-digit color; `docs-eval:skip` contract exact.                                                                    |
| Prompt contract           | same focused Deno assertion                                                                | PASS    | `use harness`, skills, full changed-file read, focused manual execution, scaffold/snippet/output comparison, per-file verdicts, and blocking hallucination findings asserted.      |
| Volatile-config guard     | `deno test --no-lock --allow-read .llm/tools/agentic/config/no-hardcoded-volatile_test.ts` | PASS    | 4 passed, 0 failed. Initial invocation omitted `--allow-read` and was a permission non-verdict; corrected invocation passed.                                                       |
| Skill mirror              | `deno task agentic:sync-claude:check`                                                      | PASS    | 17 skills / 21 mirrored files clean after regeneration.                                                                                                                            |
| Focused formatting        | `deno fmt --check` on the three new workflow/prompt/audit files                            | PASS    | 3 files checked. Whole legacy labels/skill/run artifacts are not reformatted by this slice.                                                                                        |
| Whitespace                | `git diff --check`                                                                         | PASS    | No whitespace errors.                                                                                                                                                              |
| Action syntax             | `command -v actionlint`                                                                    | NOT_RUN | `actionlint` is not installed; compensated by full YAML parse and focused structural assertions.                                                                                   |
| A1 slice review           | separate Claude Opus 4.8 high session                                                      | PASS    | `slice-review.md`; no blocking findings, four low/info advisories documented.                                                                                                      |
| IMPL-EVAL                 | separate local open-model session                                                          | PASS    | `evaluate.md`; session `83719d9f-797c-448c-96b7-d1b1d3d49024`, no blocking findings.                                                                                               |

### Fitness Gates

| Gate         | Result | Evidence                                                                   | Notes                                                                                                            |
| ------------ | ------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Docs overlay | PASS   | source/model/token alignment, local path existence, terminology assertions | Audit note remains CI policy and points to pending PR #805 consolidation rather than duplicating agent doctrine. |

### Runtime Gates

| Gate               | Result | Evidence          | Notes                  |
| ------------------ | ------ | ----------------- | ---------------------- |
| OpenHands dispatch | N/A    | owner prohibition | Do not dispatch evals. |

### Consumer Gates

| Consumer        | Result            | Evidence                                                        | Notes                                                               |
| --------------- | ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| docs-labeled PR | PASS (structural) | workflow event/label/route/PAT/comment assertions               | Posts the exact Minimax M3 trigger with a 100-iteration budget.     |
| duplicate event | PASS (structural) | concurrency + exact body/head marker + later-summary comparison | An identical unanswered trigger is not reposted.                    |
| skipped docs PR | PASS (structural) | explicit skip step and guards on every dispatch step            | Writes attributed “skipped on demand” summary and posts no trigger. |

## Handoff Notes

- PLAN-EVAL, A1 slice review, and IMPL-EVAL all passed. PR #806 remains draft at milestone 13 with
  the requested final labels. No OpenHands eval was dispatched and no merge was performed; the next
  action is owner review.
