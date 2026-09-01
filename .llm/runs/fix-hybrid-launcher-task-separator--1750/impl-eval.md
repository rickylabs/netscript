# IMPL-EVAL: fix-hybrid-launcher-task-separator--1750 (#1750 / PR #1840)

| Field | Value |
| --- | --- |
| Run ID | `fix-hybrid-launcher-task-separator--1750` |
| Target | task-separator acceptance in agentic launchers (26 strict `agentic:*` parsers) |
| Archetype | N/A — internal `.llm/tools/agentic` tooling; no package/plugin surface |
| Scope overlays | none |
| Evaluator | Separate opposite-family session (Claude surface / GLM 5.3 Flash), 2026-08-31; generator is Codex / GPT-5.6-Sol — session separation holds |
| Evaluated head | `f11dfadd5b47fac422ed7eba858b787b0d4447d4` (matches PR #1840 `headRefOid`) |
| Base | owner-locked `58a4a10eb3b73a0e6c9452e4ed6c7def93f45c92` |
| Method | Read-only over source; every exit code below was captured as `out=$(cmd 2>&1); rc=$?` — no piped-away statuses |

## Decisive Questions

### 1. Is the survey denominator honest? — YES (independently derived)

Re-derived from `deno.json` + entry sources, not from the worklog:

- **32** `agentic:*` tasks in `deno.json` (matches claim).
- **26 strict** finite parsers: wsl-foundation, runtime, routing-state, leak-check, teardown,
  antigravity-evidence, provider-canary, rollout-canary, claude-openrouter-gateway, claude-hybrid,
  codex-resume, codex-status, codex-follow, codex-watch, launch-codex-slice, dispatch-openhands,
  openhands-status, gh-pr, gh-watch, gh-token, review-threads, pr-checks, claude-openrouter,
  opencode, opencode-eval, opencode-web.
- **6 permissive / argument-free** (verified per file, correctly outside the predicate):
  `sync-claude-skills.ts` (×2 tasks, permissive `Set`), `validate-claude-surface.ts`
  (`Deno.args.includes('--pretty')`), `dogfood-skills.ts` (no arg reads), `claude-remote-smoke.ts`
  (scan-style parser that silently ignores unknown tokens), `claude-hook-log.ts` (help probe only).
  32 tasks → 31 unique entry scripts (the sync-claude pair shares one script), matching research.md.
- The **21 rejecting / 5 over-accepting** base split is derivable: GREEN removes exactly five
  explicit `--`-skip blocks (`remote-model-launcher.ts` `continue`, `pr-checks.ts` and
  `review-threads.ts` `case '--'`, `leak-check.ts` and `teardown.ts` `continue`). Base probes
  confirmed both classes: `codex-resume`/`codex-status` rc=2 `Unknown argument: --`, `gh-pr` rc=2,
  `routing-state` rc=3, `leak-check` rc=1 (rejecting); `provider-canary -- --help` rc=0 through the
  raw-args help precheck (over-acceptor family).
- Considered and excluded: `openhands/watch-openhands-verdict.ts` has a strict-ish hand-rolled
  parser and is README-documented — but only as a direct `deno run` script (README.md:210–223), is
  not a `deno.json` task, and a direct `deno run` never receives a task separator. Exclusion is
  correct, not a miss.
- The denominator is additionally **mechanically locked**: `task-separator_test.ts` compares
  STRICT(26) ∪ PERMISSIVE(6) against the live `deno.json` keys, asserts each task→entry mapping,
  and asserts each entry source calls the normalizer — survey drift now fails the suite.

### 2. Did the fix reach every strict entry? — YES (26/26)

- 26/26 entry files import and call `normalizeTaskArguments` as the first statement of the parse
  function that `Deno.args` flows into (per-file call-site grep; every call assigns the normalized
  array back before the finite loop / help scan).
- Every residual raw `Deno.args` read in a wired entry sits inside `main()` → `parse(Deno.args)`,
  i.e. on the normalizing path — no bypass path exists.
- The two help-precheck bypasses named in the plan's hidden scope were actually fixed:
  `provider-canary.ts` and `routing-state.ts` now normalize **before** scanning for `--help` /
  `--json`, so a second or non-leading `--` cannot ride through a precheck.
- One call shape spot-checked in depth (`codex-resume.ts:67`): `parseArgs` normalizes, then the
  finite switch rejects unknowns; `main()` catches and exits 2.

### 3. Is fail-closed genuinely preserved? — YES (all 26 entries probed, real captured exits)

| Probe | Result across all 26 strict entries |
| --- | --- |
| `deno task agentic:<t> -- --zzz-unknown` (unknown later arg) | 26/26 non-zero (rc 1/2/3/4 per each entry's pre-existing convention), all loud parse failures |
| `deno task agentic:<t> -- -- --help` (second separator) | 26/26 non-zero with `Unknown argument: --` |
| `deno task agentic:<t> --help --` (non-leading separator) | 26/26 non-zero with `Unknown argument: --` |
| `deno task agentic:<t> -- --help` (documented form) | rc=0 on all 9 help-supporting entries (codex-resume, codex-status, codex-follow, codex-watch, launch-codex-slice, dispatch-openhands, openhands-status, gh-pr, gh-watch) |

- `claude-hybrid` supports no `--help`; direct and task forms reject it **identically** (rc=1,
  `unknown argument: --help`) — parity, not a separator defect.
- `wsl-foundation`/`runtime`/`routing-state`/`antigravity-evidence`/`provider-canary`/
  `rollout-canary`/`gh-pr`/`gh-token`/`opencode`/`opencode-eval` use their own pre-existing
  usage/unknown-command text rather than the shared message on the unknown-arg probe; all still
  fail loudly and non-zero. The shared `Unknown argument: --` fires uniformly on every later
  separator (the normalizer's own contract).
- Real-arg end-to-end: `deno task agentic:codex-resume -- --thread-id … --message 'eval dry run'
  --user node --dry-run` and the direct form both rc=0 with **byte-identical** command plans; no
  send. This is the documented-form fix proven with substantive arguments.

### 4. Is the RED genuine? — YES

- Throwaway detached worktree `.llm/tmp/red-verify-94178f9ef` at `94178f9ef`;
  `git status --short` captured **empty (0 chars)** before running anything.
- `deno test --no-lock --allow-all .llm/tools/agentic/task-separator_test.ts` → rc=1, 1 passed /
  2 failed; the captured assertion is the exact documented defect (`deno task agentic:codex-resume
  -- --help` → `Unknown argument: --`).
- RED-era `hybrid-launcher_test.ts` + `remote-model-launcher_test.ts` → rc=1, 13 passed / 2 failed.
- Aggregate 14 passed / 4 intended separator failures — matches the worklog claim; the fail-closed
  lifecycle test passes even at RED (fail-closed pre-existed; only acceptance was broken), which is
  the correct RED shape. Both throwaway worktrees removed afterwards.

### 5. Is the normalizer's contract tested beyond the happy path? — YES

`task-separator_test.ts` asserts accept (`['--']`→`[]`, leading strip), reject later `--`, and
reject second `--` on the helper directly; hybrid parser-failure tests assert non-zero **and zero
fake child PIDs** for unknown, second, and non-leading separator forms; lifecycle tests assert one
child with PID/cwd/session/bridge evidence for direct **and** task forms.

## Independent Gate Reproduction

| Gate | Command | Result |
| --- | --- | --- |
| Targeted separator suite | `deno test --no-lock --allow-all .llm/tools/agentic/task-separator_test.ts` | rc=0, 5/5 |
| Full agentic suite | `deno test --no-lock --allow-all .llm/tools/agentic/` | rc=0, **498/498** |
| Check | `run-deno-check.ts --root .llm/tools/agentic --ext ts` | rc=0, 167 files, 2 batches, 0 findings |
| Format | `run-deno-fmt.ts --root .llm/tools/agentic --ext ts` | rc=0, 167/167 processed, 0 findings |
| Dry-run equivalence | `codex-resume` direct vs `deno task … -- … --dry-run` | both rc=0, identical plans, no send |
| `deno.lock` | `git diff 58a4a10eb..f11dfadd5 -- deno.lock` | empty — byte-identical |

Lint was not re-run here; the worklog discloses that the structured lint wrapper refuses the hidden
`.llm` root under the repo config (exit 2, zero files — not a verdict) and obtained the 167-file
verdict via a temporary explicitly-including config. CI lint plus that disclosure is accepted.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| PLAN-EVAL disposition | PASS | Justified `N/A` recorded in supervisor.md/worklog/PR before implementation (owner-supplied exact contract); acceptable for mechanical work |
| Generator ≠ evaluator | PASS | Generator Codex/GPT-5.6-Sol; this is a separate opposite-family session |
| Design checkpoint in worklog | PASS | Worklog `## Design` (surface, vocabulary, ports, constants, slices) |
| Commit slices match plan | PASS | Slice 1 RED `94178f9ef` (tests only), Slice 2 GREEN `f11dfadd5` (implementation) |
| Slice gates | PASS | See reproduction table above |
| Boundary: sibling leaf #1751 | PASS | No `runtime/sender-*` or `codex-thread-read` file in either commit's diff |
| Boundary: live supervisor | PASS (by design) | No real Remote Control launch by author; evaluator also did not launch one |
| PR hygiene | PASS | #1840 OPEN **draft**, body carries `Closes #1750`, DoD leaves IMPL-EVAL unchecked pending this verdict; no labels flipped by this eval |
| Artifacts for resume | PASS | plan/research/worklog/context-pack/drift/supervisor all present and consistent |

## Findings

| Severity | Finding | Disposition |
| --- | --- | --- |
| Low | Parse-failure exit codes vary by entry (1/2/3/4) — e.g. `wsl-foundation` 4, `routing-state` 3, `review-threads` 1. Pre-existing per-entry conventions; this diff adds no new exit convention and the normalizer throw is caught by each parser's existing handler. | Accept — out of scope; no action |
| Low | `research.md` provider-canary baseline cell says "rejected by parser"; at base `deno task agentic:provider-canary -- --help` exits 0 via the raw-args help precheck (before the parser). The parser itself did reject `--`, and the 21/5 split is unaffected (the five over-acceptors are exactly the `case '--'` removals). | Accept — one imprecise cell; counts and classification stand |
| Low | `claude-hybrid` has no `--help` surface; both invocation forms reject it identically (rc=1). | Accept — pre-existing, parity preserved, out of scope |
| Info | Issue #1750's acceptance line ("launches exactly one Remote Control supervisor") is satisfied by the fake-claude lifecycle fixture (one child, PID/cwd/session/bridge evidence, zero children on parse failure) plus byte-identical direct/task dry-run plans — not by a live launch. Judgment: **sufficient**, because the change touches only argv normalization; the direct form's real-launch behavior is pre-existing and untouched; a live launch is a supervisor-owned, globally serialized action correctly refused by both author and evaluator. | Accept with recorded rationale |
| Info | Lint gate evidence rests on the disclosed temporary-config workaround (hidden `.llm` root refusal under the repo config). | Accept as disclosed; CI lint is the durable verdict |

No blocking findings. The sharpest risks briefed to this evaluation — an under-counted survey
denominator, an entry surveyed but not wired, fail-closed degrading into token-ignoring, a
working-tree-contaminated RED — were each checked independently and did not materialize.

## Arch-Debt Delta

None. No new entries, no resolved entries, no deepened or unrecorded violations; no
`packages/**`/`plugins/**` surface touched.

## Verdict

Approved scope complete; survey denominator independently confirmed (32/26/6, mechanically locked
against `deno.json`); 26/26 strict entries wired through the exact-one-leading normalizer with no
bypass path; fail-closed verified with real captured exits on all 26 entries in both directions;
RED genuine in a clean throwaway worktree; normalizer contract tested beyond its happy path;
lock and sibling-leaf boundaries clean; full suite 498/498 and static gates independently
reproduced.

VERDICT: PASS
