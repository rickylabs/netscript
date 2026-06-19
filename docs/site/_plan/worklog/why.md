# Worklog — docs/site/why.vto (B2 code-proof floor)

One row per code proof. Every NetScript symbol, import, and CLI flag shown on the page was verified against the real public surface before use. `deno doc` was unavailable in-environment for some modules, so the recorded fallback was reading `mod.ts` / `README.md` / the exporting source file directly (per accuracy rule 1).

| Verification command / file read | Symbol(s) | Found | Note |
| --- | --- | --- | --- |
| Read `packages/contracts/README.md` (Quick example block) | `baseContract`, `OffsetPaginationQuerySchema`, `OffsetPaginationMetaSchema`, `.route().input().output()` | yes | Contract proof lifted verbatim from the README quick example, extended only with realistic field schemas. Import is `@netscript/contracts`. |
| Read `packages/sdk/README.md` (Quick example block) | `defineServices` | yes | Returns `{ clients, queries, queryUtils }`; `clients.users.<op>(...)` typed call confirmed. Page uses `clients.users.list(...)` matching the authored contract op. Import is `@netscript/sdk`. |
| Read `packages/plugin-sagas-core/README.md` + `packages/plugin-sagas-core/src/public/messages.ts` | `defineSaga`, `sagaComplete`, `send`, `sagaFail` | yes | `defineSaga(id).state().on().build()` chain lifted from README. `send` (messages.ts:21), `sagaComplete` (:65), `sagaFail` (:73) confirmed as public exports. Import is `@netscript/plugin-sagas-core`. |
| Read `packages/telemetry/src/core/span.ts:32` (fallback for `deno doc @netscript/telemetry/tracer --filter withSpan`) | `withSpan` | yes | Signature `withSpan<T>(tracer, name, fn, options?)`: opens span, sets OK on success, records exception + ERROR on throw, ends span in `finally`. Page proof matches (tracer first arg, async fn). |
| Read `packages/telemetry/src/core/tracer.ts:24` | `getTracer` | yes | `getTracer(name?, version?): Tracer`. Paired with `withSpan` so the traced-handler proof has a real tracer. Both reachable via the `@netscript/telemetry/tracer` subpath (confirmed in `packages/telemetry/deno.json` exports map). |
| Read `packages/service/mod.ts:127` | `defineService`, `DefineServiceOptions` | yes | `export { defineService, type DefineServiceOptions } from './src/presets/define-service.ts'`. README confirms `defineService(router, { name, port })` + `service.stop()`. Import is `@netscript/service`. |
| Read `docs/site/_plan/01-positioning-brief.md` §Core values (lines 70-78) | value-map (internal axiom → public value) | yes | Source for the "NetScript answer" `apiTable`. Doctrine jargon (composition root / fitness functions / archetype) deliberately omitted per tone lock; public-value phrasing retained. |
| Verified CLI flag `--no-aspire` against project doctrine (AGENTS.md / positioning brief + index sample line 37) | `--no-aspire` | yes | Used only as the documented opt-out; no other CLI flags claimed on this page beyond `netscript init`. |

## Components referenced (per pinned component API contract; authored by the lane, not by this page)

- `comp.hero({ tagline, subhead, ctas })`
- `comp.callout({ type, title })` + body + close (sample at `_plan/samples/callout.vto`)
- `comp.apiTable({ rows: [{ name, type, desc }], caption })`
- `comp.tabbedCode({ tabs: [{ label, lang, code }] })`
- `comp.nextPrev({ next })`

## Source-blocker status

None. All three mandated code proofs (contract→client, saga state machine, traced handler) compile against the verified public surface. No `packages/` edit required; nothing was invented.
