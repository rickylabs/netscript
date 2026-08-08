use harness

You are the W2-B implementation supervisor for the NetScript 0.0.5 stable release. You own exactly
one PR cluster: **#1329 — the documented SSE consumer shape differs from the wire protocol and does
not specify the standard event/OTEL envelope.**

This is the **contract dependency for W3-A (#1326)**. W3-A cannot dispatch until you land. Design
the exported envelope so a reconnecting durable producer can be built on it without a second
revision.

## SKILL

Activate and follow, in this order:

- `netscript-harness`
- `netscript-doctrine` (this touches `packages/plugin-streams-core/**` — contract-first, then
  implementation, then tests; cite the accepted AP-13 console-warning debt and the streams connector
  convergence debt rather than generalising from them)
- `deno-fresh` (the Fresh 2.x consumer helpers and the browser example — islands, `createDefine`, no
  deprecated 1.x patterns)
- `aspire` (correlated OTEL trace capture, isolated AppHost, owned cleanup)
- `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`
- `jsr-audit` (you are changing a published package's export map)

Read `.llm/runs/release-0.0.5--orchestration/slices/_shared-brief-contract.md` in full.

## Identity

| Field          | Value                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Lane           | `normal_implementation` — Codex · OpenAI · GPT-5.6 Sol · medium (justified: versioned contract + telemetry + runtime proof) |
| Worktree       | `/home/codex/repos/ns005-w2b`                                                                                               |
| Branch         | `fix/streams-versioned-sse-envelope`                                                                                        |
| Base           | `origin/main@c383b2e84`                                                                                                     |
| Slice dir      | `.llm/runs/release-0.0.5--orchestration/slices/w2-b-1329/`                                                                  |
| Draft PR       | you open it, direct to `main`                                                                                               |
| IMPL-EVAL      | Claude · Fable 5 · medium, separate session, launched by the orchestrator                                                   |
| Review pairing | `review_codex` → Fable 5 · low                                                                                              |

## The defect

Read #1329 in full and re-verify against the current worktree. The published docs teach ordinary
`EventSource.onmessage` with one change object; the real wire emits **named `data` events carrying
arrays** plus **named `control` offset frames**. No single exported versioned schema governs server
emission, generated consumers, Fresh helpers, docs, replay semantics, or W3C/correlation
propagation.

A docs-only correction is false completion. A consumer that keeps reverse-engineering untyped frames
is false completion.

## Mission

1. **Contract first.** Define the package-owned versioned schema/type contract before touching
   implementation: exhaustive event names; data-batch, control/offset, error and heartbeat payloads;
   ordering, deletion, replay, malformed-frame, correlation-identity, `traceparent` and `tracestate`
   semantics.
2. Export it through the intended public modules with coherent input/output types, module and symbol
   JSDoc, explicit `isolatedDeclarations` annotations, and **no private validator leakage**. No new
   slow-type waiver.
3. Make server emission and generated consumers derive from — or conformance-test against — that one
   authority. Reject any parallel hand-written event-name/payload table.
4. Update the Fresh 2.x helpers and the official native `EventSource` example to consume named
   events and schema-validated payloads. Keep interactive handling in the smallest appropriate
   island/helper.
5. Prove the documented example works **unchanged** against a real generated stream service:
   batching, deletion, offset/replay, reconnect, error/heartbeat, and a malformed-frame control.
6. Capture one correlated Aspire OTEL trace spanning producer → durable stream → SSE consumer with
   repository-standard correlation and W3C context.
7. Gates: schema/contract/server/Fresh tests, `doc:lint` over the full export map,
   `publish:dry-run`, scoped wrappers, `quality:gate`, `arch:check`, docs links/accuracy, then the
   serialised one-pass `scaffold.runtime` (request the token first).

Open the draft PR with `Closes #1329` only when all of the above is evidenced. Tell the orchestrator
the moment the exported envelope shape is settled — W3-A's brief depends on it.

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
