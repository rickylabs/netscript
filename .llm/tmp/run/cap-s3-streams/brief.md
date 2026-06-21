# S3 Codex Slice — Streams publish/subscribe (contract-first; STOP-rescope guarded)

Run-id: `cap-s3-streams` · Slice S3 of the capability-caveats fix track. PLAN-EVAL PASS on PR #65.
Worktree: `/home/codex/repos/netscript-cap-s3-streams` · Branch: `fix/cap-caveat-s3-streams` (off `origin/main`, at 159db1f).

You are a WSL Codex implementation agent for NetScript. **Use harness.** Activate skills: `netscript-harness`, `netscript-doctrine` (this is a plugin — ARCHETYPE-5), `rtk`. You implement only; the supervisor (Claude) opens the PR and dispatches IMPL-EVAL. Do NOT self-certify.

This is the **riskiest** slice. Read the STOP condition FIRST. Do not force a large implementation.

## Problem (validated by PLAN-EVAL against current main)
`plugins/streams/src/public/stream-api.ts` — `defineStreamProducer` returns a `publish` that is an
empty `async () => {}` (`:28` area) and `defineStreamConsumer` returns a `subscribe` that registers
nothing and returns a no-op unsubscribe (`:43` area). Also see `create-durable-stream.ts`. Streams
publish/subscribe are **silent no-ops** — a documented capability that does nothing.

## Fix — CONTRACT-FIRST (investigate, then decide; you may NOT silently no-op)
1. Read the streams contract and runtime: `stream-api.ts`, `create-durable-stream.ts`, the streams
   plugin runtime/manifest, and the topic definition types. Determine whether a **real transport**
   already exists to carry stream payloads (e.g. the `@netscript/queue` package, an event bus, KV,
   or a plugin runtime channel) that producers/consumers were meant to bind to.
2. Choose ONE, by what the architecture actually provides:
   - **(a) Wire to a real transport** — if a transport exists and binding `publish`/`subscribe` to it
     fits within an M-sized slice, implement real delivery (publish enqueues/emits; subscribe receives
     and invokes the handler; unsubscribe detaches). PREFER THIS if the transport is already there.
   - **(b) Honest rejection + debt** — if no transport exists and building one is beyond this slice,
     make `publish`/`subscribe` **explicitly surface non-support** instead of silently succeeding:
     `publish` throws/rejects `unsupportedOperation('stream.publish')` (and `subscribe` likewise, or
     returns in a way that cannot be mistaken for working delivery). Add a debt entry to
     `.llm/harness/debt/arch-debt.md` describing the real durable-stream transport that is deferred,
     and record a concrete rescope recommendation. This mirrors the accepted S2 outcome.
3. Record the chosen option + the contract/transport evidence in `worklog.md`.

## Constraints (binding)
- Keep the diff to the streams plugin (and `plugin-streams-core`/types only if the contract genuinely
  requires a small additive change). No unrelated churn. No `docs/` edits. S3 only.
- Do NOT change `deno.lock`, the catalog, version pins, or generated files.

## Gates (all required; wrap deno runs in `rtk proxy`)
1. New runtime test proving `publish`/`subscribe` either **deliver** (option a — a published payload
   reaches a subscribed handler) or **explicitly reject/raise** (option b) — never a silent no-op.
   `deno test` green for the streams plugin test(s).
2. `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/streams --ext ts,tsx`
   green (wrapper passes `--unstable-kv`).
3. `deno lint` green for the touched scope.
4. `git diff --stat origin/main -- deno.lock` must be empty.

## Report + commit
- Write `.llm/tmp/run/cap-s3-streams/worklog.md`: files changed, the decision + transport evidence,
  all gate results. Append the commit line to `.llm/tmp/run/cap-s3-streams/commits.md`.
- Commit message starts: `fix(streams): deliver (or explicitly reject) stream publish/subscribe instead of silent no-op`
  and ends with EXACTLY these two trailer lines:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_018fq9V7ujx7e1rWXi57qkPG
  ```
- `git branch --unset-upstream`, then push with an explicit refspec:
  `git push origin fix/cap-caveat-s3-streams:fix/cap-caveat-s3-streams` (never a bare push — this
  worktree tracks origin/main, so a bare push would target main).
- Do NOT open the PR. Final worklog line: `DONE <sha>` + a one-line gate summary.

## STOP condition (this slice is flagged risky — honor it)
If real durable-stream delivery requires new cross-package transport infrastructure beyond an M-sized
slice, do NOT build it here. Either take option (b) (honest rejection + debt + rescope note) if that
is clearly the minimal honest fix, OR if even the right boundary is unclear, STOP: record the full
findings and a rescope recommendation in `.llm/tmp/run/cap-s3-streams/drift.md` and hand back to the
supervisor. Never ship a silent no-op, and never half-build a transport.
