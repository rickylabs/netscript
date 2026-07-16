# Plan: fix #773 — render_ui recursion hole

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-773-beta10-stabilization--render-ui-recursion` |
| Branch | `fix/773-beta10-stabilization` |
| Phase | `plan` |
| Target | `packages/fresh-ui` copy-source registry and core CI |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Archetype

Doctrine explicitly assigns `fresh-ui` to Archetype 4. This slice changes a registry-delivered UI
surface and its fitness gate; it does not introduce a new runtime, port, adapter, or public API.

## Current Doctrine Verdict

`@netscript/fresh-ui`: **Keep** — confirm runtime registry shape. This slice preserves that shape
and makes source-to-registry synchronization executable.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A8 | The regression belongs beside registry tests, while CI wiring remains in the workflow. |
| A14 | The published/copy-source surface must be protected by a fitness function, not convention. |

## Goal

Make nested-array recursion bounded in the `render-ui` source users actually receive, and prevent
all embedded asset barrels from silently drifting from their sources again.

## Scope

- Reproduce the source/embed mismatch before regeneration.
- Regenerate `packages/fresh-ui/registry.generated.ts` from its owning source.
- Add a failing-layer regression that compares the embedded `render-ui` copy with its source.
- Wire the existing `deno task check:assets-barrel` freshness gate into core CI.
- Run package/framework gates and scaffold runtime E2E because copy-source scaffold output changes.

## Non-Scope

- No redesign of `renderUiPayload`, block vocabulary, depth semantics, or public types.
- No changes to `tools/design-sync`; issue #773 verifies it consumes real source.
- No unrelated regeneration churn in the CLI, plugin, or service embedded barrels.
- No evaluator dispatch, self-certification, merge, or release cut.

## Hidden Scope

- The shared generator rewrites four barrels. Only the Fresh UI barrel is expected to differ; any
  other diff is a stop-and-investigate condition.
- CI must run regeneration before diffing, so the gate is intentionally mutation-then-verify.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Regenerate; do not hand-edit `registry.generated.ts`. | The generator owns the artifact and must remain reproducible. |
| D2 | Test byte equality for the embedded `src/ai/render-ui.tsx`. | It targets the failing copy-source layer while the existing behavior test proves nested-array fallback semantics. |
| D3 | Reuse `check:assets-barrel` in the CI quality job. | The repository already has the general freshness contract; duplicate scripts would create another drift seam. |
| D4 | Treat the registry change as scaffold-output change. | `netscript ui:add ai` copies this source into consumer projects, triggering the requested full runtime E2E condition. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact CI job placement | resolved | Add to `quality`, which already owns generated/publish fitness checks. |
| Behavioral execution of dynamically embedded TSX | safe to defer | Exact source equality plus the existing source behavior test proves the shipped copy without temp-module complexity. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Shared regeneration changes unrelated barrels. | Inspect path-limited diff immediately; stop if any non-Fresh-UI barrel changes. |
| Equality test is sensitive to intentional source edits. | That sensitivity is the contract: intentional source edits require regeneration. |
| CI gate mutates the checkout before detecting drift. | Follow immediately with `git diff --exit-code`, matching the existing task contract. |
| Full scaffold runtime E2E is expensive or environment-sensitive. | Run after targeted gates; report raw exit and exact failing suite if infrastructure blocks it. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-18 | risk | Assert semantic source/artifact equality, not a giant inline generated-string snapshot. |
| AP-25 | avoid | Keep generation side effects in the existing edge tool and CI task. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1–F-19 (Archetype 4 applicable set) | yes | `deno task arch:check`, scoped wrappers, manual diff review |
| Code-quality scan | yes | `deno task quality:scan` |
| Generated-asset freshness | yes | `deno task check:assets-barrel` |
| JSR surface | yes | package doc lint and publish dry-run evidence; no surface change expected |
| Frontend consumer/runtime | yes | targeted Fresh UI tests plus `scaffold.runtime` E2E |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| none | none | The slice closes the detected fitness hole without new/deepened debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Reproduction | compare source with `FRESH_UI_REGISTRY_CONTENT['src/ai/render-ui.tsx']` before regeneration | mismatch; embedded array call retains `depth` |
| 2 | Targeted regression | `deno test --allow-read --unstable-kv packages/fresh-ui/tests/ai/render-ui.test.tsx packages/fresh-ui/tests/registry/registry-generated.test.ts` | PASS |
| 3 | Fresh UI tests | `deno task --cwd packages/fresh-ui test` | PASS |
| 4 | Freshness | `deno task check:assets-barrel` | PASS with clean generated diff |
| 5 | Scoped wrappers | check/lint/fmt wrappers over `packages/fresh-ui` | PASS |
| 6 | Framework quality | `deno task quality:scan` and `deno task arch:check` | PASS |
| 7 | JSR | doc lint and package publish dry-run | PASS or pre-existing debt recorded without suppression |
| 8 | Scaffold runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS |

## Risks

- The full shared generator may expose unrelated pre-existing drift; such drift is outside this
  slice and triggers the issue's stop condition rather than silent inclusion.

## Dependencies

- Existing generator `.llm/tools/generate-cli-assets-barrel.ts`.
- Existing source behavior test for nested arrays.
- Existing core CI quality lane.

## Drift Watch

- Any non-Fresh-UI generated barrel change.
- Any required renderer API change beyond regeneration.
- Any evidence that the shared freshness task cannot run in stock GitHub Actions.

