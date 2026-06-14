You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=600 use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh

**IMPL-EVAL — independent evaluator session for the Wave 5 `@netscript/fresh` consolidation (run `feat-package-quality-wave5-apps--consolidation`, Phase D + D2).** You are the INDEPENDENT evaluator — you did NOT write this code. Your job is to rule, with evidence, whether the committed implementation on branch `feat/package-quality-wave5-apps` (HEAD `ca6c00a`) meets the doctrine and the **no-backward-compat** mandate. Evaluate against `.llm/harness/evaluator/protocol.md`, the doctrine under `.claude/skills/netscript-doctrine/`, and `.llm/harness/gates/archetype-gate-matrix.md`. Evaluation ONLY: zero edits to `packages/`, no implementation, no merging.

**WRITE-ARTIFACT-FIRST (mandatory — prior OpenHands runs hit the iteration cap and fabricated summaries; do NOT repeat that): your FIRST action is to create `.llm/tmp/run/feat-package-quality-wave5-apps--consolidation/impl-eval.md` as a skeleton (one heading per Verify item below + a `## Verdict` heading), then fill and re-save each ruling AS YOU GO. Budget your reading so the artifact AND the `OPENHANDS_SUMMARY_PATH` summary are BOTH written and committed well before the iteration cap. The summary's final line MUST be the verdict line. Uncommitted workspace files are committed back to the branch automatically at run end.**

Scope under evaluation: `packages/fresh` — Archetype 4 (DSL/Builder) — restructured into doctrine `src/` role folders, with ALL backward-compat re-export shells DELETED and every consumer (CLI import-maps, tests, package tasks) repointed to `src/`.

Verify (binary PASS/FAIL each, write each ruling into impl-eval.md as you go):

1. **No backward-compat surface remains.** The 5 root re-export shells (`server.ts`, `builders/mod.ts`, `route/mod.ts`, `query/mod.ts`, `config/vite.ts`) and their emptied dirs are gone; the package root holds only `README.md`, `deno.json`, `mod.ts`, `docs/`, `src/`, `tests/`. Confirm `grep -rn --include='*.ts' --include='*.tsx' --include='*.json' "packages/fresh/server.ts\|packages/fresh/builders/mod.ts\|packages/fresh/route/mod.ts\|packages/fresh/query/mod.ts\|packages/fresh/config/vite.ts" packages/` returns ZERO.

2. **Root surface is minimal and de-duplicated.** Root `.` → `mod.ts` exports ONLY the cache-entry helpers (`hasAllCacheEntries`, `minCachedAt`, `projectCachedItemFromList` + their types). It must NOT re-export the error helpers (those live solely on `./error`). No "backward-compat" / "existing apps can keep" framing in the module doc.

3. **deno.json exports + tasks integrity.** Every published subpath key resolves to an existing file under `src/` (no dangling target); the `exports` map was NOT weakened. The `check`/`fmt`/`fmt:check`/`lint` tasks reference real `src/` targets, not deleted shell paths.

4. **CLI import-map parity.** Both `packages/cli/src/maintainer/adapters/local-import-resolver.ts` and `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts` `PACKAGE_TO_LOCAL_PATH` fresh entries point at the SAME `src/` targets as the JSR `exports` (builders→`src/application/builders/mod.ts`, query→`src/application/query/mod.ts`, route→`src/application/route/mod.ts`, server→`src/runtime/server/mod.ts`, vite→`src/application/vite/vite.ts`). `generators-config_test.ts` assertions match. No path references a deleted shell.

5. **Doctrine 05 structure.** `src/` uses only canonical role folders; NO forbidden folder names (`utils/ common/ helpers/ interfaces/ core/`); ≤12 children/dir, ≤4 depth; no file over the ~500 LOC ceiling without a debt entry.

6. **Archetype 4 gates (run them, paste evidence).** From `packages/fresh`: `deno task check`, `deno task lint`, `deno task doc-lint`, `deno publish --dry-run`. Report each PASS/FAIL with command output. Flag any required gate from the matrix omitted without an N/A rationale.

7. **E2E import resolution.** Confirm the scaffold E2E `scaffold.runtime` suite passes with the repointed import-map (a locally-scaffolded app must resolve `@netscript/fresh/*` to `src/` targets, not shells). The generator claims 41/41; verify or, if you cannot run it, say so explicitly and rule on the static evidence instead of fabricating a pass.

8. **Docs truth.** `README.md`, `docs/architecture.md`, and `src/application/vite/README.md` describe the no-shell reality — zero "re-export shell" / "backward-compat" language; the entry-point table's root row lists ONLY the cache helpers.

CRITICAL: reconcile `drift.md` and `commits.md` in the run dir against the actual committed tree — flag any harness-artifact claim not supported by the code.

Output: `impl-eval.md` committed to the run dir (binary PASS/FAIL per item + gate-by-gate evidence). Summary via `OPENHANDS_SUMMARY_PATH` ending with EXACTLY one verdict line: `VERDICT: APPROVED` or `VERDICT: NEEDS-REVISION` + remaining blockers. Evaluation ONLY — zero edits to `packages/`, no implementation, no merging. Do NOT emit any `@openhands-agent` block.

Issue/PR title: [Wave 5] Package Quality — Apps Layer (sdk · service · fresh · fresh-ui) — 5a–5d ✅ MERGED · Structural Consolidation: A–D ✅ · E (close) IN PROGRESS

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27507518739-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27507518739-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-17/run-27507518739-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 17
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27507518739
