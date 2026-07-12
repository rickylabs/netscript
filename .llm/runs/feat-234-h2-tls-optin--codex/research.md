# Research — feat-234-h2-tls-optin--codex

## Re-baseline

- Carried-in source: issue #234 slice brief.
- Re-derived against `origin/main` at `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d` on 2026-07-12.
- Material change: the requested Phase 0/1 implementation already landed in ancestor commit
  `9c9efb6b43b721f2bcb79e9fa00f4ee466a6ba99` (`feat(service): opt-in TLS/HTTP2 on service listener
  (#234) (#293)`). No product-code duplication is warranted.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `ServeOptions.tls` already accepts PEM `cert` and `key` through exported `ServiceTlsOptions`. | `deno doc --filter ServeOptions /home/codex/repos/ns-b9-234/packages/service/mod.ts` |
| 2 | `startServiceListener` has separate TLS/plain branches, forwards `cert`/`key` to `Deno.serve`, and derives the banner scheme from active TLS. | `packages/service/src/builder/service-listener.ts` |
| 3 | Plain HTTP remains the no-TLS default. | `packages/service/tests/tls-listener_test.ts` and listener branch inspection |
| 4 | The existing test captures `Deno.serve` options and covers TLS forwarding, HTTPS banner generation, and the plain HTTP path. | `packages/service/tests/tls-listener_test.ts` |
| 5 | `@netscript/service` is doctrine Archetype 4 with verdict `Refactor`; this slice must not deepen the open folder/assets/slow-type debt. | doctrine file 10 and `.llm/harness/debt/arch-debt.md` |

## jsr-audit surface scan

- Surface scanned: `packages/service/mod.ts`, `ServeOptions`, and `ServiceTlsOptions` via `deno doc`.
- Risk: the public TLS types are stable exports and must retain JSDoc; package has a pre-existing
  accepted oRPC slow-type carve-out. This re-baseline introduces no new public surface.
- Gate: focused doc/type/lint/format/test evidence; no dependency or version decision is involved.

## Open questions

- None for Phase 0/1. Aspire dev-cert provisioning, TLS-by-default, browser trust, and Fresh/Vite TLS
  remain explicitly deferred.
