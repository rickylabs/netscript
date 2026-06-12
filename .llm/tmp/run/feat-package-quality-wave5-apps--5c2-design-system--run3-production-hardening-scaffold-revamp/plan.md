# Plan: Run 3 production hardening + scaffold revamp

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-package-quality-wave5-apps--5c2-design-system--run3-production-hardening-scaffold-revamp` |
| Branch | `feat/package-quality-wave5-apps-5c2-design-system` |
| Phase | `plan-gate pending` |
| Target | `packages/fresh-ui`, `apps/playground`, `packages/cli` scaffold output |
| Archetype | `3 - Runtime/Behavior` for `@netscript/fresh-ui`; `6 - CLI/Tooling` for scaffold slices |
| Scope overlays | `frontend`, `docs` |

## Archetype

`@netscript/fresh-ui` is locked for this run as Archetype 3 because it owns imported interactive
runtime behavior, platform-backed lifecycle primitives, registry copy-source contracts, and browser
validation routes. The scaffold revamp touches `@netscript/cli`, so CLI slices 12-16 must also obey
Archetype 6 command/scaffold rules and the `netscript-cli` skill.

## Current Doctrine Verdict

The current doctrine handoff still says `@netscript/fresh-ui` is Archetype 4 / Keep and
`@netscript/cli` is Archetype 6 / Restructure. This run follows the user's locked Run 3 instruction
for fresh-ui as Archetype 3 and records the doctrine classification mismatch as drift rather than
changing doctrine mid-run.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1 | Public package and registry contracts must be named before implementation. |
| A2 | Published surfaces must become simpler, not accumulate compatibility shims. |
| A6/A7 | New helpers or Zag adoption must be justified against Web Platform and `@std/*` first. |
| A8/A9 | Package shape, test placement, and registry payload boundaries must match the selected archetype. |
| A10/A11 | CLI scaffold wiring and registry support code need named extension axes before abstraction. |
| A13/A14 | Browser/runtime failures and fitness gates are first-class closure evidence. |

## Goal

Deliver a JSR-ready `@netscript/fresh-ui` package and a revamped generated Fresh app scaffold that
uses `@netscript/fresh-ui` as its design system, including design routes and real browser evidence
from a freshly generated app.

## Scope

- Cleanup C-1..C-12 exactly as carried by `.llm/plans/2026-06-12-fresh-ui-doctrine-plan.md` and
  the user-provided lock.
- Add the scaffold revamp slices 12-16 from the user prompt.
- Keep slice boundaries locked; out-of-scope findings go to `drift.md`.
- Commit, push, update run artifacts, and post PR comments after each implemented slice once
  Plan-Gate status permits implementation.

## Non-Scope

- No migration of the existing seven native-backed interactive components to Zag.
- No merge or self-evaluation.
- No root `deno.lock` deletion or cache reload.
- No repo-wide formatting outside the exact C-7 ownership change.

## Hidden Scope

- Framework worktree changes must be synchronized to repo-genesis copies per copy-fidelity rules.
- Visual slices require real-route Playwright/browser validation.
- CLI scaffold changes require generated-app gates, not only template typechecks.
- Docs changes require doctests to remain green.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| LD-1 | The slice table below is locked and must not be rescoped in-place. | User instruction and fresh-ui horizontal skill. |
| LD-2 | `@netscript/fresh-ui` is treated as Archetype 3 for this run, with frontend/docs overlays. | Runtime behavior and browser-gated UI package scope. |
| LD-3 | `@netscript/cli` scaffold slices follow `netscript-cli` and Archetype 6 expectations. | Slices 12-16 change generated A-Z scaffold behavior. |
| LD-4 | C-2 requires user approval before tracking, deleting, or ignoring package `deno.lock`. | Explicit user instruction and lock hygiene rule. |
| LD-5 | Zag is spike-only: adopt only for future complex non-platform widgets if Fresh evidence passes. | Native-first L0 contract and carried plan addendum. |
| LD-6 | Design routes and scaffolded pages use registry vocabulary only. | Prevents off-vocabulary styling and keeps scaffold aligned with the package. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Package `deno.lock` policy | Safe to defer until Slice 2; must resolve before Slice 2 edits. | Ask user before C-2. |
| Run 3 PLAN-EVAL status | Must resolve before implementation. | No Run 3 plan-eval artifact found; need separate evaluator `PASS` or explicit waiver. |
| Zag production dependency | Safe to defer until Slice 7 verdict. | Slice 7 records ADR evidence; no migration is allowed. |

## Locked Slice Table

| Slice | Scope |
| ----- | ----- |
| 1 | C-1 single deno config: fold `deno.gates.json` into `deno.json`. |
| 2 | C-2 package `deno.lock` decision: requires user approval before deleting/tracking/ignoring. |
| 3 | C-3 manifest/schema out of the registry payload; check `netscript-cli` skill first. |
| 4 | C-4 dead registry items: wire `sheet-styles` + `floating-styles` into the gallery. |
| 5 | C-5 consolidate tests under `tests/` + C-6 version coherence bump to `0.1.0`. |
| 6 | C-7 fmt ownership for css/md and root exclusion removal + C-8 promote DS gates into `arch:check`. |
| 7 | C-12 Zag ADR spike in a real Fresh island; record verdict in `docs/architecture.md`. |
| 8 | C-9 `ns-responsive-table` as a new L3 registry block using the full horizontal loop. |
| 9 | C-11 docs scaffold + doctests; docs join publish include. |
| 10 | C-10 repo hygiene: remove `netscript-standards` shim after reference check. |
| 11 | JSR release readiness: clean `deno publish --dry-run` without `--allow-dirty`, jsr-audit, README/docs final check. |
| 12 | Scaffold revamp audit: current CLI scaffold templates vs fresh-ui registry gap report and locked follow-ups. |
| 13 | Scaffold consumes `ui:init`/`ui:add`: NS One theme seed, styles aggregator, `deno.json` imports. |
| 14 | Scaffold ships `/design/tokens`, `/design/components`, `/design/composition` ported from `apps/playground`. |
| 15 | Scaffolded app pages rebuilt on registry components only; zero off-vocabulary styling; generated app gates green. |
| 16 | E2E proof: generate fresh app, run it, browser-gate design routes plus one app route; record evidence. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Plan-Gate missing for Run 3. | Stop before implementation until separate evaluator `PASS` or written waiver. |
| Package lock policy affects task flags and publish readiness. | Ask before C-2; do not mutate lock policy earlier. |
| CLI scaffold revamp expands beyond five slices. | Log drift and follow-ups; do not rescope locked slices silently. |
| Browser gates mutate root `deno.lock`. | Restore root lock before staging; never commit root lock churn. |
| Visual routes pass static checks but fail at 390px/reduced motion. | Real route Playwright validation on visual slices. |
| Zag adds bundle/hydration cost. | Spike with measurable SSR/hydration/bundle evidence and ADR verdict. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1 | risk | Keep new registry/scaffold files focused; split large templates where owned. |
| AP-11 | risk | Avoid hidden globals in runtime/island behavior. |
| AP-13 | risk | No `console.*` in published runtime code. |
| AP-16/AP-17 | existing repo risk | Remove legacy skill shim only after reference check; avoid new generic folders. |
| AP-19 | risk | README/docs must state package and scaffold permissions where applicable. |
| AP-20 | risk | Single deno config must preserve `deno.unstable` where needed. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-1..F-15 | yes for fresh-ui | `deno task arch:check`, package/static evidence, manual where scripts are pending. |
| F-6/F-7 | yes | Clean `deno publish --dry-run` and jsr-audit report in Slice 11. |
| F-10 | yes | Tests consolidated and doctest fixture green. |
| F-CLI-* | yes for slices 12-16 | CLI scaffold gate evidence and `scaffold.runtime` smoke at merge-readiness. |
| DS no raw hex | yes | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts`. |
| DS color utilities | yes | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts`. |
| Browser validation | visual slices | SSR 200, zero console errors, theme flip both ways, 390x844 overflow scan, reduced motion. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `packages/cli — AP-1 / doctrine verdict Restructure` | update only if scaffold slices close part of it | Current run may not close all CLI debt. |
| fresh-ui archetype mismatch | drift | Do not edit doctrine handoff without explicit scope. |
| new unavoidable scaffold or package violations | create debt | Only with owner, target, and closing gate. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | package check | `Push-Location packages/fresh-ui; deno task check; Pop-Location` | PASS after each applicable slice. |
| 2 | package test | `Push-Location packages/fresh-ui; deno task test; Pop-Location` | PASS after each applicable slice. |
| 3 | tokens | `Push-Location packages/fresh-ui; deno task tokens:check; Pop-Location` | PASS unless token artifacts are intentionally updated. |
| 4 | DS raw hex | `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` | PASS; new gates get negative tests. |
| 5 | DS color utilities | `deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts` | PASS; new gates get negative tests. |
| 6 | docs doctest | `deno test --unstable-kv packages/fresh-ui/tests/_fixtures/docs-examples_test.ts` | PASS once introduced. |
| 7 | browser | Playwright real routes from `apps/playground` or generated scaffold | PASS for visual slices. |
| 8 | publish | `Push-Location packages/fresh-ui; deno publish --dry-run; Pop-Location` | PASS clean in Slice 11. |
| 9 | CLI scaffold smoke | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS at Slice 16 / merge-readiness. |

## Dependencies

- `.llm/tmp/docs/*` curated dependency notes.
- Fresh 2 / Preact / Tailwind v4 patterns from checked-in skills and docs notes.
- GitHub MCP for PR comments because `gh` is unavailable by instruction.

## Drift Watch

- Missing skill/reference paths or repo resources.
- Any changed CLI command spelling found by live `--help`.
- Any copy-fidelity exception beyond island import-depth rewrite.
- Any slice discovering work that belongs to a later or new slice.
