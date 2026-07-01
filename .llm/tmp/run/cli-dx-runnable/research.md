# Research — CLI `dx`-runnable slice (`@netscript/cli`)

Run-id: `cli-dx-runnable` · Archetype: app-surface package (CLI) · Lane: **WSL Codex source slice**
(touches `packages/cli` source/config + a repo-wide command sweep). Supervisor (Claude) authors
research + plan + dispatches PLAN-EVAL; Codex implements; OpenHands runs IMPL-EVAL.

## Why this slice exists, and when it runs

User directive (2026-06-25): publish packages **one by one in dependency order, CLI LAST**, and
**implement the DX slice BEFORE publishing the CLI** — so the CLI's first published alpha already
ships the `dx`-runnable entry. This slice therefore **gates the final (CLI) publish**, not the other
30 packages.

## Decisive grounding correction (vs the original task framing)

The original follow-up (`docs-root-readme/followups.md`, DX-CLI-DX) and task #110 assumed we would
"declare a `dx`-resolvable **bin**" on `@netscript/cli`. **That is wrong for JSR.** Authoritative
Deno docs (`https://docs.deno.com/runtime/reference/cli/x/`):

> "JSR packages are run by pointing `deno x` at an export that executes when imported, for example
> `deno x jsr:@std/http/file-server`."

So for a **JSR** package, `deno dx` resolves a **module export** (a path in the `exports` map) that
**executes on import**, guarded by `import.meta.main` so the same module is still importable as a
library. There is **no npm-style `bin` field** for JSR `dx` resolution. (The npm `bin` concept only
applies to npm-target packages, e.g. via dnt — not in scope here.)

Deno 2.6 blog (`https://deno.com/blog/v2.6`): `dx` "defaults to `npm:<package_name>` unless
otherwise specified" and runs binaries "from npm and JSR packages"; it downloads to the global
cache, resolves the package's entry point, and executes it. `--allow-all` by default; prompts before
download; errors on local file paths.

## Current `@netscript/cli` state (`packages/cli/deno.json`)

- `exports`: `"."` → `./mod.ts` (LIBRARY: `export * from './src/public/public-api.ts'`,
  `createPublicCli`; **no `import.meta.main`** — confirmed not an executable entry).
- `"./scaffolding"` → `./scaffolding.ts`; `"./testing"` → `./testing.ts`.
- `bin/netscript.ts` IS in `publish.include`, so it ships — but it is **not in the `exports` map**,
  so it is reachable only as the explicit published file path `jsr:@netscript/cli/bin/netscript.ts`
  (works with `deno run`/`deno install` — that is the current shipped command). It is **not a `dx`
  target**, because `dx` resolves declared exports, not arbitrary published file paths.
- `bin/netscript-dev.ts` and `maintainer.ts` are `publish.exclude`d (local-source maintainer entry).

So the gap is precise: **`bin/netscript.ts` (the real CLI entry, with its `import.meta.main` guard)
is published but not exported**, so `deno dx jsr:@netscript/cli …` cannot resolve it today.

## Open empirical questions (docs inconclusive — Codex MUST verify against a real `dx` run)

The Deno docs do **not** state the bare-specifier rule or show arg-forwarding, so these must be
verified empirically (e.g. `deno x jsr:@std/http/file-server`, and a bare-specifier JSR package, to
learn the resolution rule) BEFORE locking the surfaced command form:

1. **Bare vs subpath.** Does `deno x jsr:@netscript/cli` (no subpath) resolve the `.` default export,
   or does `dx` REQUIRE a named subpath (`deno x jsr:@netscript/cli/<name>`)? The only doc example
   uses a subpath. This determines whether the surfaced command can be the short
   `deno dx jsr:@netscript/cli init` or must be `deno dx jsr:@netscript/cli/<name> init`.
2. **Argument forwarding.** Confirm `deno x jsr:@netscript/cli[/sub] init my-app --db postgres`
   forwards `init my-app --db postgres` to the module as `Deno.args` (usage shows
   `deno x [OPTIONS] [SCRIPT_ARG]...`, but no example).

## Design options for the executable export (PLAN to pick one, grounded by Q1/Q2)

- **Option A — make `.` runnable.** Keep `.` → `./mod.ts` as the library but add an
  `import.meta.main` guard that runs the CLI when executed; verify `deno x jsr:@netscript/cli init`
  resolves the default export. Cleanest surfaced form IF bare-specifier resolution works. Risk:
  importing the library must NOT trigger CLI execution — the guard must be airtight, and the doctest
  / library consumers must stay clean.
- **Option B — add a named executable export.** Add e.g. `"./cli"` (or reuse `bin/netscript.ts`
  under a clean export name) → an `import.meta.main`-guarded entry; surfaced form
  `deno dx jsr:@netscript/cli/cli init`. Less pretty but unambiguous and decoupled from the `.`
  library export.
- Pick A if Q1 confirms bare resolution; else B with the shortest sensible subpath.

## Repo-wide command sweep (the second half of the slice)

After the runnable export is verified, replace **every** occurrence of the old
`jsr:@netscript/cli/bin/netscript.ts` install/run command with the verified `deno dx jsr:@netscript/cli …`
form (and keep a `deno install`/no-install fallback where appropriate). Known reference sites to
sweep (grep the whole repo — do not rely on this list being exhaustive):

- `docs/site/cli-reference.md`, `docs/site/tutorials/getting-started.md`,
  `docs/site/tutorials/workspace/*`, `docs/site/explanation/aspire.md`
- root `README.md`, `packages/*/README.md`, `plugins/*/README.md`
- `_plan/*`, `worklog`/run artifacts that show the install command as user-facing copy
- any scaffold-emitted help text / generated docs that print the install command

Leave **no stale `jsr:@netscript/cli/bin/netscript.ts`** user-facing invocation behind. Maintainer
local-source forms (`packages/cli/bin/netscript-dev.ts`, `deno task dev`) are NOT swept — they are
correct as-is.

## Gates

- `deno publish --dry-run` for `@netscript/cli` stays green (the new export must publish cleanly;
  slow-types accepted per the publish decisions).
- Library import path unchanged: `import { createPublicCli } from "jsr:@netscript/cli"` must NOT
  execute the CLI (guard correctness) — covered by `deno check` + a focused test.
- `e2e:cli` scaffold path unaffected (the dev/dirty local entry is untouched).
- Scoped `deno fmt`/`deno lint`/`deno check` on `packages/cli` clean.
- Zero-cast rule holds (only the 2 accepted casts).
- Voice doctrine on any swept docs prose (no banned tokens).

## Constraints / sequencing

- CLI is the **last** package published. The true end-to-end `deno dx jsr:@netscript/cli …` check can
  only run AFTER the CLI publishes; the pre-publish gate is structural (`publish --dry-run` + local
  `deno run` of the new export + empirical `dx` resolution-rule check against an already-published
  reference package). Record the post-publish dx smoke as a close-out verification.
- WSL Codex pushes via SSH + explicit refspec `git push origin HEAD:refs/heads/<branch>`.
