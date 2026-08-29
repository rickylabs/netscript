# Drift Log: Aspire 13.5 S2 runtime verification

Drift is append-only. Record facts that diverge from the plan, issue, research baseline, or 13.4.6
skill text.

## 2026-08-30 — Bootstrap

- **What:** No implementation drift. Two documented `--help` invocations are unsupported by the
  current `agentic:leak-check` and `agentic:teardown` parsers.
- **Source:** `deno task agentic:leak-check --help`; `deno task agentic:teardown --help`; parser
  source under `.llm/tools/agentic/teardown/`.
- **Expected:** The coordinator brief requested both help surfaces.
- **Actual:** Both commands exit non-zero with `unknown argument: --help`; the parser source
  confirms `--slice-dir`, `--worktree`, `--owned-root`, plus `--stale-after` or
  `--apply`/`--dry-run`.
- **Severity:** minor
- **Action:** accept; execute the documented parsed arguments directly and retain the failed help
  output as bootstrap evidence.
- **Evidence:** bootstrap command transcript in implementation session; summarized in `research.md`.

## 2026-08-30 — Live runtime V1–V7

- **What:** First and second isolated starts took 38.62 s and 24.80 s, not the 13.4.6 skill's
  13-second baseline. The browser-log child existed but remained `NotStarted`; web readiness timed
  out after 60 seconds because generated Prisma/Zod output was absent.
- **Severity:** significant
- **Action:** feed V2 and browser-child observations to S9; do not repair in S2.
- **Evidence:** `receipts/02-runtime-lifecycle.md`, describe and console-log receipts.

- **What:** The direct `verify-live-db-endpoint` gate failed because both consecutive isolated
  starts reused Postgres host port 14428. Executable URL and process ports still differed without
  `ASPIRE_PROXYLESS_ENDPOINT_PORT_RANGE`.
- **Severity:** significant
- **Action:** preserve as a real V3 gate failure and S9 input; do not silence the gate.
- **Evidence:** `receipts/02-verify-live-db-endpoint.raw.txt` and describe snapshots.

- **What:** Bare detached `aspire otel logs` still exited 12 while an explicit dashboard URL exited
  0. Aspire 13.5.3 therefore does not retire the generated telemetry fallback.
- **Severity:** significant
- **Action:** keep `aspire-otel-cli-discovery` open and append this outcome.
- **Evidence:** `receipts/02-v4-*`.

- **What:** After the exact launcher PID was terminated, `aspire ps` discarded the orphan in 385 ms
  and exact-path `aspire stop` returned in 374 ms, substantially faster than the shipped skill's
  approximate 20-second DCP-helper note. The non-force path retained persistent Postgres.
- **Severity:** significant
- **Action:** feed cleanup timing/semantics to S9 and complete the persistent resource through the
  ownership-aware teardown gate.
- **Evidence:** `receipts/02-v6-*`.
