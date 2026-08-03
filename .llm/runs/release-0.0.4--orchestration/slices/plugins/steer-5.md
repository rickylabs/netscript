# BLOCKING #2 — your `sortRecord` reordered generated Aspire helpers and broke `runtime.flow-b-fixture`

`scaffold-static` is now **green** — your `unavailable` arm fixed the deno-only lane. One red left,
and it is also ours.

## The failure

`scaffold-runtime` on `057f063e1`, `Summary: passed=26 failed=1`:

```
FAILED GATE: runtime.flow-b-fixture
DECISIVE ERROR: Command exited 1; expected 0.
  stderr: error: Uncaught (in promise) Error: generated register-background.mts did not contain the workers resource block
    at packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts:211:9
```

## The cause — I traced it, do not re-derive it

`prepare-flow-b-fixture.ts:202-211` extracts the workers block by finding its marker and then finding
**the next** marker after it:

```ts
const workersBackgroundMarker = '  // --- workers ---';
const workersBackgroundIndex = registerBackground.indexOf(workersBackgroundMarker);
const nextBackgroundIndex = registerBackground.indexOf(
  '  // --- ', workersBackgroundIndex + workersBackgroundMarker.length,
);
if (workersBackgroundIndex < 0 || nextBackgroundIndex < 0) { throw … }
```

It requires workers **not to be the last block**.

Your reconciler ends with:

```ts
appsettings.NetScript.BackgroundProcessors = sortRecord(backgroundProcessors);
```

The E2E installs `workers, sagas, triggers, streams`, so before your change the emitted order was
insertion order and **workers came first** — there was always a following block. `sortRecord`
alphabetises to `sagas, streams, triggers, workers`, so **workers is now last**, `nextBackgroundIndex`
is `-1`, and the fixture throws.

So this is a genuine behavioural change from our slice: we altered the ordering of a **generated
artifact**, and something downstream depended on the old ordering.

## Decision — fix the fixture, keep the sort

Do **not** remove `sortRecord`. Deterministic ordering of generated output is the correct behaviour
and is what makes the #1067 acceptance ("identical `appsettings.json`") meaningful; reverting it to
satisfy a fragile test assumption would be the wrong trade.

Fix `prepare-flow-b-fixture.ts` so extracting the workers block does not assume a following block —
when `workers` is the last entry, slice to end-of-file (or to the next top-level boundary) instead of
failing. Keep the genuine "workers block is missing entirely" case as an error; only the
"workers is last" case should stop being a failure.

While you are there, check whether any **other** gate or generator slices blocks by "find the next
marker". If the same pattern appears elsewhere it will fail the same way as soon as that plugin sorts
last, and I would rather find it now than in the release.

## Also record this

Add a drift entry: reconcile sorts `Plugins` and `BackgroundProcessors`, which changes the ordering of
generated Aspire helper output for existing projects. It is intentional and desirable (stable diffs),
but it is a visible change in generated artefacts and belongs in the PR notes. I will carry it.

## Verification bar — do not repeat the last mistake

A local `scaffold.plugins` green does **not** cover this; `flow-b-fixture` lives in `scaffold.runtime`.
Either run `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` locally, or state
plainly that you could not and let CI be the proof. Do not report it green from a suite that never
executed the gate.

Note the machine is shared: `/home/codex/repos/ns004-sagas` has a live slice with its own containers
(`ns004-sagas-review-redis`, `netscript-saga-1075-redis`). Do not touch them, and use `--cleanup`.

Commit, push, report the hash.
