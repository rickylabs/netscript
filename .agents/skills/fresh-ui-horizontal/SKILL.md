---
name: fresh-ui-horizontal
description: Execute @netscript/fresh-ui design-system slices (registry → scaffolded UI page) under Harness v2 — follow the L0/theme/README authority chain and the run's LOCKED slice table; record divergence in drift.md, never improvise.
---

# SKILL: fresh-ui horizontal implementation (registry → scaffolded UI page)

Audience: a follower model (e.g. GPT 5.5) executing design-system slices
for `@netscript/fresh-ui` under Harness v2. Follow these rules literally;
when reality diverges, append to the run's `drift.md` — never improvise
silently.

## Authority chain

1. `l0-conventions.md` (alongside this skill) — the L0 contract (layers,
   attributes, token rule, motion rule, copy fidelity).
2. `theme-authoring.md` (alongside this skill) — the theme contract.
3. `packages/fresh-ui/README.md` — surface, catalog, validation commands.
4. The LOCKED slice table in the run's `plan.md` — never rescope a locked
   slice; out-of-scope findings become drift entries, not work.

## The horizontal loop (one component, end to end)

Each horizontal slice carries a component from registry source to a
validated page in the consuming app. Stages, in order — no stage may be
skipped:

1. **Registry source** (framework worktree, `packages/fresh-ui/registry/`)
   - L2 component: `components/ui/<name>.tsx` + `<name>.css`. May import
     L0/L1 and `lib/` — NEVER another L2 file.
   - CSS uses only `--ns-*` variables and `color-mix()` over them; class
     vocabulary `ns-<block>`, `ns-<block>__<part>`, `ns-<block>--<mod>`.
   - Every animation declares reduced-motion behavior (motion rule).
   - Register the item in `registry/manifest.ts` (kind, layer, files,
     dependencies, collections).
2. **Package gates** (from `packages/fresh-ui/`):
   `deno task check` · `deno task test` · and from the workspace root
   `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` and
   `...check-ds-color-utilities.ts`. New gates get a negative test:
   inject a violation, prove FAIL + exit 1, revert, prove PASS.
3. **Copy to consumer** (repo-genesis worktree): registry tsx →
   `apps/playground/components/ui/`, css → `apps/playground/assets/ui/`,
   islands → `apps/playground/islands/ui/` (rewrite relative import depth
   `../lib/` → `../../lib/`; that is the ONLY allowed content change).
   Verify with `diff --strip-trailing-cr` (checkouts are CRLF; bytes
   differ legitimately). Also sync the framework package copy at
   repo-genesis `packages/fresh-ui/`.
4. **Page integration**: add the component to the gallery route
   `apps/playground/routes/(design)/design/components.tsx` (every
   variant/size/state), and to the relevant app page if the slice says so.
   Import CSS via the styles aggregator, not inline.
5. **Browser gate on the REAL route** (Playwright, dev server from
   `apps/playground`, port printed by vite): SSR 200 + zero console
   errors; theme flip via `button[aria-label="Switch to dark mode"]` both
   ways with computed-style assertions; 390×844 viewport with
   `scrollWidth <= innerWidth` and per-element offender scan;
   `page.emulateMedia({ reducedMotion: 'reduce' })` if the component
   animates.
6. **Tests**: unit tests beside the runtime/lib code; if the public
   surface changed, extend `consumer-render.test.tsx` with a
   consumer-shaped JSX tree.

## Commit & evidence discipline (Harness v2)

- One slice = one impl commit per repo + bookkeeping commit. NEVER amend;
  follow-ups are new commits, hash-recorded.
- Trailer on every commit: `Co-Authored-By: <model attribution line>`.
- Append (never rewrite) `worklog.md`, `drift.md` in `.llm/runs/<run-id>/`.
- Per-slice PR comment with a Gate(s) / Changed / Drift / Commits table — the
  draft-PR commit list + per-slice PR comments are the commit trail (no
  `commits.md`).
- Push both repos after every slice.

## Environment gotchas (verified, will bite you)

- Root `deno.lock` gets mutated by the dev server: restore with
  `git checkout -- deno.lock` before staging. NEVER delete locks or run
  `deno cache --reload`. `git add -A packages/fresh-ui` stages the
  untracked package `deno.lock` — unstage it.
- Targeted `deno check` needs `--unstable-kv`; package tasks use
  `--config deno.gates.json --no-lock`.
- fmt: root config excludes the package; use
  `deno fmt --no-config --indent-width 2 --line-width 100 --single-quote`
  for package CSS/md until the config is unified (doctrine plan C-7).
- rtk shell proxy: `rg` not on PATH, compound `find` predicates fail,
  `cat`-based diffs can error misleadingly — use plain Bash, absolute
  paths, `cmp -s` / `diff --strip-trailing-cr`.
- Token vocabulary: it is `--ns-muted-fg` (NOT `--ns-fg-muted`). Check
  names against `registry/theme/tokens.css` before writing CSS.
- Bash cwd resets to the framework worktree after every command; always
  `cd` with absolute paths.
- `gh` CLI unavailable: use the GitHub MCP `add_issue_comment` for PR
  comments. Raw `git` (not rtk) for verdict-bearing reads.

## Hard prohibitions

- No self-evaluation, no merging, no editing locked plan tables.
- No raw colors / stock Tailwind palette utilities in components (gates
  enforce; allow markers `ds-allow-raw-color` / `ds-allow-color-utility`
  only with a documented platform reason).
- No L2→L2 imports; shared behavior goes down (L0/L1), composition up (L3).
- No new dependencies without checking Web Platform / `@std/*` first.
