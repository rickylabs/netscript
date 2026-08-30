use harness

## SKILL

- netscript-harness — evaluator protocol (`.llm/harness/evaluator/protocol.md`,
  `verdict-definitions.md`); you are the **independent IMPL-EVAL** for Codex-authored work; you
  never continue implementation and never self-certify anything.
- netscript-tools — scoped wrappers, gate receipts (`.llm/tools/gates/run-gate.ts`), raw git
  verification.
- netscript-pr — PR/labels/closing-keyword rules.
- aspire — Aspire CLI facts; **do not** start an AppHost or upgrade/install the host Aspire CLI (no
  runtime lease).

## Context

Formal IMPL-EVAL for **S6 of the Aspire 13.5 epic (phase A)** — issue #1718, draft PR #1743 (base =
S5 branch `fix/aspire-13-5-s5-literal-ports`; closes #1718, #1280), epic #1712. Route: Claude ·
Anthropic · Fable 5 · medium (native opposite-family evaluator of Codex · GPT-5.6 Sol work), per
`.llm/harness/workflow/lane-policy.md`.

- Evaluate **exactly** head `78d0ded28` on branch `feat/aspire-13-5-s6-health-checks` (base = S5
  head `0bd8ba832`; evaluate only commits after it). Your worktree:
  `/home/codex/repos/netscript-aspire-13-5-s6-eval` (detached at that head; read-only for product
  files).
- Generator run dir (in the tree): `.llm/runs/feat-aspire-13-5-s6-health-checks--impl/`
  (`supervisor.md`, `worklog.md` incl. Design + gate tables, `context-pack.md`, `drift.md`,
  `receipts/parity-phase1-{red,green}.json`).
- Contract of record: issue #1718 — the locked readiness contract table (per-kind TCP / RESP `PING`,
  `HealthCheckResult` mapping, no credentials, one socket + 2000 ms timeout + no retry, endpoint
  host/port resolved at check time). **Phase A only**: the `runtime.health.listener-unreachable` E2E
  fixture and live `healthReports` receipts are lease-backed phase B — do not fail for their
  absence; the fixture code may exist unexecuted in
  `.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` on `origin/research/aspire-13.5-0.0.7`
  (`git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md`).
- Supervisor Tier-A notes:
  `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s6/review-tier-a.md`.
- S2 receipts referenced by S6: `origin/test/aspire-13-5-s2-runtime-verification`
  `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/01-restored-module-grep*`
  (authoritative 13.5.3 TS surface: `addHealthCheck`, `withHealthCheck`, `HealthStatus` member
  casing, `EndpointProperty`) and `02-v5-aspire-describe-final.json` (`healthReports`/`healthStatus`
  keys).
- Known baseline (not S6's): `packages/fresh/src/application/query/hydration.ts` TS2345 on
  `origin/main` (#1734 / PR #1736) fails generated-project `deno task check`; classify it explicitly
  if any CI gate is red for that reason.

## What to verify (run the gates yourself; verdicts from executed evidence, not the generator's claims)

1. Design checkpoint exists and commit slices match it (helpers RED→green → generator emission →
   snapshot/barrel regen → E2E wait gates + phase-B fixture code → gates/drafts).
2. Helpers in `_aspire-compat.ts.template`: `createListenerReadinessCheck` / `createRespPingCheck`
   use `node:net` only; exact `HealthCheckResult` mapping (`Healthy` description
   `<kind> listener ready on <host>:<port>`; `Unhealthy` with
   `data: { code, host, port, elapsedMs }`; `Degraded` only for `-NOAUTH`); one socket,
   `setTimeout(2000)`, destroyed on connect/data/error/timeout, no retry loop. **Verify
   `HealthStatus` member names and the `addHealthCheck`/`withHealthCheck` signatures against S2's
   restored-module receipt, not prose.** Unit tests cover local server / closed port / black-hole
   timeout / `+PONG` / `-NOAUTH` / garbage.
3. Generator: per kind (Postgres/MySQL/SQL Server TCP; Redis/Garnet RESP; Deno KV unchanged
   `withHttpHealthCheck`; SQLite/none nothing) emits
   `builder.addHealthCheck('<resource>_listener'|'_resp', …)` + `.withHealthCheck(key)`; host/port
   from the resource's own endpoint at check time
   (`getEndpoint('tcp').property(EndpointProperty.Host|Port)`); generator tests assert exact
   emission per kind and that password/user parameter names never appear in the probe (grep test on
   generated output).
4. Snapshot `generate-register-infrastructure-1.ts.template` regenerated; `check:assets-barrel`
   clean; `packages/aspire` public surface unchanged (state jsr-audit N/A with evidence).
5. `runtime-gates.ts` asserts `healthReports['<resource>_listener'|'_resp']` present and `Healthy`
   per backing service (describe-derived); phase-B fixture code present but unexecuted;
   `scaffold.plugins` green.
6. Gates you run: configured `deno task lint`, scoped wrappers (+ raw fmt/lint on config-excluded
   `packages/cli`), `quality:scan`, `arch:check`, `check:assets-barrel`, generator/helper tests; no
   new `deno-lint-ignore`/`as unknown as`/`any`; A7/A11: no IO in the generator.
7. Draft PR body `Closes #1718` / `Closes #1280` / `Part of #1712`, base = S5 branch with the
   stacking + phase-B lease stated, labels/milestone, per-commit comments, explicit-refspec pushes;
   boundaries (no S8 commands/`excludeFromMcp`, no pins, no `packages/fresh`, no skills/docs, no
   runtime, no S5 commit edits). S6b 0.0.8 draft and #1366/#863 comment texts exist in the run dir.
8. Verdict semantics: `PASS` = phase A complete and correct; the PR stays draft awaiting phase B; do
   not require phase B.

## Output

Write `evaluate.md` from `.llm/harness/templates/evaluate.md` into the generator run dir path **on
the supervisor's research worktree** by absolute path:
`/home/codex/repos/netscript-007-aspire-13-5-research/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s6/evaluate.md`
(declare the exact evaluated head in the file), and post the same verdict as a PR #1743 comment
starting with `**[PHASE: IMPL-EVAL]**` and the head SHA. Verdict ∈ `PASS` / `FAIL_FIX` /
`FAIL_RESCOPE` / `FAIL_DEBT`. Do not commit to the S6 branch, do not mark the PR ready, do not
merge.
