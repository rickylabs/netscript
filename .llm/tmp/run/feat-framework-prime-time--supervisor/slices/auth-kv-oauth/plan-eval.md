# PLAN-EVAL — `auth-kv-oauth` slice (cycle 1, 2026-06-20)

> **Provenance note (supervisor):** This file is reconstructed from OpenHands PR comment
> `issuecomment-4757538575` on #73. The evaluator job (minimax-m3, run `27869687433`) produced the
> full verdict but its runner reported `Job status: failure` and died at the artifact-commit step, so
> the original `plan-eval.md` and the `run-27869687433-1` trace dir never landed on the branch.
> Because the dispatch used `output=pr-comment`, the comment is the contracted deliverable; this file
> mirrors it verbatim in substance for the run record. Verdict is unaffected.

## Verdict: **PASS** (cycle 1, no FAIL_PLAN cycle required). Implementation may begin.

Read-only PLAN-EVAL pass for the Track-4 prime-time slice `@netscript/auth-kv-oauth` on PR #73
(`feat/framework-prime-time`). Walked the Plan-Gate checklist box by box and spot-checked every
load-bearing claim in `plan.md` / `api-design.md` / `plan-meta.json` against the actual codebase.

## Spot-checks (all verified against current `main`)

| Claim | Verified location |
| --- | --- |
| `AuthenticatorPort`/`AuthnRequest`/`AuthnResult`/`Principal` consumed unchanged | `packages/service/src/auth/types.ts` (verbatim, incl. `scheme:'custom'`, `setCookies: readonly string[]`) |
| Seam middleware honors `setCookies` for refresh-on-read | `packages/service/src/auth/auth-middleware.ts` `applyAuthnResponse(c, responseHeaders, setCookies)` |
| `withAuthn({ authenticator })` + `allowAnonymous` composition root | `packages/service/src/auth/options.ts:23,27` |
| `WatchableKv` injection (no raw `Deno.openKv`) | `packages/kv/src/{mod,kv-store,watchable-kv}.ts` |
| Engine `jsr:@panva/oauth4webapi@^3.8.6` is authoritative latest stable | JSR registry `3.8.6` (2026-04-27, zero-dep, MIT) — see M1 |
| Engine exports cover security baseline (PKCE S256, exact state, RFC 9207 iss, OIDC nonce + id_token validation, refresh rotation, DPoP) | JSR `index.ts` exports (`generateRandomCodeVerifier/State/Nonce`, client-auth methods, `authorizationCodeGrantRequest`, `processAuthorizationCodeOpenIDResponse`, `refreshTokenGrantRequest`, `validateAuthResponse`, DPoP helpers) |
| Catalog law: `catalog:` is npm-only; JSR must be inline | `.agents/skills/netscript-deno-toolchain/SKILL.md` |
| `e2e-cli-gate` correctly EXCLUDED | plan §Gates (no `@netscript/cli` touch, no scaffold/Aspire change) |
| `deno_kv_oauth@0.11.0` is JSR latest | JSR registry |

All 8 Plan-Gate boxes pass.

## Open-decision sweep

- **JSR-inline engine pin vs Track-2 `catalog:` — RESOLVED in place.** `catalog:` is npm-only per the
  toolchain skill; JSR deps must be inline. Track-2 routes npm libs through catalog (correct for
  npm); Track-4 pins a JSR lib inline (correct for JSR). Same doctrine — no actual divergence.
- Decisions 11 (encryption-key provenance) and 12 (RP-only v1) already locked in the plan; accepted.
- Tier-2 / PAR / DPoP rescope option acceptable: if S3/S4 trip on size at impl, split to fast-follow.

## Self-applied corrections for the implementing agent (M1–M4, slice-time, non-rework)

- **M1** — `plan.md`/`plan-meta.json` "matches npm 3.8.6" aside is wrong (npm `oauth4webapi` is
  `1.x`); the JSR pin itself stands. Drop the aside; re-confirm via `deno task deps:latest` at impl.
- **M2** — re-label ARCHETYPE-3 → ARCHETYPE-2 (Integration). Arch-3 is Runtime/Behavior in
  `docs/architecture/doctrine/06-archetypes.md`; adapter packages (`prisma-adapter-mysql`,
  `auth-workos`, `auth-better-auth`) are Arch-2.
- **M3** — add a consumer-import validation item to S6: a downstream module importing the public
  `mod.ts`, type-checked under `isolatedDeclarations`, proving the export map resolves for consumers.
- **M4** — document the dual-surface precedent honestly: `prisma-adapter-mysql` shares the flat `src/`
  layout but has **no** Hono mount and **no** `AuthenticatorPort` factory; the real dual-surface
  precedent is the Track-2 `auth-workos` / `auth-better-auth` adapters. README must not over-claim.

## Remaining risks (carried to impl, agent-owned)

- `deno` not available in the evaluator sandbox; JSR `3.8.6` verified against the registry directly —
  `deno task deps:latest` re-confirmation is the implementing agent's responsibility.
- Provider endpoint literals (X.com, Facebook API version) stale in the reference; plan correctly says
  verify at impl, prefer OIDC discovery, no version-pinned literals (LD-6).
- Active key-rotation DEFERRED to debt (LD-11); `keyId` prefix is the forward-compat seam. v1 ships
  hard startup error on missing key.
- Resource-server bearer-JWT validation DEFERRED (LD-12); v1 is RP-only.

Run: https://github.com/rickylabs/netscript/actions/runs/27869687433
