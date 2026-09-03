# Evaluation: PR #1982 — exclude harness runs and transient state from Aspire scans

IMPL-EVAL (formal, separate session from the generator). Written in the evaluator's isolated
worktree `/home/agent/projects/netscript/worktrees/007-eval-1982`. No source edits, no commits,
no GitHub mutation performed by this evaluation.

## Identity

| Field             | Value |
| ----------------- | ----- |
| Run ID            | `fix-aspire-parity-context--0.0.7` |
| Evaluated head    | `c487e927367e6b6eee281c7ca19f384c89a1fae7` (exact, clean worktree) |
| Base              | `94fe507af47171cd4f295e8f532b281d7147b334` |
| Requested route   | Approved GLM 5.3 Flash `max` via checked-in Claude/OpenRouter transport (native Fable monthly spend-capped) |
| Observed identity | `z-ai/glm-5.3-flash` on Claude Code transport (OpenRouter), fresh independent evaluator session |
| Generator         | Primary coordinator GPT-5.6-SOL high (per `supervisor.md`); helper thread 01a06670 failed/not-attached (drift D-1) |
| Scope             | Bounded tooling-only correction; owner-directed scan-domain amendment folded into #1982 |
| PLAN-EVAL         | `N/A` recorded in `plan.md` before implementation — justified (bounded known-context repair, no new architecture) |
| PR head at review time | `0475c32134166b9ba60ce1ea1a53c6abcc5af695` — **two commits ahead of the evaluated head** (see Findings F-1) |

## Commands and results (all run independently in this worktree, Deno 2.9.5 via mise)

| Command | Result |
| --- | --- |
| `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all` over `aspire-scan-scope_test.ts`, `check-aspire-version-parity_test.ts`, `check-aspire-host-ports_test.ts`, `check-aspire-resource-polling_test.ts`, `check-compat-fixtures_test.ts` | exit 0, **55 passed / 0 failed** (matches author receipt) |
| `deno task check:aspire-version-parity --phase 1` | exit 0, `ok:true`, 867 checked, 0 fail, 12 deferred, 5 info, 1 skipped, 0 missing, `manifestFresh:true` |
| `deno task check:aspire-version-parity --phase 2` | exit 0, `ok:true`, 867 checked, 0 fail, 17 info, 1 skipped, 0 missing, `manifestFresh:true` |
| `deno task check:aspire-host-ports` | exit 0, "Scanned 966 files. OK — no pinned host ports." |
| `deno eval` live polling scan (`findAspireResourcePolling` over repo root) | 2 findings — **both pre-existing at base**; see Finding F-3 |
| `deno check --unstable-kv` over the 10 touched TS files | exit 0, zero diagnostics |
| `run-deno-lint.ts --config .llm/tmp/eval-parity-lint.json` (tags `recommended`,`jsr`; include `no-process-global`,`no-node-globals`; **no excludes**) over the 10 files | 10 selected / **10 processed / 0 dropped / 0 refusals**, 0 occurrences, exit 0 |
| `run-deno-fmt.ts` over the 10 files | 10 selected / 10 processed, 0 findings, exit 0 |
| `deno task quality:scan` | `ok:true`, 0 findings, 7 pre-existing allowances |
| `deno task arch:check` | exit 0, warning-only findings, FAIL=0 |
| `git diff --diff-filter=D --name-only 94fe507af..c487e9273` | **empty — no tracked file deleted, no history erased**; `.agents/generated/consumer-skills/` still tracked |
| `gh api repos/rickylabs/netscript/pulls/1982{,/commits,/comments}` (read-only) | PR open, base 94fe507af, head drifted to 0475c3213; 5 commits; 3 phase comments |

Lint coverage note (honest): the root `deno.json` lint config excludes `.llm/`, so the 10-file lint
used an evaluator-created temporary config `.llm/tmp/eval-parity-lint.json` (gitignored, transient)
carrying the root rule set with no excludes. All 10 files were actually processed — not dropped —
under `recommended` + `jsr` tags plus `no-process-global`/`no-node-globals`.

## Substantive review (independent, pre-sign-off)

1. **Shared scan-scope policy** (`aspire-scan-scope.ts`): 8-line pure predicate; `.llm/runs|tmp`,
   `.agents/generated/`, `.git`, `node_modules`, `.data`, `.cache`, `.vite`, `coverage`, and
   repo-root `tmp|temp` are excluded; backslash and `./` normalized; the `runs` boundary is exact
   (`runsX` does not match). Retention tests prove `packages/**` source, `packages/sdk/src/.generated/`,
   docs, `.agents/skills/`, `.llm/tools/` remain scanned. Shipped generated framework source is NOT
   exempted — verified by test and by phase-2 checking 867 maintained paths.
2. **Parity wiring**: transient rows are `skipped` (reported, not silently dropped), and the skip
   test asserts the injected reader is never called for them in either phase. Manifest freshness
   still compares the committed TSV byte-for-byte against the canonical generator (`manifestFresh:true`
   observed in both phases).
3. **Manifest generator**: single `git grep` pass with `:!​.llm/runs :!​.llm/tmp` plus the shared
   predicate — the owning research run is no longer row-by-row re-included, so future run files
   cannot create unmatched rows (the original failure trigger). Committed TSV regenerated from the
   generator (no manual rows); the ~100 removed rows are all `.agents/generated/**` working-copy and
   `.llm/runs/**` archival rows.
4. **Negative-version-guard is narrowly owned**: exactly one manifest row
   (`.llm/tools/docs/check-accuracy-and-discoverability.ts`, exact-path rule). The mask recognizes
   only a direct `forbidText(<identifier>, '13.0–13.4.x', <identifier|quoted string>)` statement;
   the real call sites (lines 75, 76–80, 110) fit it. Fail-closed cases are tested: literal first
   arg, `requireText`, quoted-in-string guard, wrong argument order, a stale pin beside a guard,
   and — decisively — the same guard syntax under any other manifest class fails. The third-argument
   version literal in `forbidText(page,'13.4.6','13.4.6')` still fails (mask covers the second
   argument only). No raw stale literal exists elsewhere in the guarded file; phase 2 checks it and
   reports no finding.
5. **Compat-fixture classification**: `.agents/skills/aspire-upgrade/SKILL.md` moved to
   `compat-fixture` with the existing exact-13.5.3-counterpart semantics; the phase-2 report shows
   it `info` with the required 13.5.3 literal present. The superseded generated-guide floor
   exception is genuinely removed (those copies are now wholly outside the scan domain).
6. **Scanners**: host-port gets the guard at both `scanContent` and walker level (default roots are
   `packages/cli/src` + `plugins`, so this is defense-in-depth for future root overrides); polling
   threads `repositoryRoot` through `visit` and skips transient dirs/files, with the
   same-defect-retained-in-framework-source negative test. One formatting-only rewrite of the
   polling `continue` guard — no detector weakening (timing/command/follow signals unchanged).
7. **No runtime behavior change**: package touch is the one version-neutral JSDoc line
   (`packages/aspire/src/domain/aspire-resource-name.ts`); no grammar, dependency, scaffold-output,
   workflow, or consumer-bundle change at this head. AGENTS.md records the durable
   scan-versus-retention rule including the "do not exempt shipped generated source / do not replace
   functional release gates with a text sweep" guard sentence.
8. **Helper suppression check**: exclusions are scoped to the three Aspire static checks only; no
   other checker, test, or gate was loosened, no test was deleted or skipped, and no run artifact
   was deleted or untracked.

## Process verification

| Check | Result | Evidence |
| --- | --- | --- |
| PLAN-EVAL N/A recorded before implementation | PASS | `plan.md` line 4 (bounded contract) |
| Design checkpoint in worklog | PASS | `worklog.md` `## Design` |
| Commit slices match plan | PASS | 85efd5ae4 → cb4d0591d → c487e9273, each scoped to a plan item |
| Evaluator separation | PASS | this session vs coordinator generator (supervisor.md) |
| Generator ≠ evaluator / no self-certification | PASS | author receipts explicitly labeled non-certifying; this review precedes sign-off |
| Release-gate class | N/A | tooling-only leaf per plan; parent release candidate still owns `scaffold.runtime` / published canary pair |
| Close-gate | N/A | partial work — PR body references `#1712` without a closing keyword (correct) |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| medium | **Head drift / evaluation scope.** PR #1982 head is `0475c3213`, two commits beyond the evaluated `c487e9273` (3b6dac6dd9 "ship Aspire scan scope with the consumer host-port checker", 0475c3213 "preserve explicit scaffold checks under scratch") touching `.llm/tools/validation/check-aspire-host-ports.ts(+test)`, `consumer-tools.json`, `agent-tools.generated.ts`, scaffold-e2e wiring, and run artifacts. This verdict does **not** certify that head. | `gh api repos/rickylabs/netscript/pulls/1982` → head 0475c3213 | Coordinator must obtain independent review of the two follow-on commits (or a re-run at the final head) before ready-merge; do not treat this verdict as covering them |
| low | Polling guard has no production caller or gate entry (pre-existing: only its own file/test reference it), and a live repo-root scan reports 2 findings that already exist at base — the guard's own test fixture (`.llm/tools/validation/check-aspire-resource-polling_test.ts:15`) and `packages/cli/src/kernel/adapters/database/operation-runner.ts:357`. No green live polling state exists at base or head; this patch's exclusion policy is proven by its tests, not by a live scan. | `deno eval` scan result; `grep -rln findAspireResourcePolling` | None in this leaf. Whoever wires the guard as a gate must first resolve the two findings and decide the scan root |
| low | D-13 `check-compat-fixtures_test.ts` pins 5 compat-fixture rows as "D-13's complete row set", but the manifest now has a 6th (`.agents/skills/aspire-upgrade/SKILL.md`). Coverage holds because phase-2 parity enforces the 13.5.3-counterpart rule generically for every compat-fixture row (observed in the phase-2 report), so the pinned list is redundant documentation that is now stale. | phase-2 `findings[]` includes the new row as `info` | Optional: add the 6th row to the pinned list in a later slice |
| low | `git diff --check 94fe507af..c487e9273` reports trailing blank lines in two run artifacts (`research.md:12`, `supervisor.md:17`); the worklog's "git diff --check PASS" receipt predates the final artifact state. Run-dir only, cosmetic. | `git diff --check` output | Optional whitespace fix in run artifacts |

Non-blocking observations: the repo-root `tmp/`/`temp/` exclusion is intentional and tested
(`packages/cli/src/temp/...` is retained, only a top-level `tmp|temp` directory is excluded) and is
consistent with the owner's "transient/temp state" language. CI for the PR was running at review
time; per the review mandate this evaluation does not certify CI — the coordinator reconciles final
CI, review threads, and the close-gate before ready-merge.

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **PASS** (coordinator token: **PASS_IMPL**) |
| Rationale | Approved scope is complete at exact head `c487e9273`: owner-directed scan-domain exclusions applied through one shared policy across parity, host-port and polling checks; manifest regenerated from its canonical generator with freshness enforced; the negative-version-guard and compat-fixture classifications are narrowly owned and fail closed; 55 focused tests (including both-phase skip-without-read and fail-closed negatives), parity phases 1 and 2 (867 checked, 0 fail, fresh manifest), host-port scan (966 files), 10-file check/lint/fmt (lint coverage honestly 10/10 processed with no exclusions), `quality:scan` and `arch:check` all pass independently in this worktree. No tracked file was deleted or untracked; shipped generated framework source, maintained docs, and tooling remain checked; runtime behavior unchanged. Findings F-2..F-4 are pre-existing or cosmetic advisories; F-1 (head drift) is a reconciliation obligation on the coordinator, not a defect of the evaluated head. |
