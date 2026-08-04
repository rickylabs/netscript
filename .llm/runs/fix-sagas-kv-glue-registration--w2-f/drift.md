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

## 2026-08-04 — Merge-readiness suite blocked by unrelated DB/AppHost endpoint churn

- **What:** The required one-pass `scaffold.runtime` suite reaches every saga readiness gate, then
  fails `behavior.service-health` after `behavior.db-status-preserves-apphost` changes the live
  Postgres endpoint without restarting the generated `users` process.
- **Source:** Retained suite JSONL under `.llm/tmp/cli-e2e/plugin-smoke-20260804-021113.log`, live
  `aspire describe postgres|users`, and the users `/health` response.
- **Expected:** The database-status gate preserves the resident AppHost and all dependent endpoint
  bindings; the later users health check connects to the live database.
- **Actual:** `behavior.db-status-preserves-apphost` passes, the healthy Postgres resource is exposed
  at `localhost:44973`, but the already-running Prisma client continues querying
  `127.0.0.1:50564`. `/health` returns 503 with `Can't reach database server` and the suite reports
  `passed=51 failed=1`; saga waits passed before this failure.
- **Severity:** blocking / out of slice scope
- **Action:** escalate
- **Evidence:** Do not mark the PR ready or claim a green expensive gate. Fixing DB-operation AppHost
  resource churn is materially outside #1184 and requires owner/orchestrator direction.

## 2026-08-04 — Orchestrator joins #1184 verification with #1190 delivery

- **What:** Final merge-readiness verification for this slice is deferred until the dedicated
  #1190 saga-publish delivery slice merges to `main`; both defects must be proven together in the
  same canary train because a runner that starts but never delivers is not a working surface.
- **Source:** Orchestrator steer after accepting this slice's recorded seven-point protocol and
  classifying the 51/1 suite result as environmental DB/endpoint churn rather than a #1184 defect.
- **Expected:** This slice would independently clear `scaffold.runtime`, transition draft→ready,
  and hand off after its own runtime proof.
- **Actual:** PR #1193 must remain draft and must not consume the coordinated expensive-gate slot.
  After explicit notification that #1190 has merged, rebase onto `main` and run one joint
  verification: the one-pass `scaffold.runtime` suite plus the full seven-point lifecycle on both
  default Redis/Garnet and `CACHE_PROVIDER=denokv`.
- **Severity:** significant / sequencing change
- **Action:** accept and hold
- **Evidence:** If DB endpoint churn recurs on that single clean rerun, capture ports, both AppHost
  identities, and `aspire describe` output as possible #1196-family evidence; do not retry. Only
  after the joint run is green may this slice complete draft→ready and hand off.

## 2026-08-04 — Joint-verification resume found branch and slot lag

- **What:** At green-light resume, the local rewritten branch and its remote still derived from
  `3ff18a8ad`, while the #1198 engine fix was the next `origin/main` commit (`f7558aa1c`). A foreign
  pristine-baseline DB-operation AppHost also remained registered in the exclusive runtime slot.
- **Source:** Raw `git rev-parse`/`merge-base`/`ls-remote`, `git log origin/main`, `aspire ps`, and
  ownership-aware leak-check.
- **Expected:** The orchestrator-provided rebase includes #1198 and the exclusive slot is physically
  empty before either backend proof starts.
- **Actual:** A second clean rebase onto current `origin/main` is required; runtime work must wait
  for the foreign `/home/codex/repos/ns005-baseline` AppHost to exit.
- **Severity:** procedural
- **Action:** reconcile without touching foreign resources
- **Evidence:** Preserve the preflight leak report, rebase only the clean feature branch, and start
  no AppHost until `aspire ps --format Json` returns `[]`.
