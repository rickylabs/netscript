# Evaluation: host-agnostic agentic WSL execution

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.

## Metadata

| Field          | Value                                                           |
| -------------- | -------------------------------------------------------------- |
| Run ID         | `fix-602-agentic-host-agnostic--host-agnostic`                 |
| Target         | internal agentic tooling (`.llm/tools/agentic/**`)             |
| Archetype      | N/A — internal repository CLI helpers, not framework-layer     |
| Scope overlays | none                                                           |
| Evaluator      | Claude · Opus 4.8 · opposite-family local IMPL-EVAL · 2026-07-11 |
| Baseline→HEAD  | `720fcb7e` → `f2bce6ab` (impl commit `f2bce6ab`)              |
| PR / Issue     | #614 (`Closes #602`), parent #601 (reference-only)            |

## Process Verification

| Check                                  | Result | Evidence                                                                                 |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict `PASS` (cycle 2); impl commit `f2bce6ab` follows plan `56b12136` + revision `39da7421`. |
| Design section exists in worklog       | PASS   | `worklog.md` §Design (Public Surface / Ports / Commit Slices).                            |
| Commit slices match design plan        | PASS   | Single slice as designed; files = `agentic-lib.ts` + adjacent test, `launch-codex-slice.ts`, `gh-token.ts`, `codex-resume.ts`, `README.md`, run artifacts. |
| Each slice has a passing gate          | PASS   | Static + runtime gates below independently re-run green.                                  |
| No speculative seams (unused files)    | PASS   | New exports `CommandPlan`/`buildWslCommand`/`resolveWslCommand`/`renderCommandPlan`/`currentUsername` all consumed by `wsl`/`wslCd`/`resolveGithubToken`/launcher/resume/gh-token or the test. |
| Constants used for finite vocabularies | PASS   | Design correctly records "no new finite string vocabulary"; host branch keys on `Deno.build.os`. |

## Static Gates

| Gate                  | Command or check                                                    | Result | Evidence                                              |
| --------------------- | ------------------------------------------------------------------- | ------ | ----------------------------------------------------- |
| Full unit suite       | `deno test --no-lock -A .llm/tools/agentic/`                        | PASS   | `209 passed, 0 failed` (incl. 4 new host-plan tests). |
| Slice typecheck       | `run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx`          | PASS   | 89 files, 0 findings, `--unstable-kv`.                |
| Format                | `run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx`            | PASS   | 89 files, 0 findings.                                 |
| Raw constructor audit | `grep -rn "wsl.exe" .llm/tools/agentic --include=*.ts`              | PASS   | Only execution constructor is `agentic-lib.ts:94` (shared Windows plan literal). Other hits are JSDoc/comments, test assertions, and one human-facing auth-advice string (`:1059`). |
| Lint                  | covered by suite/check scope                                        | N/A    | No lint-specific gate in plan; check/fmt clean.        |
| Doc lint / Publish    | published-surface gates                                             | N/A    | Internal `.llm/tools/**`, not a `packages/`/`plugins/` surface. |
| Lock hygiene          | `git diff [baseline..HEAD] -- deno.lock` and working-tree diff      | PASS   | No output either way — `deno.lock` byte-unchanged.     |

## Fitness Gates

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| F-1…F-19 | N/A | Archetype N/A — internal CLI tooling, not framework-layer `packages/`/`plugins/` code. Doctrine fitness matrix does not apply. |

## Runtime Gates

| Gate               | Validation                                                                 | Result | Evidence |
| ------------------ | -------------------------------------------------------------------------- | ------ | -------- |
| Native-WSL dry-run | `launch-codex-slice.ts --dry-run` on this Linux worktree, no `wsl.exe` dispatch | PASS   | Independently reproduced. `DRY-RUN ok`; git-safety `{branch:"fix/602-agentic-host-agnostic",head:"f2bce6ab",upstream:"NONE",dirty:0}`; `would run : (cwd="…/netscript-602-hostagnostic") "bash" "-lc" "…"` — local `bash`, **not** `wsl.exe`. Host selection keys on `Deno.build.os==="linux"`, not PATH (`wsl.exe` was still resolvable via the login profile, yet local bash was chosen). Staging step (`wsl()`→local bash) wrote the brief and `wslGitInfo` produced real git info locally. |
| Local user mismatch | `resolveWslCommand("nonexistent-user-xyz", …)` on Linux                     | PASS   | Independently reproduced: throws `Cannot run WSL command locally as requested user "nonexistent-user-xyz"; the current Linux user is "codex". …` before any spawn — `-u` semantics never silently dropped. Same-user resolves to `{bin:"bash",args:["-lc",…],cwd:"/tmp"}`. |

## Consumer Gates

| Consumer            | Validation                                                        | Result | Evidence |
| ------------------- | ----------------------------------------------------------------- | ------ | -------- |
| Windows argv (exact) | pure `buildWslCommand` assertions                                 | PASS   | Byte-for-byte legacy argv: no-cwd `wsl.exe -u codex -- bash -lc <script>`; with-cwd `wsl.exe -u codex --cd <dir> -- bash -lc <script>`. Matches removed `wsl()`/`wslCd()` literals exactly. |
| Linux argv/cwd      | pure test + native dry-run                                        | PASS   | `bash -lc <script>` with `cwd` mapped to `Deno.Command.cwd`; `--cd` collapses into process cwd. |
| Launcher streaming spawn | diff review + dry-run                                          | PASS   | `new Deno.Command(commandPlan.bin,{args,cwd,stdout:'piped',stderr:'inherit'}).spawn()` — early thread-id streaming/capture, ownership, and route-identity paths unchanged; only host construction moved to `commandPlan`. |
| gh-token stdin login | diff review                                                      | PASS   | `runWithStdin(plan.bin, plan.args, pat+'\n', {cwd})` — PAT remains stdin-only (`stdin:'piped'`, `stdout/stderr` not carrying token), never in argv/disk. |
| gh token capture probe | diff review                                                     | PASS   | `resolveGithubToken` gh:wsl probe now `resolveWslCommand(...)` → `runCapture(bin,args,{cwd})`; permission-guarded fallback preserved. |
| resume dispatch + dry-run | diff review                                                  | PASS   | Real dispatch `wsl(o.user,script)` is now host-aware; dry-run `command` field renders `renderCommandPlan(plan)` instead of a hardcoded `wsl.exe …` string (plan-eval carry-forward note resolved). |

## Anti-Pattern Check

| AP    | Status | Notes |
| ----- | ------ | ----- |
| AP-1…AP-25 | N/A | Doctrine anti-patterns target framework `packages/`/`plugins/` archetypes. This run is internal `.llm/tools/` tooling; none are in scope. No new indirection/inheritance/public-surface leakage introduced — one pure builder replaces duplicated literals. |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No doctrine violation introduced; `arch-debt.md` needs no entry. |
| Resolved entries      | 0     | — |
| Deepened violations   | 0     | — |
| Unrecorded violations | 0     | Constructor audit confirms no raw `wsl.exe` execution path remains outside the shared Windows plan literal. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low (non-blocking, forward) | PR #614 body is stale from the plan phase: Slice `S1`, all Definition-of-Done boxes, and "Validation: Not run yet" are unchecked/unupdated. Implementation evidence lives in the run artifacts (`worklog.md` Gate Results), so IMPL-EVAL evidence is **not** missing. | `gh pr view 614` body vs `worklog.md` §Gate Results. | Before moving to `status:ready-merge` and merging (auto-closing #602), honor the close-gate (protocol item 12): check the DoD checklist + #602 acceptance with linked gate evidence and refresh the Validation section. Not a Plan/impl defect; does not block this verdict at `status:impl-eval`. |
| low (accepted) | Auth-advice error string `agentic-lib.ts:1059` still names `wsl.exe` literally. | `agentic-lib.ts:1056-1062`. | Acceptable: it is human instruction text on how to authenticate, not a dispatch or dry-run render. Plan-eval scoped only display/dry-run *render* strings, which are fixed. Optional future polish. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Model host dispatch as a pure `{bin,args,cwd?}` plan, then let buffered/captured/streaming/stdin consumers execute it | Spawn-free unit-testable command planning; one construction source | internal tooling, any host-boundary CLI helper | high |
| Fail closed on Linux requested-user mismatch instead of silently dropping `-u` | Preserve privilege semantics across host abstraction | agentic suite host layer | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Approved scope is complete and issue #602 acceptance is met: host is detected via `Deno.build.os`, Linux execs local `bash -lc` with cwd mapping and a clear pre-spawn user-mismatch failure, while Windows `wsl.exe` argv is preserved byte-for-byte. Every raw `wsl.exe` execution constructor — `wsl()`, `wslCd()`, the gh token capture probe, the gh stdin login, the launcher streaming spawn, and resume dispatch/dry-run render — routes through the shared host-aware plan; the sole remaining literal is the Windows branch inside `buildWslCommand`. Independently re-run gates are green: 209/0 unit, scoped check/fmt 0 findings, native-WSL dry-run exercising git-safety with local bash, mismatch rejection reproduced, and `deno.lock` unchanged. Brief-contract, git-safety, route-identity, one-sender-ownership, LF, and token-stdin invariants are untouched by the diff. No architecture debt is required. The only open item is the pre-merge PR-body close-gate bookkeeping (low, forward), which does not gate the IMPL-EVAL pass. |
