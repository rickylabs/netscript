use harness

# Slice brief — #1548 browser stream resolver cannot see Aspire VITE service references

**Codex · GPT-5.6 Sol · medium** (`normal_implementation`). The plan has **passed PLAN-EVAL with
conditions**; implement it, do not re-decide it.

| Field | Value |
| --- | --- |
| Issue | #1548 (`priority:p1`) |
| PR | **#1559** (already open, draft, at plan phase — commit onto its branch) |
| Worktree | `/home/codex/repos/ns006-1548` |
| Branch | `fix/1548-vite-browser-stream-discovery` |
| Run dir | `.llm/runs/release-0.0.6-features--orchestration/` |

**Read first:** `slices/plan-1548.md` — **including the "Amendments after PLAN-EVAL" section at the
bottom, which is binding** — and `slices/research-1548.md`. If they are not on your branch, read them
with `git show chore/release-0.0.6-runtime-reopen:<path>`.

## SKILL

- `netscript-doctrine` — `packages/plugin-streams-core` is framework code; `mod.ts` is published
  surface.
- `deno-fresh` — Fresh/Vite build and `import.meta.env` substitution.
- `netscript-tools`, `netscript-pr`, `netscript-harness`.

## The defect

`packages/plugin-streams-core/src/application/stream-url-resolver.ts` cannot see
`VITE_services__streams__http__0` in a browser bundle, for **two** independent reasons:

1. `import.meta` is passed **as a value** into `readImportMetaEnvironment` (`:60`), reached through a
   parameter binding (`:77-78`) — the literal `import.meta.env.VITE_…` never appears in source.
2. Both keys are read by **computed index** (`:64,:68`).

This repo's own Vite plugin substitutes by emitting `define` entries keyed exactly as
`` `import.meta.env.${target}` `` (`packages/fresh/src/application/vite/vite.ts:195,311-335`) — a
textual static-expression mechanism that by construction cannot reach either shape.

## LOCKED decisions

- **D1** — read the two browser keys as **literal static member expressions** inline:
  `import.meta.env.VITE_services__streams__http__0` and `import.meta.env.VITE_STREAMS_URL`. No value
  passing of `import.meta`, no computed index for these two. Safe because the keys are fully known at
  compile time (`STREAMS_RESOURCE_NAME`, `domain/constants.ts:5`).
- **D2** — split the **pure, injectable** lookup from the impure reader. **A1 (binding):** the SDK
  (`packages/sdk/src/discovery/browser-env.ts`) is a **structural** precedent only — it carries the
  *same* substitutability defect. Borrow its shape; do **not** describe it, in code comments or the
  PR, as having already solved this.
- **D3** — **no published-surface growth**: the pure function stays internal, not added to `mod.ts`
  (which exports only `buildStreamUrl`, `getStreamsAuth`, `getStreamsUrl`). Tests import by src path.
- **D4** — precedence unchanged: `DURABLE_STREAMS_URL` → `services__streams__http__0` → browser
  `VITE_*` (full key before shorthand) → throw. Change **how** the browser branch reads, not what wins.
- **D5** — **no** Vite `transform` hook and **no** scaffold-template change in this slice.
- **D6** — you may narrow the silent `catch` (`:59,69-71`) so a genuine throw is distinguishable from
  "absent", but it must not change which value wins. Drop it if it grows.
- **A3** — `plugin-streams-core/deno.json` depends only on `@netscript/telemetry` and `@std/assert`;
  there is no dependency on `packages/fresh`, so no cycle is introduced and the
  `createNetScriptStreamDB` call site needs no change.

## Required tests

1. **Precedence on the pure lookup**, injected bag: full key wins over shorthand; shorthand used when
   the full key is absent; neither → `undefined`. Mirrors
   `packages/sdk/tests/discovery/env-ordering_test.ts:24,41,56`.
2. **Source-shape guard** — assert the module contains the literal substitutable expressions and that
   the browser path does **not** pass `import.meta` across a function boundary or index `env` by a
   computed key. This is deliberately a shape assertion: **the defect is the shape**, and without this
   guard a refactor back to a helper reintroduces the bug silently with all behavioural tests green.
3. **Resolution through `getStreamsUrl()`** proving the browser branch is reachable and correctly
   ordered.

There are currently **no unit tests at all** for this file's URL resolution — the package's nine test
files never reference `getStreamsUrl`. You are adding the first.

**Do not claim any test proves Vite substitution.** It does not; test 2 is an explicit surrogate.
Say so in the PR.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-streams-core --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/plugin-streams-core --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/plugin-streams-core --ext ts,tsx
deno task --cwd packages/plugin-streams-core test
deno task doc:lint --root packages/plugin-streams-core --pretty
```

**A2 (binding):** `arch:check` at `deno.json:156` **confirmed does not include**
`packages/plugin-streams-core`. So run `deno task quality:gate` **and** an **explicit target scan over
`packages/plugin-streams-core/src`**, and state in the PR that the package-quality verdict rests on
the explicit scan, not the repo gate. Do not report a green repo gate as proof for this package.

Use `deno task --cwd <pkg> test`, never a bare `deno test <path>` (omits `--allow-env`, exits 1 on
`NotCapable`). No `e2e:cli` — this slice does not touch scaffold output.

## Commit trail

PR **#1559 already exists** as a draft at plan phase. Commit onto its branch, push by explicit
refspec, and post a `[PHASE: IMPL]` comment with commit hash and pasted real gate output. Update the
PR body's Definition of Done to match what shipped. `Closes #1548` is already in its Scope. Move the
label from `status:plan-eval` to `status:impl` when you push.

## Reporting contract

Report what changed, the exact test names and what each catches, verbatim gate output, and anything
you could not verify. **Do not flip the PR to ready** — that fires the automatic IMPL-EVAL and is the
orchestrator's trigger to pull. Merge authority is the orchestrator's.
