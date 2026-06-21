# Drift Log: service-graceful-shutdown

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-06-20 — Harness reference path drift

- **What:** The implementation brief points to `.llm/harness/gates/SCOPE-*.md`, but `SCOPE-service.md` lives under `.llm/harness/archetypes/` in this worktree.
- **Source:** `ls .llm/harness/gates`; `ls .llm/harness/archetypes`
- **Expected:** Scope overlay under `.llm/harness/gates/`.
- **Actual:** Scope overlay under `.llm/harness/archetypes/`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `.llm/harness/archetypes/SCOPE-service.md`

## 2026-06-20 — Missing service overlay read-first docs

- **What:** `SCOPE-service.md` references `.claude/04-services.md` and `.claude/06-infrastructure.md`, but this worktree only has `.claude/settings.json`.
- **Source:** `find . -maxdepth 3 -type f \( -path './.claude/*' -o -path './.agents/*' \)`
- **Expected:** Referenced `.claude` service and infrastructure docs exist.
- **Actual:** Referenced docs are absent.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `.llm/harness/archetypes/SCOPE-service.md`

## 2026-06-20 — Slice plan-eval artifact summarized at supervisor level

- **What:** The slice directory does not contain `plan-eval.md`, but supervisor `plan-eval-summary.md` records `service-graceful-shutdown` as PASS.
- **Source:** `ls .llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-graceful-shutdown`; `rg "service-graceful-shutdown" .llm/tmp/run/feat-framework-prime-time--supervisor/plan-eval-summary.md`
- **Expected:** Slice-local PLAN-EVAL artifact.
- **Actual:** Supervisor-level PLAN-EVAL summary with PASS verdict.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `.llm/tmp/run/feat-framework-prime-time--supervisor/plan-eval-summary.md`

## 2026-06-20 — Root architecture gate has unrelated pre-existing failures

- **What:** `deno task arch:check` exits 1 on repo-wide doctrine findings outside this slice.
- **Source:** `rtk proxy deno task arch:check`
- **Expected:** Approved plan names `deno task arch:check` as a gate.
- **Actual:** Root gate reports 58 FAIL / 143 WARN / 1 INFO, with failures in root metadata, `packages/cli`, `packages/plugin`, `packages/plugin-workers-core`, and plugin CLI/test files. Touched `packages/service` files are not listed as failures; `deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/service` exits 0 with one pre-existing warning about `docs/architecture.md` archetype wording.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Root gate failed on unrelated existing repo debt; scoped service doctrine gate passed.
