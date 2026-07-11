# Worklog — issue #444: identity-access story + plugin-system fix (D5)

Branch: `docs/444-positioning-identity-access` from `7f7ed76b`.
Brief: `.llm/runs/beta7-ship--orchestrator/docs-briefs/issue-444.md` + common brief.
Design source: `design/CD-docs/epic-and-issues.md` §4 D5; proposal §4.2 (story template),
§4.4 (auth has no eis-chat proof point), §4.5 (plugin-system telemetry contradiction);
`context/D-positioning/authoring-constraints.md`; `research/D-positioning/competitor-teardown.md`
(Supabase agent-skills section).

## Plan

1. `docs/site/identity-access/auth.md`
   - Add §4.2 story block: elevator pitch (build-efficiency, one line) + story spine
     ("where agent-built auth goes wrong": concrete failure modes the shipped contract closes) +
     ONE factual competitor comparison (Supabase agent-skills failure-modes technique, T2,
     prose form, NO percentages, no external link — matches the Temporal-in-prose site style).
   - Per proposal §4.4: no eis-chat proof point exists for auth — story grounded in the package's
     own shipped contract only; do NOT imply eis-chat proves the auth story.
   - Fix the self-contradiction: the "Scope: events are best-effort, no audit surface" warning
     said "There is no dedicated auth telemetry or audit-observability surface yet" while the same
     page's Production notes (and `explanation/observability.md` + `explanation/auth-model.md`)
     document `createAuthTelemetry`. Rewrite the callout: stream events stay best-effort; the
     dedicated audit surface is `createAuthTelemetry` (salt-gated).
2. `docs/site/identity-access/index.md`
   - Pitch-led pillar intro (elevator pitch + one-paragraph spine teaser, cross-linked).
   - Add a "Capability → Authentication" card: `/identity-access/auth/` was reachable from neither
     the `_data.ts` nav nor the pillar index grid (only via cross-page links / the
     `capabilities/auth` redirect stub). Fixed via an index card, NOT `_data.ts` (merge hotspot,
     brief says avoid).
3. `docs/site/explanation/plugin-system.md`
   - Fix the D5-named contradiction: "There is also no auth telemetry or audit surface yet — do
     not assume one exists" → replaced with the shipped `createAuthTelemetry` salt-gated framing,
     xref to `explain:observability`. Also "aligned alpha train" → "aligned release train" in that
     callout (stale wording on a touched line).

## Accuracy trace (claim → verification)

- `createAuthTelemetry` + `AuthTelemetry*` types are on the PUBLISHED beta.7 surface:
  `deno doc jsr:@netscript/plugin-auth-core@0.0.1-beta.7` is blocked locally by the Deno
  minimum-dependency-date guard (beta.7 published <24h ago), so verified via the registry
  directly: `https://jsr.io/@netscript/plugin-auth-core/0.0.1-beta.7/src/public/mod.ts` exports
  `createAuthTelemetry` (line 88) and `AuthTelemetry`, `AuthTelemetryAttributes`,
  `AuthTelemetryOperation`, `AuthTelemetryOptions` (lines 101–105); the version manifest
  `0.0.1-beta.7_meta.json` lists `/src/telemetry/instrumentation.ts`. Workspace source at this
  commit matches (`packages/plugin-auth-core/src/public/mod.ts:88`).
- Salt gating (`subjectHashSalt` / `NETSCRIPT_AUTH_AUDIT_SALT`, no-op recorder without salt):
  restated from `explanation/observability.md` ("Auth audit is gated" callout) and this page's own
  Production notes — no new claim introduced.
- All story-spine mechanism claims (typed `AuthnResult { ok:false, reason }` never a silent
  anonymous principal; `AUTH_PROVIDER_ERROR` / `AuthBackendOperationUnsupportedError` on
  non-interactive backends; single-active-backend via `NETSCRIPT_AUTH_BACKEND`; `__Host-ns_session`
  cookie constraints) restate claims already on the page (apiTables + callouts, previously
  verified against the live export surface) — no new API symbols introduced.
- Supabase comparison: factual description of Supabase's published agent-skills guidance
  (agents skip RLS policies, hallucinate CLI commands, create views without
  `security_invoker = true`) per `research/D-positioning/competitor-teardown.md` Supabase section.
  NO percentage cited (issue: "no invented %"; Supabase's own 58→71 measured figure deliberately
  omitted — borrowed social proof).

## Positioning-law self-check

- No throughput/benchmark claims; no superlatives/absolutes; no honesty/candor framing;
  no fabricated %/social proof; exactly ONE competitor comparison (Supabase, T2).
- No `_plan/*` prose lifted.
- Diátaxis: mechanism sections cross-link `how-to/add-authentication`, `explanation/auth-model`,
  `reference/auth` — not duplicated.
- Left the site-wide `alpha` badge convention untouched (maturity label used across many pages;
  an alpha→beta badge sweep is not this slice's scope). No numeric stale-version claims found on
  touched pages.

## Resumption review (predecessor died mid-flight, post-edit / pre-validate)

This slice was resumed after the authoring agent hit its spend limit having edited all three files
but before validation/commit. Per the "fix, don't blindly trust" mandate I re-verified every
load-bearing claim against **workspace source at HEAD 7f7ed76b** (the predecessor could only reach
the registry because the beta.7 min-dependency-date guard blocks `deno doc jsr:...@0.0.1-beta.7`):

- `createAuthTelemetry` + `AuthTelemetry`/`AuthTelemetryAttributes`/`AuthTelemetryOperation`/
  `AuthTelemetryOptions` — exported from `packages/plugin-auth-core/src/public/mod.ts:88,101-105`. ✓
- `subjectHashSalt` option + no-op-without-salt gating — `packages/plugin-auth-core/src/telemetry/
  instrumentation.ts:111` (option) and `:152` (`const salt = options.subjectHashSalt`). ✓
- `NETSCRIPT_AUTH_AUDIT_SALT` env → salt resolution — wired at `plugins/auth/services/src/main.ts:88`
  (`env.NETSCRIPT_AUTH_AUDIT_SALT ?? serviceAuditSalt(ctx)`). Real shipped env var, not a docs
  invention; also already documented on `explanation/observability.md:219` and this page's own
  Production notes (pre-diff), so not newly introduced. ✓ (this citation strengthens the trace;
  the predecessor had only cited the docs pages for the env name.)
- `AUTH_PROVIDER_ERROR` — `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:154,166` +
  `telemetry/attributes.ts:104`. ✓
- `AuthBackendOperationUnsupportedError` — class at `packages/plugin-auth-core/src/ports/mod.ts:147`,
  re-exported from `src/public/mod.ts:28`. ✓
- `NETSCRIPT_AUTH_BACKEND` — real env var (also used by `packages/cli/e2e/.../runtime-gates.ts`). ✓
- `__Host-ns_session` — pre-existing on the page (lines 28/252/344); the new bullet restates it. ✓
- xref keys `explain:observability`, `explain:auth-model`, `cap:streams` — all present in
  `docs/site/_data/xref.ts`. ✓

**Positioning-law grep on the three touched pages** (`honest|candor|throughput|X% faster|superlatives`):
the only hit is `auth.md:128` "The fastest path is the provider preset" — **pre-existing content
outside the D5 diff** (a workflow-path phrasing, not a competitor/throughput claim); left untouched
to avoid widening merge surface on unrelated prose. Competitor-name grep confirms the single
factual competitor comparison is Supabase (auth.md:54); every other vendor name (WorkOS,
better-auth, kv-oauth, clerk/auth0/okta presets) is a **supported backend/provider**, not a
comparison. No fabricated %, no honesty/candor framing, no superlatives introduced by this slice.

**Review verdict: predecessor edits ACCEPTED as-is** — accurate (all present-tense API claims
trace to shipped source above) and positioning-law compliant. No corrections required.

## Evidence

`deno task verify` (in `docs/site`) — **GREEN** (exit 0):

- `build` (lume): `500 files generated in 9.40 seconds`.
- `check:links`: `23021 internal links across 162 pages — all resolve`.
- `check:caveats`: `27 caveat markers across 22 pages — all references resolve`.

`_site/` build output is gitignored (`git check-ignore` confirms); the commit carries only the 3
source pages + this run dir. No `packages/`/`plugins/`/`deno.lock`/`_data.ts` churn.
