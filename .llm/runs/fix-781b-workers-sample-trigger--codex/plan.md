# Plan — fix #792 workers sample queue trigger

## Profile and verdict

- Archetype: 5 — Plugin Package, runtime subtype, because `plugins/workers` wires core worker contracts into the first-party runtime.
- Scope overlays: none. The consumer/runtime gate is required by the archetype and the issue.
- Current doctrine verdict: `plugins/workers` is **Refactor**; this narrow fix must not deepen its existing worker/jobs shape findings.
- Relevant axioms: A1, A2, A8, A11, A14. Anti-pattern risks: AP-9 (unneeded abstraction), AP-11 (hidden behavior), AP-25 (implicit runtime effects).

## Goal

Make queue-trigger listeners opt-in for reusable `Worker` instances while preserving the scaffolded workers default experience.

## Scope

- Remove the sample export-notification schema/default from reusable worker options.
- Centralize queue-trigger option resolution at the worker-options layer and use it from `Worker`.
- Add a worker-options regression proving omission means no triggers and explicit triggers are preserved without aliasing caller state.

## Non-Scope

- No CLI/scaffold generator changes unless the full runtime smoke proves they are required.
- No worker architecture refactor, queue contract redesign, sample job changes, dependency changes, or umbrella #781 closure.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `WorkerOptions.queueTriggers` remains the sole opt-in seam. | It already names the extension axis and avoids a second configuration contract. |
| D2 | Omitted triggers resolve to an empty readonly copy. | Reusable runtime behavior must not embed sample-domain listeners, and copying prevents later caller mutation. |
| D3 | Delete the sample schema/default rather than relocating it into reusable runtime helpers. | No scaffold path consumes it; retaining dead sample-domain configuration would preserve the defect in another name. |
| D4 | Validate scaffold behavior with the canonical one-pass runtime suite. | The issue explicitly requires the consumer experience to remain green. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Whether scaffold code must explicitly provide the removed trigger | safe to defer, resolved by gate | No scaffold consumer references the sample queue/job; only change if canonical E2E disproves the research. |
| Broader workers plugin refactor | safe to defer | Existing doctrine verdict; unrelated to finding 9. |

## Commit Slices

1. Harness bootstrap and draft PR surface. Gate: issue/API and tree evidence. Files: this run directory only.
2. Opt-in queue-trigger resolution and regression. Gate: focused worker-options test plus scoped check/lint/fmt. Files: `plugins/workers/worker/worker-options.ts`, `worker.ts`, new colocated test, run artifacts.
3. Merge-readiness evidence and evaluator handoff. Gates: `quality:scan`, `arch:check`, canonical `scaffold.runtime`; files: run artifacts and PR metadata only.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Removing the implicit listener could break scaffold startup or behavior. | Run the full canonical scaffold runtime suite with cleanup. |
| Returning the caller array directly could permit post-construction mutation. | Resolver returns a copied readonly array; regression asserts no aliasing. |
| A new exported helper could accidentally expand the package surface. | Keep it internal to `worker-options.ts`; do not re-export it from `worker.ts` or `worker/mod.ts`. |

## Fitness and Validation Gates

- Focused `worker-options_test.ts` regression.
- Scoped check, lint, and fmt wrappers over `plugins/workers`.
- `deno task quality:scan` and `deno task arch:check` with no new suppressions.
- Full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Separate supervisor-triggered IMPL-EVAL after handoff.

## Arch-Debt Implications

- No new or deepened debt is planned; existing `plugins/workers` Refactor findings remain outside this slice.
