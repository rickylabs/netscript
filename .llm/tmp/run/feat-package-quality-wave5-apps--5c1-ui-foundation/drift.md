# Drift log — Run 5c1 Composition foundation

Append-only drift from locked v2 plan. Record any implementation divergence
before the related commit.

## Existing Bound Drift From Parent Plan

- Parent D-7: anchor positioning fallback is CSS `position: fixed` + `inset`;
  OddBird polyfill is rejected.
- Parent D-8: registry schema v2 includes `cssVars?` and `author?`.

## Run-local Drift

### D-5c1-1 — Slice 10 Fresh/Zag spike hosted in run-local scratch app

- Slice: 10
- Plan reference: locked plan asks for a Zag x Fresh combobox spike in a
  playground island, with the user caveat allowing a scratch app under
  `.llm/tmp/` when that is the minimal reachable Fresh harness from this
  framework worktree.
- Reality: the playground app lives outside this framework worktree, and this
  worktree has no local Fresh app harness.
- Decision: host the throwaway combobox spike at
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-10-zag-fresh-spike/`
  and commit only the scratch app plus SSR/hydration evidence under the run
  directory. No package or shipped app runtime code is added.
- Impact: no consumer-facing drift; the evidence validates `npm:@zag-js/preact`
  with Fresh 2 SSR before any Tier-Z package work, while hydration remains
  governed by D-5c1-2.

### D-5c1-2 — Slice 10 hydration check blocked by Fresh Vite builder startup

- Slice: 10
- Plan reference: locked plan asks for SSR + hydration evidence for a Zag x
  Fresh combobox island.
- Reality: the scratch Fresh 2 app type-checks with `@zag-js/preact` and direct
  Fresh SSR returns 200 with combobox markup, but the builder-backed Vite dev
  server fails before serving a hydrated page. The reproducible blocker is
  `TypeError: Cannot read properties of undefined (reading
  'unref')` inside
  `esbuild@0.27.7` when Vite loads `vite.config.ts` under Deno on this Windows
  worktree.
- Decision: treat Slice 10 as a conditional no-go for shipping Tier Z
  composition. Zag Preact API adoption can proceed only behind a follow-up
  builder-backed hydration proof in a reachable Fresh app environment.
- Impact: no package runtime code is introduced from the spike. Run 1 continues
  with the recorded no-go evidence because the slice deliverable is evidence,
  not shipped Tier Z code.
