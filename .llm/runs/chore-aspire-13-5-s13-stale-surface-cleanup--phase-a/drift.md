# Drift Log: S13 stale surface cleanup

## 2026-08-30 — Phase-1 parity is not in the S10 sibling stack

- **What:** `.llm/tools/validation/check-aspire-version-parity.ts` and its task wiring exist on the
  S1 remote branch but not at S13's required S10′ base.
- **Source:** `git log --all -- .llm/tools/validation/check-aspire-version-parity.ts` and tree probe.
- **Expected:** S13 evolves the S1 gate while remaining a sibling branch stacked on S10.
- **Actual:** The dependency has not landed on main or this stack.
- **Severity:** significant
- **Action:** accept the prescribed base; implement the phase-2 evolution with phase 1 default and
  defer CI flip/convergence until S1 is on main.
- **Evidence:** `research.md`, final dependency check in `worklog.md`.

## 2026-08-30 — Phase-2 flip deferred by ratified ordering

- **What:** S13 implements phase 2 but cannot make it the CI/default enforcement phase yet.
- **Source:** dispatch ordering requires S1 #1727, S9 #1759, and S11 #1771 on `main` first.
- **Expected:** all three dependency row sets current before the final flip commit.
- **Actual:** refreshed `origin/main` is `24f6642f`; `.github/toolchain.env` still pins Aspire 13.4.6,
  and the report sweep attributes 24 remaining non-archival hits to predecessor/derived owners.
- **Severity:** significant, expected sequencing drift
- **Action:** keep phase 1 as the no-argument default, leave CI unchanged, and record the exact owner
  counts for the coordinator's later convergence commit.
- **Evidence:** `worklog.md` slice-4 report and `deno task check:aspire-version-parity -- --phase 2
  --report` output.

## 2026-08-30 — RTK binary unavailable

- **What:** The repository skill recommends RTK for read-heavy commands, but `rtk` is not on PATH.
- **Source:** `rtk grep ...` → `/bin/bash: rtk: command not found`.
- **Expected:** RTK 0.38.0 available at the machine level.
- **Actual:** unavailable in this container.
- **Severity:** minor
- **Action:** use focused raw `rg`/`git`; durable verdicts still use structured wrappers/receipts.
- **Evidence:** bootstrap command output.

## 2026-08-30 — Shared MCP helper widens generated consumer dependencies

- **What:** D-17 extraction makes the generated Fresh telemetry route and workspace Aspire runner
  import the shared reader from `@netscript/mcp`, widening the MCP root export and generated import
  maps beyond the research snapshot.
- **Source:** IMPL-EVAL cycle 1 findings F-1/F-3 at implementation head `e3ffb5dd`.
- **Expected:** the ratified shared-helper contract replaces duplicated `aspire ps` parsing.
- **Actual:** the initial implementation mapped the app import but omitted the workspace-root runner
  import in public JSR/local modes. The canary-C consumer also requires the matching MCP package
  release before a registry scaffold can consume the new exports.
- **Severity:** significant, corrected in the evaluator-fix slice
- **Action:** map `@netscript/mcp` wherever the generated workspace runner is emitted, lock both
  public modes with a paired generator test, and keep canary C coupled to the MCP/CLI release train.
- **Evidence:** `generateDenoJson` and `generators_test.ts`; evaluator cycle 2.

## 2026-08-30 — Synchronous telemetry discovery trade-off

- **What:** the generated telemetry example invokes the synchronous D-17 resolver at request time;
  without a configured AppHost identity it accepts the first running AppHost returned by Aspire.
- **Source:** IMPL-EVAL cycle 1 finding F-4.
- **Expected:** templates consume the same explicit/env/port/running-AppHost policy as MCP without
  duplicating process parsing.
- **Actual:** the ratified resolver is synchronous. The example route has no platform-safe project
  root/AppHost identity port and performs discovery on each page request rather than caching it.
- **Severity:** moderate, accepted for the example surface
- **Action:** retain the shared synchronous reader for semantic parity; configured env/port values
  bypass the process call. A future async/cached route adapter may improve latency without changing
  D-17. Preserve the Aspire-port HTTPS fallback in the template now.
- **Evidence:** `telemetry-trace.ts.template`, resolver precedence tests, evaluator cycle 2.

## 2026-08-30 — Convergence must regenerate the tree-bound manifest

- **What:** manifest freshness follows the exact tracked tree, so stack convergence can change the
  row set even when S13-owned content is stable.
- **Source:** IMPL-EVAL cycle 1 finding F-6.
- **Expected:** D-54 requires regeneration at the final merge head.
- **Actual:** this branch tracks four supervisor-run rows that differ from `main`; S1 also owns an
  independently evolved phase-1 checker.
- **Severity:** expected ordering drift
- **Action:** coordinator regenerates the surface manifest and reconciles the S1/S13 checker at the
  convergence head before flipping phase 2.
- **Evidence:** phase-2 report receipt and coordinator convergence checklist.
