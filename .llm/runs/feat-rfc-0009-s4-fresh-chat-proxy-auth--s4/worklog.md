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
- **Construction-time snapshotting & fail-fast validation:** All authorized-mode options (`allowedOrigins` array copy, static `target` copy, bound/frozen `clock` and `revocationSource` port adapters, and strict original shape validation rejecting `Set` origins, `{ subscribe: null }`, and `null` overrides) are snapshotted and validated eagerly via ONE shared `createNetScriptStreamProxy` instance at construction so post-construction mutation cannot weaken policy or replace active hooks.
- **Cohesive internal separation (`packages/fresh/src/internal/authorized-chat-stream-proxy.ts`, `chat-proxy-plan.ts`, `chat-proxy-guard.ts`, `chat-proxy-headers.ts`):** Keeps `packages/fresh/src/runtime/ai/` directory child count unchanged (doctrine F-16), keeps `packages/fresh/src/internal/` well within the 12-child limit (8 entries), and keeps every source file well under the 500-line cap (doctrine A8/F-1).
- **`GET` `live=sse` delegation (single shared core proxy):** Enforces the HTTP method boundary up front (`GET`/`POST` only; other methods return `405` + `Allow: GET, POST` before policy/upstream), runs deterministic RFC 6750 credential selection + Cookie Origin/Fetch-Metadata guard, strips client credential/transport headers (`cookie`, `authorization`, `proxy-authorization`, `host`, `origin`, `referer`, `sec-fetch-*`, `x-forwarded-*`, hop-by-hop) from `target.headers` overlays, and delegates any `GET` carrying an `sse` `live` parameter to the ONE shared `createNetScriptStreamProxy` instance (carrying per-request overrides via a request-keyed `WeakMap` + correlation traceparent map cleaned in `finally`) so all SSE readers share the global 1,000-reader cap (`503 Retry-After: 5` before policy/upstream) alongside full delivery-unit revocation, push/expiry/idle timers, 3-tier response headers, and redaction.
- **`POST` & non-SSE `GET` authorized path:** Runs the same method, credential + CSRF/Origin guard, sanitized `target.headers`, and bounded `authorize`, rechecks abort signals right at the upstream `fetch` boundary (including aborts triggered inside `auth()`), builds upstream headers from a strict allowlist (never forwarding client `Cookie` or `Authorization`, forcing `accept-encoding: identity`), preserves `POST` `duplex: 'half'` and non-SSE response headers (`application/json`, `etag`, `Stream-*`), validates RFC 9110 `Connection` tokens before stripping dynamic hop-by-hop headers, cancels rejected upstream bodies non-blockingly so stalled `body.cancel()` never hangs redacted `502` responses on upstream `401`/`403`/`3xx` or disallowed/ambiguous/combined SSE `Content-Type` responses on either `GET` or `POST`, and attaches validated `decision.responseHeaders` / additive `decision.setCookies` + `cache-control: no-store` / `vary`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-11-27 | S4 | bootstrap | Unwatched merged PR #2694, fetched `origin/main` (`17af13715`), branched `feat/rfc-0009-s4-fresh-chat-proxy-auth`, verified zero open-PR overlap, linked `#2680` (`status:impl`). |
| 2026-11-27 | S4 | implement | Implemented `packages/fresh/src/internal/chat-proxy-headers.ts`, `packages/fresh/src/internal/chat-proxy-guard.ts`, and `packages/fresh/src/internal/authorized-chat-stream-proxy.ts` (all under the 500-line doctrine cap), extended `NetScriptChatStreamProxyOptions<TGrant = unknown>` and `createNetScriptChatStreamProxy` in `packages/fresh/src/runtime/ai/stream-proxy.ts` with zero extra `@netscript/fresh/ai` exports, documented legacy vs opt-in security posture in `packages/fresh/src/runtime/ai/README.md`, and added full Gate 8 + security conformance suite in `packages/fresh/tests/chat-stream-proxy-auth_test.ts` (leaving `packages/fresh/src/runtime/ai/stream-proxy_test.ts` byte-for-byte untouched). |
| 2026-11-27 | S4 | verify | Local gates passed: 15/15 sanitized chat proxy tests (9/9 unchanged `stream-proxy_test.ts` + 6/6 Gate 8 conformance + live HTTP `duplex: 'half'` tests under `--sanitize-ops --sanitize-resources`) and full `packages/fresh/src/runtime/ai` test suite; `deno task --cwd packages/fresh check` (incl. `check:streams-types`) and `packages/mcp` check; `run-deno-check` / `run-deno-lint` / `run-deno-fmt` across `packages/fresh` (0 errors/occurrences/findings); `deno doc --lint packages/fresh/src/runtime/ai/mod.ts` reports 0 errors on `stream-proxy.ts` (only 2 pre-existing merge-base `private-type-ref` errors remain unchanged on untouched `create-chat-connection.ts:115` `NetScriptChatSendMessage` referencing `UIMessage`/`ModelMessage`); `quality:gate` + `arch:check` (doctrine FAIL=0, zero new warnings on `packages/fresh`); `check:emitted-samples` (48 samples); regenerated `export-surface-corpus.generated.ts` and `publish-assets.generated.ts` and verified `check:mcp-export-corpus`, `check:publish-assets`, `check:agent-docs-prose`, `check:netscript-jsr-specifiers`, `docs:exports-drift`, `docs:accuracy`, `docs:jsdoc-examples`, `docs:readme-fences`; `deno publish --dry-run --allow-dirty --config packages/fresh/deno.json`; zero `deno.lock` churn. |
| 2026-11-27 | S4 | eval-fixes | Addressed all 5 Round-1 Sol 6.2 xhigh IMPL-EVAL findings (`IC_kwDOSxcnO88AAAABrZQBgQ`): (1) instantiated one shared `createNetScriptStreamProxy` per proxy (with per-request WeakMap + correlation traceparent plan routing) so the 1,000-reader cap rejects request 1,001 with `503 Retry-After: 5` before policy/upstream; (2) stripped client credential/transport headers from `target.headers` overlays across SSE `GET`, non-SSE `GET`, and `POST`; (3) enforced `GET`/`POST`-only method boundary (`405 Allow: GET, POST` before policy/upstream) and rejected `text/event-stream` and comma-combined/ambiguous `Content-Type` on both non-SSE `GET` and `POST` (`502`); (4) made rejected-body cancellation non-blocking on all 502 paths, validated RFC 9110 `Connection` tokens before `headers.delete`, and rechecked abort at the upstream boundary (including aborts inside `auth()`); (5) bound/froze `clock` and `revocationSource` port methods at construction and strictly validated original option shapes (`Array.isArray(allowedOrigins)`, `revocationSource.subscribe`, `clock`, `null` overrides). Extracted `packages/fresh/src/internal/chat-proxy-plan.ts` so all files stay well under 500 lines and added 5 dedicated sanitized regression tests (20/20 chat proxy tests total, `stream-proxy_test.ts` still byte-for-byte untouched). |
