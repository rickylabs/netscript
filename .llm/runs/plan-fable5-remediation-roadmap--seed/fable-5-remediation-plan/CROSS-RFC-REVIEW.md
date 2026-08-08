# Cross-RFC PLAN-EVAL review — RFC-A (#1390) × RFC-B (#1389)

Evaluator: Claude Fable 5 · high, owner-designated cross-family PLAN-EVAL authority
(2026-08-08). Verdicts of record: `plan-eval.md` in each RFC run dir — **both
CHANGES_REQUESTED (FAIL_PLAN cycle 1)**: RFC-A @ `f1a29fe1a` (F-A1–F-A10), RFC-B @ `122301d25`
(F-B1–F-B7). Deep-dive delegations: workflow `wf_b3416478-edf` (3× Opus 5 · xhigh, read-only,
script committed pre-execution in this run's `workflows/`). This artifact records the
cross-RFC obligations; it performs **no board mutation**.

## 1. Composition verdict: the two RFCs compose cleanly

- **No circular dependency.** Shared prerequisite #1350 (0.0.7) is one-way: RFC-A stage 1 and
  RFC-B stage 0 both consume it; neither RFC depends on the other's implementation. RFC-B's
  service→database edge is new but acyclic (F-B2 requires it be *declared*).
- **No duplicated error policy.** RFC-A's preparation failures are local, pre-dispatch, never
  contract errors; RFC-B's command errors are route-opt-in contract errors. Both defer
  client-visible typing to #1350's literal-preserving spelling. Coherent — with one shared
  obligation: whichever lands first establishes that spelling; the other must reuse it (F-B7b).
- **No duplicated context/telemetry policy.** RFC-A reserves trace headers to the transport;
  RFC-B persists validated W3C context in rows and uses producer/consumer spans — disjoint
  layers, consistent with the existing telemetry vocabulary. Both correctly avoid inventing a
  second correlation scheme; RFC-B's stricter-than-existing attribute redaction (F-B7h) is a
  vocabulary-cleanup question, not a conflict.
- **Shared `(family, major)` protocol vocabulary** (RFC-A ↔ #928) does not leak into RFC-B.
- **One latent intersection to watch at implementation:** RFC-A's `idempotency-key` header
  allowance and RFC-B's envelope `idempotencyKey` are different layers (transport header vs
  command input). No conflict today; the future HTTP-idempotency recipe should name which one is
  authoritative for services that accept both.

## 2. Sequencing vs the filed board (#1348–#1388, PR #1347)

Coherent as filed: RFC trackers #1348/#1361 in 0.0.6 (ratification); RFC-A implementation
children #1349–#1353 in 0.0.7; RFC-B children #1362–#1364 (+#1363 umbrella) in 0.0.8 with #1350
(0.0.7) as stage 0. The milestone descriptions carry the authority banner. Frontmatter
`target-milestone` semantics need one clarifying line in each RFC (RFC-A says 0.0.7 = impl,
RFC-B says 0.0.6 = ratification — pick one convention; F-B7d).

**Existing children are sufficient — no duplicates needed.** Required amendments (owner-ratified,
not executed by this evaluator):

- **#1351** — add: `@orpc/opentelemetry` rename decision (already available on v1, F-A8d);
  exact-pin vs lock-only-pin policy for the family move (F-A8, caret manifests); the GET-dedupe
  no-op trap as an acceptance row (F-A8c).
- **#1349** — add: prepared-header channel statement, private-port location + `deno doc`-absence
  gate, server key-algebra surfaces (F-A2/A6/A7) once the amended RFC lands.
- **#1350** — stage-0 body reconciliation (metadata initialization + literal-preserving spelling
  shared by both RFCs) — already planned by RFC-A stage 0; keep.
- **#1362/#1363** — inherit F-B2's relay-ownership decision and F-B1's claim algorithm once
  amended; #1363's child table gains the `PrismaTransactionClient` generator deliverable (F-B6).
- **New reconciliation candidate (owner decision):** `@netscript/queue`'s runtime `ensureSchema`
  DDL vs RFC-B's no-hidden-migrations doctrine (F-B3) — file only if the owner adopts the rule
  repo-wide rather than kit-scoped.

## 3. oRPC v2 migration: separate RFC epic — recommended, with exact scope

**Recommendation: yes, one new RFC tracking issue (rfc-form, 0.0.6-adjacent ratification,
implementation unscheduled)** after RFC-A acceptance — not filed by this evaluator. Verified
facts anchoring it: v1.15.0 is latest stable (shipped *after* beta.26 — v1 actively maintained);
v2 wire protocol incompatible; 74 non-test files reference `@orpc/*`.

Scope (RFC-A's gate list + the four evaluator additions): keep-or-drop **GET** decision
(`allowMethods` + Sec-Fetch-Mode CSRF story — direction corrected per F-A8a); re-implement
`inferRPCMethodFromContractRouter` (removed in v2); dedupe-effectiveness gate (GET-only filter);
`defineMeta` migration for `NetScriptProcedureMeta`; `errorStatusMap` split vs #1350 spelling;
middleware-dedup removal audit across the 74 files; OTel span-topology/double-span proof
(package rename excluded — that is #1351, v1); serializer/streaming/Fresh/desktop parity;
TanStack key re-verification; coordinated-rollout vs parallel-endpoints owner decision (RFC-A
Q9); exact-family pinning discipline; full conformance-suite re-run on the v2 adapter.
Dependencies: RFC-A accepted + stages 2–3 landed (the ports are the migration boundary); owner
beta-risk decision; #1351 complete.

## 4. Handoff state (root orchestrator)

- **Both verdicts request changes → per the evaluator contract, this session stops here.** The
  Qwen 3.8 Max adversarial pass waits until both RFCs reach APPROVED.
- Resume the **RFC-A Codex generator** (thread `019fe242-2bd9-7ff3-8044-bd9d09585397`) with PR
  #1390's finding list (F-A1–F-A8 required; F-A9/A10 may ride along). Branch
  `docs/rfc-sdk-client-contribution`, HEAD `f1a29fe1a` (evaluator commit atop `7be129d80`).
- Resume the **RFC-B Codex generator** (thread `019fe242-2c45-7e03-a428-eebfb968eda0`) with PR
  #1389's list (F-B1–F-B4 required; F-B5–F-B7 as batch edits). Branch
  `docs/rfc-command-composition-kit`, HEAD `122301d25` (evaluator commit atop `62304176f`).
- Both PRs moved to `status:plan`; restore `status:plan-eval` with the amended handoffs. Cycle 2
  is the last before escalation (two-FAIL_PLAN limit).
- Evaluator wrote only: the two `plan-eval.md` files (pushed with explicit refspecs to their own
  branches), the two PR comments + label moves, this artifact, and the seed-run worklog note. No
  RFC text, no product code, no issues/epics/milestones touched. RFC-B's pre-existing dirty
  `codex-thread-ids.md` was left untouched.
