# Charter — plan-process-manager--seed

Owner ask (2026-07-06, verbatim intent, lightly structured). This is the authoritative scope
statement for the run; re-read after any compaction.

## Subject

Build a **Deno-native AND NetScript-native process manager** — the concept of
[pup](https://github.com/hexagon/pup) (unmaintained ~2 years, imperfect code, excellent concept)
and pm2, done right for 2026 — as part of the **Deploy feature** planned in the upcoming releases
(deployment epic #327, bare-metal lane).

## Owner's framing (why a plugin)

Ship it **as a NetScript plugin** (composed with a core package + adapters, at the same quality
bar as `auth` or `workers`):

1. Leverages the vast built-in plugin mechanism surface and adheres to NetScript standards.
2. Stays **optional** — not a separate thing/concept for maintainers to maintain.
3. Composable: core package + adapters with equivalent quality to reference packages
   (auth-core+adapters, workers).
4. (Nice-to-have, not the main goal) For `--no-aspire` scaffolds it is a decent **dev-process
   fallback** (in dev it runs like every other plugin — that is fine).

## Delivery surfaces (the main goal)

- **A) Deno Desktop app** (new in Deno 2.9.0) with a **UI admin console** that surfaces the same
  underlying core mechanism as B.
- **B) Pure CLI** — like pup/pm2 with equivalent feature parity, but **not a dumb copy**: leverage
  2026 state-of-the-art techniques + NetScript standards and everything NetScript ships for free
  (OTEL, API/oRPC, deploy, ...).

## Research directives

- Study pup deeply (concept excellent, code imperfect — extract the concept, not the code).
- Study **Servy** (Windows-only but really efficient; NetScript already ships a servy adapter in
  the CLI bare-metal lane) and any other relevant solutions (pm2 and beyond).
- **Re-use/refactor seams already built or planned**: the shipped bare-metal deploy lane
  (`deploy.targets.*` #337, `OsServicePort`+`SystemdAdapter` #339, `deno compile` artifact #340,
  rollback/health-gate/OTEL/secrets hardening #341) and planned deployment slices — this re-use
  question is explicitly part of the research.

## Final objective

The plugin becomes a **deployment target component**: it covers the **"bare metal" option** of the
deployment epic (#327) — i.e. the process-manager plugin is how NetScript apps are run, supervised,
and administered on bare metal.

## Deliverable of this run

A proper **RFC (epic) with all sub-issues**, planned like recent feature epics (seed-run shape:
discovery corpus → synthesis → design packs → locked plan → adversarial → PLAN-EVAL → owner
ratification → one-shot filing). Drafts only until owner ratifies at Stage H.

## Constraints inherited from the board (run-start snapshot)

- Deployment epic #327 OPEN (milestone 0.0.1-beta.5 at snapshot; beta.5 was cut at baseline
  `317e4b50`, so epic/milestone placement must be re-derived at Stage E).
- Bare-metal tier-1 slices #337–#344 CLOSED (shipped ≤ beta.3). Open deployment scope: #345 (S9
  stable hardening), #346 (S10 k8s/Azure), #348 (S12 one-click convergence), #349/#350 (WATCH),
  desktop Tier-4 #451–#458 (beta.8/stable).
- Prior research corpus: branch `research/deployment-aggregation`
  (`.llm/tmp/run/epic-deployment-aggregation/`: `deployment-architecture-spec.md`,
  `servy-assessment.md` — SERVY verdict = MODERNIZE, `decision-gap-tracker.md`).
