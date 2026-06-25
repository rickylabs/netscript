# Plan — CLI `dx`-runnable slice (`@netscript/cli`)

Run-id: `cli-dx-runnable` · Branch: `feat/cli-dx-runnable` · Lane: **WSL Codex source slice**
Archetype: **ARCHETYPE-? app-surface (CLI)** + **SCOPE-docs overlay** (the slice also sweeps
user-facing docs/READMEs). Grounding: `./research.md`.

## Scope (SCOPE)

Make `@netscript/cli` runnable via Deno 2.6 `deno dx`, then sweep every user-facing reference to the
old install/run command to the verified `dx` form.

**In scope:** `packages/cli/deno.json` (exports + publish set), the executable entry it points at
(reuse `bin/netscript.ts` or a thin re-export with an `import.meta.main` guard), a focused guard
test, and the repo-wide command sweep (docs/site, READMEs, tutorials, aspire.md, user-facing run
artifacts). **Out of scope:** any CLI behavior change, new subcommands, the publish workflow/order
(#111), the maintainer local-source entries (`bin/netscript-dev.ts`, `maintainer.ts`, `deno task
dev`), and the npm/dnt `bin` concept (irrelevant to JSR `dx`).

## Locked decisions

- **D1 — Mechanism: executable EXPORT, not a `bin` field.** JSR `dx` resolves a declared module
  export that executes on import (guarded by `import.meta.main`). The slice adds/repoints an
  `exports` entry to the CLI's runnable entry. (`bin` fields are npm-only and do not apply.)
- **D2 — Export shape decided empirically, within two allowed options.** Codex MUST first verify the
  `dx` resolution rule against an already-published reference package (e.g.
  `deno x jsr:@std/http/file-server`, plus a bare-specifier probe) and confirm arg-forwarding, THEN
  choose:
  - **A (preferred):** make the `.` default export runnable (keep the `createPublicCli` library
    surface, add an airtight `import.meta.main` guard so importing the library never executes the
    CLI) **iff** bare `deno dx jsr:@netscript/cli init` resolves the default export.
  - **B (fallback):** add a named executable export (shortest sensible name, e.g. `"./cli"`) →
    surfaced form `deno dx jsr:@netscript/cli/cli init`.
  Record the empirical result + the chosen option in `worklog.md`. Do not surface a command form
  that was not actually run.
- **D3 — Library import must stay pure.** `import { createPublicCli } from "jsr:@netscript/cli"`
  (and the existing `.`/`./scaffolding`/`./testing` consumers) must not trigger CLI execution. A
  focused test asserts importing the module is side-effect-free.
- **D4 — Sweep is exhaustive + verified-form-only.** Replace EVERY user-facing
  `jsr:@netscript/cli/bin/netscript.ts` install/run command with the verified `deno dx
  jsr:@netscript/cli …` form. Keep a `deno install`/no-install fallback line where the page already
  offers one (mirror the npx/bunx fallback pattern in the package READMEs). Grep the whole repo;
  the research site list is a starting point, not a whitelist. Maintainer local-source forms are NOT
  swept. Voice doctrine applies to any reworded prose (no banned tokens).
- **D5 — Pre-publish gate is structural; dx end-to-end is a post-publish close-out.** Because the CLI
  publishes LAST (#111), the true `deno dx jsr:@netscript/cli …` smoke can only run after publish.
  The merge gate is: `deno publish --dry-run` clean for the new export, local `deno run` of the
  export works, the empirical `dx` resolution-rule check passed against a reference package, and the
  guard test is green. The post-publish dx smoke is recorded as a close-out verification on #111.

## Gates (archetype + publish)

- `deno publish --dry-run --allow-dirty --no-check=remote` for `@netscript/cli` → clean (slow types
  accepted per the publish decisions).
- Scoped `deno check --unstable-kv` over the CLI entry set (incl. the new export) → clean.
- Scoped `deno lint` + `deno fmt --check` on `packages/cli` (source `ts` only) → clean.
- Guard test (import is side-effect-free) → green.
- `deno task e2e:cli run scaffold.runtime` NOT required for this slice (no scaffold/runtime change);
  `e2e:cli` dev path untouched. Note this in worklog rather than running the expensive gate.
- Zero-cast rule (only the 2 accepted casts) holds.
- Sweep verification: `grep -rn "jsr:@netscript/cli/bin/netscript.ts"` returns only intended
  non-user-facing hits (or zero) after the sweep; record the residual set + why each is acceptable.

## Debt / follow-ups

- If Option B (named subpath) is forced because bare-specifier resolution does not work, record an
  arch-debt note that the surfaced command is `…/cli init` (slightly longer than the marketing-ideal
  bare form) so a future Deno `dx` improvement can shorten it.
- Post-publish dx smoke (after CLI publishes last) tracked on #111 close-out.

## Implementation slices (Codex)

1. **S1 — runnable export.** Verify `dx` resolution rule empirically; choose A/B; edit
   `packages/cli/deno.json` (`exports` + `publish.include` if a new file is introduced); add the
   `import.meta.main` guard + (if needed) a thin entry; add the guard test. Gates: dry-run, check,
   lint, fmt, test. Commit + push (explicit refspec) + PR comment.
2. **S2 — repo-wide command sweep.** Replace every user-facing old command with the verified `dx`
   form; keep fallbacks; voice-clean. Gate: grep residual check + fmt on touched docs. Commit + push
   + PR comment.

(Two commits, two gates; one PR `feat/cli-dx-runnable`.)

## Pipeline

1. **PLAN-EVAL** — OpenHands `openrouter/minimax/minimax-m3`, separate session. Hard gate; no Codex
   slice before PASS.
2. **Implement** — WSL Codex daemon-attached, S1 then S2, commit/push/comment per slice.
3. **IMPL-EVAL** — OpenHands `openrouter/qwen/qwen3.7-max`, separate session.
4. **Merge** `feat/cli-dx-runnable` → main (CLI now `dx`-runnable). THEN proceed to #111 ordered
   publish with CLI last; run the post-publish `dx` smoke as #111 close-out.
