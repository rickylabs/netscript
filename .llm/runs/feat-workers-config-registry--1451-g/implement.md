use harness

# Slice G — config-aware installed registry generation (#1451 adapter)

## SKILL

- `netscript-harness` — slice discipline, worklog/drift artifacts, gate evidence.
- `netscript-doctrine` — `plugins/workers` archetype and public surface.
- `netscript-cli` — generate/plugin command surface.
- `netscript-deno-toolchain` — dependency/lock questions; **do not hand-roll registry curls**.

## Standing plan — already PLAN-EVAL PASSed, do not redesign

The clustered plan is on `main` at
`.llm/runs/feat-workers-runtime--1592-1451/plan.md`. **Read D5, D6, D7 and the Slice G section
before writing code.** Its decisions are locked; if reality contradicts one, record it in `drift.md`
and continue — do not silently redesign.

Base: `main` `1e53e731a` — this already contains **Slice C (#1861, merged)**, whose `JobConfig`
schema you consume.

## The one rule that defines this slice

**Slice G consumes Slice C's normalized output and must not duplicate validation.** Slice C already
owns the canonical constraints (`priority` int 0–100 default 50, `retryDelay` int non-negative
default 1000, `maxConcurrency` int **non-negative** default 1 — zero concurrency is deliberately
valid — and `persist`). Re-validating, re-defaulting, or re-declaring any of those in the generator
is the specific failure mode this slice must avoid. Load config at the generator entry edge and pass
**normalized data inward** (D5).

## File ceiling: 7

1. `plugins/workers/deno.json`
2. `plugins/workers/src/cli/generate-runtime-registries.ts`
3. `plugins/workers/src/cli/runtime-registry-generator.ts`
4. `plugins/workers/tests/cli/runtime-registry-generator_test.ts` (new)
5. `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts`
6. one existing workers CLI/reference doc describing policy authority and precedence
7. a fixture/helper **only if** the installed-generator integration cannot be expressed locally

**No generic CLI production file is expected to change.** `scaffold.runtime.json` stays discovery
metadata, never policy storage. If you need an eighth file, stop and write the reason in `drift.md`
first.

## Required tests — all of these, they are the acceptance surface

- entry CLI loads a real temporary `netscript.config.ts`, validates workers policy, and the generated
  module literals **preserve every supported field**;
- grouped same-identity policy **wholly shadows** flat policy; grouped topic wins (D7);
- conflicting id/path/source and an unmatched config entry fail with **actionable diagnostics**;
- configured **Windows separators** and normalized relative paths match the same discovered file (D6);
- an unconfigured discovered job retains current generic defaults;
- an absent `workers` section retains current generation behaviour;
- a malformed `workers` section **stops generation**;
- installed-registry integration proves the generated `jobDefinitions` consumed by runtime startup
  carries project policy — **without network fetch and without a second manifest**.

## Gates

Focused plugin/CLI `check`/`test`/`lint`/`fmt`; CLI subpath and plugin `doc:lint` with **zero new**
diagnostics (measure A/B against base — the root has pre-existing baseline findings that are not
yours); plugin `publish:dry-run`; dependency/lock verification via the native Deno toolchain;
`deno task arch:check`.

**`deno.lock` must remain byte-unchanged** — `@netscript/config` is already a workspace dependency.
If the lock moves, stop and diagnose; do not commit it.

## Runtime boundary — binding, not advisory

**Do not run `deno task e2e:cli`, `scaffold.runtime`, Aspire, Docker, or any browser gate.** A prior
worker in this lane ran an out-of-brief local `scaffold.runtime` and leaked three containers,
requiring supervised teardown. The one-pass runtime smoke belongs to the **hosted** lane at merge
readiness and the supervisor owns it. Local runtime execution is out of brief.

## PR contract

Open the PR with **full metadata in the same action** — `orchestrator:features`, `status:impl`,
`type:feat`, `priority:p1`, `wave:v1`, `area:workers`, milestone **0.0.7**. A PR labelled later is
invisible to coordinator audits while it is active.

Use `Refs #1451` with **no closing keyword** and confirm `closingIssuesReferences` is empty. Slice G
may complete #1451's scope, but **closure is the supervisor's decision after close-gate verification**
— enumerate in the PR body which acceptance rows your evidence satisfies, and do not tick boxes by
hand (acceptance evidence is mirrored, never hand-edited).

Write `worklog.md` and `drift.md` under
`.llm/runs/feat-workers-config-registry--1451-g/` as you go, and keep receipts. Do not strip or
rewrite any `.llm/runs` content — harness run directories are intentional cross-agent context.
