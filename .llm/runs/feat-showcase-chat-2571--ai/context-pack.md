# Resume

Issue #2571 app-owned AI/MCP slice; only new showcase/ai templates, showcase-ai tests and this private run are owned.
Implementation complete: 17 canonical templates plus rendered-consumer validation and 20/20 behavioral scenarios. Read integration.md and auth-prerequisites.md for exact destinations, setup/configuration and remaining parent gates. The consumer uses real framework/provider ports, durable persistence/replay, upstream MCP, a real typed HTTP RPC test, the actual generated BFF and fresh-process native streams restart tests, with no real model key.

Critical correction: `routerName: 'orders'` plus the SDK default apiVersion v1 reaches the generated v1.orders router. The requested literal `v1.orders` value duplicates the version in the RPC URL and fails; see drift.md and the live RPC test.

Automatic S2 setup: render integration/stream-secret.ts.template to showcase/stream-secret.ts and integration/streams-host.ts.template to showcase/streams-host.ts. Parent setup calls await provisionShowcaseStreams(root); retain the installed streams entry but set Workdir '.' and Entrypoint 'showcase/streams-host.ts', then regenerate Aspire. The helper stores the per-workspace credential only under the current POSIX user's .secrets (700/file 600) and writes only a basename/version reference under .netscript. Native runtime/host read it and set server-only STREAMS_SECRET; host persists .data/streams and uses native loopback upstream. Missing/broken auth, unsafe secret files or public chat streams fail closed. No-key page returns before secret/auth/network/model work.

Auth correction: actual BFF session verification is GET-only; runtime adapts chat/MCP POST to an app-owned GET retaining cookies and cancellation. Default kv-oauth supports the generated sign-in after real external provider configuration and stable KV key. Better-auth is validate-only: credentials alone do not supply a login/issuer/bridge; do not claim it is turnkey.

Structured source/rendered check/lint/fmt, 20 scenario tests and quality:gate passed. Independent IMPL-EVAL, provider-boundary production build, real external-provider browser acceptance and full scaffold.runtime remain parent-owned. Do not treat this slice as merge approval.
Parent owns integration and independent review. Do not read profiles/, open PRs, push or contact others.
