use harness

You are the W3-A implementation supervisor for the NetScript 0.0.5 stable release. You own one PR
cluster: **#1326 — `DurableStreamProducer` permanently drops writes after an initial connection
failure; reconnect is never attempted.** Priority p0.

## SKILL

- `netscript-harness` — operating model, slice discipline, evaluator separation
- `netscript-doctrine` — you are changing `packages/plugin-streams-core/**`. Contract first, then
  implementation, then tests. The package carries **accepted AP-13 console-warning debt** and
  **streams connector convergence debt** — cite them, do not deepen or generalise from them
- `aspire` — isolated AppHost, resource health, correlated OTEL, owned cleanup
- `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`
- `jsr-audit` — this is a published package

Read the inlined shared contract below in full. It is part of this brief.

## Identity

| Field | Value |
| --- | --- |
| Lane | `normal_implementation` — Codex · OpenAI · GPT-5.6 Sol · medium (justified: runtime semantics plus telemetry proof) |
| Worktree | `/home/codex/repos/ns005-w3a` |
| Branch | `fix/streams-durable-producer-reconnect` |
| Base | `origin/main@aa8e151e6` — the head `0.0.5-canary.17` was cut from |
| Slice dir | `.llm/runs/release-0.0.5--orchestration/slices/w3-a-1326/` |
| PLAN-EVAL | Claude · Fable 5, separate session, launched by the orchestrator — **mandatory before implementation** |
| IMPL-EVAL | Claude · Fable 5, separate session, launched by the orchestrator |

## Your dependency is satisfied — build on it, do not redesign it

#1329 merged as `aa8e151e6` and shipped the **versioned SSE and OTEL envelope** you must build on.
Read it before planning; it is the contract, not a suggestion:

- `bindStreamEventSourceV1` with named `data` / `control` events
- an **opaque committed offset token** used for reconnect — the contract states offsets are opaque
  ordered tokens and are **never parsed**. Do not do arithmetic on them
- a derived heartbeat requirement, and a malformed control proven non-retryable without replay
  advancement
- a replay snapshot, and correlation/trace identity stable across replay
- `streamClosed` as the terminal signal

If you find the envelope genuinely insufficient for bounded reconnect, that is a finding to raise
before implementing — not a second contract to invent.

## The defect

Read #1326 in full (`gh issue view 1326 --repo rickylabs/netscript`) and re-verify every claim
against the worktree. Quote its acceptance rows into your plan from the live body.

The producer drops writes permanently after an initial connection failure and never attempts
reconnect. Your PLAN-EVAL for #1329 already established the shape of what a reconnecting consumer
needs; you own the **producer** side of that story.

## Mission

1. **Contract first.** Define the producer's reconnect, readiness, buffering and shutdown semantics
   as an explicit contract before writing implementation: what is retried, what is bounded, what is
   dropped and when a caller learns about it. Silent data loss is the defect — a fix that merely
   moves where writes vanish is not a fix.
2. Cover the failure modes #1326 names: initial outage, mid-session outage, ordering under
   reconnect, buffer overflow, cancel/stop during retry, and recovery.
3. **RED-first, and show the RED.** A test that passes both before and after your change proves
   nothing. For each behaviour, record the pre-fix failure with its raw exit code.
4. Correlated OTEL across the reconnect boundary — a trace that survives the outage is the evidence
   that the recovery is real rather than a fresh unrelated session.
5. Gates: focused tests, `doc:lint` over the full export map if exports move, `publish:dry-run`,
   scoped check/lint/fmt, `quality:gate`, `arch:check`, then the serialised one-pass
   `scaffold.runtime` — **request the token; do not start it.**

## Boundary

`behavior.otel.stream-consumer` and `behavior.otel.traces` are currently **deferred** out of the
critical `scaffold.runtime` selection, owned by **#1398** (job executions are never published to the
durable stream — root cause is missing `setMutationHook` wiring in the `bin/runtime.ts` entrypoints).
That deferral is not yours to fix and not yours to widen. If your work makes those gates passable,
say so — do not re-enable them unilaterally.

Open the draft PR with `Closes #1326` only when every acceptance row is truthfully tickable.

---

# (inlined) Shared supervisor contract — 0.0.5 stable-cut waves

Every W2+ slice brief in this run includes this contract by reference. Read it fully before acting.

## Non-negotiables

1. **You do not merge, publish, cut, or dispatch a release workflow.** The milestone orchestrator
   holds merge and canary authority. You land a green, evaluated draft PR and stop.
2. **You do not self-certify.** After your gates are green, the orchestrator performs the Tier-A
   slice review before sign-off, and a separate-session IMPL-EVAL runs on the opposite family
   (**Claude · Fable 5 · medium**, because your work is Codex-authored). Ask the orchestrator to
   launch it; never launch it yourself and never resume/relabel a stale evaluator session.
3. **One writer per worktree/thread.** Do not start a second sender, a rival `codex resume`, or an
   app-server client for your own thread. If you need a steer, the orchestrator sends it.
4. **The honesty rule.** A criterion you cannot truthfully tick does not get ticked. Say so, and the
   orchestrator moves the row or splits the issue. An observational row ("a follow-up run shows…",
   "on the owner's machine…") can never be closed by your PR — reference it, do not close it.
5. **Green gate ≠ done, and silence ≠ pass.** A gate that did not execute is a missing verdict, not
   a pass. Report the raw exit code and the command you ran, never a truncated excerpt.

## Gates you must turn green — these are deliverables, not chores

| Gate                                                              | Command                                                                                                                                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scoped type-check                                                 | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root <path> --ext ts,tsx`                                                                                                               |
| Scoped lint                                                       | `.llm/tools/run-deno-lint.ts --root <path> --ext ts,tsx`                                                                                                                                                  |
| Scoped format                                                     | `.llm/tools/run-deno-fmt.ts --root <path> --ext ts,tsx`                                                                                                                                                   |
| **Framework-wave law** (any `packages/**` or `plugins/**` change) | `deno task quality:gate` — the scoped wrappers pass code containing `any`, `as unknown as`, and inline `deno-lint-ignore no-explicit-any`; `quality:gate` does not. This is the hole that let #745 merge. |
| Doctrine fitness                                                  | `deno task arch:check`                                                                                                                                                                                    |
| Doc-lint (any export-map change)                                  | `deno task doc:lint --root <pkg> --pretty`                                                                                                                                                                |
| Publish dry-run (any publishable surface change)                  | `deno task publish:dry-run`                                                                                                                                                                               |
| Review threads (before ready-for-review)                          | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr <n> --pretty`                                                                                                                        |

A new `// deno-lint-ignore`, `as unknown as`, or `@ts-ignore` introduced to green a wrapper is a
review-blocking finding. The only `quality:scan` escape hatch is an inline
`// quality-allow: <reason>` on the offending line, and its count is reported.

## The expensive gate is serialised — ask before you run it

`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` is the one-pass runtime verdict.
Three concurrent runs in 0.0.4 produced two failures that were **contention, not defects**. This
wave has three lanes and one token.

**Protocol:** when your slice is otherwise gate-complete, write `EXPENSIVE-GATE-REQUEST` in your
slice's `worklog.md`, push, and tell the orchestrator. Wait for the grant. Do not start it
speculatively, and do not split it into individual `gates` invocations when a full runtime verdict
is required.

Before and after any run that starts containers or an AppHost:

```
deno task agentic:leak-check -- --slice-dir <slice-dir> --worktree <your worktree>
```

Review every foreign/unknown-owner entry and **leave it alone**. Teardown is
`deno task agentic:teardown -- --slice-dir <dir> --worktree <wt>` and mutates only with `--apply`,
scoped to positively proven resources. Verify the artefact, never the exit code: three agents in
0.0.4 claimed to have stopped their AppHost while all three process trees were still running.

## Environmental hazards known on this host

- Never delete `deno.lock`, run `deno cache --reload`, or delete caches. Root `deno.lock` in the
  coordination checkout is protected; touch only your own worktree's lock, and only when the change
  is a real dependency change you intend to commit.
- Scoped wrappers spawn `deno check` — pass `--deno-arg --no-lock` so a validation run does not
  rewrite your lock (C-D21).
- Quarantined worktrees `/home/codex/repos/ns005-t2a-refresh.6hYJaW` and
  `/home/codex/repos/ns005-t2b-refresh.DMBKiM` belong to a dead run. Do not clean, reuse, or modify.
- `deno check` over workspace code needs `--unstable-kv`.
- Prefix read-heavy `git`/`gh`/`grep`/`ls`/`docker` with `rtk`; wrap `deno task` runs in
  `rtk proxy`.

## PR lifecycle

1. Open the **draft PR directly against `main`** in the same session as your first commit, so its
   commit list is live and reviewable from mobile. Never target this run's orchestrator branch.
2. Body carries the closing keyword **only** for issues your PR fully and truthfully satisfies
   (`Closes #N`). Partial work uses `#N` with a written statement of what remains. Apply the
   namespaced labels (`type:`/`area:`/`priority:`/exactly one `status:`) and milestone `0.0.5`.
3. Commit **by slice**, not by monolith. Each slice: commit → push → comment on the draft PR with
   scope, commit hash, and gate evidence → update your run-dir `worklog.md` in the same slice.
4. When gates are green, set `status:impl-eval` and tell the orchestrator. Do not mark ready for
   review yourself.

## Reporting

Write findings, not adjectives. If you discover a defect outside your scope, do **not** widen the PR
— report it and the orchestrator files it with full taxonomy. If your issue turns out to be
unimplementable as scoped, say so before you build a workaround: that is a rescope decision, and it
is the orchestrator's to make.

## Wave 3 additions — earned in Wave 2, do not rediscover

**Your plan is gated.** Under the owner-ratified Plan-Gate split, the _milestone_ plan is already
`PASS`; your **group brief and its slice table are what get evaluated for your slice**. So: do
research, write your plan with an ordered commit-slice table naming files and the proving gate per
slice, open the draft PR, set `status:plan-eval`, and **stop**. The orchestrator launches a separate
Claude · Fable 5 PLAN-EVAL. Do not implement product source before it returns `PASS`.

**Five things Wave 2 paid for:**

1. **A gate that cannot fail is worse than no gate.** Every negative you write must be shown failing
   before you trust it. W2-C's `behavior.live-db-endpoint` took six runtime passes and five of the
   failures were in the gate, not the product — a stderr getter read while stderr was inherited, a
   connection-string dialect the validator did not know, a health payload shape the matcher
   invented, and a telemetry path unusable against a detached dashboard. Each fix was correct and
   the next assumption failed. **Derive shapes from the producing contract; do not guess them.**
2. **Report gates by name, not by aggregate.** A green `Summary: passed=76 failed=0` in this wave
   turned out to have skipped the four gates the slice existed to prove. Name each decisive gate and
   what it returned. The aggregate line now also prints `skipped=`; a nonzero value means something
   was deferred and you must say what.
3. **Diagnose before repairing.** W2-B burned two runtime passes on selector repairs before an
   empirical audit showed the record it was selecting is never published at all. If two attempts
   fail on the same assumption, stop and measure instead of picking a third.
4. **Read the issue, not a summary of it.** Three separate errors this wave came from trusting a
   well-written claim: an issue carried as blocked by requirements its body never contained, four
   closure rows nearly ticked on evidence their bodies never accepted, and a root-cause mechanism
   named in three documents that source history falsified. **Quote acceptance rows from the live
   issue body.**
5. **Disclose narrowings unprompted.** Both Wave 2 lanes that volunteered "this is proven by focused
   test rather than against the real service" were believed on everything else. That is the trade.
