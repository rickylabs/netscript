# Worklog: RFC 0009 Slice 4 — Opt-in revocable authorization delegation for Fresh chat stream proxy (#2680)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-rfc-0009-s4-fresh-chat-proxy-auth--s4` |
| Branch | `feat/rfc-0009-s4-fresh-chat-proxy-auth` |
| Issue | `#2680` (`Part of #2146`, milestone `0.0.10`, blocked-by `#2679` merged at `17af13715`) |
| Archetype | Archetype 4 (`@netscript/fresh/ai`) |
| Scope overlays | `none` |

## Owner Direction (verbatim)

> "Then all merged RFC Ready for start implementation should be launched in separate main lanes with Neon and Fable 5.2 as reviewer (sub lane of it) + hydrogen on subsequent pass (where needed)"
>
> "Make sure relevant issues are assigned to milestone 0.0.10"
>
> "Merge all what is ready to merge as it lands"

### PLAN-EVAL Disposition

- `PLAN-EVAL: N/A` — governed directly by accepted RFC 0009 (`rfcs/0009-authorizing-stream-proxy.md`, merged at `af5107b8d` after `PLAN-EVAL: APPROVED` at `ab1ef854f6966168c66e93629c813d677d10e4f7`).

### Design Checkpoint

- **Strict legacy preservation (`authorize`/`recheck` omitted):** Legacy mode executes the exact original code path untouched; `packages/fresh/src/runtime/ai/stream-proxy_test.ts` remains byte-for-byte unchanged and passes unchanged. Supplying only one of `authorize`/`recheck` or passing authorized-mode options (`clientAuth`, `allowedOrigins`, `trustProxy`, `recheckEveryMs`, `revocationSource`, `policyTimeoutMs`, `clock`) without both hooks throws `TypeError` synchronously at construction.
- **Construction-time snapshotting & fail-fast validation:** All authorized-mode options (including `allowedOrigins` array copy) are snapshotted and validated eagerly via `createNetScriptStreamProxy` at construction so post-construction mutation cannot weaken policy.
- **Cohesive internal separation (`packages/fresh/src/internal/authorized-chat-stream-proxy.ts`):** Keeps `packages/fresh/src/runtime/ai/` directory child count unchanged (doctrine F-16) and both source files well under the 500-line cap (doctrine A8/F-1).
- **`GET` `live=sse` delegation:** Runs deterministic RFC 6750 credential selection + Cookie Origin/Fetch-Metadata guard first, resolves chat `target`/`streamPath`/`query` (preserving `target.baseUrl`, `target.headers`, embedded `streamPath` queries, `id`-dropping, repeated keys, collision precedence, `options.auth()`, and `options.fetch` receiving a `Request`), and delegates any `GET` carrying an `sse` `live` parameter to `@netscript/plugin-streams-core/proxy`'s `createNetScriptStreamProxy` for full delivery-unit revocation, push/expiry/idle timers, 3-tier response headers, and redaction.
- **`POST` & non-SSE `GET` authorized path:** Runs the same credential + CSRF/Origin guard and bounded `authorize` (with `clock`/`policyTimeoutMs`, exception-safe decision snapshotting, finite `expiresAtMs`, and reserved-header rejection), builds upstream headers from a strict allowlist (never forwarding client `Cookie` or `Authorization`, forcing `accept-encoding: identity`), preserves `POST` `duplex: 'half'` and non-SSE response headers (`application/json`, `etag`, `Stream-*`), strips static + dynamic `Connection` hop-by-hop and leaked auth/CORS headers, maps upstream `401`/`403`/`3xx` and unexpected non-SSE `GET` `text/event-stream` responses fail-closed to redacted `502`, and attaches validated `decision.responseHeaders` / additive `decision.setCookies` + `cache-control: no-store` / `vary`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-11-27 | S4 | bootstrap | Unwatched merged PR #2694, fetched `origin/main` (`17af13715`), branched `feat/rfc-0009-s4-fresh-chat-proxy-auth`, verified zero open-PR overlap, linked `#2680` (`status:impl`). |
| 2026-11-27 | S4 | implement | Implemented `packages/fresh/src/internal/chat-proxy-headers.ts`, `packages/fresh/src/internal/chat-proxy-guard.ts`, and `packages/fresh/src/internal/authorized-chat-stream-proxy.ts` (all under the 500-line doctrine cap), extended `NetScriptChatStreamProxyOptions<TGrant = unknown>` and `createNetScriptChatStreamProxy` in `packages/fresh/src/runtime/ai/stream-proxy.ts` with zero extra `@netscript/fresh/ai` exports, documented legacy vs opt-in security posture in `packages/fresh/src/runtime/ai/README.md`, and added full Gate 8 + security conformance suite in `packages/fresh/tests/chat-stream-proxy-auth_test.ts` (leaving `packages/fresh/src/runtime/ai/stream-proxy_test.ts` byte-for-byte untouched). |
| 2026-11-27 | S4 | verify | Local gates passed: 15/15 sanitized chat proxy tests (9/9 unchanged `stream-proxy_test.ts` + 6/6 Gate 8 conformance + live HTTP `duplex: 'half'` tests under `--sanitize-ops --sanitize-resources`) and full `packages/fresh/src/runtime/ai` test suite; `deno task --cwd packages/fresh check` (incl. `check:streams-types`) and `packages/mcp` check; `run-deno-check` / `run-deno-lint` / `run-deno-fmt` across `packages/fresh` (0 errors/occurrences/findings); `deno doc --lint packages/fresh/src/runtime/ai/mod.ts` reports 0 errors on `stream-proxy.ts` (only 2 pre-existing merge-base `private-type-ref` errors remain unchanged on untouched `create-chat-connection.ts:115` `NetScriptChatSendMessage` referencing `UIMessage`/`ModelMessage`); `quality:gate` + `arch:check` (doctrine FAIL=0, zero new warnings on `packages/fresh`); `check:emitted-samples` (48 samples); regenerated `export-surface-corpus.generated.ts` and `publish-assets.generated.ts` and verified `check:mcp-export-corpus`, `check:publish-assets`, `check:agent-docs-prose`, `check:netscript-jsr-specifiers`, `docs:exports-drift`, `docs:accuracy`, `docs:jsdoc-examples`, `docs:readme-fences`; `deno publish --dry-run --allow-dirty --config packages/fresh/deno.json`; zero `deno.lock` churn. |
