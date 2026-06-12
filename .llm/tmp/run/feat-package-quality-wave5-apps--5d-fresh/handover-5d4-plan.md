# Handover prompt — 5d4 PLAN phase (copy-paste below this line)

use harness

You are the PLAN-phase generator for **Wave 5d sub-gate 4/6: `./defer` +
`./streams`** — progressive streaming rendering (RFC 13 PSR) and end-to-end
streams (RFC 16) in `@netscript/fresh`, plus the server-side streaming
helpers that live in `server/` (`sse.ts` 10.8K, `stream.ts`,
`stream-error-boundary.tsx`). PLAN only: research → design → proposed slice
lock. Zero implementation. PLAN-EVAL is a separate session.

## Where you work

- Worktree: `C:\Dev\repos\netscript\output\test-app\worktrees\repo-genesis\.genesis\netscript\.worktrees\wave5-apps-5d4-streaming`
- Branch: `feat/package-quality-wave5-apps-5d4-streaming` · Draft PR: **#37**
  (base: `feat/package-quality-wave5-apps-5d-fresh`)
- Run dir (seeded): `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/`

## Authority — read first, in order

1. BINDING umbrella target architecture:
   `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (branch
   `feat/package-quality-wave5-apps-5d-fresh`). Divergence = drift entry.
   Note: `server.ts`/`defineFreshApp` surface ownership belongs to 5d6 —
   you own the streaming internals of `server/`, not the app builder.
2. `.llm/harness/` (ARCHETYPE-3 streaming: abort/cleanup tests are
   first-class gates; runtime/Aspire validation; run-loop). If
   `.claude/skills/netscript-doctrine/SKILL.md` is absent, `.llm/harness/`
   is the doctrine source.
3. RFC 13 (PSR) + RFC 16 (e2e streams) in `.resources/rfcs/`; the Wave 4
   merged `@netscript/plugin-streams(-core)` surface (27 fresh files
   reference it — re-verify the coupling on your branch); 5d1 plan (PR #34)
   telemetry convention binds you.

## Skills to activate

`netscript-harness`, `netscript-doctrine`, `jsr-audit`, `deno-fresh`,
`aspire`.

## Deep-dive directives

1. **Abort/cleanup as the unit's spine** — every defer/SSE/stream surface
   must prove AbortSignal propagation, backpressure behavior, and resource
   cleanup on client disconnect. Inventory current gaps (`DeferIsland`,
   `DeferPage`, `policy.ts`, `sse.ts`, `create-stream-db.ts`) and make the
   test strategy a named plan deliverable.
2. **One streaming story, not three** — defer (HTML streaming), SSE
   (server/sse.ts), and plugin-streams e2e streams overlap. Design the
   layering: what `./defer` owns (rendering), what `./streams` owns
   (transport over plugin-streams), what stays in `server/`. Compare React
   18/Next.js streaming + Suspense, TanStack Start streaming loaders, and
   Remix defer for the DX bar.
3. **Telemetry** — `defer/telemetry.ts` must adopt the 5d1 cross-cutting
   convention; streaming spans (time-to-first-byte, chunk timings) are the
   E2E-telemetry showcase of the wave — design the span/event vocabulary.
4. **Wave 4 coupling** — the merged `plugin-streams(-core)` surface is
   upstream truth; document exactly which of its exports `./streams` wraps
   and protect against re-implementing transport concerns locally.
5. **Runtime validation** — plan the Aspire/playground proof: a real route
   streaming deferred content + an SSE endpoint, validated in-browser and
   with curl-level chunk assertions.

## MEASURE-FIRST

On your branch: combined `deno doc --lint` for `./defer` + `./streams` (+
the `server/` streaming files), `deno check --unstable-kv`, over-cap
inventory, private-type refs, dry-run. Root check excludes
`packages/fresh`. Slice lock ≤30, justified by numbers.

## Concept of done (PLAN phase)

On PR #37, pushed: `research.md` (coupling map + market comparison with
sources), `design.md` (streaming layering + abort/cleanup test strategy +
telemetry vocabulary), `plan.md` (PROPOSED slice lock with per-slice gates),
`drift.md`, `context-pack.md`. Final comment: **READY FOR PLAN-EVAL**.
Fable 5 reviews the plan on the PR first.

## Routine (every milestone)

Commit per artifact milestone, never amend; trailer
`Co-Authored-By: <your model name> <noreply@anthropic.com>`; append-only run
docs with hashes in `commits.md`; push after every commit; PR comment on
#37 with a Stage / Artifacts / Findings / Drift / Commits table.

## Hard constraints

No implementation, no self-eval, no merging. Never touch lock files / no
`deno cache --reload`; restore root `deno.lock` via `git checkout --
deno.lock`. Surface/dependency changes need an umbrella drift entry.
Implementation runs after 5d3 lands — state 5d1/5d2/5d3 dependencies
explicitly.
