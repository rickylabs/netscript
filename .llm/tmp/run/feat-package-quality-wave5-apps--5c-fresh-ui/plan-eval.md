# Plan-Eval — Sub-wave 5c: NetScript UI end product

> Evaluator session: PLAN-EVAL / SECOND-PLAN-PASS
> Date: 2026-06-11
> Branch: feat/package-quality-wave5-apps-5c-fresh-ui

## Plan-Gate Checklist

| Check | Status | Evidence |
|-------|--------|----------|
| Research present and current | PASS | research.md exists; external sources scraped and saved to .llm/tmp/docs/ (9 extract files) |
| Decisions locked with rationale | PASS | 13 decisions in plan.md §3, each with rationale |
| Open-decision sweep | PASS | 4 open decisions listed in plan.md §4; none force rework if deferred |
| Commit slices enumerated, <30 | PASS | Run 1 = 16 slices; runs 2–3 scoped for re-slice at their locks |
| Risk register | PASS | 7 risks with mitigations in plan.md §7 |
| Gate set selected | PASS | Archetype 4 (DSL/Builder) + frontend scope overlay; gate matrix cited |
| Deferred scope explicit | PASS | 5 deferred items in plan.md §9 |
| jsr-audit surface scan | PASS | jsr-audit skill applied; plan.md §1 names JSR dry-run gate; publish filtering already in deno.json |

## Open-Decision Sweep (evaluator independent check)

| Decision | Safe to defer? | Rationale |
|----------|---------------|-----------|
| D-13 naming ("NS One") | YES | Cosmetic; no schema/code impact |
| Anchor-positioning fallback choice | YES | Decision framework provided (polyfill vs CSS fallback); slice 12 will measure |
| Tier-Z lead component | YES | Spike slice 10 is go/no-go; schema unaffected |
| `block:add` contract introspection | YES | Seam designed; explicitly deferred to post-5c |

No deferred decision forces rework. **PASS**.

## Decision Matrix (D-1 … D-13)

| # | Decision | Verdict | Evidence Extract | Deciding Fact |
|---|----------|---------|------------------|---------------|
| D-1 | Layer model (L0 = contract) | **CONFIRMED** | base-ui-contract.md | Base UI 1.0 proves contract-first (data-attrs + prop merge) is the modern standard; ~40 wrappers are React-era indirection. |
| D-2 | Runtime doctrine (P+Z tiers) | **CONFIRMED** | zagjs-preact-api.md, popover-api-anchor.md | `@zag-js/preact` v1.41.2 is real, per-machine packaged, SSR-safe statecharts. Popover API is Baseline. Anchor positioning needs fallback (Firefox flag). |
| D-3 | Token pipeline (DTCG → SD v5) | **CONFIRMED** | style-dictionary-dtcg.md, tailwindcss-v4-theme.md, oklch-ramps.md | SD v5 works under Deno (npm:); DTCG color object format is supported. `@theme inline` is the correct Tailwind v4 bridge. OKLCH ramp derivation method documented. |
| D-4 | Registry schema v2 | **AMEND** | shadcn-registry-schema.md | Add `cssVars?` and `author?` fields to align with shadcn proven model; keep `kind` divergence (simpler taxonomy). |
| D-5 | Distribution (JSR-native) | **CONFIRMED** | shadcn-registry-schema.md, jsr-audit skill | JSR package distribution is validated by existing deno.json publish config. `registry.json` export as derived artifact matches shadcn root schema. |
| D-6 | Ownership split | **CONFIRMED** | design.md §2.4 | Matches shadcn's radix-vs-components split; matches our layer model. |
| D-7 | Official design system | **CONFIRMED** | tailwindcss-v4-theme.md, oklch-ramps.md | Tailwind v4 defaults to OKLCH; our DS identity already exists in playground. |
| D-8 | Playground = consumer #1 | **CONFIRMED** | context-pack.md | Playground already uses deep imports; converting to ui:add dogfoods the chain. |
| D-9 | Living styleguide (/design) | **CONFIRMED** | fresh2-islands-partials.md | Fresh 2 routes + islands support the three surface types (tokens browser, gallery, rules). |
| D-10 | Scaffold = install + glue | **CONFIRMED** | fresh2-islands-partials.md, shadcn-registry-schema.md | Fresh 2 island detection by folder; ui:init can write to components/ui/ and islands/ui/. |
| D-11 | Starter app definition | **AMEND** | fresh2-islands-partials.md, popover-api-anchor.md | Needs concrete route table and dynamic contract spec (provided in design deepening below). |
| D-12 | Single-package topology | **CONFIRMED** | zagjs-preact-api.md | Per-machine packaging means Zag dependency cost is scoped; no need for a separate primitives package until a second consumer appears. |
| D-13 | Run split + ordering | **CONFIRMED** | plan.md §5 | 3-run split is justified by dependencies (run 2 needs 1; run 3 needs 1+2+5b). |

## Amendments Summary

1. **D-4**: Add `cssVars?: { theme?, light?, dark? }` and `author?: string` to registry schema v2.
2. **D-11**: Provide full scaffolded-app spec in design.md (file tree, route table, dynamic contract, starter collection, playground-parity checklist).
3. **D-2 popover fallback**: Make the fallback decision NOW — CSS `position: fixed` + `inset` fallback, NOT OddBird polyfill. Rationale: polyfill has dynamic-content caveat (Fresh partials), adds tens of KB, and CSS fallback is sufficient for graceful degradation. Record as accepted debt.

## Blocking Findings

None. All decisions are confirmable with primary-source extracts. No fundamental problems identified.

## Verdict

**PASS** — with amendments documented above. Plan may proceed to v2 LOCK after amendments are applied.
