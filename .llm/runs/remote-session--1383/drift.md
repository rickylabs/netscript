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
