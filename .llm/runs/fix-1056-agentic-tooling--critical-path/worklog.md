# Worklog: agentic runtime, lane bindings, and release tooling

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1056-agentic-tooling--critical-path` |
| Branch | `fix/1056-agentic-tooling` |
| Archetype | N/A — repository tooling |
| Scope overlays | docs |

## Design

### Public Surface

- `OPENROUTER_MODEL_IDS.gemini` — centralized model identity.
- `OPENROUTER_PRESETS` documentation-authoring preset — executable Claude/OpenRouter binding.
- `CANONICAL_ROUTE_POLICY` lane `documentation_authoring` — machine route selected by operators.
- `deno task agentic:codex-status`, runtime repair, review-thread verb/CI gate, generated consumer
  skill guidance, and same-semver release retry — later slices.

### Domain Vocabulary

- `documentation_authoring` — generator lane; never a formal evaluator lane.
- `open_only` — formal evaluator policy limited to `OPEN_EVALUATOR_MODEL_IDS`.
- answered thread — non-outdated review thread with at least one reply.
- anchored app-server — process argv matching the canonical Codex app-server parser.

### Ports

- Existing provider profile/preset tables; no new abstraction is planned.
- Existing GitHub GraphQL command adapter and workflow patterns for S3.
- Existing asset generator for S4.

### Constants

- `OPENROUTER_MODEL_IDS` owns all volatile OpenRouter model strings.
- Existing route/preset finite tuples grow by one documentation-authoring entry.
- `OPEN_EVALUATOR_MODEL_IDS` remains unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Bind Gemini documentation authoring while proving evaluator exclusion | focused routing/provider tests + volatile guard + scoped lint/fmt | agentic config/runtime tests, lane policy, run artifacts |
| 2 | Anchor Codex liveness and status counts to process/socket reality | required failing-before-fix and focused runtime tests + live read-only comparison | agentic runtime/codex tests and implementation |
| 3 | Gate unanswered non-outdated review threads | four-case regression suite + workflow/tool discoverability checks | agentic GitHub tooling, CI, `deno.json`, indexes |
| 4 | Replace unsafe Aspire teardown and regenerate shipped assets | generator + forbidden guard + generated-output grep | source skills, generated assets, guard inventory |
| 5 | Prove or implement missing-member same-semver retry only | focused release tests/workflow evidence | release tooling/run artifacts as required |

### Deferred Scope

- PR mutation remains with the owner.
- Live publication is not authorized; S5 may record an evidence limitation.

### Contributor Path

Add volatile models only in `config/models.ts`, add provider execution metadata in
`runtime/provider-profiles.ts`, bind purposes in `runtime/routing-policy.ts`, then render the same
route in `workflow/lane-policy.md` and prove policy boundaries with focused tests.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-03 | S1 | research/plan | Read required skills, harness references, all issue bodies, #1004 owner comment, current model/preset/routing code, and tests. |
| 2026-08-03 | S1 | supervisor waiver | Supervisor waived further Plan-Gate work and retained the existing `FAIL_PLAN` artifact without further evaluation. |
| 2026-08-03 | S1 | implementation | Added the centralized Gemini id, Claude/OpenRouter authoring preset, generator route, rendered policy decision, and positive evaluator-rejection test. |
| 2026-08-03 | S1 | gate | Focused suite passed 41/41; `deno task check`, scoped lint, and scoped TypeScript format checks passed. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Stop after S1 push | Docs lane is externally blocked on this binding. | Owner brief |
| No package/plugin gates | No package/plugin paths are planned. | Scoped tree review |

## Drift

None.

## Gate Results

### Section 1

| Gate | Result | Trusted output |
| --- | --- | --- |
| Evaluator tuple | PASS | `['minimax/minimax-m3','qwen/qwen3.7-max']`; Gemini absent. |
| Focused tests | PASS | `deno test --allow-read config/no-hardcoded-volatile_test.ts runtime/routing-policy_test.ts runtime/provider-profiles_test.ts`: `41 passed`, `0 failed`; includes Gemini generator binding and formal-evaluator rejection. |
| Type check | PASS | `deno task check` completed after the scoped check runner selected the repository package/plugin TypeScript surface; no type errors were emitted. |
| Scoped lint | PASS | `filesSelected:124`, `totalOccurrences:0`. |
| Scoped TypeScript format | PASS | `filesSelected:124`, `failedBatches:0`, `findings:0`. |

The first volatile-guard invocation omitted `--allow-read`; its three failures were permission
errors before scanning and are not treated as a code verdict. The corrected invocation above is the
trusted result.

The separate Markdown format probe found pre-existing whole-table formatting drift in
`lane-policy.md` and formatting differences in the new run artifacts. It is not a required verdict
source for this slice and no repo-wide Markdown reformat was performed.

## Handoff Notes

- Inspect the evaluator-exclusion regression first; it is the load-bearing Section 1 invariant.
- Supervisor review is the next step after commit/push; do not start Section 2 yet.
