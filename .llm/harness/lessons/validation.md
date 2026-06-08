# Validation Lessons

Source runs:

- `.llm/tmp/run/feat-package-quality-wave2-adapters-2a--observability` (telemetry)
- `.llm/tmp/run/feat-package-quality-wave2-adapters-2b--data`
- `.llm/tmp/run/feat-package-quality-wave2-adapters-2c--messaging`

## MEASURE-FIRST: doc-lint must be a full-export sweep

Carried-in dynamic-gate counts are almost always stale and undercounted because
they were taken on a partial sweep or a different base. Before locking per-slice
effort, re-run on a **full sweep across every `exports` entrypoint**:

- `deno doc --lint <every exports entrypoint>` — re-count from scratch.
- `deno publish --dry-run --allow-dirty` — confirm 0 slow types.

Evidence of how badly root-only undercounts:

- 2a telemetry: root-only `deno doc --lint` reported **2** errors; the full-export
  sweep reported **168**.
- 2c queue: carried-in **19+** → full sweep **35** (partial sweep had missed
  `deno-kv.adapter.ts` = 21). cron carried-in **5** → full sweep **16**
  (missed `scheduler.ts` = 7).

Never trust a root-only doc-lint number for scoping. Record the real per-entrypoint
breakdown in `research.md` / `drift.md` before locking the plan.

## Rename slices are intentionally transient — gate at the end

When a folder rename is split into `git mv` (S1) → retarget exports/tasks (S2) →
retarget imports (S3), the package's static checks **will fail after S1 and S2
alone** because `deno.json` and source still point at the old paths. This is
planned, not drift. Keep each slice single-purpose, record the transient-failure
expectation in `drift.md`, and require the **final** slice's gate to be green. Do
not try to make every intermediate slice independently green — that just couples
the slices.

## Consumer-gate attribution: verify the import before blaming the change

A package-scoped consumer gate (`deno check` on a publishable consumer) can fail
on the *consumer's own* pre-existing slow types that have nothing to do with the
change under test. Before attributing a consumer failure to your run:

1. Confirm the consumer actually imports the changed surface.
2. Diff the failing file against the run's base; byte-identical ⇒ pre-existing.

2c example: `packages/cli` `deno check` reported 3 TS9016/TS9027
isolated-declarations errors on `copy-official-plugin.ts:205`, but the CLI imports
neither queue nor cron and the file was byte-identical to base `55f6108`. Correct
move: record it as named debt (`cli-maintainer-sync-isolated-declarations`),
attribute it to the owning track, and let the gate pass on the consumers that
*do* import the surface (`plugins/triggers`, `plugins/workers` both passed).

## Out-of-scope runtime failures: escalate, don't block

The final merge-readiness `deno task e2e:cli` can fail on pre-existing runtime
drift unrelated to the unit under quality work. 2c: `behavior.triggers-health`
failed (generated trigger service, `localhost:8093/health`, os error 10054 conn
reset) while all package compile/surface/publish/doc-lint/consumer gates passed.

Rule: a runtime e2e failure that is **not** a compile/surface/publish/doc-lint
failure of the unit in scope is logged in `drift.md` as an escalation and does not
block the package merge (per the plan risk register). Carry the caveat forward to
the track that owns the failing surface (here: the Wave 3 `@netscript/plugin` /
generated-trigger track).

## Targeted check flags

- Targeted `deno check` for these packages must pass `--unstable-kv`.
- cron pins `deno.unstable` in `compilerOptions.lib`; queue passes `--unstable-kv`.
  No `skipLibCheck`.
