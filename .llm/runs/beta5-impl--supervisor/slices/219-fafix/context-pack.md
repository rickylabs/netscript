# 219-fafix Context Pack

## Scope

Branch `fix/219-fresh-ai-proxy` implements the #219 AI-anchor unblock for `@netscript/fresh/ai`:

- configurable durable chat stream subpaths for FA1 and FA2;
- FA2 upstream `Accept-Encoding: identity` to prevent decode-time failures from gzip-mislabeled plain JSON;
- FA1 direct durable-stream reads also force `Accept-Encoding: identity` for SSR seed and live
  subscribe/resume reads;
- `NetScriptVitePlugin` keeps a package-owned public type while remaining assignable to Vite
  `Plugin` / `PluginOption`;
- tests proving an eis-chat shaped route can use FA1/FA2 without the three local workarounds.

## Current Implementation

- `packages/fresh/src/runtime/ai/create-chat-connection.ts`
  - exports `NetScriptChatStreamPath`;
  - adds `streamPath` to connection, response, and snapshot option bags;
  - resolves string stream paths as static prefixes and function stream paths as full per-session subpaths.
  - routes all FA1 headers through an identity-encoding normalizer so direct seed/live reads do not
    request gzip/br from durable-streams.
- `packages/fresh/src/runtime/ai/stream-proxy.ts`
  - reuses FA1 `resolveChatSessionUrl`;
  - adds per-request `streamPath`;
  - sets upstream `accept-encoding` to `identity`;
  - keeps response header sanitization.
- `packages/fresh/src/application/vite/vite.ts`
  - exposes package-owned structural hook function types for `NetScriptVitePlugin`;
  - avoids Vite private type leakage while preserving normal `defineConfig({ plugins: [...] })`
    assignability.
- Tests:
  - FA1 dynamic path covers connection, response, and snapshot URLs.
  - FA1 SSR seed and live read local-server regressions prove identity-negotiated gzip mislabels
    do not crash direct readers.
  - FA2 dynamic path mirrors `/eischat/sessions/{id}/messages`.
  - FA2 local-server regression proves identity-negotiated gzip mislabel survives and returns clean JSON.
  - Vite compile contract assigns `createNetScriptVitePlugin()` to `Plugin`, `PluginOption`, and
    `defineConfig({ plugins: [...] })`.

## Validation So Far

- PASS: `rtk proxy deno test --allow-all packages/fresh/src/runtime/ai/create-chat-connection_test.ts packages/fresh/src/runtime/ai/stream-proxy_test.ts`.
- PASS: scoped Fresh fmt/lint/check wrappers.
- PASS: `rtk proxy deno task --cwd packages/fresh test`.
- PASS: `rtk proxy deno task --cwd packages/fresh doc-lint`.
- PASS: Fresh package `rtk proxy deno publish --dry-run --allow-dirty`.
- PASS: `rtk proxy deno task check`.
- PASS: `rtk proxy deno task test`.
- PASS: `rtk proxy deno task publish:dry-run`.
- PASS: adversarial focused test/check loop for FA1 gzip-mislabel and Vite assignability.
- PASS: adversarial scoped Fresh fmt/lint/check wrappers.
- PASS: adversarial `rtk proxy deno task --cwd packages/fresh test` (191 passed).
- PASS: adversarial Fresh full export-map doc-lint and package publish dry-run.
- PASS: adversarial root `deno task check`, `deno task test` (1,502 passed / 482 steps), and
  root publish dry-run.

## Pending

- Commit, explicit-refspec push, PR comment ending `SLICE-COMPLETE-2`.
