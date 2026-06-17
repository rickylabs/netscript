# Context pack — Sub-wave 5c: NetScript UI end product (for PLAN-EVAL and implementation)

## Current state

- Branch `feat/package-quality-wave5-apps-5c-fresh-ui` off umbrella tip `19cae06`,
  worktree `.worktrees/wave5-apps-5c-fresh-ui`. Research + design + PROPOSED plan
  only — zero implementation, zero source changes outside the run dir.
- 5b (sdk) implementation is running concurrently in its own session/branch (PR
  #29, plan LOCKED). 5c run 3 hard-gates on 5b merge; everything else is parallel.

## What this session did

- Rescope absorbed (drift D-1): plan the intended end product (RFC 06 + whitepaper),
  not a quality pass. Read both specs in full; inventoried fresh-ui (5,783 LOC, 33
  registry items, 7 hand-rolled-but-Zag-shaped machines, 211L token seed),
  playground (2,264L CSS design system, ~20 components via deep relative imports),
  CLI templates (definePage/defer/sdk wired, but design system forked as 570L
  subset + 2 component forks), legacy generated app (Fresh-default quality —
  the user's "ugly/barely functional" evidence).
- External research with sources (research.md §3): Base UI 1.0 contract, shadcn CLI
  3.0 registry schema/namespaces, DTCG 2025.10 stable + SD v5, official
  `@zag-js/preact`, Popover API/anchor positioning/`@starting-style` Baseline
  status, Tailwind v4 @theme practice.

## Where things are

- Run dir `.llm/tmp/run/feat-package-quality-wave5-apps--5c-fresh-ui/`:
  research.md, design.md, plan.md (PROPOSED), worklog.md, drift.md (6 entries),
  commits.md, this file.
- Specs: RFC 06 at `.resources/rfcs/frontend/06-ui-architecture-and-composition-model.md`
  (in test-app repo), whitepaper at `.resources/rfcs/drafts/ui/NETSCRIPT-UI-WHITEPAPER.md`.
- Playground lives in the test-app workspace (`output/test-app/apps/playground`),
  NOT this framework repo — run 2 crosses that boundary via genesis sync.

## Plan in one paragraph

One distribution chain: DTCG 2025.10 token source → Style Dictionary v5 → three
checked-in generated artifacts (tokens.css, theme-bridge.css, tokens.json; drift
gate) → registry v2 (shadcn-grade schema, per-item CSS, JSR-package distribution) →
`netscript ui:init/ui:add` → apps. Playground and the generated starter become two
consumers of the same registry (no forks, no deep relative imports). Interactivity
is platform-first (native dialog/details/Popover API/anchor positioning) behind the
existing Zag-shaped prop-getter contract, with official `@zag-js/preact` approved
for machine-class components after a spike. Three runs: 5c1 foundation (16 slices),
5c2 design system + playground convergence + /design styleguide, 5c3 scaffold
revamp (starter app as playground sibling; gated on 5b merge).

## Review hot-spots (where to push back)

- D-2 platform-first vs whitepaper Zag-everywhere: is the two-engine surface (P+Z)
  worth it vs all-Zag simplicity? (Counter: platform tiers are 0kb and the contract
  hides the difference.)
- D-12 single package: whitepaper mandates ui-primitives split; we defer. Check the
  rationale holds (single consumer framework).
- Run 1 slice 12 (popover → Popover API + anchor positioning): R2 Baseline risk —
  fallback strategy decided in-slice; evaluator should demand concrete fallback
  evidence.
- Per-item CSS extraction (slice 8) before the design-system reconciliation (run 2):
  ordering means some classes move twice. Accepted for unblocking ui:add; verify.
- tokens phase 2 (OKLCH) inside run 1: could be deferred to run 2 if visual review
  burden is high.

## Hard rules in force

- Generator ≠ PLAN-EVAL ≠ IMPL-EVAL (separate sessions). Plan locks only via
  PLAN-EVAL, then 5b-style lock commit.
- Never delete lock files/caches; never `deno cache --reload` without approval.
- Targeted `deno check` needs `--unstable-kv`; verdicts from raw deno/git, not rtk
  (netscript-tools doctrine). jsr dry-run from package dir.
- Record every drift in this run's drift.md; commits.md hash-record pattern (record
  hashes in follow-up commits, never amend).
- Do NOT implement RFC 14 unified mode (protect seams only).
