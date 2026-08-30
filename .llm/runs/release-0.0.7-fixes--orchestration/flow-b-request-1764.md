# Flow-B off-host gate request — PR #1764 / issue #1368

Prepared, **not fired**. Posting the trigger spends external CI, so it is the coordinator's call;
say the word and I will post it verbatim.

## SUPERSEDED PREMISE — D-42/D-43 is resolved (coordinator infrastructure update)

This request was written when Flow-B could not run on this host at all. That is **no longer true**.
DinD mount visibility and cross-container ports are fixed: use `DOCKER_HOST=tcp://netscript-dind:2375`
and reach published ports via **`netscript-dind:<port>`, not `127.0.0.1`** — which was precisely the
D-43 failure mode (DCP publishes on the dind host's loopback while the AppHost dialled its own).

So Flow-B is now a **queued local runtime request**, with off-host as the fallback rather than the only
route. It is **not** runnable right now: the sole host runtime lease is held by the Aspire supervisor
for Phase B. Queue behind it; start no Aspire and no Docker until that lease returns exact zero.
Nothing in this request has been executed — no container or AppHost was started to prepare it.

**Preferred route (local, when the lease returns):** request the singleton host runtime lease at the
exact head, run the command below, capture the durable receipt, then scoped teardown proving
`aspire ps` empty and `docker ps -a` empty before releasing.

**Fallback route (off-host):** the OpenHands trigger at the end of this file, unchanged.

## Exact head

`735ed2a66` on `fix/saga-span-emission-and-correlation` — pushed, clean, main reconciled to `24f6642f`.
Run at this exact SHA; if main advances with intersecting drift, re-cut first.

## Gate identity

- Gate id **`runtime.flow-b-fixture`** (`GATE.RUNTIME_FLOW_B_FIXTURE`, `packages/cli/e2e/src/domain/cli-surface.ts:104`).
- Selected into `RUNTIME_GATES` at `packages/cli/e2e/suites/scaffold/capability-suites.ts:88` — selection
  is what puts it in the suite; a defined-but-unselected gate is silently dropped.
- Fixture: `prepare-flow-b-fixture.ts`. Validator: `validate-flow-b-traces.ts`.

## Command — one pass, do not split

```text
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Do not substitute individual `gates` invocations; the runtime verdict requires the full suite.

## Evidence contract — what a PASS must show

1. **Raw exit code** of the command, stated as a number.
2. The `runtime.flow-b-fixture` gate **selected and executed**, named in the output — not skipped.
3. The validator's saga assertions passing, specifically:
   - **TC-6/TC-7** — every correlated span carries `netscript.correlation.id`, including **`saga.handle`
     and `saga.compensate`**; all of them share **one** correlation id; and the callback correlation
     equals the generated fixture value.
   - **TC-9** and the surrounding parent-edge assertions (`enqueue → dequeue`, `dispatch → execute`,
     `execute → callbackBoundary`).
4. Failing suite/test names if any, with the raw assertion text.
5. Lock hygiene: `deno.lock` unchanged; no source churn committed.

Anything less is not a pass. In particular a green overall exit with the Flow-B gate **skipped** is a
fail for this purpose — the #1368 acceptance boxes turn on this gate actually running.

## Off-host trigger (OpenHands, per root AGENTS.md)

```text
@openhands-agent model=openrouter/qwen/qwen3.8-max output=pr-comment
run the full scaffold runtime E2E smoke for this PR.

Use this single one-pass command from the repository root:

deno task e2e:cli run scaffold.runtime --cleanup --format pretty

Do not split this into individual gate commands. Report the raw exit code and summarize failing suite/test names if any. Preserve lock hygiene: do not commit deno.lock or source churn unless the run explicitly requires a reviewed fix.
```

Add one line to that trigger when posting: **"Confirm the `runtime.flow-b-fixture` gate executed and
report its TC-6/TC-7 assertion results explicitly."** The stock template does not ask for per-gate
detail, and without it a pass cannot be distinguished from a skip.

## Known baseline risk

The last bare `e2e:cli` this lane ran (for #1758) came back **26/1 baseline-blocked on a #1734
generated-project TS2345**. If that baseline is still red off-host, this run reports the same failure
and Flow-B stays unproven — that is a real possibility to expect, not a reason to waive. Classify
exactly and report; do not retry into a different answer.

## On completion

PASS → the last DoD box closes and #1764 can move to `status:ready-merge` for the coordinator's merge.
Either route satisfies the owner ruling: it required CI or off-host **because** local was blocked, and
that condition no longer holds — a local lease-backed green run is equally valid evidence.
FAIL → classify leaf-caused vs baseline-caused by comparing against the same command at `24f6642f`,
and report before any repair.
