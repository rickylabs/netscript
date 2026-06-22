# Seam-coverage matrix — docs-v4-ia-deepening

Phase-0 scout (workflow wf_090ee054-3d5), grounded in `deno doc` over all six pillars.
Headline: **exactly ONE real build-seam gap in the entire framework** (auth plugin passthrough).
Every other "no seam" row is an already-correctly-documented deliberate limitation.

## The one build-seam gap — better-auth plugins

All 9 better-auth plugins (`organization`, `twoFactor`, `magicLink`, `admin`, `passkey`,
`multiSession`, `apiKey`, `bearer`, `jwt`) are **mountable today**, but **only via an
undocumented escape hatch**:

```ts
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { createBetterAuthBackend } from "@netscript/auth-better-auth";

// escape hatch: build your own better-auth instance, pass it structurally
const backend = createBetterAuthBackend({
  auth: betterAuth({ plugins: [organization()] }), // satisfies BetterAuthInstance (handler + api.getSession)
});
```

- The **documented** convenience factory `createNetscriptBetterAuth(options)`
  (`packages/auth-better-auth/src/better-auth.ts:122`) CANNOT enable any plugin:
  `NetscriptBetterAuthOptions` (`:22`) is a closed interface with **no `plugins` field**,
  so `{ plugins: [...] }` fails the TS excess-property check and is never forwarded.
- The Principal mapper ALREADY consumes org-plugin output:
  `principalFromBetterAuthSession` (`:221`) reads
  `activeOrganizationId/Role/Roles/Permissions` + `user.role/roles/permissions` into
  `Principal.scopes/roles/claims`. **So orgs light up end-to-end the moment the plugin is
  enabled** — the only thing missing is the documented on-ramp.
- **Interactive caveat:** `magicLink` and `passkey` SIGN-IN are interactive flows better-auth
  owns. NetScript's better-auth backend is non-interactive (no `InteractiveFlowPort`), so
  `/signin` and `/callback` return `AUTH_PROVIDER_ERROR`; those flows must be driven against
  better-auth's own handler with NetScript verifying the session. `bearer` and `jwt` (stateless,
  no own tables) work cleanly through the R0 passthrough with no further prerequisite. `organization`,
  `twoFactor`, `admin`, and `apiKey` have **no interactive dependency** but ARE table-backed: they
  only become runnable once their better-auth schema is generated and migrated (the R1 schema-gen
  prerequisite). Until R1, enabling them through the R0 passthrough type-checks but fails at runtime
  on the missing tables — so docs for these plugins MUST carry the R1 schema-gen caveat, not present
  them as turnkey.
- The `tutorials/workspace` track (about orgs/multi-tenancy) tells users to hand-roll an
  `orgId` column because "NetScript ships no organization primitive" — it COULD enable
  better-auth's `organization` plugin instead.

**Recommendation:** add a `plugins` / `betterAuthOptions` passthrough to
`createNetscriptBetterAuth` (small framework slice) **and** document the escape hatch; rework the
workspace tutorial to use the org plugin.

**USER DECISION (2026-06-22):** BUILD the passthrough now (R0), AND record the full seamless-auth
roadmap (further seams, adapters, helpers, fluent builder) in the harness debt registry. Recorded
as `arch-debt.md → "packages/auth-better-auth — seamless better-auth integration roadmap"` (R0 ships
this run, IMPL-EVAL-gated; R1 DB-schema-gen, R2 InteractiveFlowPort, R3 org/tenant primitives, R4
`defineAuth()` fluent builder, R5 plugin-aware mappers/adapters/CLI = dedicated future program).
**Docs honesty constraint:** docs-v4 must document the R0 factory path AND state the R1
schema-generation requirement (a plugin needing tables fails at runtime until its migration exists);
magic-link/passkey carry the R2 interactive-flow caveat.

## Every other pillar — honestly seamed or honestly documented

| Pillar | Capability | Verdict |
| --- | --- | --- |
| Web | fresh builders / route / defer / form / query / streams | seam present (definePage, defineRouteContract, …) |
| Services | workers permissions + multi-runtime adapters | seam present |
| Background | sagas Prisma store + durability tiers | seam present (createSagaRuntime) |
| Background | streams producer | seam present (createDurableStream) |
| Background | streams in-process consumer / replay / consumer-groups | absent — **already documented** (fail-loud, SSE only) |
| Background | triggers cron + retry/DLQ | seam present (defineScheduledTrigger / createTriggerProcessor) |
| Background | triggers `defer` action | absent — **already documented** (defined→DLQ) |
| Services | polyglot non-deno sandbox | absent — **already documented** (only Deno adapter sandboxes) |
| Data | second/multi database | seam present (createPostgresAdapter / `netscript db add`) |
| Data | kv / queue / cron providers | seam present (getKv / createQueue / createScheduler) |
| Identity | WorkOS organizationId | seam present (config field) |
| Identity | multi-active backend / cross-link / global logout | absent — **already documented** (v1 boundary) |
| Identity | interactive sign-in for WorkOS/better-auth | absent — **already documented** (kv-oauth only) |
| Identity | auth audit/observability surface | absent — **already documented** |

**Conclusion:** the user's fear of "many cases like this" resolves to **one** actionable
framework gap (auth plugin passthrough). The rest are already honest. The systemic failure was
**process** (caveats not harvested to drift/debt — see drift D1), not widespread missing seams.
