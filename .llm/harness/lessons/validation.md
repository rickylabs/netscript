# Validation Lessons

Source runs:

- `.llm/tmp/run/feat-package-quality-wave2-adapters-2a--observability` (telemetry)
- `.llm/tmp/run/feat-package-quality-wave2-adapters-2b--data`
- `.llm/tmp/run/feat-package-quality-wave2-adapters-2c--messaging`
- `.llm/tmp/run/feat-package-quality-wave4-runtimes--4c-sagas` (per-EP vs full-barrel)

## MEASURE-FIRST: doc-lint must be a full-export sweep

Carried-in dynamic-gate counts are almost always stale and undercounted because they were taken on a
partial sweep or a different base. Before locking per-slice effort, re-run on a **full sweep across
every `exports` entrypoint**:

- `deno doc --lint <every exports entrypoint>` — re-count from scratch.
- `deno publish --dry-run --allow-dirty` — confirm 0 slow types.

Evidence of how badly root-only undercounts:

- 2a telemetry: root-only `deno doc --lint` reported **2** errors; the full-export sweep reported
  **168**.
- 2c queue: carried-in **19+** → full sweep **35** (partial sweep had missed `deno-kv.adapter.ts` =
  21). cron carried-in **5** → full sweep **16** (missed `scheduler.ts` = 7).

Never trust a root-only doc-lint number for scoping. Record the real per-entrypoint breakdown in
`research.md` / `drift.md` before locking the plan.

### …but the _final gate_ must be the full-barrel `mod.ts`, not per-EP runs

Per-entrypoint doc-lint is correct for **scoping/attribution** (count debt per surface). It is **not
sufficient as the final pass/fail gate**: linting each entrypoint in isolation can miss a
`private-type-ref` that only appears when the public barrel's merged type graph is resolved
together.

Wave 4 4c: the generator's C14 worklog claimed `private-type-ref-count=0` from per-entrypoint runs,
but IMPL-EVAL ran `deno doc --lint packages/plugin-sagas-core/mod.ts` (the full public barrel) and
found **2** `private-type-ref` errors — `SagaCorrelation` referenced by `SagaBuilder["correlate"]` +
`SagaCorrelationRule` but never exported from `src/public/mod.ts`. The per-EP sweep missed it
because the `builders/mod.ts` → `define-saga.ts` graph was only fully resolved through the merged
barrel. Result: a `FAIL_FIX` IMPL-EVAL cycle for a 1-line export.

Rule: scope with per-entrypoint counts; **gate with `deno doc --lint <pkg>/mod.ts`** (the full
merged barrel) and reconcile the ptr count against _that_ before claiming clean. A "0 per-EP" is not
"0 on the barrel."

## Rename slices are intentionally transient — gate at the end

When a folder rename is split into `git mv` (S1) → retarget exports/tasks (S2) → retarget imports
(S3), the package's static checks **will fail after S1 and S2 alone** because `deno.json` and source
still point at the old paths. This is planned, not drift. Keep each slice single-purpose, record the
transient-failure expectation in `drift.md`, and require the **final** slice's gate to be green. Do
not try to make every intermediate slice independently green — that just couples the slices.

## Consumer-gate attribution: verify the import before blaming the change

A package-scoped consumer gate (`deno check` on a publishable consumer) can fail on the _consumer's
own_ pre-existing slow types that have nothing to do with the change under test. Before attributing
a consumer failure to your run:

1. Confirm the consumer actually imports the changed surface.
2. Diff the failing file against the run's base; byte-identical ⇒ pre-existing.

2c example: `packages/cli` `deno check` reported 3 TS9016/TS9027 isolated-declarations errors on
`copy-official-plugin.ts:205`, but the CLI imports neither queue nor cron and the file was
byte-identical to base `55f6108`. Correct move: record it as named debt
(`cli-maintainer-sync-isolated-declarations`), attribute it to the owning track, and let the gate
pass on the consumers that _do_ import the surface (`plugins/triggers`, `plugins/workers` both
passed).

## Out-of-scope runtime failures: escalate, don't block

The final merge-readiness `deno task e2e:cli` can fail on pre-existing runtime drift unrelated to
the unit under quality work. 2c: `behavior.triggers-health` failed (generated trigger service,
`localhost:8093/health`, os error 10054 conn reset) while all package
compile/surface/publish/doc-lint/consumer gates passed.

Rule: a runtime e2e failure that is **not** a compile/surface/publish/doc-lint failure of the unit
in scope is logged in `drift.md` as an escalation and does not block the package merge (per the plan
risk register). Carry the caveat forward to the track that owns the failing surface (here: the Wave
3 `@netscript/plugin` / generated-trigger track).

## Targeted check flags

- Targeted `deno check` for these packages must pass `--unstable-kv`.
- cron pins `deno.unstable` in `compilerOptions.lib`; queue passes `--unstable-kv`. No
  `skipLibCheck`.

## Userland install gates must run outside the checkout

Source run:

- `.llm/tmp/run/issue-167-marketplace-plugin-install`

CLI scaffold and plugin-install gates can pass falsely when the generated project lives inside the
monorepo: checkout walk-up logic, local import maps, copied source trees, and unpublished package
paths can mask the actual published-user experience. The #167 baseline had exactly this blind spot:
`scaffold.runtime` passed in the monorepo while `jsr:@netscript/cli` users could not install
official plugins at all.

Reusable rule: any gate claiming "published userland" behavior must create its project under an OS
temp root outside the checkout and assert both presence and absence:

- expected generated artifacts exist;
- framework/plugin source directories are absent;
- generated files contain no monorepo absolute paths, `file://` worktree URLs, or local
  `../packages` imports.

For unpublished package exports, pre-merge validation may use an explicit `--local-path` only if the
project root is still outside the checkout and the worklog states that the real `deno x jsr:` leg is
post-publish validation. Do not report production-JSR green until the published package path is
exercised by a prod smoke such as `e2e-cli-prod`.

## A gate that classifies globally will false-green

Source run: `beta10-non-dashboard--claude` (PR #715). IMPL-EVAL finding **F1**.

A batch-running gate (`deno lint` / `deno fmt` wrappers, and anything shaped like them) must
classify **per batch**, never across the run.

The failure looks like this. A wrapper ran N batches, collected all their output into one blob, and
decided "did anything crash?" with a **global** predicate:

```ts
// WRONG — a crashed batch hides behind another batch's legitimate finding
const failedWithoutParsedFindings = failedBatches > 0 && allFindings.length === 0;
```

Two ways that lies:

1. Batch A has an ordinary finding, batch B **crashes** (config parse error, permission error). Now
   `allFindings.length > 0`, so B's stderr is never printed — the crash is silent.
2. Worse: if A's only findings are ones the run **filters** (e.g. `--ignore-line-endings`), the
   reported `findings.length` is 0 while `allFindings.length` is not — so the crash is neither
   reported _nor_ failed. **The gate exits 0 with a crashed batch.** A false green on a repo gate.

The correct predicate is per batch: _a batch is a crash iff it exits non-zero and **its own** output
yields no parseable finding._

### The part that generalizes beyond wrappers

The author of that fix had **already fixed this exact bug** in the sibling lint wrapper — and then
reintroduced it one level up in the fmt wrapper, because the lint one classified per batch and the
fmt one did not. Fixing a bug class in one place is not fixing the class. **When you fix a
swallow/classification bug, grep for its siblings in the same run** — the same author, the same
afternoon, the same shape.

And the tests could not have caught it: they were **renderer-only**, building `BatchResult[]` by
hand and asserting on the formatted string. They restated the implementation instead of pinning the
invariant.

### Rule

- A non-zero exit with an empty findings list must **never** be silent, and must never be reachable
  with exit 0.
- Classify per unit of work, not per run. Any predicate of the form
  `anyFailed && nothingFoundAnywhere` is a false-green waiting to happen.
- A gate's tests must drive the **classifier**, not the renderer, and must include the mixed case
  (one legitimate finding + one crash) and the filtered case (the only findings are ignored ones).
- Green gates are not evidence that a gate works. Prove a gate **fails** when it should.

## Stage deliberately: `git add -A` will sweep a foreign slice into your PR

Source run: `beta10-non-dashboard--claude` (PR #715). IMPL-EVAL finding **F5**.

A supervisor working in one worktree while preparing a _different_ branch's slice created a new
validation tool + a `deno.json` task there, then committed run-artifact bookkeeping with
`git add -A`. That swept the tool, the task, **and a `deno.lock` delta** into the PR — executable,
CI-affecting scope that had bypassed the review boundary — while the run's own worklog told the next
reader those files lived only on the other branch. The artifact and the Git history said opposite
things.

### Rule

- In a run dir, stage **explicitly** (`git add <paths>`), never `-A`, when the worktree has also
  been used to stage or verify work destined for another branch.
- `deno.lock` moving in a "chore(harness): record …" commit is a red flag. A bookkeeping commit that
  touches the lockfile is not bookkeeping.
- Before pushing, diff the commit's file list against what the commit message claims. If the message
  says "record evidence" and the stat shows a `.ts` tool and a lockfile, the message is wrong or the
  staging is.
