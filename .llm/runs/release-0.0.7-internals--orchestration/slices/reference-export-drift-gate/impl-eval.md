# IMPL-EVAL cycle 5 (changed-source quality repair delta) — reference-export-drift-gate (PR #1666)

## Verdict

**PASS**

Cycle 5 judges the focused repair `e357938df` that answered the two leaf-owned findings raised by
the ready-triggered **Code quality** run `31908898023` (head `05ac90d00`, `failure`): `explicit-any`
at former line 356 and `unsafe-cast` at former line 372 of `.llm/tools/docs/check-exports-drift.ts`.
It also confirms the integration contract accepted by cycle 4 is undisturbed. The prior canonical
verdict (cycle 4, PASS at content head `8c03d8629`, evidence `021c7ffc6`, committed `05ac90d00`) is
preserved verbatim as `impl-eval-cycle-4.md`; cycles 1–3 and both `plan-eval*` are untouched. Every
item below was re-derived in this session on scratch `git archive` copies under
`$CLAUDE_JOB_DIR/tmp/` (never `.llm/tmp/`), not re-read from `ci-quality-repair-evidence.md`. No
blocking finding; one non-blocking observation (§5, lint exclusion — pre-existing repo config).

## Binding

| Field                    | Value                                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluator                | Claude Fable 5, fresh separate session; opposite-family to Codex GPT-5.6 Sol author thread `01a005d2-7c9d-7dd1-b6fc-531b72dc14e4`                                                |
| Session                  | `claude.ai/code/session_016v2se871QD9Q9Rd6YADAKC` (bg job `dc433b8d`, Remote Control)                                                                                            |
| Immutable repaired head  | `e357938df82b2a87ccc69ac3217c165c16572930` — `fix(docs): type exports drift map parsing`                                                                                         |
| Prior accepted heads     | integration content `8c03d8629`, evidence `021c7ffc6`, cycle-4 verdict `05ac90d00`; base `baf1cdf67`; main `0ef48c2ec` — all ancestors of `e357938df` (linear, no rebase/squash) |
| Local / remote / PR head | `git rev-parse HEAD`, `git fetch origin` + `origin/fix/reference-export-drift-gate`, `gh pr view 1666 --json headRefOid` all `e357938df`; PR OPEN, draft, `status:impl`          |
| Repair delta             | `git show --stat e357938df`: 6 files — checker (+34/−11), checker test (+54/−1), `ci-quality-repair-evidence.md`, `context-pack.md`, `drift.md`, `worklog.md` (append-only)      |
| CI at head               | `Code quality`, `ci`, `e2e-cli`, `public-surface-diff` **skipped** (draft) at `e357938df`; Pages deploy success. My local `changed-files` scan below is the head-bound evidence. |

Evaluator worktree: `.claude/worktrees/impl-eval-c5` (branch `eval/impl-eval-c5-1666` at
`e357938df`); scratch archives `$CLAUDE_JOB_DIR/tmp/{prefix,head}` (`git archive 05ac90d00` /
`e357938df` of `.llm/tools/quality`, `.llm/tools/docs`, `deno.json`, `deno.lock`). No Aspire /
Docker / browser / `e2e:cli` / scaffold smoke / close-gate / publish / label / issue / draft-state
action; #1663 and #1651 untouched; no second evaluator launched.

## Findings against the eight brief items

### 1. Both findings eliminated by real typing — confirmed, no cheating

- `grep -n -E '\bany\b|as unknown|@ts-|deno-lint-ignore|quality-allow'` over
  `check-exports-drift.ts` and `check-exports-drift_test.ts` at head: **zero matches**.
- Repair shape (diff `05ac90d00..e357938df`): `exportsObj: any` → `exportsObj: unknown`;
  `(value as any).default || ''` → `resolveDenoExportPath(value)` behind `isExportsRecord` /
  `isDenoExportTarget` type guards and the new `DenoConditionalExportTarget` / `DenoExportTarget` /
  `DenoExports` vocabulary. No cast, no ignore, no allowance.
- Scanner and its config byte-unchanged base→head:
  `git diff --stat baf1cdf67 e357938df --
  .llm/tools/quality/ .github/workflows/code-quality.yml`
  is **empty**; the only `deno.json` delta base→head is the one-line `docs:exports-drift` task
  (already-accepted S2 content); `quality:scan` `--max-allow 7` unchanged.
- Pre-fix reproduction on the `05ac90d00` archive:
  `scan-code-quality.ts --changed-file <checker>
  --changed-file <checker_test>` → `ok:false`,
  exactly two findings, `explicit-any` line 356 `exportsObj: any,` and `unsafe-cast` line 372
  `(value as any).default || ''`, `allowCount 0`, raw exit **1**. The findings were real and are the
  ones CI attributed.

### 2. Unknown top-level fails closed — confirmed

Direct probe of head `deriveExpectedExports('@x/p', v)` (scratch `probe.ts` importing the archived
head checker): `42`, `null`, `undefined`, `[]`, `['./a.ts']`, `true` **all throw**
`TypeError: Deno exports must be a string or a record`; `'x'` → `[['@x/p','x']]`. No permissive
empty-map fallback exists on any non-string/non-record path (arrays are excluded by
`isExportsRecord`).

### 3. Behaviour deliberate; tests discriminate — mutation-tested, 6/6 killed

Head focused suite: 12 passed / 0 failed (structured wrapper, raw exit 0). Six mutants applied one
at a time to the archived head checker, suite re-run each time, checker byte-restored (`cmp` OK)
after each:

| Mutant | Change                                                                                    | Result       | Failing test (only)                                               |
| ------ | ----------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| M1     | string form no longer sets root                                                           | 11/1, exit 1 | `derives a root export from the string exports form`              |
| M2     | conditional object resolves to `''`                                                       | 11/1, exit 1 | `derives record exports from string and default targets`          |
| M3     | missing `default` → `'MISSING'` (`?? 'MISSING'`)                                          | 11/1, exit 1 | `uses an empty path when a conditional export has no default`     |
| M4     | guard loosened + falsy default stringified (`false` → `'false'`)                          | 11/1, exit 1 | `preserves the empty fallback for a falsy default`                |
| M5     | `null` target throws                                                                      | 11/1, exit 1 | `uses an empty path for a null export target instead of throwing` |
| M6     | top-level guard returns empty map instead of throwing (the permissive fallback of item 2) | 11/1, exit 1 | `refuses a malformed top-level exports value`                     |

Each behaviour has exactly one correspondingly named test that fails on its own regression; the four
pre-existing policy-refusal tests were unaffected by every mutant. The `null`-target change (throw →
`''`) is documented as the single intentional pathological-input change in
`ci-quality-repair-evidence.md` §Behavior 3, the drift log, and the IMPL comment; the `|| ''` falsy
fallback is preserved (with the guard, `''`/`false`/`0` all map to `''`).

### 4. Changed-files quality selection non-empty and green — confirmed at head

`changed-source-files.ts 0ef48c2ec e357938df` → nine paths (three `.llm/tools/docs/*`, two generated
assets, four `packages/contracts/*`). `scan-code-quality.ts --pretty` with those nine as
`--changed-file`: **`mode: "changed-files"`**, `scanned` lists all nine (including
`check-exports-drift.ts` and `_test.ts`), `findings: []`, `allowCount 0`, raw exit **0**. Not a
repository-mode run; the repaired files were actually scanned.

### 5. Focused checker / drift / check / test evidence — truthful, numbers match

| Command (this session, worktree at `e357938df`)                                 | Raw exit | Observed                                                                                                                  | Author claim |
| ------------------------------------------------------------------------------- | -------: | ------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `run-deno-test.ts -- --allow-all .llm/tools/docs/check-exports-drift_test.ts`   |        0 | 12 passed / 0 failed                                                                                                      | 12/0 ✓       |
| `deno task docs:exports-drift`                                                  |        0 | 8 coverage lines; `fresh-ui`/`config`/`contracts`/`telemetry` `mode=complete`; fresh-ui 0/1, contracts 0/0; terminal PASS | ✓            |
| `deno check --unstable-kv` both edited files                                    |        0 | clean                                                                                                                     | ✓            |
| `run-deno-fmt.ts --root .llm/tools/docs --ext ts --include check-exports-drift` |        0 | 2 selected, 0 findings                                                                                                    | ✓            |
| `deno task check` (root wrapper, packages+plugins)                              |        0 | 2925 files, 25 batches, 0 failed                                                                                          | ✓            |
| `deno task test` (root wrapper)                                                 |        0 | **4217 passed / 0 failed / 19 ignored, 4236 total** (295.9 s)                                                             | 4217/0/19 ✓  |

Non-blocking observation: `run-deno-lint.ts` over `.llm/tools/docs` exits 2 because raw `deno lint`
reports "No target files found" — `.llm/` is excluded from lint by repo `deno.json` (pre-existing,
base and head alike); the quality scanner (item 4) is the governing gate for this path and is green.

### 6. Accepted integration contract preserved byte-for-byte — confirmed

`git rev-parse` blob ids identical at `8c03d8629` and `e357938df`: `deno.lock` `a1522e6e…`,
`prose.json.gz` `f6c1e3b6…`, `provenance.json` `a894f884…`, `agent-docs.generated.ts` `1321a9e4…`,
`publish-assets.generated.ts` `03ec3c00…`; `git diff --stat` over the five paths empty.
`git diff --stat 8c03d8629 e357938df -- packages/ plugins/` **empty** — no publish-surface delta at
all. `grep -c check-exports-drift packages/cli/src/kernel/assets/agent-tools.generated.ts` = 0 — the
checker is not embedded, so the repair carries no publish delta.

### 7. Prior history append-only — confirmed

`git diff --stat 05ac90d00 e357938df` over `impl-eval.md`, `impl-eval-cycle-{1,2,3}.md`,
`plan-eval.md`, `plan-eval-cycle-1.md`, `receipts/` (s3, fix1, sa4, base-refresh), `audit/` is
**empty**. `receipts/sa4/test.json` still `outcome FAIL`, `exitCode 1`, summary `4202/1/19`,
`totalResults 4222`. The full run-dir delta since cycle 4 is four append-only files
(`ci-quality-repair-evidence.md` +70, `context-pack.md` +12, `drift.md` +12, `worklog.md` +17).

### 8. #1296 acceptance holds; `Closes #1296` earned; boxes untouched

No `packages/`/`docs/site` content changed since cycle 4 (item 6), so the cycle-3/4 row-by-row
derivation stands. Head-side spot checks: `pages.yml` carries the
`Check documentation exports
drift` step (`deno task docs:exports-drift`); the fresh-ui runbook
(`docs/site/reference/fresh-ui/
index.md` §regeneration, steps 1–5) names the checker and task;
`contract-primitives.ts` JSDoc imports `baseContract` from the root, which `src/public/mod.ts:2`
re-exports; drift gate PASS with contracts and fresh-ui `mode=complete` and one reason-bearing
documented-non-export group. PR body carries `Closes #1296` on its own line. Issue #1296 open; its
five boxes are coordinator-owned and were not touched by me.

## Evaluator commit and exit hygiene

- Only this file written; prior canonical preserved as `impl-eval-cycle-4.md` via `git mv`
  (byte-identical). Committed on `eval/impl-eval-c5-1666` at `e357938df`, pushed by explicit refspec
  `HEAD:refs/heads/fix/reference-export-drift-gate`.
- Scratch archives `$CLAUDE_JOB_DIR/tmp/{prefix,head}`, `mutate.sh`, `probe.ts`, `rootgates.sh` and
  logs live under the job tmp dir (auto-cleaned); nothing under `.llm/tmp/` except this session's
  checked-in Claude hook log `.llm/tmp/claude/hooks/unscoped/events.jsonl` (gitignored; contains
  none of the forbidden teardown phrases; forbidden-commands test passed inside the root run above),
  quarantined to `/home/codex/.claude/jobs/dc433b8d/quarantine/` at exit.
- `git status --short` empty in the evaluator worktree at exit; worktree removed.
