use harness

# #1730 — bounded IMPL-EVAL repair

You are the implementation author for this leaf. S1–S4 are complete and **Tier-A accepted**; the
separate-session IMPL-EVAL returned `FAIL_FIX`. **Repair only the findings listed below — nothing
else.**

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1730` |
| Branch | `test/ai-request-context-provider-guard`, PR **#1763** |
| Start head | verify yourself; expect `1baabbd6` (or the evaluator's evidence commit on top) |
| Base | already converged with `origin/main` — **do not re-integrate** unless a finding requires it |
| Run dir | `.llm/runs/test-ai-request-context-provider-guard--1730/` |

## SKILL

`netscript-harness`, `netscript-tools`, `netscript-pr`, `rtk`. Read `evaluate.md` first — **it is your
specification.** Do not edit it; it is another session's record.

## Findings to repair

### F-1 (medium) — the guard ignores a provider-bound argument. **This is the whole repair.**

`loopProviderBoundPayload` projects `messages` / `system` / `tools` / `options` from the *request*,
but `client.stream()` takes a **second argument**, `ChatClientCallOptions`, and the loop passes
`modelOptions` through it. That field is documented provider-native and is merged into the TanStack
`modelOptions` at **highest priority**.

The evaluator proved the hole with **mutation B2**:

```ts
{ signal, modelOptions: { ctx: JSON.stringify(input.context) } }
```

**All 147 tests stayed green.** A guard whose stated purpose is a tripwire on *every* provider-bound
loop path, with a known un-projected provider-bound argument at the very seam under test, reproduces
the #1696 S-1 false-done state one argument over. That is why this is `FAIL_FIX` and not a nit.

**Fix (test-only, inside your existing ceiling):**

- Have the recording client capture its second argument: `async *stream(request, options)`.
- Include the call options **minus `signal`** — at minimum `options?.modelOptions` — in the
  per-request provider-bound projection.
- **Demonstrate B2 red** in `worklog.md` exactly as B was demonstrated: apply, show the named test
  fail, revert, prove the tree clean and the suite green.
- Keep `request_context_test.ts` **≤ 500 LOC** (495 now) — compact if needed; F-10 ceiling.

### F-2 (low, optional) — the `modelId` path

`provider.createChatClient(modelId)` is provider-bound and is caught only *incidentally* by
`agent loop: single text turn transitions idle -> running -> done`, not by the named guard
(mutation B3). Either record `modelId` in the recording provider and fold it into the projection
while fixing F-1, **or** note the incidental owner in the test comment. Your call — say which.

### F-3 + F-4 (low) — the receipt trail is inaccurate about `publish-dry-run`

- **F-3:** the PR body and S4 comment cite `publish-dry-run` at **150 ms**. That receipt was a replay,
  not a run; Tier-A re-cut it at **attempt 2, 30,719 ms** (wall-clock timed at 40,318 ms). The repair
  is recorded nowhere durable.
- **F-4:** the receipt's `argv` is the **workspace** `deno task publish:dry-run` at the worktree root,
  not the plan row-8 **package-scoped** `deno publish --dry-run --allow-dirty` in `packages/ai`, and
  the S4 comment says "package cwd". Coverage is a superset; the *claim* is inaccurate.

**Fix:** state both facts accurately in the receipt audit — actual argv, actual cwd, attempt 2 and its
duration. Optionally add the package-scoped run as the supplemental it was planned to be.

### F-6 (low) — the receipt audit has no durable home

`worklog.md § Static Gates` is frozen at `PENDING_RECEIPTS` by design. Since F-1 moves the content
head anyway, **record the receipt audit table in `worklog.md` in this slice**, then re-cut the named
set at the new head.

### Not yours

**F-5** (no Tier-A evidence on the commit trail) is closed — the supervisor posted the Tier-A review
to PR #1763. **F-7** is informational, no action for this leaf.

## Settled — do not relitigate

- **The guard itself is accepted.** Mutation B at `agent/loop.ts:159` turns
  `agent loop: keeps context out of every provider-bound retry and continuation request` red (8/1) and
  reverts clean — verified independently at two heads. Do not rebuild it.
- **S3's rename is accepted**: `Anthropic adapter omits context from direct wire serialization`, with
  its boundary comment.
- **`doc-lint` is a contracted base-red delta** (base 20 / head 20), never a PASS. Do not chase green.
- **JSR audit** is 2 findings at head and base, no increase, base-inherited. Not yours.
- **No product behaviour change.** `agent/loop.ts` and the bridge stay read-only except for
  temporary, reverted mutation demonstrations — verify with `git diff` that none is committed.

## Evidence

Re-cut the plan's named receipts at your new content head through `.llm/tools/gates/run-gate.ts`,
each `gitHead == actualGitHead`, named explicitly, never a glob. Receipts live under **ignored**
`.llm/tmp/gate-receipts/test-ai-request-context-provider-guard--1730/receipts/` by design — land the
evidence commit **first**, then cut, so no commit moves the head out from under them.

**Verify every receipt by `argv` and `durationMs`, not `exitCode`.** One receipt on this very leaf
recorded `publish-dry-run` at **150 ms** when the real task takes ~30–40 s — a replay, not a run. It
was caught by that check and re-cut at 30,719 ms. An expected-red gate will happily record a usage
error as `exit 1` and look correct.

Prove `deno.lock` byte-unchanged and that no generated carrier moved (`git status`).

## Boundaries

No merge, ready-flip, relabel, milestone change, issue close, acceptance-box ticking, or PR body
rewrite — the body and its fenced `acceptance-evidence` block are supervisor/coordinator-owned. No
`e2e:cli`, Aspire, Docker or browser gates; no runtime lease is held. Push by explicit refspec.

Commit, push, post the per-slice PR comment, and **stop** for supervisor Tier-A. Report your content
and evidence heads.
