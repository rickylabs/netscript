# IMPL-EVAL — S6: tooling-honesty audit (#1173)

- **Evaluator**: Claude Code + OpenRouter · `qwen/qwen3.7-max` · separate session from generator
- **PR**: #1186 (closes #1173)
- **Worktree**: `/home/codex/repos/ns004-s6-honesty`
- **Branch**: `chore/1173-exit0-audit`
- **Head commit**: `cbaf299e7` (sign-off) on `46c4d715e` (implementation)
- **Plan**: `.llm/runs/feat-1169-one-pass-publish--design/plan.md` → slice S6
- **Plan-Gate**: owner-waived (drift.md records written approval)

## Verdict: **PASS**

## Gate evidence

| Gate | Exit | Result |
| --- | ---: | --- |
| `run-deno-check.ts --root .llm/tools/agentic --ext ts` | 0 | 133 files, 0 findings |
| `run-deno-lint.ts --root .llm/tools/agentic --ext ts` | 0 | 133 files, 0 findings |
| `run-deno-fmt.ts --root .llm/tools/agentic --ext ts` | 0 | 133 files, 0 findings |
| `deno test --allow-read --allow-write --allow-run .llm/tools/agentic/teardown/` | 0 | 28 passed, 0 failed |

Note: bare `deno test` without permission flags fails 9/28 (all `NotCapable` errors). This is expected — the tests require filesystem/process access. The worklog records the correct invocation with `--allow-read --allow-env --allow-write --allow-run`.

## Task 1 — `duplicate_sender_risk` exit 0 explanation

### Artifact verification
**PASS** — `.llm/runs/release-0.0.4--orchestration/slices/plugins/launch.log` exists (796 bytes). Contains structured `duplicate_sender_risk` refusal from the sender-ownership guard — a tool-level session-management refusal, not a model content refusal.

### Deno.exit(4) predates 2026-08-03
**PASS** — `git log -S "Deno.exit(4)" --format="%H %ai %s"` shows earliest introduction at `c2e2d3f8f` / `a60f88196` on **2026-06-20** (44 days before today). Nine commits total touch the string.

### Transcript path plausibility
**PASS** — `.llm/runs/release-0.0.4--orchestration/slices/plugins/` exists with 26 files including `launch.log`, `codex-brief.md`, `acceptance.md`, steer logs, and `resume.log` (334 KB). A fully materialized slice run directory. The claim that "the observer read cat's exit code" (artifact-reader `cat` status attributed to the launcher) is **plausible** from the transcript path existing and the launch.log containing the structured refusal. No certainty is fabricated beyond the artifacts.

### Explanation honesty
**PASS** — The worklog records the finding honestly: the observed exit-0 was an **evidence error** (the background shell's `cat` exit status was observed, not the launcher's), not a launcher defect. The launcher already exited 4 at the time. The transcript path is cited. The supervisor sign-off accepted this finding.

## Task 2 — audit table spot-check (5 rows verified against source)

| # | Tool | Audit table claim | Source evidence | Match |
|---|------|------------------|---------------|-------|
| 1 | `agentic:teardown` | `--apply` with escalations → exit **4** | `teardown.ts:17` — `result.applied && result.escalated.length > 0 ? 4 : 0` | ✅ |
| 2 | `agentic:pr-checks` | non-green checks → exit **1** | `pr-checks.ts:232` — `Deno.exit(report.ok ? 0 : 1)` | ✅ |
| 3 | `agentic:launch-codex-slice` | sender ownership/create race → exit **4** | `launch-codex-slice.ts:390,408` — `Deno.exit(4)` on both paths | ✅ |
| 4 | `agentic:runtime` | blocked → **4**, failed → **5**, invalid → **3** | `agentic-runtime.ts:157` — `status === 'blocked' ? 4 : status === 'failed' ? 5 : 0` (invalid handled upstream with exit 3) | ✅ |
| 5 | `agentic:codex-watch` | invalid/missing → **1**, timeout/heartbeat → **2** | `codex-watch.ts:211,234` — both timeout/heartbeat paths `Deno.exit(2)` | ⚠️ see finding F-1 |

4 of 5 rows match exactly. 1 row has a documentation error (code is correct, table column misread).

## Task 3 — negative test verification

### Teardown `--apply` escalation exits 4 (positive test)
**PASS** — `teardown_test.ts:30-55`: test `apply exits non-zero when requested cleanup is escalated` asserts `teardownExitCode(applied=true, escalated=[...]) === 4` and `teardownExitCode(applied=false, escalated=[...]) === 0`. Passes on current code.

### Negative test: flip exit 4 → 0, test must fail
**PASS** — Evaluator temporarily edited `teardown.ts:17` from `? 4 : 0` to `? 0 : 0`:

```
apply exits non-zero when requested cleanup is escalated ... FAILED
error: AssertionError: Values are not equal.
    [Diff] Actual / Expected
-   0
+   4
FAILED | 5 passed | 1 failed
EXIT=1
```

Restored to `? 4 : 0` — no tracked changes in worktree (`git diff` empty).

## Audit table coverage

The worklog table covers **24 tools** (every `import.meta.main` entrypoint + `agentic:*` task). Every row has a refusal-path description, exit code, and verdict classification. The table is comprehensive for the `.llm/tools/agentic/` surface.

## Concept of Done

- Approved scope complete: Task 1 evidence-error finding with artifact citations, Task 2 systematic audit (24 tools), Task 3 negative test for the one genuine fix (teardown --apply escalation).
- Static gates pass (check/lint/fmt on `.llm/tools/agentic`, 133 files each).
- Runtime gate: 28/28 teardown tests; 344/344 full agentic suite (per worklog).
- No doctrine violation introduced.
- Run artifacts updated (worklog, implement brief, codex-thread-ids, sign-off).
- No `any`, no lint-ignores, no `as unknown as` (per worklog; check/lint clean).

## Findings

### F-1 (minor, non-blocking) — audit table `codex-watch` column misread

**File**: `.llm/runs/chore-1173-exit0-audit--s6/worklog.md`, audit table row for `agentic:codex-watch`
**Claim**: "invalid/missing rollout/worktree; timeout/heartbeat without requested event → 1 / 2"
**Reality**: `codex-watch.ts` exits 2 for both timeout heartbeat (line 211) and watcher-closed-without-event (line 234). The "1" in the table does not correspond to any actual codex-watch exit path for the timeout/heartbeat case — the code is correct (both exit non-zero); the table column is misread.
**Severity**: Minor documentation error. The code behavior is honest (both paths exit non-zero). No code change needed. Suggest correcting the table cell to "1 / 2 / 2" (input-validation / timeout / watcher-close) or restructuring the description for clarity.
