# PLAN-EVAL cycle 3 (final) — release-0.0.7-internals--orchestration/slices/package-gate-honesty

- Plan evaluator session: Claude Code `0f7c4fdf-1023-43ce-8a4d-3c24fa16cd64` / 2026-08-23
- Run: `release-0.0.7-internals--orchestration/slices/package-gate-honesty`
- Surface / archetype: `packages/cli` E2E harness + `packages/mcp` + root `deno.json` + `.llm/tools`
  fmt/lint wrappers + one regenerated CLI asset / Archetype 6 (CLI / Tooling), supporting MCP A2
- Scope overlays: `docs`
- **Evaluated head:** `194e22a3d0aaefe68922ed7a378aafb651a72dff` (repaired thirteen-path plan)
- **Immutable base:** `05fc3132b6800a85eb6152691a961b658962571b`
- **Prior cycles:** cycle 1 `FAIL_PLAN` at `be2b18728` (`plan-eval-cycle-1.md`); cycle 2
  `FAIL_PLAN` at `c415daad2`, preserved bit-identical as `plan-eval-cycle-2.md` (sha256
  `3d54469686be0b16aa00fd863948c5ceab04737e42b532b5ace425a2dec6a678`, equal to
  `git show 194e22a3d:…/plan-eval.md`).
- **Cycle count:** this is the owner-authorized third and FINAL cycle. No cycle 4 exists; a
  `FAIL_PLAN` here returns the leaf to the owner, not to the author.

## Identity, independence, route

| Field                           | Value                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model                           | Anthropic Claude Fable 5 (`claude-fable-5`)                                                                                                             |
| Session ID                      | `0f7c4fdf-1023-43ce-8a4d-3c24fa16cd64`                                                                                                                  |
| `bridgeSessionId`               | `cse_012zvXzGwbKFLMTqNLRZVhBR` (Remote Control, non-empty)                                                                                              |
| Job / backend                   | `~/.claude/jobs/0f7c4fdf/state.json`, `backend: "daemon"`, template `bg`                                                                                |
| `respawnFlags`                  | `--effort medium --remote-control --permission-mode bypassPermissions --name "NetScript 0.0.7 #1663 PLAN-EVAL c3" --model claude-fable-5`               |
| `providerEnv`                   | `{}` (native Anthropic, no gateway)                                                                                                                     |
| cwd                             | `/home/codex/repos/netscript-007-package-gate`                                                                                                          |
| CLI version                     | `2.1.241 (Claude Code)`; Deno `2.9.5`                                                                                                                   |
| Requested route                 | `formal_plan_evaluation` (`lane-policy.md:45`): Anthropic / Fable 5 / medium / `--remote-control`                                                       |
| Route verdict                   | **requested = observed** (native opposite-family binding for a Codex GPT-5.6 Sol-authored plan)                                                         |

Independence: fresh session; not the Codex author thread `01a004ec-86a6-7c21-8886-81c09de099f5`,
not the topic supervisor `f7691917-0be2-4bcd-8839-43d3fc809c34`, not cycle-1 evaluator `9078ecb6-…`
(not resumed), not cycle-2 evaluator `517ac0e7-…`. Inputs: the brief, committed run artifacts, the
PR, the tree at `194e22a3d`, and my own executions. The supervisor's T-1/T-2 were reproduced, not
adopted.

## Target verification

| Check                                                      | Observed                                                                                                                                  |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Local `HEAD`                                               | `194e22a3d0aaefe68922ed7a378aafb651a72dff`                                                                                                |
| `git ls-remote origin refs/heads/fix/package-gate-honesty` | `194e22a3d0aaefe68922ed7a378aafb651a72dff`                                                                                                |
| PR #1663 `head.sha`                                        | `194e22a3d0aaefe68922ed7a378aafb651a72dff` — no mismatch                                                                                  |
| PR base                                                    | `main` @ `05fc3132b6800a85eb6152691a961b658962571b`; draft; labels `type:fix`, `area:tooling`, `status:plan-eval` (cycle-2 A3 discharged) |
| `git diff --stat 05fc3132b..194e22a3d`                     | 9 files, +1341/-0, all under this run dir; **no product/config path changed**                                                             |
| Tree at start                                              | `git status --short` empty                                                                                                                |

All reproductions ran on `git archive HEAD` copies under `$CLAUDE_JOB_DIR/tmp/` (`copy/` with the
planned S1 state applied, `base/` untouched, `t1/` minimal project). The checkout was never
mutated. The author's scratch prototype under `.llm/tmp/package-gate-honesty-plan-proof.xd8Msn/`
was read only to obtain the proposed wrapper code (child-only marker + `nearestConfig` batching);
every number below is my own run.

## Checklist results

| Plan-Gate item                          | Result   | Evidence / location                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Research present and current            | PASS     | `research.md` re-baselined @ `05fc3132b`; R2 reproduced (`quickstart-command-drift_test.ts` from `packages/cli` cwd → `NotFound … docs/site/quickstart.vto`, green from root); R11 reproduced (`closeScoreGap 0.5 → 5` keeps `guidance-retrieval_test.ts` 7/7 green); R14/R15/R16 reproduced by execution (§1–§4).                                                     |
| Decisions locked                        | **FAIL** | L1–L11 are stated with rationale, but the `deno.json` row, L10's last sentence, and DoD row 3 lock a **top-level** `exclude` on the stated rationale that it "only" protects fixture-local formatting from raw walks. Executed: that key also makes `deno check` silently drop the doctor family from explicit argv (F1, §5). The rationale is false by execution.       |
| Open-decision sweep                     | **FAIL** | Evaluator-run sweep finds one unflagged decision that forces rework if deferred: **which** `deno.json` key carries the doctor-family exclusion (top-level `exclude` vs `fmt.exclude`). The plan's choice silently removes four healthy fixture files (plus `broken/`) from the root `check` gate that type-checks them today (F1). Automatic unchecked box.               |
| Commit slices (< 30, gate + files each) | PASS     | Four ordered slices, each with proof/files/gates; S1 now lists the thirteenth path as regeneration-only; numbering matches the PR body `## Slices`.                                                                                                                                                                                                                       |
| Risk register                           | PASS     | `plan.md` risk table; rows 1–2 correctly anticipate parent-family skips and the "exclude the healthy file" temptation; row 7 covers the barrel; row 8 covers memoization. (Row 2's "retain the top-level root exclusion" inherits F1.)                                                                                                                                    |
| Gate set selected                       | PASS     | Gate rows 1–8 map the frozen contract; row 4 now carries `check:assets-barrel` (cycle-2 F1 absorbed); `scaffold.runtime` correctly `n/a` by coordinator waiver.                                                                                                                                                                                                          |
| Deferred scope explicit                 | PASS     | `plan.md` § Explicit deferrals / non-scope.                                                                                                                                                                                                                                                                                                                              |
| jsr-audit (package/plugin waves)        | PASS     | `@netscript/cli` row now discloses embedded tool text + `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` delta with no export/API change; reproduced: `deno task gen:assets-barrel` on the S1 copy changes only `agent-tools.generated.ts` (+2/−2, contains `nearestConfig`, hash line changed) and `check:assets-barrel` exits 0 on the committed copy. `@netscript/mcp` row unchanged. |

## Executed proofs at `194e22a3d`

### 1. Cycle-2 F1 absorbed — PASS by execution

On `copy/` with the prototype `run-deno-lint.ts` in place: `deno task gen:assets-barrel` → EXIT 0;
`git status` shows exactly one generated file changed, `packages/cli/src/kernel/assets/
agent-tools.generated.ts` (`1 file changed, 2 insertions(+), 2 deletions(-)`), containing
`nearestConfig` and a changed `EMBEDDED_AGENT_TOOL_BUNDLE_HASH`; `embedded.generated.ts`,
`skills.generated.ts`, `agent-docs.generated.ts`, plugin/fresh-ui/service barrels unchanged. After
committing that state, `deno task check:assets-barrel` → EXIT 0. The only other consumer of the
hash is `init-agent.ts:7,73` (runtime value, no snapshot/fixture pin), so no fourteenth path is
forced by the regeneration. The thirteenth path is correctly regeneration-only in the surface table,
S1, gate row 4, L7, and the JSR table.

### 2. Cycle-2 A1 absorbed — PASS by execution

`copy/deno.json` with the `fmt:check` task's `packages/mcp/tests/fixtures/doctor/|` alternative
removed: `deno task fmt:check` → EXIT 0, `filesSelected:2038, batches:36, failedBatches:0`. With a
formatting defect appended to `healthy/netscript.config.ts`: EXIT 1, `findings:1` naming
`healthy/netscript.config.ts` — the root gate really selects and judges the healthy file. Control
with the HEAD task (exclusion retained): `filesSelected:2034`, EXIT 0 with the same defect present
(silent skip). The plan's open-decision row "Root `fmt:check` selection" and gate row 3 state this
correctly.

### 3. Cycle-2 A2 / A4 absorbed — PASS by reading + execution

L10 / R14 now say root-style-valid vs fixture-local-default-style-invalid; `deno fmt` on the
healthy file in `copy/` produced exactly the plan's diff, and `deno eval --no-config` import of the
formatted module prints `{"plugins":["workers"]}`. L11 plans per-directory memoization of
`nearestConfig` in both wrappers (A4). `doctor-families_test.ts` 4/4 and the existing
`run-deno-fmt_test.ts` + `run-deno-lint_test.ts` 16/16 stay green with the prototype and marker in
place. `broken/deno.json` sha256 `6815999dbd68bd1ab5bb137b59808cb1f1a38fb3393c9133721f439c0ad37361`
in checkout and copy.

### 4. Acceptance commands and negative controls — PASS by execution

Exact no-extra-flag commands on `copy/` (marker + prototype wrappers + normalized healthy file +
planned `deno.json`):

- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx` →
  EXIT 0, `filesSelected:114, batches:2, failedBatches:0, findings:0`.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/mcp --ext ts,tsx` →
  EXIT 0, `filesSelected:114, batches:2`, 0 occurrences.
- fmt negative (`export const   z=1;` appended to
  `healthy/.netscript/generated/plugin-workers/job-registry.ts`) → EXIT 1, 114/2, one finding naming
  that file; restored `cmp`-equal.
- lint negative (`export const probe: any = 1;` appended to `healthy/netscript.config.ts`) → EXIT 1,
  114/2, one `no-explicit-any` at that path line 5; restored `cmp`-equal.

### 5. New finding F1 — top-level `exclude` silently removes the doctor family from `deno check`

Executed, `base/` (HEAD `deno.json`) vs `copy/` (planned `deno.json` with
`"exclude": [".llm/tmp/", "packages/mcp/tests/fixtures/doctor/"]`):

| Command                                                                               | base (HEAD)                                                   | planned top-level `exclude`                                          |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| `deno check healthy/netscript.config.ts`                                              | `Check …healthy/netscript.config.ts`, EXIT 0                  | `Warning No matching files found.`, EXIT 0 — **file not checked**    |
| `deno check --unstable-kv packages/mcp/mod.ts healthy/netscript.config.ts` (mixed)   | both `Check` lines, EXIT 0                                    | only `Check packages/mcp/mod.ts`, EXIT 0 — **healthy silently dropped** |
| `run-deno-check.ts --root packages/mcp/tests/fixtures/doctor --ext ts,tsx`            | `filesSelected:5, failedBatches:0`, EXIT 0                    | `1 deno check batch(es) failed without parseable type diagnostics`, EXIT 2 |
| `run-deno-check.ts --root packages/mcp --ext ts,tsx --exclude <check task's regex>`   | 115 selected                                                  | `filesSelected:115, batches:1, failedBatches:0`, EXIT 0 — reports 115 "selected" while Deno checks 110 |
| `deno lint healthy/netscript.config.ts` (with the `any` probe)                        | n/a                                                           | `Found 1 problem / Checked 1 file`, EXIT 1 — lint **does** fall back to the nested config |

Root `deno task check` (`deno.json:34`) walks `--root packages --root plugins` with explicit argv and
has **no** doctor-family exclusion, so today it type-checks all five doctor fixture TS files
(base row 3 and the `Check` lines). Under the plan's top-level `exclude`, the same task stays EXIT 0
while `deno check` silently drops those five files from every mixed batch — the wrapper still
counts them as selected. That is a silent coverage loss in a frozen gate (plan gate row 1 "check …
non-empty selection; exit 0" would report green), produced by the very `deno.json` edit the plan
describes as "only" protecting fixture-local formatting (`deno.json` row, L10, DoD row 3,
open-decision row "Invalid-fixture boundary", risk row 2). It is the same false-green class #1618
and R9 condemn, and the class cycle-2 A1 just removed from `fmt:check`.

Why it differs from fmt/lint: for `deno lint` / `deno fmt` an explicitly named file under a
**nested** `deno.json` escapes the root `exclude` (T-1); for `deno check` it does not — the root
`exclude` is applied before resolution and the file is silently omitted. The plan never states the
precedence rule it relies on (T-1), and the rule does not even hold uniformly across the three
subcommands the frozen gate set runs.

**Executed alternative (within the thirteen paths, no fourteenth path):** move the entry from
top-level `exclude` into the existing root `fmt.exclude` list (`deno.json:206-210`, beside
`packages/cli/`, `**/.generated/`, `**/node_modules/`). Results on `copy/`:

- raw root walk `deno fmt --check packages/mcp` → 127 files / 4 unformatted (identical to the
  top-level variant; the normalized healthy file is **not** re-flagged — protection intact; base
  without any exclusion is 136 / 5 and the planned-state raw walk without protection would be 136 /
  6);
- exact fmt wrapper → 114/2, `failedBatches:0`, EXIT 0; exact lint wrapper → 114/2, EXIT 0;
- `deno task fmt:check` → 2038/36, `failedBatches:0`, EXIT 0;
- `deno check --unstable-kv healthy/netscript.config.ts broken/netscript.config.ts` → both `Check`
  lines, EXIT 0; scoped `run-deno-check.ts` on the doctor dir → `filesSelected:5, failedBatches:0`,
  EXIT 0 — **check coverage restored**.

Note for the author: the root `fmt` block already contains an `exclude` key; adding a second
`"exclude"` key earlier in the block is silently shadowed (JSON last-key-wins — I hit this in
scratch). Append to the existing list.

### 6. T-1 disposition — verified; not acceptable as an omission at plan altitude

Reproduced in `t1/`: root `{ "exclude": ["sub/"] }`, `sub/bad.ts` with `any` + bad spacing:
`deno lint sub/bad.ts` and `deno fmt --check sub/bad.ts` → `error: No target files found`, EXIT 1.
Same with section-level `lint.exclude` / `fmt.exclude`. After adding `sub/deno.json` (`{}`): lint
reports `no-explicit-any`, fmt reports the diff, both EXIT 1 on genuine findings — nested config
wins. This is exactly what lets the plan claim both the new root exclusion and the 114/2 green
wrappers. The omission is **not** merely cosmetic: §5 shows the precedence rule does not extend to
`deno check`, and the plan's choice of key is wrong precisely because the rule was never written
down and checked per subcommand. Disposition: folded into F1 (required fix includes stating the
rule and its per-subcommand scope in L3/L10).

### 7. T-2 disposition — confirmed by execution; not rework-forcing; plan owes one sentence

Root `lint.exclude` (`deno.json:182-187`) contains `packages/mcp/tests/fixtures/doctor/`. With the
planned state, the lint probe in §4 fired `no-explicit-any` inside `healthy/netscript.config.ts`
via the exact wrapper (114/2, EXIT 1) and via direct `deno lint <file>` (`Checked 1 file`, EXIT 1):
the healthy files escape `lint.exclude` through nested-config precedence, so L3's "lint becomes
green" is a true green, not a silent skip. No `lint.exclude` edit is required. The plan should
state this asymmetry explicitly (advisory A-T2 below). The `.llm/` entry is the deferred L-2 item
and was not evaluated.

### 8. Surface discipline

Thirteen rows match the two coordinator grants recorded in `drift.md`; the marker is the sole new
file; no fourteenth path is forced — F1's fix is a different key inside the already-granted
`deno.json`. I found no consumer of `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` or the embedded lint text
outside `init-agent.ts` / `init-agent_test.ts` / the generated barrels that would pin the old bytes.

## Open-decision sweep (evaluator-run)

1. **Which `deno.json` key excludes the doctor family** — unflagged; top-level `exclude` silently
   removes five fixture files from the root `check` gate that type-checks them today; `fmt.exclude`
   achieves the stated purpose without that loss. Forces rework of the `deno.json` edit, L10, DoD
   row 3, gate row 1's passing condition, and the risk-register row if deferred (F1). → `FAIL_PLAN`.
2. Root `lint.exclude` asymmetry (T-2) — not rework-forcing; statement owed (A-T2).
3. Everything else in the plan's sweep holds by execution (§1–§4).

## Verdict

`FAIL_PLAN`

This is the third and final cycle; per the owner's authorization the leaf returns to the owner for
disposition. The gap is a single bounded decision inside an already-granted path.

### Required fixes

1. **F1 — doctor-family exclusion key (`plan.md` surface-table `deno.json` row; L3; L10 last
   sentence; open-decision row "Invalid-fixture boundary"; risk row 2; gate row 1; PR DoD row 3).**
   Observed: with the planned top-level `exclude`, `deno check` reports `No matching files found`
   for any explicitly named doctor fixture file and silently omits them from mixed batches while the
   root `check` wrapper still counts them as selected (§5). Required: lock the exclusion in the root
   `fmt.exclude` list (append to the existing key at `deno.json:206`), not top-level `exclude`;
   state the nearest-config precedence rule and that it holds for `fmt`/`lint` explicit argv but not
   for `check` (T-1); re-state the root exclusion's role as "raw `deno fmt` walk protection only, no
   effect on `check`/`lint`/`test` selection"; add to gate row 1 / S1 proof that `deno check` of the
   four healthy files still emits `Check` lines (or the scoped check wrapper reports
   `filesSelected:5, failedBatches:0`) after the edit. Executed alternative evidence is in §5.

### Advisory (do not block on their own)

- **A-T2** — add one sentence to L3 or the `deno.json` row: root `lint.exclude` keeps its doctor
  entry; the healthy files are still linted because their nested `deno.json` takes precedence for
  explicit argv (proved by the `no-explicit-any` probe in §4).
- **A-mem** — L11 memoization is planned; the tests should assert grouping equality with and
  without the cache rather than timing.

## Notes

- Nothing was executed against the checkout; `git status --short` was empty at start and is empty
  at exit apart from this run dir's two artifact changes (`plan-eval.md`, new
  `plan-eval-cycle-2.md`). No marker, fixture, `deno.json`, wrapper, or generated asset changed in
  the tree. No `scaffold.runtime`, Aspire, Docker, or `e2e:cli` was run. No label, issue, ready
  state, lease, or central cluster state was touched.
- The scratch `git stash` commands in my transcript ran inside the private `.git` of the archive
  copy under `$CLAUDE_JOB_DIR/tmp/copy`, never against the shared worktree stash.
