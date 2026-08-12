use harness

# Slice brief — #1583 chat connection opens duplicate durable SSE subscriptions

**Codex · GPT-5.6 Sol · medium** (`normal_implementation`). **P0.** Research the mechanism first —
the issue gives symptoms, not a root cause — then fix and prove it.

| Field | Value |
| --- | --- |
| Issue | **#1583** (`priority:p0`, `area:streams`, `area:ai`) |
| Worktree | `/home/codex/repos/ns006-1583` |
| Branch | `fix/1583-duplicate-sse-subscriptions` |
| Base | `main@fc312f211` — the **canary.4 terminal-green** checkpoint |

## SKILL

- `deno-fresh` — islands, hydration, Preact effect/lifecycle semantics.
- `netscript-doctrine` — `packages/fresh` is framework code; `runtime/ai` is published surface.
- `netscript-tools`, `netscript-pr`, `netscript-harness`.

## The defect

`durableStreamConnection` / `createNetScriptChatConnection`
(`packages/fresh/src/runtime/ai/create-chat-connection.ts`) used as the connection for TanStack AI
Preact `useChat({ live: true })`. One page, **one** ChatPane island produced:

- **1 component mount**
- **3 renders** of the same component instance
- **0 unmounts** before navigation
- **2 simultaneous live SSE GETs** to the same durable chat stream

Both live requests stayed active. From a **single** Playwright CDP target, so the second request is
**not** the separately launched desktop CEF client — that alternative is already ruled out; do not
re-investigate it.

Navigating away aborted both and surfaced two `The signal has been aborted` overlays from
`@remix-run/node-fetch-server`.

**Why it matters beyond tidiness:** browsers allow ~6 concurrent connections per origin on HTTP/1.1.
Duplicate chat subscriptions consume two slots and correlate with page freezes when other
session/knowledge streams are active. Two consumers processing the same durable chunks also risks
**duplicate transcript entries**.

## Research first — the issue does not name the mechanism

Establish, with `path:line` evidence, **before** changing anything:

1. **What is created per render vs per mount?** 1 mount + 3 renders + 2 subscriptions is the signature
   of a subscription started in render or in an effect whose dependencies change identity across
   renders. Find the exact creation site.
2. **Is there any dedupe/memo today?** The module already documents `stop()`/`dispose()` parity and an
   SR2-tolerant subscribe path — determine whether a second subscribe is meant to be idempotent and is
   not, or whether nothing dedupes at all.
3. **Which layer should own dedupe** — the connection handle, the subscribe path, or the consumer's
   effect? Prefer the layer that makes the guarantee **structural** rather than dependent on a caller
   getting an effect dependency array right.
4. **Does `stop()`/`dispose()` actually cancel an in-flight live GET?** The abort overlays on
   navigation suggest requests survive until navigation.

Report findings before/with the fix. If the mechanism turns out to be in the **consumer's** effect
rather than this package, **stop and report** — do not reshape the published API to compensate for a
caller bug without saying so.

## Constraints

- **Preserve the existing seed/live contract.** The module doc is explicit that seed and live MUST
  route through the documented path and that live begins at the first live chunk. Do not change replay
  offset semantics, SR2 tolerance, or the message projection shape.
- **No published-surface growth** unless the fix genuinely requires it; if it does, say why.
- **Do not touch** `packages/fresh/src/application/defer/**` or `define-page/**` — a sibling Fresh
  group (#1576/#1568/#1569) owns that subtree and will run in parallel.
- **The `isPartial` guard applies repo-wide:** never suppress a cache read or seed merely because a
  request is a partial. Not relevant to this file today — keep it that way.

## Required tests

1. **One mount ⇒ exactly one live subscription**, across **multiple renders** of the same instance.
   Assert the **count of live subscribe calls / open requests**, not merely that a connection exists.
   This is the regression that must not return.
2. **`stop()`/`dispose()` cancels the in-flight live request** — assert the request is aborted, not
   just that the handle reports stopped.
3. **Re-subscribe after an explicit stop still works** — the dedupe must not wedge a legitimate
   re-subscription.
4. Existing `create-chat-connection_test.ts` and `_integration_test.ts` stay green; if either needs
   changing, explain why rather than editing it to fit.

Each test must fail without your fix. State which.

## Gates

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/fresh --ext ts,tsx
deno task --cwd packages/fresh test
deno task doc:lint --root packages/fresh --pretty
deno task quality:gate
```

`arch:check` does **not** cover `packages/fresh` — run an explicit target quality scan over
`packages/fresh/src` and state that the package verdict rests on it. Use `deno task --cwd <pkg> test`,
never a bare `deno test <path>`. **Do not run `e2e:cli`.**

**`deno.lock`:** if it moves and you added no dependency, **stop and report**. If you added one, the
delta is whatever Deno deterministically generates — never hand-reduced. Incomplete lock closures cost
this lane a canary cycle and two P0 issues.

## Commit trail

One draft PR against `main`. Title:
`fix(ai): open exactly one durable SSE subscription per mounted chat island`.
Body per `netscript-pr` with **`Closes #1583`** in `## Scope`, your research findings, and the pasted
per-test RED evidence. Map #1583's acceptance with `box-index` entries; **no empty
`acceptance-evidence` entry list** (#1561). Labels `type:fix`, `area:ai`, `area:streams`,
`status:impl`, milestone `0.0.6`. Push by explicit refspec; post `[PHASE: IMPL]` with commit hash and
real gate output.

## Reporting contract

Report the mechanism with citations, which layer you chose to own dedupe and why, exact test names
with what each catches, verbatim gate output, and **anything you could not verify**. Do **not** flip
the PR to ready, do **not** merge, do **not** dispatch a canary.
