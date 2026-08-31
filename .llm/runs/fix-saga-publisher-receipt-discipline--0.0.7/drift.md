# Drift Log: saga publisher receipt discipline (#1365)

Drift is append-only. It records facts that diverge from the issue, doctrine assumptions, or the
initial operating plan.

## 2026-08-31 — Aspire S5 already fixed the literal fallback and scaffold success bug

- **What:** The locked base already contains #1740's S5 changes.
- **Source:** Commit `2a1248d33`; current publisher, sample, CLI client, and probe source.
- **Expected:** Issue #1365 cites a silent `127.0.0.1:8092` publisher fallback, two additional literal
  sites, and a scaffold job that discards its receipt.
- **Actual:** No cited runtime/CLI/probe site falls back to 8092, and the scaffold job already
  discriminates the receipt and returns a failed job result. The publisher's missing-endpoint reason
  remains terse and public docs remain stale/unsafe.
- **Severity:** significant
- **Action:** accept the S5 correction; narrow implementation to enforceability, rich diagnostics,
  tests, docs truth, and generated derivatives.
- **Evidence:** `plugins/sagas/src/runtime/saga-publisher.ts:107-169,297-307`;
  `plugins/workers/src/cli/official-sample-configuration.ts:376-415`;
  `plugins/sagas/src/cli/adapters/runtime-api-client.ts:25-47`;
  `plugins/sagas/src/e2e/probes/probe-context.ts:19-30`.

## 2026-08-31 — Discovery normalization is context-specific, not an all-path miss

- **What:** Server and Vite browser service keys deliberately use different normalization.
- **Source:** SDK server/browser resolvers, Aspire Vite helper, and AppHost generator/tests.
- **Expected:** The issue proposes that raw `sagas-api` versus normalized `sagas_api` may make every
  discovery lookup miss.
- **Actual:** Server-side Aspire exports and the saga publisher both use raw
  `services__sagas-api__http__0`, so that path is correct. The SDK browser full key is asymmetric,
  but its normalized `VITE_SAGAS_API_URL` shorthand still resolves the second key Aspire injects.
- **Severity:** significant
- **Action:** defer browser full-key parity to a separate SDK/Aspire issue; do not change server key
  normalization or expand this leaf into SDK/Aspire source.
- **Evidence:** `packages/sdk/src/discovery/service-url.ts:52-61`;
  `packages/sdk/src/discovery/browser-env.ts:15-53`;
  `packages/aspire/src/application/build-vite-env-var-name.ts:50-64`;
  `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts:178-203`.

## 2026-08-31 — #1764 carrier is not integrated at the locked base

- **What:** `9d8bbb4e96e555462cdd8432883a28d493b051eb` descends from the leaf's locked base but is not an
  ancestor of it.
- **Source:** `git merge-base` and `git merge-base --is-ancestor`.
- **Expected:** The brief asked to diff after main integrates the carrier.
- **Actual:** Main at the owner-locked base predates that carrier. The product source paths do not
  collide; `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` is
  a mechanical generated collision. `packages/plugin-sagas-core/README.md` also changes on the
  carrier and is intentionally excluded from this leaf's ceiling.
- **Severity:** significant
- **Action:** keep the locked base; regenerate the MCP corpus in-ceiling for the leaf, then require
  the merge coordinator to regenerate it once more at the final integrated head. Do not duplicate
  #1764's span/correlation acceptance.
- **Evidence:** merge base `5197e70b716eafb82fbb12ddb9a910c248ddb86a`; focused name-status diff in
  `research.md`.

## 2026-08-31 — Owner routing and PR handoff override defaults

- **What:** The owner assigned Codex as S1 author, parked PLAN-EVAL, and reserved PR creation.
- **Source:** User brief and supervisor correction.
- **Expected:** Default harness/PR workflow selects the planning author from lane policy and opens a
  draft PR at first commit.
- **Actual:** This leaf commits and pushes S1 artifacts without a PR; separate-session PLAN-EVAL is
  a hard stop and remains undispatched.
- **Severity:** minor
- **Action:** accept owner override; record it in `supervisor.md` and stop after S1 push.
- **Evidence:** `supervisor.md`.

## 2026-08-31 — RTK proxy unavailable in this worktree environment

- **What:** The required `rtk` executable is not installed on `PATH`.
- **Source:** Initial tool probe.
- **Expected:** AGENTS/RTK skill prefer `rtk` for read-heavy git and task output.
- **Actual:** Raw focused git commands and structured Deno wrappers were used.
- **Severity:** minor
- **Action:** accept; retain compact command scopes and structured wrapper output.
- **Evidence:** `worklog.md` gate records.

## 2026-08-31 — Serialized host-runtime lease required

- **What:** The primary prohibited all scaffold, Aspire, Docker, container, and AppHost commands
  until it explicitly grants this leaf a serialized runtime lease.
- **Source:** Primary supervisor correction in this thread.
- **Expected:** Archetypes 3 and 5 normally require runtime/consumer proof.
- **Actual:** S1 may retain only static, package-level, and read-only evidence. No host-runtime
  result is usable or retained.
- **Severity:** significant
- **Action:** mark every host-runtime gate `NOT_RUN — lease required`; name the exact future command
  but do not run it. PLAN-EVAL and the primary must decide when a leased runtime pass occurs.
- **Evidence:** `plan.md` validation table; `worklog.md` runtime gates.
