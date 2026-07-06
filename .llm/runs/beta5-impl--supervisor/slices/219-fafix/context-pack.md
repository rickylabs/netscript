# 219-fafix Context Pack

## Scope

Branch `fix/219-fresh-ai-proxy` implements the #219 AI-anchor unblock for `@netscript/fresh/ai`:

- configurable durable chat stream subpaths for FA1 and FA2;
- FA2 upstream `Accept-Encoding: identity` to prevent decode-time failures from gzip-mislabeled plain JSON;
- tests proving an eis-chat shaped route can use FA1/FA2 without the three local workarounds.

## Current Implementation

- `packages/fresh/src/runtime/ai/create-chat-connection.ts`
  - exports `NetScriptChatStreamPath`;
  - adds `streamPath` to connection, response, and snapshot option bags;
  - resolves string stream paths as static prefixes and function stream paths as full per-session subpaths.
- `packages/fresh/src/runtime/ai/stream-proxy.ts`
  - reuses FA1 `resolveChatSessionUrl`;
  - adds per-request `streamPath`;
  - sets upstream `accept-encoding` to `identity`;
  - keeps response header sanitization.
- Tests:
  - FA1 dynamic path covers connection, response, and snapshot URLs.
  - FA2 dynamic path mirrors `/eischat/sessions/{id}/messages`.
  - FA2 local-server regression proves identity-negotiated gzip mislabel survives and returns clean JSON.

## Validation So Far

- PASS: `rtk proxy deno test --allow-all packages/fresh/src/runtime/ai/create-chat-connection_test.ts packages/fresh/src/runtime/ai/stream-proxy_test.ts`.
- PASS: scoped Fresh fmt/lint/check wrappers.
- PASS: `rtk proxy deno task --cwd packages/fresh test`.
- PASS: `rtk proxy deno task --cwd packages/fresh doc-lint`.
- PASS: Fresh package `rtk proxy deno publish --dry-run --allow-dirty`.
- PASS: `rtk proxy deno task check`.
- PASS: `rtk proxy deno task test`.
- PASS: `rtk proxy deno task publish:dry-run`.

## Pending

- Commit, explicit-refspec push, draft PR, labels/milestone, slice PR comment, `SLICE-COMPLETE`.
