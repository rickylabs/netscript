use harness

# Slice brief — #1457 chat stream proxy drops durable State-Protocol query parameters

Implementation agent for one small, fully specified slice. **Codex · GPT-5.6 Sol · low**
(`light_implementation`). Do exactly this slice; do not refactor neighbours, and do not touch the
#1459 or #1548 surfaces (`application/defer/**`, `stream-url-resolver.ts`) — they are separate PRs in
this same lane.

| Field | Value |
| --- | --- |
| Issue | #1457 (`priority:p1`) |
| Worktree | `/home/codex/repos/ns006-1457` |
| Branch | `fix/1457-chat-proxy-query-forwarding` |
| Base | `origin/main@f99cb4fbf` |
| Run dir | `.llm/runs/release-0.0.6-features--orchestration/` |

## SKILL

- `netscript-doctrine` — `packages/fresh` is framework code; this changes a **published helper's**
  observable behaviour. Read before changing the option surface.
- `deno-fresh` — Fresh 2.x route/handler conventions.
- `netscript-harness` — slice/commit trail, drift recording.
- `netscript-tools` — validation wrappers and what counts as gate evidence.
- `netscript-pr` — draft PR body, closing keyword, phase comments, labels.

## The defect, exactly

`createNetScriptChatStreamProxy()`
(`packages/fresh/src/runtime/ai/stream-proxy.ts:159-211`) resolves the upstream URL at `:172`:

```ts
const upstreamUrl = resolveChatSessionUrl(target, { streamPath });
```

and builds the upstream request from it at `:206` — **without ever reading
`new URL(request.url).search`**. Headers are carefully forwarded (`:179-191`); the query string is
silently dropped.

A durable chat subscriber calling
`/api/chat-stream?id=session-1&offset=42&live=sse&handle=h1` therefore reaches the durable-stream
service with **no** `offset`, `live`, or `handle`, so resume and live-polling semantics are lost.

`resolveChatSessionUrl` (`packages/fresh/src/runtime/ai/create-chat-connection.ts:60-66`) delegates
to `buildStreamUrl(resolveChatStreamSubpath(...), baseUrl)`, so the resolved URL **may already carry
its own query**. That matters for the fix — see D2.

## LOCKED decisions — implement these, do not re-decide

The issue permits either "forward by default" or "a documented query-mapping hook". **Both**, in this
shape:

- **D1 — forward the incoming query by default.** Every query parameter on the incoming request is
  forwarded to the upstream URL, **except `id`**, which is application routing metadata and is
  dropped. This is the zero-config behaviour a consumer gets with no new options, and it is what
  removes the consumer-side adapter the issue names.
- **D2 — merge, never clobber.** Because `resolveChatSessionUrl` can return a URL that already has a
  query, forwarding must **merge onto** the resolved URL's existing parameters rather than replacing
  its search string. On a key collision the **resolved URL's own value wins** — the helper's
  configured `streamPath` is more authoritative than client input, and letting a client override it
  would be a request-forgery seam. Preserve repeated keys (`URLSearchParams` `append`, not `set`).
- **D3 — an optional documented mapping hook**, e.g. a `query` option receiving the incoming
  `URLSearchParams` and returning the parameters to forward. When provided it **replaces** the D1
  default (the caller takes full control, including whether `id` survives). When absent, D1 applies.
  This is additive: existing callers compile and behave identically **except** that the query is now
  forwarded, which is the fix.
- **D4 — no change to headers, auth, body, streaming, abort, or response sanitization.** The
  `accept-encoding: identity` line (`:191`) and the `duplex: 'half'` body handling (`:194-205`) are
  load-bearing for other defects; leave them alone.

If you conclude D1 and D2 conflict for a real case, **stop and report** rather than choosing.

## Required tests

The issue names them: `offset`, `live`, `handle`, and `cursor`.

1. Each of `offset`, `live`, `handle`, `cursor` present on the incoming request **reaches the
   upstream URL** with its value intact. Assert against the URL the injected `fetch` actually
   receives — not against a helper's return value.
2. `id` is **dropped** from the upstream URL while the others survive (the exact case from the issue:
   `?id=session-1&offset=42&live=sse&handle=h1`).
3. **Collision:** when the resolved upstream URL already carries a parameter the client also sends,
   the resolved URL's value wins (D2). This pins the anti-forgery direction and would otherwise
   regress silently.
4. **Repeated keys** are preserved rather than collapsed.
5. The `query` hook (D3), when supplied, replaces the default and can suppress or add parameters.
6. A no-query request still produces exactly the URL it produces today (no stray `?`).

Each test must fail if its own behaviour regresses. Use the injectable `options.fetch` seam
(`:163`) to capture the upstream `Request`.

## Gates — deliverables, not hopes

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/fresh --ext ts,tsx
deno task quality:gate
deno task --cwd packages/fresh test
deno task doc:lint --root packages/fresh --pretty
```

**Use the package-declared `deno task --cwd <pkg> test`, never a bare `deno test <path>`** — the bare
form omits `--allow-env` and exits 1 on `NotCapable`. That was a real defect in an earlier brief in
this lane; it is corrected here rather than repeated.

`quality:gate` is mandatory for a `packages/**` slice. **Check whether its configured roots actually
cover `packages/fresh`** — they demonstrably omit several packages (tracked as **#1542**). If
`packages/fresh` is not covered, run an explicit target scan and say so; do not report the repo gate
as proof for this package.

Do **not** run `deno task e2e:cli` — this slice does not touch scaffold output, and that gate is
expensive and serialised across the lane.

**Known hazard:** `deno fmt` rewraps long lines and can silently undo a scripted string edit. After
the format wrapper, re-grep for the parameter names you introduced and confirm they are still there.

## Commit trail

1. Open a **draft PR against `main`** in the same session as your first commit. Title:
   `fix(fresh): forward durable State-Protocol query parameters through the chat stream proxy`.
   Body per `netscript-pr`: `Closes #1457` in `## Scope`, run-dir path, slice checklist, Definition of
   Done, and a fenced `acceptance-evidence` block. **Use `box-index` entries**, not full-text `box:`
   matching — this issue's expectations wrap across lines and the mirror matches a checkbox's first
   line. Labels `type:fix`, `area:fresh`, `area:plugin-ai`, `area:streams`, `status:impl`, milestone
   `0.0.6`.
2. Commit per slice, push by **explicit refspec**
   (`git push origin HEAD:refs/heads/fix/1457-chat-proxy-query-forwarding`), and post a
   `[PHASE: IMPL]` comment with the commit hash and **pasted real gate output**.
3. Keep your slice worklog current in the same commit.

## Reporting contract

Report: what changed and where; the exact test names and what each would catch; verbatim gate output;
and **anything you could not do, could not verify, or that surprised you**. A red gate reported is
useful; a red gate worked around silently is the failure mode this brief exists to prevent.

You do **not** merge and you do **not** flip the PR to ready — flipping to ready triggers the
automatic IMPL-EVAL, and that trigger is the orchestrator's to fire. Merge authority is the
orchestrator's.
