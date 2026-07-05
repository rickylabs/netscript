# Authoring constraint checklist — for the per-feature Fable-supervisor briefs

The owner's "one Fable supervisor per feature" intent is realized (per `specs/topic-D-positioning-
docs.md` §2 and the project's Claude Workflow Policy) as: **Opus docs authoring workflow, one
supervisor per feature**, coordinated by Fable, **OpenHands-validated per feature** (generator ≠
certifier), **never Fable in the fan-out**. Every per-feature authoring brief Fable writes should
carry this checklist verbatim or by reference.

## Voice / positioning (hard constraints — `specs/01-ratified-decisions.md`)

- NetScript competes on **AI-agent build-efficiency** (fewer turns to a production-grade backend),
  **not** runtime throughput. No throughput/performance benchmark claims, direct or indirect
  ("X% faster", ops/sec charts — see the Hono landmine in `research/D-positioning/
  competitor-teardown.md` §3.1).
- **No unshipped-capability claims.** Every capability described as present must be traceable to
  shipped code (`deno doc <module>` is the authority, never research prose or `_plan/` copy).
- **Ban "honesty/candor" framing.** No "honest comparison," "let's be honest," "candidly," etc. — use
  one clean factual callout instead. This rule is violated in several **unshipped** `_plan/` planning
  docs (`_plan/research/market-fit.md`, `_plan/08-decisions-locked.md` Q4/Q5,
  `_plan/07-questions-for-user.md`) — do not lift phrasing from those files without rewriting it.
- **No absolute/superlative claims** ("the world's best," "unbreakable," "as reliable as gravity" —
  see Temporal/NestJS/Trigger.dev landmines in the competitor research). Comparisons must be factual,
  falsifiable, and current.
- **No fabricated social proof or measured percentages.** Do not invent case-study logos or a
  Supabase-style "58%→71%" number without NetScript's own measured data (the eventual source is
  `netscript-bench`, issue #302 — a post-stable fast-follow, not available yet).
- **Plugin-thinness / core-centralization law** still applies to any docs copy describing plugin
  internals: convention-bearing primitives live in core, plugins stay thin — don't imply otherwise
  for marketing effect.
- **Wrap, don't reinvent framing:** `@netscript/aspire` is a **TypeScript AppHost inspection/
  diagnostics package** (`inspectAspire`), NOT the .NET Aspire orchestrator runtime itself — do not
  conflate in any feature story (see `explanation/aspire.md`'s existing disambiguation for the
  correct framing).

## Structural constraints

- **Diátaxis stays the organizing principle** even though the per-feature "story" pages are a
  deliberate Capability-Hub-style departure from pure reference — every rewritten feature page must
  still cross-link (not duplicate) into `reference/`, `how-to/`, and `tutorials/`.
- **Resolve the `capabilities/` vs. 9-pillar-folder IA question before writing** (see
  `analysis/D-positioning/current-docs-audit.md` §3) — know which zone a rewritten feature page
  actually lands in and whether it will be reachable from nav/homepage.
- **Every API/adapter/symbol claim needs an accuracy-worklog line** (`docs/site/_plan/worklog/
  <page>.md` pattern, `.llm/tools/docs/api-cite.ts` gate) — claim, verification command, found?/note.
- Lume/Vento landmines apply to any `.vto` file touched: `function` keyword in a comp-tag argument
  breaks the build; `deno fmt` reflows/splits `{{ comp }}` tags (docs excludes `.md/.mdx/.vto` from
  fmt); verify via `check:links` + a real build, not just a tag-balance scan.

## Per-feature brief must specify (from `specs/topic-D-positioning-docs.md` §7)

1. Elevator pitch (see `context/D-positioning/elevator-pitch-raw-material.md` for real raw material
   per feature, sourced from eis-chat's actual usage + the master positioning-brief pitch).
2. Story spine (a concrete failure mode or real workflow the feature solves — model on
   `tutorials/storefront/04-checkout-saga.md`, not a feature-bullet list).
3. Comparison angle (one sharpest competitor per feature — see the mapping table in
   `research/D-positioning/competitor-teardown.md` §2; do not invent a new competitor angle without
   checking that table first).
4. Acceptance criteria + beta.7 milestone.
5. OpenHands validation brief (separate from the authoring brief — the Opus workflow is the
   generator only, it does not self-certify).

## Known landmines specific to this docs tree (do not reintroduce)

- `explanation/plugin-system.md` currently contradicts `explanation/auth-model.md` and
  `explanation/observability.md` about whether an auth audit/telemetry surface exists — fix if this
  page is touched by any per-feature rewrite (plugin-system/auth/observability all bear on it).
- `concepts.vto` still says "Still alpha... targeting late 2026" while the rest of the site says
  "beta" — fix if touched.
- `docs/site/_plan/00-README.md`'s problem statement is stale (describes a much barer site than
  exists today) — do not use it as a gap baseline; use `analysis/D-positioning/
  current-docs-audit.md` instead.
