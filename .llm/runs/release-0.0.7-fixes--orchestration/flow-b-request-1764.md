# Flow-B off-host gate request — PR #1764 / issue #1368

Prepared, **not fired**. Posting the trigger spends external CI, so it is the coordinator's call;
say the word and I will post it verbatim.

## Why off-host

Flow-B is the sole remaining blocker after IMPL-EVAL cycle 3 `PASS_IMPL`. It cannot run on this host:
D-42/D-43 established that AppHost gates cannot boot against the remote dind — generated
`withDataBindMount('.data/postgres')` names a path the dind daemon cannot see, and with the scratch
`DataPath` omitted DCP publishes container ports on the dind host's `127.0.0.1` while the AppHost dials
`127.0.0.1:<port>` from this container. Not fixable by version, quota, or product config. No local
Aspire or Docker was started to prepare this request.

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
FAIL → classify leaf-caused vs baseline-caused by comparing against the same command at `24f6642f`,
and report before any repair.
