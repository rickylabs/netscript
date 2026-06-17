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

### D-5c1-3 — Slice 16 JSR dry-run required lifting the root fresh-ui exclusion

- Slice: 16
- Plan reference: locked plan requires `deno publish --dry-run` from
  `packages/fresh-ui` as an exit gate.
- Reality: the workspace root `deno.json` excluded `packages/fresh-ui/`, so
  Deno treated every package export and graph module as excluded from publishing
  even when the package-local `publish.include` listed those files.
- Decision: remove only `packages/fresh-ui/` from the root top-level `exclude`
  list and keep the root task-level check/fmt/lint excludes unchanged. The
  package remains governed by its own local gates and publish include/exclude
  set.
- Impact: the JSR publish graph is no longer blocked by stale workspace
  exclusion. Broad root task behavior remains unchanged, and no lock files are
  touched.

### D-5c1-2 — RESOLVED: Slice 10 hydration blocked by Windows MAX_PATH

- Slice: 10 closeout
- Supersedes: the earlier D-5c1-2 conditional no-go entry.
- Root cause: the Fresh Vite builder was not blocked by Zag, Fresh, Vite, Deno,
  or esbuild compatibility. It was blocked by Windows MAX_PATH: the nested
  run-dir `esbuild.exe` path measured 299 characters, so process creation failed
  even though the binary existed on disk.
- Evidence: see
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-10-hydration-evidence.md`
  and generator PR comment
  `https://github.com/rickylabs/netscript/pull/31#issuecomment-4684398933`.
- Decision: short-path re-hosting at `%TEMP%\zag-spike-5c1` proves SSR and
  hydration with `nodeModulesDir: "auto"`, Vite native config loader, and
  `fresh({ serverEntry: "./main.tsx" })`.
- Verdict flip: conditional no-go -> **Tier Z = GO**.
- Impact: no package runtime code is introduced. No `LongPathsEnabled` registry
  change was made or required. Slice 10 remains evidence-only, and Tier-Z
  component shipping remains Run 2+ scope.
