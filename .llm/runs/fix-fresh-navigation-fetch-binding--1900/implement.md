use harness

# P1 bounded fix — bind the captured platform fetch (#1900)

## SKILL

- `netscript-harness` — slice discipline, worklog/drift, gate evidence.
- `deno-fresh` — Fresh 2.3.3 partial navigation semantics.
- `netscript-doctrine` — `packages/fresh` (Archetype 4) public surface.

## The defect — already diagnosed, do not re-derive from scratch

`packages/fresh/src/runtime/navigation/coordinator.ts:117` captures the platform fetch **unbound**:

```ts
this.originalFetch = platform.getFetch();
```

and invokes it as a coordinator method at **236** and **246**:

```ts
return await this.originalFetch(input, init);
const response = await this.originalFetch(safeInput, safeInit);
```

`window.fetch` requires `this === window`. Detached, a real browser throws
`TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation`. This is **live on `main`** and
published — every consumer hits it on the first partial navigation. Hosted evidence: `fresh-browser`
gate run `33542380097`, `FAILED | 2 passed | 1 failed`.

## The fix

Bind the captured fetch to its platform receiver at capture time (or invoke it with that receiver).
Keep every existing semantic **unchanged** — in particular the load-bearing one:

**Drain, never abort.** Superseded responses are read to EOF and discarded; disposal awaits EOF. There
must remain **zero** `.abort(`, `AbortController`, `.cancel(` in production navigation code. If your
change touches the transport path, re-verify that property explicitly.

## The test that must exist afterwards

The reason every gate missed this is that unit coverage injects a **plain function** as `getFetch()`,
which has no receiver requirement. Add coverage that **fails when the fetch is invoked detached** —
e.g. a double that throws unless called with the expected receiver. Without it, the next refactor
reintroduces the bug and the suite stays green.

That test is the deliverable as much as the one-line binding.

## Bounded scope — expect ~2 files

`coordinator.ts` plus its test. Do not restructure the coordinator, do not touch
`keyed-partial.tsx`/`types.ts`/`mod.ts`, and do not change the public surface: the entrypoint's 7
exported symbols (2 values, 5 types) must be unchanged, or the MCP export corpus and the reference page
both drift.

## Gates

Focused `packages/fresh` structured check/test/lint/fmt. `deno.lock` must not move. **Do not run
Chromium, Docker, Aspire, or `e2e:cli` locally** — this NAS lane has no browser and a prior worker
leaked three containers doing that. The hosted `fresh-browser` proof is supervisor-owned.

## PR contract

Full metadata **in the same action as opening**: `orchestrator:features`, `status:impl`, `type:fix`,
`priority:p1`, `wave:v1`, `area:fresh`, milestone **0.0.7**. Use `Closes #1900`.

Note in the body that **#1895** (the #1590 Slice-2 browser proof) is the PR that caught this and will
rebase onto this fix; do not modify #1895 or its fixtures.

Keep `worklog.md` and `drift.md` under `.llm/runs/fix-fresh-navigation-fetch-binding--1900/`.
