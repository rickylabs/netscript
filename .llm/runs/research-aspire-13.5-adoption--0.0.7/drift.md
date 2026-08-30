# Drift log

## D-1 — Owner route override

- Severity: intentional
- Baseline policy: planning orchestration normally routes to Opus 5 high; Fable 5 medium is the
  deep-analysis lane.
- Owner decision: this standalone harness research orchestrator must use Fable 5 medium.
- Action: record requested and observed identity and keep the route for the run.

## D-2 — Scope expanded beyond migration

- Severity: plan-shaping
- Owner correction: the epic must cover Aspire MCP plus all static resources and docs so NetScript
  is fully aligned with the latest Aspire release.
- Action: `supervisor.md` makes canonical-source and regeneration-chain coverage mandatory.

## D-3 — `?aspire-lang=typescript` has no effect on the Markdown form

- Severity: minor (method)
- Observation: aspire.dev serves Markdown at `<page>.md`; the query string does not change the
  response (byte-identical for the What's New page). The Markdown contains both C# and `apphost.mts`
  tabs.
- Action: TypeScript claims are taken from the `apphost.mts`/`twoslash` fences and from the
  generated TypeScript API reference (`reference/api/typescript/aspire.hosting`), which is the
  authoritative TS surface. Recorded in `sources/README.md`.

## D-4 — Upstream documentation contradicts itself on TypeScript feature availability

- Severity: minor (evidence)
- Observation: `app-host/container-files` and `fundamentals/health-checks` still say the TS APIs are
  "not yet available"; the 13.5 What's New and the 13.5.1 TS API reference expose them.
- Action: trust the API reference; `research.md` §11 lists every discrepancy so nobody "fixes"
  NetScript to match a stale page.

## D-5 — Remote Control cannot be enabled from inside the turn

- Severity: process
- Observation: `/rc` is a user-side slash command; the orchestrator can only record the observed
  session URL (`https://claude.ai/code/session_011Ng6hnMLyY8vzM8EJo2XKg`). Effort level is not
  introspectable from inside the session.
- Action: recorded in `supervisor.md`; the owner verifies `/status` and keeps `/rc` on.

## D-6 — Repo already partially on 13.5

- Severity: plan-shaping
- Observation: `.github/workflows/e2e-cli-prod.yml` pins Aspire CLI `13.5.0-preview.1.26404.10` (for
  aspire#18948/#18958) while every other pin is 13.4.6 and the NuGet cache key is `13.4.6-v1`; the
  policy test asserts both literals.
- Action: plan D-1/D-8 converge everything on 13.5.3 in S1; the preview's rationale shipped in
  13.5.0.

## D-7 — Standing scaffold assumption about CommunityToolkit projection is stale

- Severity: plan-shaping
- Observation: `generate-aspire-config.ts:44-56` and the arch-debt entry assume `[AspireExport]`
  from external NuGets is not projected into the TS SDK; the aspire.dev TS API reference lists
  `CommunityToolkit.Aspire.Hosting.Deno` (`addDenoApp`, `addDenoTask`).
- Action: not adopted in 0.0.7 (D-4); S2 V9 proves it at restore time, S12 spikes it in 0.0.8.

## D-8 — Coordinator scope expansion to whole-ecosystem alignment

- Severity: plan-shaping
- Owner/coordinator correction (2026-08-29): audit and dispose every Aspire-bound surface (MCP
  server/client, static resources, generated snapshots/schemas, skills/corpora/prompts, CI
  workflows/fixtures, examples/templates, dashboard/telemetry bridge, all docs) with one
  authoritative source and one repo-path disposition; include cleanup in the issue graph.
- Action: `stale-surface-inventory.md` (7 surface classes, archival exemption list), research
  C26–C31 + §12a, plan D-11/D-12, new slice S-13, epic pillar 7.

## D-9 — S-09 acceptance was prose-only

- Severity: acceptance
- Correction: S-09 must prove the MCP upgrade behaviour with a structured receipt tied to S-01/S-02.
- Action: `sub-issues/09` rewritten (Part A smoke gate `agent.aspire-mcp-smoke`, JSON receipt path
  `.llm/tmp/gate-receipts/<job>/agent.aspire-mcp-smoke.json`, committed copy
  `receipts/aspire-13.5-mcp-smoke.json`); 13.4.6 baseline captured now in
  `receipts/aspire-13.4.6-mcp-baseline.json` (executed via the session's Aspire MCP server —
  `doctor` + tool discovery; no AppHost started).

## D-10 — Shipped skill's 13.4.6 MCP table is already incomplete

- Severity: minor (evidence)
- Observation: the 13.4.6 server exposes `refresh_tools`, which the "verified tool set on 13.4.6"
  table in `skills/aspire/SKILL.md` omits. Not a 13.5 change; S-09's receipt-driven table fixes it.

## D-11 — PLAN-EVAL cycle 1 FAIL_PLAN and bounded repair

- Severity: plan-shaping
- Verdict: `plan-eval.md` (head `d8caa507e`, evaluator Codex · Sol · high) — F1 health contract, F2
  canary/stable admission, F3 MCP ownership/lifecycle, F4 parity phases, F5 wave completeness +
  manifest, F6 jsr-audit, F7 rendering/staleness.
- Action: all seven corrected in one research-only commit (mapping in `worklog.md`); decisions
  D-5/D-6/D-10 revised, D-13/D-14 added, D-17 opened (dashboard-port assumption, resolve before
  S-13); S6b (protocol-level readiness) deferred to 0.0.8; `aspire-surface-manifest.tsv` + generator
  committed. No second evaluation cycle was launched.

## D-12 — PLAN-EVAL cycle 2 (final) FAIL_PLAN and consistency repair

- Severity: plan-shaping
- Verdict: `plan-eval-cycle-2.md` (head `1bfe60b05`) — six consistency findings; root cause of most
  of them: the cycle-1 repair's scripted `plan.md` replacements silently missed after `deno fmt`
  re-padded table cells (the exact `fmt-rewrap-breaks-string-patches` trap), so D-10/slice table/
  rollback/risk/ratification stayed on the two-canary/12-slice text while the DAG and canary table
  were already correct.
- Action: `plan.md` rewritten in full; MCP semantics corrected (`excludeFromMcp()` ≠
  `withHidden()`); parity phases made executable with the run dir + debt registry archival and
  compat fixtures / lock files special-cased; S13 everywhere; `SAGAS_API_DEFAULT_PORT` retained as
  deprecated compat export; truncated rows reconstructed; deployment owned by S4 (D-15); D-17
  default locked. Every scripted edit was re-verified by grep before commit. No third ordinary
  PLAN-EVAL; next step is coordinator ratification.

## D-13 — Resume turns drop the requested effort

- Severity: minor (route)
- Observation: `launch-codex-slice` matched openai · gpt-5.6-sol · medium for S1, but
  `run-codex-slice` → `codex-resume` (`codex exec resume`) carries no `--effort`, so `codex-status`
  reports the later turns at the profile default `high`.
- Action: recorded; review pairing unchanged (Fable, medium+); agentic-suite follow-up to propagate
  effort on resume (not an S1 concern).

## D-14 — Baseline Fresh type error blocks the CI runtime verdict

- Severity: significant (blocker for S1 draft→ready; not S1-caused)
- Observation: `packages/fresh/src/application/query/hydration.ts:43` TS2345 fails generated-project
  `deno task check` (`generated.quality-negative`, `generated.service-check`) at base `3b32d1628`;
  blob identical at S1 head. Aspire-specific gates through `runtime.aspire-restore` are green on
  13.5.3.
- Action: surfaced to the primary coordinator for the 0.0.7 fixes lane; S1 stays draft until the
  baseline is green or the coordinator admits S1 on the Aspire-specific evidence.

## D-15 — Aspire MCP 13.5.3 exposes 14 tools; `get_integration_docs` is documented but absent

- Severity: plan-shaping (S-09 acceptance)
- Observation (S2 V8, exact host CLI 13.5.3+b5f1433, stdio `aspire agent mcp` from the generated
  project root, 2026-08-29T22:47Z): `tools/list` = the same 14 tools as the committed 13.4.6
  baseline (`refresh_tools` present); `get_integration_docs` — listed by
  `sources/aspiredev-get-started_aspire-mcp-server.md` — is **not** exposed. Receipts:
  `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/03-v8-*` on
  `test/aspire-13-5-s2-runtime-verification`.
- Action: S-09's smoke expectation becomes the **executed** 13.5.3 set (14 tools; `baselineDiff`
  empty); the receipt records `get_integration_docs` as a documented-but-absent tool (upstream doc
  discrepancy §11 item 6) and treats its later appearance as `info`, not `fail`. Issue #1721 gets a
  comment; `research.md` C16/C27 get an errata line at the next research-dir edit.

## D-16 — Isolated starts reuse the generated Postgres host port (S2 V3)

- Severity: significant (product; S5 scope)
- Observation: two consecutive `aspire start --isolated` runs of the same generated project both
  bound Postgres to host port 14428; `verify-live-db-endpoint` exited 1.
  `DcpPublisher__RandomizePorts` does not cover the generated infrastructure `withHostPort`/endpoint
  pins.
- Action: S5 (#1717) must include infrastructure host-port pins in the literal-port removal / opt-in
  policy; S10 keeps the gate; noted on #1717.

## D-17b — Cold start 38.6 s and web readiness timeout on 13.5.3 (S2 V2)

- Severity: minor (evidence)
- Observation: time-to-`dashboardUrl` 38.6 s cold / 24.8 s warm on this host (skill baseline 13 s on
  13.4.6, different machine state); web readiness timed out because Prisma/Zod generated output was
  absent until `db generate` ran; browser-log child `NotStarted`.
- Action: S9 replaces the skill timing claim with measured ranges; S10 orders db codegen before the
  readiness wait; not an Aspire regression claim without a same-host 13.4.6 control.

## D-18 — 2026-08-30 — S5 does not close #1365 (OF-3a drift)

- **What:** Ratified OF-3a / #1717 box 6 had S5's PR close #1365, #1370, #979. At IMPL-EVAL PASS
  (`slices/s5/evaluate-cycle-2.md` F-2) the #1365 acceptance boxes for docs-site embedding
  (S11), "discarding a publish result fails type-check/lint" (declined by locked D-14), and
  restart/duplicate/out-of-order/OTEL-correlation proofs are not met by S5.
- **Action:** PR #1740 references `Part of #1365` with the remaining scope listed; #1370 and #979
  keep closing keywords. Coordinator to either amend #1365's boxes (D-14 decision) or route the
  remainder to S11 + a sagas follow-up. Severity: minor (scope honesty, no code impact).
