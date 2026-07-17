# Worklog: automatic OpenHands docs-accuracy gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `ci-docs-openhands-gate--docs-accuracy` |
| Branch | `ci/docs-openhands-gate` |
| Archetype | N/A |
| Scope overlays | `SCOPE-docs.md` |

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
- **executable claim** — command, snippet, or generated-output assertion suitable for quick manual execution.

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

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | Prove and approve the docs-gate design before implementation. | PLAN-EVAL `PASS` | run `supervisor.md`, `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `pr-body.md` |
| 1 | Land the automatic trigger, conditional-testing prompt, audit note, and synchronized label taxonomy. | YAML/structure, label schema, prompt assertions, mirror sync | workflow, prompt, audit note, labels, PR skill + mirror, run artifacts |
| 2 | Independently evaluate the complete implementation and evidence. | IMPL-EVAL `PASS` | run `evaluate.md`, `worklog.md`, `context-pack.md` |

### Deferred Scope

- Live OpenHands dispatch — explicitly prohibited for this implementation run.
- Audit-note consolidation — deferred until the absent canonical document lands.

### Contributor Path

Start at the workflow header, follow its pointer to the audit note, then edit the checked-in prompt;
change model IDs only through the canonical agentic config and update the exact workflow allow guard
in the same reviewed slice.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 | 0 | Research | Re-baselined clean target branch at current remote main; verified model, token, trigger, marker, mirror, and validation contracts. |
| 2026-07-17 | 0 | Owner refinement | Locked conditional executable-claim testing while retaining mandatory full-set accuracy and hallucination review. |
| 2026-07-17 | 0 | PLAN-EVAL | Fresh local Qwen session `d50d8e9b-a3f5-465a-8dcb-15785de620b7` evaluated the settled D1-D8 plan and returned `PASS`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Use a checked-in prompt | Keeps the detailed evaluation contract reviewable and testable. | plan D6 |
| Require a PAT | A default workflow token cannot chain the OpenHands comment event. | plan D4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| none | N/A | N/A |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | separate local open-model session | PASS | `plan-eval.md`; session `d50d8e9b-a3f5-465a-8dcb-15785de620b7`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Docs overlay | NOT_RUN | planned source alignment/link/terminology checks | Run after implementation. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| OpenHands dispatch | N/A | owner prohibition | Do not dispatch evals. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| docs-labeled PR | NOT_RUN | structural assertions planned | Must post one trigger. |
| skipped docs PR | NOT_RUN | structural assertions planned | Must write explicit summary. |

## Handoff Notes

- PLAN-EVAL should inspect D2/D4/D5/D6 and the conditional-vs-mandatory prompt split first.
