# Worklog — Sub-wave 5c: NetScript UI end product

## Bootstrap

- Worktree `wave5-apps-5c-fresh-ui`, branch `feat/package-quality-wave5-apps-5c-fresh-ui`
  forked off umbrella tip `19cae06`. Run dir created. Research-only fork: zero
  fresh-ui imports of sdk/plugin-streams-core verified, so 5c proceeds in parallel
  with 5b implementation; only run 3 (scaffold revamp) gates on 5b merge.

## Measure-first

- Deferred to each implementation run's lock (rescope drift D-1): this run's
  baseline is the structural inventory in research.md §1 (LOC, item census, CSS
  corpora sizes, template/fork map, legacy-output evidence) rather than gate
  numerics. Each run re-baselines its own slice of the gate matrix before locking.

## Research

- Read in full: RFC 06 (578L) + NETSCRIPT-UI-WHITEPAPER (2030L).
- Tier inventory: fresh-ui package (5,783 LOC; registry model + 33 items + 7
  Zag-shaped hand-rolled machines + 211L token seed), playground (~20 components via
  deep relative imports; 2,264L CSS design system; 12 islands), CLI scaffold (45
  frontend templates — definePage/defer/sdk already wired but design system forked
  as a 570L subset + 2 component forks), legacy generated app in test-app
  (Fresh-default quality; the "ugly/barely functional" evidence).
- External: Base UI 1.0 (data-attr styling contract, useRender), shadcn CLI 3.0
  registry schema + namespaces, DTCG 2025.10 stable + Style Dictionary v5,
  **official `@zag-js/preact` adapter (v1.31.1)**, Popover API Baseline + anchor
  positioning 2/3 engines + `@starting-style`, Tailwind v4 @theme/OKLCH practice.
  Sources recorded in research.md §3.

## Design

- design.md: one distribution chain (DTCG → SD v5 → generated artifacts → registry
  v2 → ui:init/ui:add → apps); playground + starter app as two consumers of one
  registry; platform-first runtime behind Zag-shaped contracts with Zag as the
  approved machine-class engine; official design system promoted from playground;
  single-package topology with split-ready layout.
- plan.md: 13 proposed decisions, 3-run split (foundation / design system /
  scaffold revamp), run 1 sliced (16), runs 2–3 scoped for re-slice at their own
  locks, gates incl. two new fitness checks (tokens-drift, manifest-integrity),
  risk register, deferred scope (block:add, Tier-Z buildout, community namespaces).
- drift.md: 6 entries incl. the two whitepaper amendments (Zag-everywhere →
  platform-first; literal L0 → contract) and the resolved token statement.

## Hand-off

- Commit artifacts, push, Draft PR to umbrella; PLAN-EVAL is a separate session.
  Plan status PROPOSED until then.

## PLAN-EVAL (2026-06-11, separate session)

- Evaluator read: plan-gate.md, protocol.md, research.md, design.md, plan.md,
  drift.md, archetype-gate-matrix.md, RFC 06, whitepaper.
- External resource aggregation: 9 extract files written to .llm/tmp/docs/
  (style-dictionary, dtcg, zagjs, tailwindcss, fresh, popover-api, base-ui,
  shadcn, react-aria, oklch).
- Decision matrix: D-1…D-13 all CONFIRMED except D-4 (AMEND: +cssVars/+author)
  and D-11 (AMEND: full spec provided in design-appendix.md).
- Fallback decision made: CSS fixed-position fallback, not OddBird polyfill.
- Design deepening written: scaffold spec, registry v2 schema+algorithm,
  token pipeline config, tier matrix, runs 2-3 re-slice.
- Plan amended to v2 LOCKED. drift.md updated with D-7, D-8.
- Verdict: PASS with amendments.
