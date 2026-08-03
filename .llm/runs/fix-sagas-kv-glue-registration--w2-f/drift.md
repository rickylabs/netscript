# Drift Log: sagas generated KV adapter registration

Drift is append-only.

## 2026-08-04 — Milestone orchestration artifacts absent from delegated checkout

- **What:** `.llm/runs/release-0.0.5--orchestration/` is not present at the branch baseline.
- **Source:** direct filesystem search after reading milestone-run workflow.
- **Expected:** Dispatch identifies this slice as part of that milestone run and cites ruling D6.
- **Actual:** The per-PR worktree contains the workflow policy but not the orchestrator's live run dir.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Owner dispatch text is treated as authoritative; local run records the exact waiver.

## 2026-08-04 — Service overlay legacy references absent

- **What:** `.llm/harness/archetypes/SCOPE-service.md` references `.claude/04-services.md` and
  `.claude/06-infrastructure.md`, neither of which exists in this checkout.
- **Source:** direct path check and repository filename search.
- **Expected:** Both additional-read files exist.
- **Actual:** No matching files exist; current service contracts, Aspire topology, plugin source,
  and runtime logs remain available.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Service gates are retained; no product scope is changed.

## 2026-08-04 — Milestone PLAN-EVAL composition

- **What:** No local formal PLAN-EVAL is launched for this per-PR slice.
- **Source:** Owner/orchestrator dispatch ruling D6 and `milestone-run.md` evaluator protocol.
- **Expected:** Normal run-loop requires a separate local formal PLAN-EVAL.
- **Actual:** Per-PR evaluation composes draft→ready review, OpenHands label surface, and the
  orchestrator pre-merge gate.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`; `worklog.md` Plan Gate row.

## 2026-08-04 — Isolated detached AppHost did not persist

- **What:** `aspire start --isolated` reported a dashboard/PID and exit 0, but the PID exited and
  `aspire ps` immediately returned no AppHost before any application resource evidence was available.
- **Source:** fresh RED scaffold start; detached CLI log ended after startup-readiness notification.
- **Expected:** The isolated AppHost remains discoverable for resource inspection.
- **Actual:** No host or resource survived; no saga claim was made from the exit code.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Worklog records the no-host result; normal generated `aspire:start` path is the retry.

## 2026-08-04 — Sibling run acquired the shared AppHost slot

- **What:** Between the empty-host preflight and retry, #1191 started an AppHost from
  `/home/codex/repos/ns005-ffi/.llm/tmp/issue1191/ffi-red-green/aspire/apphost.mts`.
- **Source:** live `aspire ps --format Json` after the retry.
- **Expected:** This slice held the W2 expensive/runtime slot after empty preflight.
- **Actual:** The sibling AppHost is now the sole discoverable owner.
- **Severity:** significant
- **Action:** accept
- **Evidence:** Live RED is queued; foreign host/resources are not stopped or mutated.

## 2026-08-04 — Fixed detached AppHost also exited after readiness

- **What:** The fixed scaffold's generated `aspire:start` reported dashboard URL and PID, but the
  detached process exited immediately after the tool-owned PTY closed; `aspire ps` returned `[]`.
- **Source:** `.aspire/logs/cli_20260803T224949373_detach-child_55c594f1afb1432d8efc3732c85130cf.log`
  ends at the AppHost startup-readiness notification and contains no application resource output.
- **Expected:** The detached AppHost remains alive for resource inspection.
- **Actual:** No host survived, so the successful CLI exit is deliberately not counted as health or
  runtime evidence.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Retry will keep an attached PTY alive while all owner-protocol evidence is collected.

## 2026-08-04 — Owner health bar requires saga-specific AppHost probe wiring

- **What:** The fixed background process reached `Running`, but `aspire describe sagas` returned an
  empty `healthReports` object. The owner explicitly disallows treating that fallback state as proof.
- **Source:** Fresh fixed scaffold under `.llm/tmp/1184-green/saga-kv-green`.
- **Expected:** The generated saga background resource has a populated report backed by a check of
  the started saga supervisor.
- **Actual:** Generic background-process generation exposes no endpoint or health probe.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** Add a saga-only supervisor health endpoint in regenerated glue plus its generated
  AppHost endpoint/probe wiring; do not change generic workers/triggers or public package exports.

## 2026-08-04 — KV saga API required unrelated Prisma projection delegates

- **What:** The fresh scaffold selected `NETSCRIPT_SAGA_STORE=kv`, but the saga API aborted its
  post-listen startup when the host Prisma client lacked saga projection delegates. The existing
  empty query adapter was never allowed to serve its intended KV-only fallback role.
- **Source:** `aspire otel logs sagas-api`; fresh scaffold with normal DB init/generate/seed.
- **Expected:** KV durable runtime opens the configured Redis adapter independently of optional
  Prisma query/stream projections; Prisma backend continues to fail closed without its delegates.
- **Actual:** An unconditional assertion prevented the KV runtime from starting.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** Add an internal backend-aware resolver with unit coverage. This deliberately leaves
  #1093 schema extraction untouched and introduces no package export.
