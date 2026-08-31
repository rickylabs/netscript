# Drift Log: saga publisher receipt discipline (#1365)

Drift is append-only. It records facts that diverge from the issue, doctrine assumptions, or the
initial operating plan.

## 2026-08-31 — Aspire S5 already fixed the literal fallback and scaffold success bug

- **What:** The locked base already contains #1740's S5 changes.
- **Source:** Commit `2a1248d33`; current publisher, sample, CLI client, and probe source.
- **Expected:** Issue #1365 cites a silent `127.0.0.1:8092` publisher fallback, two additional
  literal sites, and a scaffold job that discards its receipt.
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

- **What:** `9d8bbb4e96e555462cdd8432883a28d493b051eb` descends from the leaf's locked base but is
  not an ancestor of it.
- **Source:** `git merge-base` and `git merge-base --is-ancestor`.
- **Expected:** The brief asked to diff after main integrates the carrier.
- **Actual:** Main at the owner-locked base predates that carrier. The product source paths do not
  collide; `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` is a
  mechanical generated collision. `packages/plugin-sagas-core/README.md` also changes on the carrier
  and is intentionally excluded from this leaf's ceiling.
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

## 2026-08-31 — Main convergence changed six paths in the authoritative ceiling

- **What:** The supervisor converged the artifact-only leaf onto main
  `8a925764276b25ef7cef484db273604f44557cef` at merge head
  `7c2a12fa1617666a0e17acd81165c25f2325126f`.
- **Source:** Merge parents/ancestry plus an explicit-path diff using the 25-path ceiling locked in
  the original S1 plan.
- **Expected:** The earlier plan treated `5197e70b7` as owner-locked and anticipated a later
  generated-corpus reconciliation.
- **Actual:** The owner superseded that base lock. Main touched **6/25** authoritative ceiling
  paths: `.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json`,
  `deno.json`, `packages/cli/src/kernel/assets/agent-docs.generated.ts`,
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, and
  `packages/mcp/src/publish-assets.generated.ts`. No handwritten publisher, quality-scanner, sample,
  or public-doc source path in the ceiling changed. The merge was conflict-free.
- **Severity:** significant
- **Action:** accept the owner-directed convergence, retain all six intersecting paths in the
  narrowed derivative/task ceiling, and replace every old gate number with a new-base measurement.
- **Evidence:** `plan.md` Rebaseline and Convergence section and Gate Table.

## 2026-08-31 — Primary narrowed the implementation to two real defects

- **What:** The primary reduced the leaf to receipt enforceability and unsafe documentation.
- **Source:** Supervisor directive after independent verification of the six S1 design answers.
- **Expected:** The original issue and first S1 plan included a silent endpoint fallback, a
  scaffold-success defect, endpoint diagnostics, and workers sample/guard changes.
- **Actual:** Two issue headline mechanisms were already fixed before this leaf: the runtime has no
  `127.0.0.1:8092` fallback, and the emitted worker sample already discriminates a rejected receipt
  before returning success. The remaining implementation defects are (1) the API still permits a
  caller to discard the result and (2) four public documentation calls still teach that discard. The
  stale 8092 reference and source-sync gate are coupled documentation corrections.
- **Severity:** significant
- **Action:** shrink the ceiling from 25 to 20 paths; remove every `plugins/workers/**` product/test
  path, endpoint implementation/test/README path, and redundant workers guard. Keep the sample
  source read-only; prove it through the repository quality rule and source-derived docs test.
- **Evidence:** narrowed contract and ceiling in `plan.md`; current
  `plugins/workers/src/cli/official-sample-configuration.ts` receipt branch.

## 2026-08-31 — Rich no-endpoint diagnostic is a proposed follow-up, not leaf scope

- **What:** S1 identified a useful improvement to replace the terse `no-endpoint` rejected reason,
  but the narrowed owner contract does not authorize it.
- **Source:** Original design answer 2 and the primary's explicit narrowing.
- **Expected:** The first plan would make a missing endpoint name all sources tried and explain
  Aspire detection.
- **Actual:** Endpoint resolution is already fallback-free, and diagnostic enrichment is a distinct
  improvement outside the two authorized defects.
- **Severity:** significant
- **Action:** propose a separately authorized follow-up. Preserve this complete attempted-source and
  detection list for that work: `options.baseUrl`; `services__<serviceName>__https__0`;
  `services__<serviceName>__http__0` (including exact default key `services__sagas-api__http__0`);
  `SAGAS_API_URL`; `NETSCRIPT_SAGAS_URL`; whether any `services__*` key or truthy `NETSCRIPT_ASPIRE`
  marker proved Aspire; and whether environment-key enumeration was denied. Do not implement any
  part of it in #1365 without explicit rescope.
- **Evidence:** `plugins/sagas/src/runtime/saga-publisher.ts`; prior S1 answer retained in branch
  history; narrowed `plan.md` deferred scope.

## 2026-08-31 — PLAN-EVAL is now recommended N/A, pending primary ruling

- **What:** Narrowing removed the endpoint, discovery, scaffold, and workers design decisions that
  previously justified adversarial plan evaluation.
- **Source:** Harness run-loop conditional PLAN-EVAL policy and the complete owner-supplied narrowed
  contract.
- **Expected:** Original S1 parked a mandatory separate-session PLAN-EVAL before S2.
- **Actual:** Public mechanism, entrypoints, forbidden alternatives, exact docs defects, ceiling,
  acceptance behavior, and gates are now fully specified. Remaining work is bounded implementation
  and fixture precision.
- **Severity:** minor
- **Action:** recommend `PLAN-EVAL: N/A`; do not treat the recommendation as authority. Stop before
  S2 until the primary accepts it or dispatches PLAN-EVAL. IMPL-EVAL remains separate-session work.
- **Evidence:** `plan.md` PLAN-EVAL Recommendation and open-decision sweep.

## 2026-08-31 — PLAN-EVAL N/A accepted and docs-only main reconverged

- **What:** The primary accepted `PLAN-EVAL: N/A`; the supervisor merged current docs-only main
  `6bb27e46ab1bd4b9534068b2a9eb58039ae287d1` at head `9f1f9fb8738c92dd047054cfde096c3722b967bb`.
- **Source:** Supervisor directive and merge parents.
- **Expected:** S2 remained stopped pending the primary's procedural ruling.
- **Actual:** S2 is authorized. The new main interval intersects 4/20 ceiling paths, all generated
  docs carriers: both agent-doc assets, the CLI agent-doc barrel, and MCP publish assets. No
  handwritten implementation/test/docs source path moved.
- **Severity:** minor
- **Action:** implement the four locked RED/GREEN slices; regenerate all shared carriers in the
  primary-specified dependency order; stop before supervisor-owned IMPL-EVAL/readiness changes.
- **Evidence:** explicit 20-path diff and `supervisor.md` route table.

## 2026-08-31 — Assets generator requires an unlisted scanner carrier

- **What:** The locked S2.4 generator sequence produced a change outside the 20-path ceiling.
- **Source:** `deno task gen:assets-barrel`, run only after `deno task gen:agent-docs-prose` as
  explicitly ordered by the primary.
- **Expected:** The generator would change the allowed agent-docs carrier at ceiling path 17 and no
  other unlisted file.
- **Actual:** It changed both `packages/cli/src/kernel/assets/agent-docs.generated.ts` and unlisted
  `packages/cli/src/kernel/assets/agent-tools.generated.ts`. The latter is not incidental metadata:
  it embeds `.llm/tools/quality/scan-code-quality.ts`, so the new `discarded-saga-publisher-result`
  implementation changes the embedded source and bundle hash. The generator reported a 2-line/2-line
  carrier diff around the large embedded string. No MCP or publish-assets generator ran after this
  was detected.
- **Severity:** blocking
- **Action:** restore every partial generated output, stop S2.4, and request explicit authorization
  to add `packages/cli/src/kernel/assets/agent-tools.generated.ts` as ceiling path 21. If
  authorized, rerun the entire four-generator chain from clean carriers in the locked order. Do not
  silently omit the carrier: that would leave the distributed quality scanner stale.
- **Evidence:** generator-attributed `git status`, focused carrier diff, and S2.4 worklog entry.

## 2026-08-31 — Primary authorized generated scanner carrier as ceiling path 21

- **What:** The primary accepted the S2.4 stop and expanded the locked ceiling from 20 to 21 paths.
- **Source:** Supervisor ruling in this thread.
- **Expected:** Material product scope expansion would require redesign or a new slice.
- **Actual:** `packages/cli/src/kernel/assets/agent-tools.generated.ts` is mechanically forced by
  existing ceiling path 6 because the asset embeds the quality scanner source and its bundle hash.
  Including the carrier does not add product behavior beyond the already-authorized scanner rule; it
  keeps the distributed copy identical to its source.
- **Severity:** significant
- **Action:** add the carrier as generated ceiling path 21, restore all seven carriers to `HEAD`,
  rerun the complete four-generator dependency chain, and stop again if any generated path outside
  15–21 moves.
- **Evidence:** owner authorization, generator attribution recorded above, and updated `plan.md`.
