use harness

# #1590 Slice 2 — deterministic Fresh/Vite A → B → A browser proof

## SKILL

- `netscript-harness` — slice discipline, worklog/drift, gate evidence.
- `deno-fresh` — Fresh 2.3.3 partial navigation, Vite dev server, island conventions.
- `netscript-doctrine` — `packages/fresh` (Archetype 4) boundaries.

## Standing plan — already PLAN-EVAL PASSed, do not redesign

Slice 2 is specified on `main` at `.llm/runs/fix-fresh-partial-nav--1590/plan.md` (section
**"Slice 2 — deterministic Fresh/Vite A → B → A browser proof"**). **Read it before writing code.**
Base is `main` `102ef8a10`, which contains **Slice 1 (#1848, merged)** — the
`@netscript/fresh/navigation` surface you are proving.

## What this slice proves — and why it is the whole point

Slice 1 shipped the coordinator with unit and type coverage, but **the browser acceptance condition
is explicitly unproven until this slice**. You prove the Slice-1 behaviour survives the *installed*
Fresh 2.3.3 client and a *real* Vite dev server under Chromium:

1. **A → B → A last-intent-wins ordering.** Navigate A → B, then back to A before B settles; the
   final rendered state must be A. A newer page generation must invalidate older page *and* region
   application, and a stale `replaceState` must be suppressed.
2. **Drain without overlay.** A superseded partial response must be read to EOF and discarded with
   **no Vite error overlay**. This is the load-bearing property: physically aborting a stale partial
   is what surfaces the unhandled `AbortSignal` overlay that #1590 exists to eliminate. Assert the
   overlay's *absence* explicitly — a test that only checks the final HTML would pass even if the
   overlay appeared.
3. **Dynamic-name remounting** through native `key={name}` boundaries, including the colon-normalized
   marker case.

## File ceiling: 6, and **no product source file**

- `packages/fresh/tests/form-navigation_browser.ts` — the compact evidence/assertion scenario
- `packages/fresh/tests/fixtures/partial-navigation-browser/app.tsx` — delayed page/region routes and
  dynamic keyed boundaries
- `packages/fresh/tests/fixtures/partial-navigation-browser/client.ts` — explicit coordinator install
- `packages/fresh/tests/fixtures/partial-navigation-browser/main.ts` — Fresh fixture entrypoint
- `packages/fresh/tests/fixtures/partial-navigation-browser/vite.config.ts` — real Fresh Vite boot
- `packages/fresh/deno.json` **only** if the existing explicit browser task needs adjustment;
  otherwise leave this slot unused

**If you find yourself editing a file under `packages/fresh/src/`, stop.** Slice 1's implementation is
merged and evaluated; a proof slice that changes the thing it proves is not a proof. Record the reason
in `drift.md` and surface it to the supervisor instead.

The delays in the fixture must be **deterministic**, not racy sleeps tuned until green — a flaky
browser gate is worse than none.

## Gates

Focused hosted `fresh-browser` durable gate; repeat the Slice-1 package, fitness, JSR, and lock gates
at this head; `deno.lock` must not move. **No workflow or classifier edit is planned — the hosted lane
already triggers for `packages/fresh/**`.**

**Do not run Chromium, Docker, Aspire, or `deno task e2e:cli` locally.** This NAS lane has no browser
and a prior worker leaked three containers running an out-of-brief local runtime gate. The hosted lane
owns execution; the supervisor triggers it.

## PR contract

Full metadata **in the same action as opening**: `orchestrator:features`, `status:impl`, `type:test`,
`priority:p1`, `wave:v1`, `area:fresh`, milestone **0.0.7**.

This slice completes #1590's remaining acceptance, so it **may** carry `Closes #1590` — but only after
the hosted browser gate is green at the exact head. Open with `Refs #1590` and no closing keyword; the
supervisor adds the keyword once the hosted proof passes. State that explicitly in the body.

Keep `worklog.md` and `drift.md` under `.llm/runs/test-fresh-partial-nav-browser--1590-s2/`.
