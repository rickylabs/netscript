use harness

# Bounded repair — registry compiler must stay in parity with the JobConfig contract (#1875)

## SKILL

- `netscript-harness` — slice discipline, worklog/drift, gate evidence.
- `netscript-doctrine` — `plugins/workers` archetype and public surface.

## The defect class, precisely

`plugins/workers/src/cli/registry-compiler.ts` authors the generated registry module as **string
literals**. Nothing ties those emitted keys to the normalized `JobConfig` contract that
`packages/plugin-workers-core/src/config/job-config.ts` owns. So a field added to `JobConfig` can be
normalized by core and then **silently dropped at emit time**, with every existing test still green.

This is a *silent* failure, which is why it needs a gate rather than a comment: the generated registry
looks well-formed, the project starts, and the policy the user declared simply is not there.

## The one rule

**Do not duplicate validation.** The schema stays the single source of truth. This slice adds a
**parity assertion**, not a second constraint set — no re-declared `min`/`max`/`nonnegative`/defaults
anywhere in `plugins/workers`.

## What to build

A parity test derived from the schema's **own keys** — read them from the Zod schema rather than
hand-listing them — that fails when a field the normalized contract carries is not emitted by the
compiler. Adding a field to `JobConfig` must then force the compiler to keep up, and the test must
fail loudly if it does not.

Verify the direction that matters: schema → emitted output. A test that only checks today's four
fields by name is exactly the hand-maintained list this issue exists to eliminate.

## Bounded scope — expect ~2 files

`plugins/workers/src/cli/registry-compiler.ts` (only if an emit gap is found) plus a test. If the
parity check reveals a **currently** dropped field, fix it and say so prominently in the worklog —
that would be a live defect, not a hypothetical.

## Coordination

Base is current `main` `82a2527e2`. **PR #1872 is unmerged and owns
`generate-runtime-registries.ts` and `runtime-registry-generator.ts` — do not touch those two files.**
`registry-compiler.ts` is not in its touch set, so this work is disjoint. **#1874** is a separate
in-flight repair to `official-sample-configuration.ts`; do not touch that file either.

## Gates

Focused plugin check/test/lint/fmt via the structured wrappers; `deno.lock` must not move. **Do not
run any local runtime, Aspire, Docker, or `e2e:cli` gate.**

## PR contract

Full metadata in the same action as opening: `orchestrator:features`, `status:impl`, `type:fix`,
`priority:p2`, `wave:v1`, `area:workers`, milestone **0.0.7**. Use `Closes #1875`.

Keep `worklog.md` and `drift.md` under `.llm/runs/fix-workers-registry-compiler-parity--1875/`.
