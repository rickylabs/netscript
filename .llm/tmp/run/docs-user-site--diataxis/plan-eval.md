# PLAN-EVAL — docs-user-site--diataxis

- Plan evaluator session: OpenHands / openrouter/minimax/minimax-m3 (cycle 1)
- Run: `docs-user-site--diataxis`
- Surface / archetype: docs (no package archetype; `SCOPE-docs.md` overlay)
- Branch: `docs/user-site` (off `release/jsr-readiness`)
- Date: 2026-06-18
- IMPL gate: satisfied (Groups 1 + 2 merged into the umbrella per worklog row
  `plan & design | Design checkpoint — PLAN-EVAL ready`)

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | `research.md` finding #6 (26-unit denominator) + `doc-lint-census.md` (25/26 clean). Plan re-baselined on `main`@`cc3b8731` post-1+2-merge per worklog. |
| Decisions locked                        | PASS              | US-1..US-7 locked with rationale. |
| Open-decision sweep                     | PASS              | Three remaining items (reference depth per unit-class, README generated-vs-authored, workflow-token) are properly slotted to Design/user. None forces rework when deferred. |
| Commit slices (< 30, gate + files each) | PASS              | Validation Plan enumerates 5 ordered gates (reference / README / build / links / deploy), each names what it proves + the command + expected evidence. US-1..US-7 + the Codex slice bound the work; well under 30. |
| Risk register                           | PASS              | Risks listed (Pages subpath, doc-lint debt larger than expected, Pages workflow blocked by missing `workflow` scope, docs describe pre-cleanup reality) with mitigations. |
| Gate set selected                       | PASS              | Fitness Gates table (5 rows) + Validation Plan align with `SCOPE-docs.md` and the docs archetype; no package-archetype gates mis-applied. |
| Deferred scope explicit                 | PASS              | Non-Scope explicitly excludes internal docs (Group 4) and framework/API changes. Only framework-code change is the fresh-ui Codex source slice (7 `*.tsx` edits) — correctly carved out. |
| jsr-audit surface scan (pkg/plugin)     | N/A               | Docs run. The single framework-code touchpoint (fresh-ui `*Namespace` type exports) is a pre-existing lint-debt fix; jsr-publishability is unchanged. |

## Spot-check evidence

### US-5 — denominator = 26

- `packages/cli/e2e/deno.json` contains `"publish": false` → correctly excluded
  from the canonical `deno task publish:dry-run` simulation.
- `packages/cli/deno.json` has `name` (`@netscript/cli`) + `exports` + a
  `publish` block (no `false`) → correctly the 26th publish target (F-wave,
  publish-last).
- 22 packages (`packages/*`) + 4 plugins (`plugins/*`) = 26 publishable
  members. The "25 simulated" framing matches the E-wave; cli is the 26th.

### US-6 — lint debt = 1 unit, source-fix

`deno doc --lint packages/fresh-ui/interactive.ts` produces exactly 7
`error[private-type-ref]` diagnostics on the `export const` namespace
declarations in:

- `packages/fresh-ui/src/runtime/accordion/Accordion.tsx` (`Accordion`)
- `packages/fresh-ui/src/runtime/dialog/Dialog.tsx` (`Dialog`)
- `packages/fresh-ui/src/runtime/drawer/Drawer.tsx` (`Drawer`)
- `packages/fresh-ui/src/runtime/popover/Popover.tsx` (`Popover`)
- `packages/fresh-ui/src/runtime/sheet/Sheet.tsx` (`Sheet`)
- `packages/fresh-ui/src/runtime/tabs/Tabs.tsx` (`Tabs`)
- `packages/fresh-ui/src/runtime/tooltip/Tooltip.tsx` (`Tooltip`)

Each names a private `*Namespace` type as the annotation; the fix is to add
`export` to the 7 type declarations (TypeScript source, NOT Markdown).
→ Correctly carved out as a WSL Codex slice (SCOPE-frontend), NOT supervisor
doc work. At least one other unit (e.g. `@netscript/kv`) is `deno doc --lint`
clean.

### US-7 — Pages subpath

Plan sets Lume `location` to `https://rickylabs.github.io/netscript/` (US-7
+ Risk Register + Drift Watch). The deploy slice still needs a
`workflow`-scoped token; flagged as user-gated, non-blocking for PLAN-EVAL.

### Gates concrete

Fitness Gates table has 5 rows, each with `Required` and `Expected evidence`.
Validation Plan orders 5 sequential gates (reference quality, README standard,
build, links, deploy) with concrete commands and expected outputs.

### Boundary / off-limits guardrail

- `packages/aspire/src/public/mod.ts` — NOT touched.
- `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` — NOT touched.
- Version pins — NOT touched.
- `catalog:` — NOT touched.
- Only framework-code change is the fresh-ui Codex slice (7 `*.tsx` exports).

### Open-decision sweep (evaluator-run)

- Reference depth per unit-class (fold `*-core` substrate under public plugin
  vs full pages) — slotted to Design. Presentation-only; no rework risk.
- README generated-vs-authored-with-check — slotted to Design. Either is
  implementable against A2; no rework risk.
- Pages CI YAML `workflow`-scoped token — user-gated. Non-blocking for
  PLAN-EVAL (per the harness protocol).

None of these would force rework when deferred.

## Verdict

`PASS`

## Notes

- IMPL gate is satisfied (Groups 1 + 2 merged). PLAN-EVAL is a plan-readiness
  gate only.
- Two user-gated items remain (Pages subpath value + `workflow`-scoped token)
  but neither blocks this verdict per `evaluator/plan-protocol.md`.
- The fresh-ui Codex source slice is the only framework-code touchpoint and
  is correctly scoped to SCOPE-frontend, not the docs supervisor.
- Cycle 1 of 2 before escalation.
