# Drift Log: S9 Phase A

## 2026-08-30 — RTK unavailable on the NAS image

- **What:** The preferred read-heavy command proxy is not installed.
- **Source:** bootstrap command returned `/bin/bash: rtk: command not found`.
- **Expected:** AGENTS.md prefers `rtk` for read-heavy git/rg output.
- **Actual:** Focused raw `git`, `rg`, and bounded `sed` are required.
- **Severity:** minor
- **Action:** accept for this run; do not install host tooling.
- **Evidence:** first bootstrap tool output in the session; no product behavior is affected.

## 2026-08-30 — Aspire 13.5.3 static MCP exposes 14 tools, not the locked 15

- **What:** The one permitted no-AppHost stdio capture found the exact 13.4.6 baseline tool set;
  `get_integration_docs` was absent.
- **Source:** direct `initialize`, `tools/list`, and `doctor` JSON-RPC exchange with
  `aspire agent mcp` from a directory containing no AppHost.
- **Expected:** The S9 contract expects the 14-tool baseline plus `get_integration_docs`.
- **Actual:** `toolsDiscovered: 14`, `toolsMissing: ["get_integration_docs"]`, and an empty
  baseline diff under CLI/server version 13.5.3.
- **Severity:** significant
- **Action:** preserve the observed receipt verbatim; retain the contract's 15-tool gate so a live
  Phase-B run fails honestly if the mismatch persists. Do not rewrite evidence or claim the
  missing tool was observed.
- **Evidence:**
  `receipts/aspire-13.5.3-mcp-tools-static.json`; pre/post `aspire ps` were `[]` and remote Docker
  inventory was empty.

## 2026-08-30 — scoped check wrapper flag syntax

- **What:** The first scoped check invocation passed `--unstable-kv` directly to the wrapper.
- **Expected:** Workspace checks include unstable KV support.
- **Actual:** The wrapper rejected the direct flag because it already enables `--unstable-kv` by
  default; the corrected invocation passed with zero diagnostics.
- **Severity:** minor
- **Action:** use the wrapper default (or `--deno-arg` for other extra Deno flags).
- **Evidence:** Slice-1 check output and `.llm/tools/run-deno-check.ts --help`.

## 2026-08-30 — agent guidance authority is a generated template

- **What:** The dispatch named `init-agent.ts` as the AGENTS block edit point, while the repository
  generates that block from `packages/cli/src/kernel/assets/agent/guidance.md.template`.
- **Expected:** Update the generator authority and regenerate its consumers.
- **Actual:** The template was updated and `gen:assets-barrel` produced the embedded output; no
  generated mirror was hand-edited.
- **Severity:** minor
- **Action:** follow the repository authority chain.
- **Evidence:** template and generated asset diff in slice 2.

## 2026-08-30 — workflow push required a scoped GitHub write path

- **What:** The configured HTTPS credential could push ordinary commits but lacked GitHub's
  `workflow` scope for `.github/workflows/e2e-cli.yml`.
- **Expected:** Push both slice-1 commits to the explicit branch ref.
- **Actual:** The code commit was pushed normally; the workflow-only commit was created through the
  authenticated GitHub connector and the local branch was fast-forwarded to the identical commit.
- **Severity:** minor
- **Action:** no credential mutation; subsequent non-workflow commits use the required refspec.
- **Evidence:** PR #1759 commits `83ae1a43` and `06a0e5e1` and their implementation comments.

## 2026-08-31 — D-133 abort and D-148 selective un-stack ruling

- **What:** The first un-stack attempt correctly stopped when S9's workflow receipt commit
  conflicted with D-112's narrowed artifact-upload lists, which were outside D-133's gate-list-only
  authorization.
- **Expected:** Only the two gate-registration unions and upstream generated files were authorized
  under D-133.
- **Actual:** D-148 classified S9's workflow change as two additive MCP receipt paths plus retention,
  while the broad recursive globs were obsolete base content that must not return.
- **Severity:** minor process drift; no product-scope expansion.
- **Action:** Rebase onto `bc838a0b3`; retain S8's narrow JSON/NDJSON/listener paths and
  `include-hidden-files: true`; add the per-job MCP receipt path and `retention-days: 30`; reject
  every `.llm/tmp/**` recursive glob.
- **Evidence:** rewritten commits `d81f5fd34`, `06103eeef`, and the D-148 gate rows in `worklog.md`.

## 2026-08-31 — D-194 AppHost workspace identity correction

- **What:** S9's dashboard-authentication amendment treated the generated project root as the
  Aspire AppHost workspace and read a non-existent root-level `aspire.config.json`.
- **Expected:** The config is co-located with `aspire/apphost.mts` under the AppHost workspace.
- **Actual:** CI failed before launching Aspire; the control head without the new read passed.
- **Severity:** behavioral regression, repaired in scope.
- **Action:** derive the config path from the AppHost directory and pass it explicitly through both
  start and restart lifecycle paths; retain strict missing/malformed-config failure.
- **Evidence:** generator path in `render-ts-apphost.ts`, `createSmokeProject()` path contract,
  commit `d9bd6250c`, static suite indices, and the D-194 RED regression in `worklog.md`.

## 2026-08-31 — D-213 generated-only range divergence

- **What:** Three replayed commits map `!` because their generated `skills.generated.ts` patches
  conflicted with the newly converged S8 base.
- **Expected:** Binding conflict rules require the upstream/S8 side for generated files and one
  deterministic barrel regeneration after the replay.
- **Actual:** Commits `8d8c5e00b`, `905f787f8`, and `00c2ef168` each conflicted only in
  `skills.generated.ts`; upstream was taken each time. The final generator produced one 3-line
  replacement committed as `55791043e`.
- **Severity:** mechanical/generated; no product behavior drift.
- **Action:** retain the explicit `!` explanation and the 23-row non-generated blob table; do not
  repair or redesign source.
- **Evidence:** `d213-converge-onto-s8.md`; all 23 non-generated `packages/` blobs are identical.

## 2026-09-02 — Aspire MCP telemetry projection is not raw OTLP

- **What:** Aspire 13.5.3's telemetry MCP tools return AI-oriented JSON projections rather than the
  Dashboard's OTLP envelopes.
- **Source:** pinned upstream `SharedAIHelpers.GetTraceDto`, `GetSpanDto`, and `GetLogEntryDto` at
  Aspire commit `b5f143315ffb6968ea939a9978797a5b20e4c688`.
- **Expected:** The existing query port normalizes trace/span/log records including timestamps,
  events, and link attributes from raw OTLP.
- **Actual:** MCP supplies trace/span timestamps and core attributes, but its structured-log rows
  omit timestamps and its span rows omit span-event fields and link attributes.
- **Severity:** significant static/runtime fidelity drift.
- **Action:** normalize every field MCP actually supplies, use deterministic `0` for its absent log
  timestamp, preserve empty collection defaults, and keep the hosted runtime verdict explicitly
  unclaimed. Do not restore raw unauthenticated HTTP or weaken anonymous-mode authentication.
- **Evidence:** realistic adapter regression and upstream source inspection; hosted tiers remain
  coordinator-held until #1908.
