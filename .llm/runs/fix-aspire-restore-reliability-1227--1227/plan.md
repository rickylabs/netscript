# Plan

## Locked decisions

1. Give command gates an optional per-gate timeout and allow a bounded three-attempt policy; configure Aspire restore for 3 × 180 seconds rather than 2 × 900 seconds.
2. Add an explicit infrastructure failure class to the gate contract and assign it to Aspire restore failures so reports cannot present feed stalls as product assertions.
3. Persist `~/.nuget/packages` in every workflow that exercises this gate, keyed by OS and the exact Aspire CLI/package train, with network restore as the cold-cache fallback.
4. Do not add a synthetic restore or skip the real Aspire command.

## Open decisions

- Safe to defer: cache eviction policy beyond GitHub's normal cache lifecycle.
- Safe to defer: upstream Aspire/NuGet fixes; the local gate remains bounded regardless.
- Must resolve now: none.

## Commit slices

1. Retry/classification contract and tests — gate domain, executor application, reporter, runtime definition.
2. Pinned NuGet cache across runtime workflows and workflow assertions.
3. Targeted gate evidence and PR handoff.

## Risks

- A broad retry change could affect other gates: retain opt-in retry and test the three-attempt ceiling.
- A cache could mask version drift: key it to the exact pinned Aspire train.
- Classification could hide product failures: assign infrastructure only on the restore gate, before product startup.

## Gates

- Focused command-gate, runtime-gate, reporter, and workflow tests.
- Targeted `deno check --unstable-kv`.
- Scoped check/lint/fmt for `packages/cli/e2e` and workflow validation.
- Relevant CLI E2E unit package task; no full scaffold runtime smoke in the implementation loop.

## Deferred scope

- Changes to Aspire CLI or NuGet upstream.
- Release-policy behavior for infra-red beyond emitting an unambiguous classification.

Per milestone ruling D6, evaluation is the draft-to-ready augment, OpenHands label, and orchestrator pre-merge gate; no local PLAN-EVAL is spawned.

