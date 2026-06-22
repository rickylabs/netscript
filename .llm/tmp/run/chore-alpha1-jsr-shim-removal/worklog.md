# Worklog — chore-alpha1-jsr-shim-removal

- Planning artifacts committed. No implementation slice until PLAN-EVAL PASS.

## 2026-06-22 — PLAN-EVAL cycle 1

- Verdict: **FAIL_PLAN** (cycle 1 of 2).
- T1 (cli aliases / db buildConnectionString / mssqlJsonExtension / telemetry context/job.ts) — verified 0-consumer; plan accurate.
- T2 (mssql trustedConnection / fresh serveStaticFiles + registerFsRoutes) — canonical exists (authentication.type='ntlm', staticFiles, fsRoutes); plan accurate.
- T3 saga-side (`saga-bus-legacy` + legacy runtime) — verified 0 external consumer; canonical `SagaBusBridge`/native runtime covers; wholesale removal safe.
- T3 workers-side (`schedule()` builder + `schedule` field plumbing) — **unsound**. `defineScheduledTrigger().enqueueJob()` is not a canonical replacement; the two are parallel cron subsystems with separate scaffolds, CLI flags, runtime adapters, and documented public surfaces.
- Version policy (alpha-1 minor bump with breaking note): **PASS** — semver-correct for 0.0.1-alpha.0 series.
- Required fixes: re-scope S3b (workers-side), run `jsr-audit` on the planned surface, include doc/recipe updates in S3b file list, add `deno doc --lint` to gate set, convert "Codex must grep" to a gate, re-run open-decision sweep.
- See `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan-eval.md` for full findings.
- See `.llm/tmp/run/chore-alpha1-jsr-shim-removal/drift.md` for drift notes.
- Lock hygiene preserved — no `deno.lock` churn, no source edits, no implementation commits.
## 2026-06-23 — PLAN-EVAL cycle 2

- Verdict: **PASS** (cycle 2 of 2; final). Run: openhands-run-27988081250-1.
- S3b (workers-side slice) cleanly DEFERRED per user-confirmed option (b). Verified at tip `5d1bee91`:
  all workers-side surface (schedule field + scheduler port + builder method + scaffold + CLI flag +
  template + 4 docs/recipe/site references) is intact and untouched by PR-B.
- S3a (saga legacy) verified self-contained: no dependency on deferred workers work;
  `saga-supervisor.ts:130` fold onto native default is correct (native is the default in
  `create-saga-runtime.ts:86-90`).
- V8_HEAP_MB fold verified: `v8-profiles.ts:12,46,73` is the only live consumer; other 7 aliases
  re-grepped = 0-consumer.
- Gate set verified sufficient for the smaller breaking removal.
- Version policy + zero-cast re-confirmed.
- Lock hygiene preserved — no `deno.lock` churn, no source edits, no implementation commits.
- See `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan-eval.md` for full findings.
- See `.llm/tmp/run/chore-alpha1-jsr-shim-removal/drift.md` for drift notes.