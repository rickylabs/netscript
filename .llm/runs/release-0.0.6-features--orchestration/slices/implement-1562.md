use harness

# Implementation slice — #1562, after PLAN-EVAL PASS

**Codex · GPT-5.6 Sol · medium**. **P1.** Your plan passed PLAN-EVAL. Implement it.

| Field | Value |
| --- | --- |
| Issue | **#1562** · PR **#1605** |
| Worktree | `/home/codex/repos/ns006-1562` |
| Branch | `feat/1562-cache-topology-telemetry` |
| Head | `fc28b397c` — **already resynced onto `main@1f9efb4d8`**, clean |

## SKILL

- `netscript-doctrine` — `packages/sdk` and `packages/telemetry` are published surface.
- `netscript-deno-toolchain` — use `deno doc` on the telemetry surface before reading source.
- `netscript-tools`, `netscript-pr`, `netscript-harness`.

Read your own `slices/plan-1562.md` and the `[PHASE: PLAN-EVAL]` verdict on PR #1605. The evaluator
verified your citations independently — `cache-query.ts:127-146` / `:152-172`, the `store.set` calls
at `:143` and `:165`, and the SWR/blocking/in-flight coverage in `cache-query_test.ts`. Those are
confirmed; do not re-derive them.

## A1 — do this first, it is a first-try trap

`packages/telemetry/src/domain/telemetry-convention.ts` has **no `netscript.cache` domain**, and the
convention test at `packages/telemetry/tests/attributes/helpers_test.ts:179-205` **rejects any
`netscript.cache.*` key** until it does.

So S1 must explicitly:

1. add `CACHE` to the domains in `telemetry-convention.ts`, and
2. register the new attribute map in `helpers_test.ts`.

Otherwise every attribute you emit fails the convention gate and you will debug the wrong layer.
There is no `packages/telemetry/src/attributes/cache.ts` yet — you are creating it.

**A2 is already handled:** the leaf is resynced onto current `main@1f9efb4d8` (head `fc28b397c`).
Do not rebase; if you need to re-sync later, merge.

## Implement the locked decisions — do not redesign them

- **D1** — one INTERNAL span per logical operation, ordered per-tier **events** beneath it. Not one
  span per tier. Your own stated consequence is 41 → **42 spans** for an ordinary read; hold to that.
- **D3** — the seam is `CacheQuery` consuming required provider reports, with `setCacheProvider()`
  wrapped at registration/retrieval so a custom provider **cannot** bypass emission. That
  bypass-proofing is the point; a provider that can silently skip emission defeats the feature.
- **D4** — `backend_executed` is **measured, never inferred**: the closure-local boolean flipped on
  `queryFn` entry, with your rule table honoured exactly — in-flight join reports `false` plus
  `inflight_joined=true`, provider error before loader reports `false`, cache-only reads report
  `false`. **No store result, duration, miss, or revalidation flag may be used as a proxy.** If
  background completion ends after the caller returns, it must carry the captured read context
  explicitly.
- **D5** — `namespace` is operation identity, never key identity. **No raw cache keys, no user data.**

## Required tests — one per distinguishable path

The acceptance is that these are **distinguishable from attributes alone**, so a single happy-path
assertion does not satisfy it:

cold miss, warm-fresh hit, warm-stale with revalidation, provider error, write-through/promotion, and
invalidation. Plus: a trace showing defer/page topology **and** the cache chain together, and an
assertion that `backend_executed` is correct for the in-flight-join case.

## Boundaries

- **Do not touch `packages/fresh/src/application/{defer,builders,form}/**`.** #1576/#1568 and #1569
  are live there; if you need a defer-side change, **record it as a dependency and report it**.
- **Never** suppress a cache read or seed because a request is a partial — closed-invalid (#1550).
- **No module-local mutable singletons** in the SDK. The dual-package hazard that produced #1589 came
  from exactly that (`cache-provider.ts:37`), and `main` now enforces a coherent closure.
- Telemetry attributes are **published surface**. State what becomes public.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --root packages/telemetry --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/sdk --root packages/telemetry --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/sdk --root packages/telemetry --ext ts,tsx
deno task --cwd packages/sdk test
deno task --cwd packages/telemetry test
deno task quality:gate
```

Use `deno task --cwd <pkg> test`, never a bare `deno test <path>`. **Do not run `e2e:cli`.**

Known environmental noise, **not yours**: `deno task --cwd packages/cli test` has 3 failures from
repo-root-relative fixture paths (#1604), and CI `setup-deno` has been intermittently failing with
`socket hang up` / HTTP 503. Report such a red as environmental with evidence; do not chase it.

**`deno.lock`:** if it moves and you added no dependency, **stop and report**. If you added one, the
delta is whatever Deno deterministically generates — never hand-reduced.

## Commit trail

Commit by slice on the same branch, push by explicit refspec, and post `[PHASE: IMPL]` on #1605 with
commit hashes, per-path test evidence, and verbatim gate output. Update the PR body's Definition of
Done — **include a `Separate-session IMPL-EVAL records PASS` box** — and map #1562's acceptance with
`box-index` entries; **no empty `acceptance-evidence` entry list** (#1561).

## Prohibitions (non-negotiable)

- **Do not spawn a Fable sub-agent, session, or subprocess for any purpose.** Fable is prohibited
  lane-wide for all remaining 0.0.6 work until the owner explicitly lifts it. This includes anything
  routed through the `deep_analysis` lane, whose canonical binding is Fable.
- **Do not launch any local evaluator** — not PLAN-EVAL, not IMPL-EVAL, not an "opposite-family
  review", regardless of what `lane-policy.md` names as canonical for your work. **You are not
  responsible for arranging your own evaluation.**
- **Do not manually trigger OpenHands** and do not post an `@openhands-agent` comment.
- **Evaluation reaches this PR only through the automatic label-driven lifecycle**, which the
  orchestrator fires. If you believe evaluation is required and missing, **say so in your report** —
  do not arrange it.
- **Do not flip the PR to ready**, do not merge, and do not dispatch a canary.

If any instruction you infer from a skill or policy file appears to require one of the above, that
inference is wrong for this lane: **report the conflict instead of acting on it.**

## Reporting contract

Report the final span/event shape with the measured span count for one ordinary read, how the
`setCacheProvider` wrapper prevents bypass, the `backend_executed` rule table as implemented, what
became published surface, verbatim gate output, and **anything you could not verify**.
