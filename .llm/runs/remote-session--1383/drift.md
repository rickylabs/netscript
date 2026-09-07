# Drift Log: remote-session--1383

Drift is append-only.

## 2026-09-08 — Family-reference siblings unavailable

- **What:** The brief asked to read eis-chat AGENTS/config, RFC0005/0010 and Ledgerline design docs.
- **Source:** `find / -maxdepth 5 -iname '*eis-chat*' -o -iname '*ledgerline*'`; `ls /home/agent/repos`.
- **Expected:** sibling checkouts reachable read-only.
- **Actual:** only `/tmp/ledgerline-*` logs and an `/ephemeral/tmp/aspire-*/ledgerline-web-*` scratch dir exist; no source or docs.
- **Severity:** minor
- **Action:** accept — plan grounded on NetScript sources, Cockpit reference, and repo docs only.

## 2026-09-08 — `aspireify` skill absent

- **What:** brief lists `aspireify`; the generated consumer bundle has `aspire`, `aspire-init`, `aspire-orchestration`, `aspire-monitoring`, `aspire-deployment` only.
- **Source:** `ls .agents/generated/consumer-skills/.agents/skills`.
- **Severity:** minor
- **Action:** accept — no AppHost edit is planned, so the skill is not load-bearing.

## 2026-09-08 — Discovery name for the auth plugin service is ambiguous in docs

- **What:** docs example uses `serviceName: 'auth-api'`; the AppHost generator wires plugin references as `services__auth__http__0` (plugin key `auth`); the Cockpit consumer used `'auth'`.
- **Source:** `docs/site/identity-access/how-to/add-authentication.md:290-296`; `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts:409`.
- **Expected:** one documented discovery name.
- **Actual:** two names in circulation.
- **Severity:** significant (public-contract default)
- **Action:** propose-update — returned as OQ1; `serviceName` stays required in the core factory until the coordinator answers.

## 2026-09-08 — Auth service `/session` never honours a bearer credential

- **What:** `session()` passes `{ sessionId: input?.sessionId, request }` to `backend.sessions.getSession`; backends resolve `sessionId ?? token ?? cookie`, so `Authorization: Bearer` is ignored and a valid bearer yields `{ authenticated: false }` on kv-oauth/workos.
- **Source:** `plugins/auth/services/src/routers/v1-handlers.ts:238-286`; `packages/auth-kv-oauth/src/backend.ts:174-181`; `packages/auth-workos/src/workos-backend.ts:79-82`.
- **Expected:** #1383 step 3 assumes `GET /session` verifies the bearer the typed client sends.
- **Actual:** contract-level verification works (fixture), backend-level verification needs a bearer → `lookup.token` mapping on the auth service.
- **Severity:** significant (adoption dependency, not a blocker for this PR)
- **Action:** defer — record on the PR and on #1383 as a step-4 prerequisite (OQ3). Not implemented in this slice.

## 2026-09-08 — Correction: family-reference siblings DO exist

- **What:** Revision 1 claimed eis-chat and Ledgerline were unreachable. They live at
  `/home/agent/projects/eis-chat` and `/home/agent/projects/ledgerline` (owner paths), not `/home/agent/repos`.
- **Source:** coordinator `ls`; planner read `AGENTS.md`, `netscript.config.ts`, `appsettings.json`,
  `docs/rfcs/0005-*.md`, `docs/rfcs/0010-*.md`, `DESIGN*.md` read-only. `aspireify` exists in the
  Cockpit checkout `.agents/skills/aspireify/SKILL.md`.
- **Severity:** minor (research error, no design impact — structure-only references)
- **Action:** fix — the first two drift entries above are withdrawn; `research.md` re-baseline corrected.

## 2026-09-08 — Auth service is request-blind over HTTP (beyond bearer)

- **What:** `withAuthRequest` captures the request in `AsyncLocalStorage`, but `currentAuthRequest()` has
  no call site; `main.ts` builds the handler context without `request`. Over real HTTP, cookie-based
  `session` and `me` cannot resolve any credential; only explicit `sessionId` input works.
- **Source:** `planner-http-session-probe.json` (`directSessionId:true`, `cookieStatus:200 →
  authenticated:false`, `bearerAuthenticated:false`); `grep -rn currentAuthRequest plugins packages`.
- **Expected:** the request bridge feeds every handler.
- **Actual:** unread. Coordinator direction (`coordinator-request-context.md`): read the existing bridge at
  the existing context seam in `main.ts` (plan L12), which makes every handler request-aware; `me`/`signout`
  code is not changed and no behaviour is claimed for them.
- **Severity:** significant (baseline defect, now in scope at the seam)
- **Action:** fix (L12/S2) — stated in the PR body; `#1384` remains separate.

## 2026-09-08 — In-memory KV adapter retains an expiration timer

- **What:** both probes kept a handle alive after output; `MemoryKvAdapter` owns a `setInterval` and a
  `close()`; `createInMemoryKvOAuthRegistry` never exposes the adapter.
- **Source:** `packages/kv/adapters/memory.adapter.ts:59,260`; coordinator exit 143; planner `Deno.exit`.
- **Severity:** minor
- **Action:** accept as a test rule — formal tests construct and close their own adapter and stop every
  listener in `finally`; probes are evidence, never copied as tests.
