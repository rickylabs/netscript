# Plan: homepage capability story

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-1334-homepage-capability-story--leaf` |
| Branch | `docs/1334-homepage-capability-story` |
| Phase | `plan` |
| Target | `docs/site/index.vto` |
| Archetype | N/A — docs-only consumer surface |
| Scope overlays | `SCOPE-docs.md` |

## Current Doctrine Verdict

N/A for the edited surface. Claims may name current package/plugin seams, while doctrine target
state remains separate. Durable-runtime language follows A12/A13 and doctrine section 08.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | Outcome copy stays small and predictable rather than hiding a catalog in the homepage. |
| A3 | Each outcome gives the common path and unfolds into one canonical task page. |
| A12 | Sagas, triggers, streams, and workers are represented honestly as distinct durable/runtime seams. |
| A14 | Export inspection, rendered gates, link checks, and Playwright evidence preserve accuracy. |

## Goal

Complete #1334 with a concise, outcome-led homepage capability section whose destinations teach
each capability in one click and whose claims are backed by current exports, code, diagrams, or
canonical source pages.

## Scope

- Add one `##` capability section using existing `comp.cardsGrid`.
- Cover server-first UI, progressive UI/data cache, generated data, auth, plugin/durable runtimes,
  observability/Aspire/Scalar, and agent-facing MCP discovery.
- Use adjacent prose links where one outer card link cannot honestly cover grouped sub-capabilities.
- Preserve L1 wording, the four tabs, diagram framing, and the five-item destination selector.
- Record snippet/export, rendered, browser, link, accuracy, caveat, and lock evidence.

## Non-Scope

- No comparison, mental-model rewrite, quickstart procedure, catalog/reference inventory, new page,
  package/plugin code, diagram work, component/CSS work, or #1277 redesign.
- No changes to `check-rendered-output.ts`, `diagram.vto`, `docs.css`, or either lock file.
- No self-evaluation, ready-for-review transition, merge, or issue closure.

## Hidden Scope

- Exact acceptance-evidence mapping in the draft PR body.
- Rendered nested-anchor DOM probe after build.
- Six browser combinations (390/1024/1600 × light/dark), semantic/tab/diagram/overflow checks,
  and destination resolution.
- Every changed TS/TSX snippet assembled under `.llm/tmp/` and checked with `--unstable-kv`.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D10 | Record snippet → source line → exact check command → result. | Acceptance requires current, proved APIs. |
| D12 | Keep `nav.ns-destination-list` exactly five and do not edit its checker. | Capability cards and lane chooser have different jobs. |
| D13 | Data card links only to `/data-persistence/database/`; “collections” is plain text; streams link is adjacent prose. | Avoid nonexistent canonical page and nested anchors. |
| D14 | Reuse existing components and diagrams only; no CSS/component/diagram edits. | Coordinates with #1277 without absorbing layout work. |
| D15 | Use a small grouped card set plus concise adjacent task links. | Covers all canonical tasks without turning the grid into an inventory. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Card count and exact prose | Must resolve now — resolved during slice 2.2 | Binding measure is concise outcome coverage and browser fit. |
| PLAN-EVAL | N/A | Issue/brief already locks scope, destinations, mechanics, gates, and non-scope; no material design decision remains. |
| IMPL-EVAL | Must resolve later | Mandatory separate supervisor/evaluator session after this implementation handoff. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Homepage becomes a catalog | Group honestly; one-line outcomes; detail stays behind task links. |
| A grouped card hides required one-click destinations | Put valid raw-HTML task links in adjacent prose, never inside linked cards. |
| Marketing-only or stale API claims | Verify every named export with `deno doc`; check any changed snippet. |
| L1 acceptance regression | Do not edit its hero, lede, diagram, tabs, or closing type-flow paragraph. |
| Invalid HTML or overflow | Build, DOM nested-anchor probe, and Playwright at six viewport/theme combinations. |
| Lock churn | Never reload caches; exact diff and blob-hash proof at handoff. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Source | `deno task check:source-format` in `docs/site` | exit 0 |
| 2 | Build/HTML | `deno task build`; DOM probe for card nested anchors | exit 0; count 0 |
| 3 | Rendered | `deno task check:rendered-output` | exit 0 with checker unchanged |
| 4 | Links/accuracy | root `docs:links`, `docs:accuracy`; site `check:links`, `check:caveats` | all exit 0 |
| 5 | Snippets | scratch module + `deno check --unstable-kv` for changed TS/TSX | exit 0 |
| 6 | Browser | Playwright 390/1024/1600 × light/dark | no overflow; semantics/tabs/diagram/links/contrast intact |
| 7 | Locks | exact diff + `git hash-object` | no diff; prescribed hashes |

## Dependencies

- L1 #1332 merge `714a4ef9b` and L3 #1408 merge `7a379dab3`, both present.
- Separate supervisor-selected IMPL-EVAL after implementation.

## Drift Watch

- Any need to edit the checker, components, CSS, diagrams, L1 language, or add a canonical page is
  significant plan drift and stops implementation.
