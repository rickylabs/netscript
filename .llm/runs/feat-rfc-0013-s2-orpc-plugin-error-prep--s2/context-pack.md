# Context Pack — RFC 0013 S2

- **RFC:** `rfcs/0013-orpc-v2-readiness.md` (§2 #4/#5/#6, §4.1 Phase 0a items 2–4, accepted 2026-11-27 in PR `#2674`)
- **Tracking issue:** `#2672`
- **Slice sub-issue:** `#2706`
- **Branch:** `feat/rfc-0013-s2-orpc-plugin-error-prep` (branched from `origin/main` `05065efea`, after S1 PR `#2704`)
- **Plan-Gate:** N/A — executes owner-accepted RFC 0013 §4.1 Phase 0a items 2–4 verbatim on `@orpc/*@^1.16.6` (zero breaking changes, zero version bumps).
- **Non-negotiable v1 guardrails:**
  - Stay on `@orpc/*@^1.16.6`.
  - `attachRootHandlerInterceptor` MUST continue attaching to `rootInterceptors` on v1 `^1.16.6` (v1 `StandardHandler` silently ignores `routingInterceptors`; flip only in Phase 2 `0.1.0`).
  - Keep `new CORSPlugin()` untouched in `packages/service/src/primitives/handlers.ts`.
  - Keep `@netscript/logger` and `@netscript/telemetry` independent Layer-2 packages (no cross-dependency between them).
