# PLAN-EVAL — release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed

- Plan evaluator session: `1b7a1305-a353-4c1d-a415-34ee8869ff6b` / 2026-08-28
- Run: `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed`
- Surface / archetype: `.llm/tools` lint/fmt wrappers + lint-driven CLI consumer asset /
  `6-cli-tooling`
- Scope overlays: none
- **Cycle: 1 of the ordinary two**

## Identity, route, family, independence

| Field                    | Observed                                                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session id               | `1b7a1305-a353-4c1d-a415-34ee8869ff6b` (`CLAUDE_CODE_SESSION_ID`; job `state.json` `sessionId` identical)                                                  |
| bridgeSessionId          | `cse_012Nz3aE9mhoeyfaiGpKGvse` (non-empty; env `CLAUDE_CODE_BRIDGE_SESSION_ID=session_012Nz3aE9mhoeyfaiGpKGvse`)                                           |
| Job `state.json` backend | `daemon`; `template: bg`                                                                                                                                   |
| respawnFlags             | `--effort medium --remote-control --permission-mode bypassPermissions --name "NetScript 0.0.7 #1709 PLAN-EVAL" --model claude-fable-5`                     |
| providerEnv              | `{}` — native Anthropic, no gateway                                                                                                                        |
| cwd                      | `/home/codex/repos/netscript-007-lint-fail-closed`                                                                                                         |
| CLI version              | Claude Code `2.1.250`; Deno `2.9.5 (stable, x86_64-unknown-linux-gnu)`                                                                                     |
| Requested route          | `formal_plan_evaluation` for a Codex GPT-5.6 Sol plan → native Claude · Anthropic · Fable 5 · medium · remote-control (`lane-policy.md` "Local PLAN-EVAL") |
| Observed route           | model `claude-fable-5`, effort `medium`, `--remote-control`, `providerEnv {}` → **requested == observed**                                                  |
| Family vs author         | Author = OpenAI Codex `gpt-5.6-sol` (`supervisor.md`, `codex-thread-ids.md`) → evaluator Anthropic family is **opposite**                                  |
| Independence             | Fresh bg Claude job; not thread `01a047f0-f17e-7692-b6f0-83a6d22888c9` (Codex author) nor `f7691917-0be2-4bcd-8839-43d3fc809c34` (topic supervisor)        |

## Target verification (before any evaluation)

- Local `HEAD` = `d437db44d40d4dd3e7149ebf98187f3d3fcbb53c`.
- `git ls-remote origin refs/heads/fix/lint-partial-exclusion-fail-closed` =
  `d437db44d40d4dd3e7149ebf98187f3d3fcbb53c`.
- PR #1710 `headRefOid` = `d437db44d40d4dd3e7149ebf98187f3d3fcbb53c`, `isDraft: true`, base `main`,
  labels `type:fix area:tooling status:plan ci:skip-e2e ci:skip-scaffold`.
- `git diff --stat cf648f1ff…d437db44d -- . ':!.llm/runs'` → empty (plan-only leaf confirmed).
  `git status --short` empty at start.
- All reproductions ran on a `git archive d437db44d` copy under `$CLAUDE_JOB_DIR/tmp/repo` and
  scratch projects under `$CLAUDE_JOB_DIR/tmp/sig`; the checkout was not mutated.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselined at `cf648f1ff` on Deno 2.9.5; load-bearing findings 2, 4, 5, 9, 10, 13 re-derived below and confirmed.                                                                                                                                                                                                                                                                             |
| Decisions locked                        | FAIL   | D1–D10 carry rationale, but D4/§"Identity proof and probes" step 3 and the worklog Design "Ports / seams" rest on a false premise for fmt: `run-deno-fmt.ts` has **no** injectable process seam (`runBatch` is private and calls `Deno.Command` directly, `run-deno-fmt.ts:419-439`; `main` calls it unconditionally, `:543-546`). Only lint has `runLint(..., runner)` (`run-deno-lint.ts:469-473`). See F1. |
| Open-decision sweep                     | FAIL   | The plan lists "must resolve now: none". Evaluator sweep found one unflagged decision that forces rework if deferred: crash-vs-coverage precedence and crash-batch coverage accounting (F2). The plan's absolute batch-size invariant cannot be satisfied for a reachable crash+drop mix without it, and the S2/S3 "crash controls" at sizes 1/2/200 cannot be written without it.                            |
| Commit slices (< 30, gate + files each) | PASS   | S1→S4 ordered, four slices, each names proof, gates, and files (`plan.md` "Ordered commit slices"). Six-path envelope respected; no seventh path is forced (verified below).                                                                                                                                                                                                                                  |
| Risk register                           | PASS   | Eleven risks with mitigations (`plan.md` "Risk register"). The "new refusals red a legitimate root selection" risk is now closed by evaluator evidence (root lint and fmt selections are drop-free at batch size 1, below); the plan should cite that class of proof rather than `failedBatches: 0` (F3).                                                                                                     |
| Gate set selected                       | PASS   | Frozen set `check`, `test`, `publish-dry-run`, `quality-job`, `check:assets-barrel` plus F-6/F-7/F-10/F-19 from the Arch-6 column of `archetype-gate-matrix.md`; runtime/browser/e2e explicitly N/A, consistent with Arch-6 `optional`/`n/a` rows.                                                                                                                                                            |
| Deferred scope explicit                 | PASS   | `plan.md` "Non-scope and deferrals"; worklog "Deferred scope".                                                                                                                                                                                                                                                                                                                                                |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `plan.md` "Fitness and publish implications" + `research.md` "Publish / JSR surface scan": lint-only embedded text/hash delta, exports unchanged, 19-WARN baseline disclosed. Verified lint-only claim below.                                                                                                                                                                                                 |

## Re-derivations (executed by the evaluator, Deno 2.9.5)

### 1. Completion adapters — the crux — **confirmed**

Raw shapes captured with `cat -A` on separately redirected stdout/stderr (all summary lines are on
**stderr**; stdout is empty in every case):

| Command                                                       | exit | Terminal line(s)                                                                          |
| ------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------- |
| `deno lint clean.ts`                                          | 0    | `Checked 1 file`                                                                          |
| `deno lint clean.ts other-clean.ts`                           | 0    | `Checked 2 files`                                                                         |
| `deno lint bad.ts` (no-explicit-any)                          | 1    | diagnostic … `Found 1 problem` / `Checked 1 file`                                         |
| `deno lint bad.ts clean.ts`                                   | 1    | `Found 1 problem` / `Checked 2 files`                                                     |
| `deno lint bad.ts clean.ts syntax.ts`                         | 1    | `Error linting: …syntax.ts` … `Found 1 problem` / `Checked 3 files`                       |
| `deno lint syntax.ts` (parse error only)                      | 1    | `Error linting: …` / `Checked 1 file` (no `error[rule]` occurrence → today's crash class) |
| `deno lint excluded.ts`                                       | 1    | `error: No target files found.` (`error` word ANSI-wrapped even when piped)               |
| `deno lint excluded.ts clean.ts`                              | 0    | `Checked 1 file` ← the defect                                                             |
| `deno lint --config deno.json excluded.ts bad.ts clean.ts`    | 1    | `Found 1 problem` / `Checked 2 files`                                                     |
| `deno fmt --check clean.ts`                                   | 0    | `Checked 1 file`                                                                          |
| `deno fmt --check clean.ts clean2.ts`                         | 0    | `Checked 2 files`                                                                         |
| `deno fmt --check dirty.ts`                                   | 1    | `from …dirty.ts:` diff … `error: Found 1 not formatted file in 1 file`                    |
| `deno fmt --check dirty.ts clean.ts`                          | 1    | one `from` block … `error: Found 1 not formatted file in 2 files`                         |
| `deno fmt --check dirty.ts dirty2.ts clean.ts`                | 1    | two `from` blocks … `error: Found 2 not formatted files in 3 files`                       |
| `deno fmt --check excluded.ts`                                | 1    | `error: No target files found.`                                                           |
| `deno fmt --check excluded.ts clean.ts`                       | 0    | `Checked 1 file` ← the symmetric defect                                                   |
| `deno fmt --check excluded.ts dirty.ts clean.ts`              | 1    | `error: Found 1 not formatted file in 2 files`                                            |
| `deno fmt --check syntax.ts clean.ts`                         | 1    | `Error checking: …` / `error: Found 1 not formatted file in 2 files` (no `from` block)    |
| `deno fmt --check syntax.ts`                                  | 1    | `Error checking: …` / `error: Found 1 not formatted file in 1 file`                       |
| `deno fmt dirty.ts clean.ts` (write)                          | 0    | `/abs/dirty.ts` / `Checked 2 files`; second run `Checked 2 files`                         |
| `deno fmt excluded.ts clean.ts` (write)                       | 0    | `Checked 1 file`                                                                          |
| `deno fmt excluded.ts` (write)                                | 1    | `error: No target files found.`                                                           |
| `deno lint ignore-file.ts clean.ts` (`deno-lint-ignore-file`) | 0    | `Checked 2 files` (ignored files still count as processed)                                |
| top-level `"exclude"` (not `lint.exclude`)                    | —    | identical drop behaviour for lint and fmt                                                 |

Conclusions: lint terminates in `Checked N file(s)` on clean, finding, **and parse-error** runs; fmt
uses `Checked N file(s)` when clean or writing and
`error: Found M not formatted file(s) in N file(s)` on check findings, with the **second** integer
being the processed count. Singular/plural forms are exactly `file`/`files` on both integers. ANSI:
the `Checked …` and `Found N problem(s)` lines are plain; the `error:` prefix is ANSI-wrapped
(`\e[0m\e[1m\e[31merror\e[0m: …`) even on piped stderr, so the plan's "ANSI-strip first, then anchor
`^error: Found …$`" ordering is necessary and correct; the existing `ANSI_PATTERN` covers the
observed `[0m [1m [31m [38;5;12m` sequences. A pty run shows `\r\n` endings only from the terminal
driver; piped output is `\n`. The S2/S3 split and the identity proof stand.

### 2. Anti-inference rule — **confirmed and honourable**

`dirty.ts clean.ts` yields one `from` block but `in 2 files`; `syntax.ts clean.ts` yields **zero**
`from` blocks but `in 2 files`. Counting `from` blocks would under-count in both. The plan's adapter
reads the second integer of the anchored summary, which the parser can do independently of
`parseFindings`; the rule is honourable as designed.

### 3. Batch-size invariance — **delivered for ordinary results; unspecified for crash mixes (F2)**

At size 1 a dropped file is its own wholly-excluded batch (`No target files found.`); at size 200 it
is a short `Checked N` inside a mixed batch and is identified by probes. The plan's run-level cause
derivation (aggregate → empty / all-excluded / partial) makes cause and dropped set independent of
batching for clean and ordinary-finding runs, and probe output never enters the parsers, so
diagnostic multiplicity is preserved. Sizes 1/2/200 cover the three boundary shapes (singleton
batches, minimal mixed batch, default). **However**, for a selected set containing a parse-error
file and a dropped file, size 200 produces one crash batch (`Error linting` + `Checked 1 file`, exit
1, no occurrence → existing crash class) while size 1 produces one crash batch plus one
wholly-excluded batch (refusal, exit 2). The precedence table has no crash-vs-refusal row, and
coverage accounting for a crashed batch's files is undefined, so exit code and `coverage.refusals`
would differ by batch size — violating the invariant as stated.

### 4. Probe soundness — **sound as specified**

Probe forms verified: lint processed `Checked 1 file` (including finding and parse-error output
ending that way); fmt check processed `Checked 1 file` or `Found 1 not formatted file in 1 file`
(also on a single parse-error file); fmt write processed `Checked 1 file`; dropped
`error: No target files found.` for both. Exact reconciliation (processed classifications ==
original `N`, dropped + processed == batch size) with `unverifiedFiles` on any unreconciled or
ambiguous probe is fail-closed. Missing/duplicate/malformed/overlarge summaries →
`processed-count-unavailable`/`-inconsistent`, exit 2; negative counts cannot match `\d+` and fall
into "missing". Write-mode probes re-run `deno fmt <file>` (mutating) but only on files already
formatted by the batch or dropped identically by the same config, so no additional mutation occurs;
using `--check` for write-mode probes would be strictly safer (advisory A2).

### 5. Must-not-regress — **confirmed against current code**

- Lint: empty selection exit 2 (`run-deno-lint.ts:737-740`); wholly excluded batch →
  `noTargetBatches`, exit 2 (`:495-499`). Existing tests pin both (`run-deno-lint_test.ts` "CLI
  refuses an empty lint selection", "CLI fails when Deno config excludes every selected lint
  target").
- Fmt: empty selection exit 2 (`run-deno-fmt.ts:587-590`); `noTargetBatches > 0` exit 2
  (`:591-596`). Existing tests pin both.
- Note for S2: today `runLint` lets a later ordinary-finding batch overwrite `exitCode = 2` with `1`
  (`:497` then `:501`), so the size-1 mixed verdict is order-dependent; D6's refusal precedence
  corrects this and the finding+drop control at 1/2/200 will pin it.
- `quality:scan` executed on the archive copy: `check-root-coverage` `ok: true`; scanner `ok: true`,
  **`allowCount: 7`** with `--max-allow 7`. `check-root-coverage.ts` only inspects `quality:scan*`
  `--root` coverage, so S1's edit to the `lint` task cannot affect it.

### 6. Publish claim — **confirmed lint-only**

- `.llm/tools/consumer-tools.json` lists `run-deno-lint.ts` (and check/doc-lint/etc.);
  `run-deno-fmt.ts` is absent.
- `packages/cli/src/kernel/assets/agent-tools.generated.ts` contains the embedded `run-deno-lint.ts`
  text (lines 15–16, 44) and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` (line 54); `grep -c run-deno-fmt`
  → 0.
- Hash consumers: `packages/cli/src/public/features/agent/init/init-agent.ts:7,73` read the
  constant; `init-agent_test.ts` uses a fake hash and a name list only — nothing pins the literal
  hash, so S4 forces no seventh path.
- Generator idempotence at base: `deno run --no-lock … generate-cli-assets-barrel.ts` on the archive
  copy left all seven `check:assets-barrel` targets byte-identical (sha256 before/after equal). S4's
  "only one file changes" claim is therefore testable as planned.

### 7. Root-task correction — **confirmed, and stronger than the plan claims**

| Run (archive copy, exact root task args)                           | filesSelected | batches | failedBatches  | exit |
| ------------------------------------------------------------------ | ------------- | ------- | -------------- | ---- |
| Baseline root `lint` command                                       | 2037          | 35      | 0              | 0    |
| Root `lint` without the `packages/mcp/tests/fixtures/doctor/` term | 2041          | 36      | 0              | 0    |
| Corrected `lint` selection at `--batch-size 1`                     | 2041          | 2041    | 0              | 0    |
| Root `fmt:check` selection at `--batch-size 1`                     | 2041          | 2041    | 0 (findings 0) | 0    |

The +4 are
`packages/mcp/tests/fixtures/doctor/healthy/{netscript.config.ts, .netscript/generated/plugin-ai/agents.registry.ts, .netscript/generated/plugin-ai/tools.registry.ts, .netscript/generated/plugin-workers/job-registry.ts}`;
`doctor/broken/` carries `.deno-fmt-lint-ignore` and stays outside selection. The batch-size-1 rows
are the evidence the plan lacks: because the defect makes `failedBatches: 0` at size 200
meaningless, only a per-file run proves that **no** selected root file is silently dropped. Both
root selections are drop-free, so S2/S3 will keep `deno task lint` and `deno task fmt:check` green
with no config change and no seventh path.

### 8. Seventh-path sweep — **none forced**

No shared module is needed (duplicated local types are within the two wrapper files); the fmt
cross-wrapper assertion can spawn/import `run-deno-lint.ts` from `run-deno-fmt_test.ts`; nothing
pins the bundle hash; `check-root-coverage.ts`, `.github/workflows/*`, `ci-classify-changes.ts`, and
docs only invoke the wrappers or describe them, and the `coverage` key is additive. The missing fmt
seam (F1) is added inside `run-deno-fmt.ts` itself.

## Findings

**F1 — False premise: fmt has no "existing injectable process seam".** `plan.md` §"Identity proof
and probes" step 3 ("through the wrapper's existing injectable process seam") and `worklog.md`
§Design "Ports / seams" ("Reuse each wrapper's existing process seam … No new … port") are true for
lint (`runLint(files, options, runner: BatchRunner)`, `run-deno-lint.ts:430-434, 469-473`) and false
for fmt (`runBatch` private, direct `Deno.Command`, `run-deno-fmt.ts:419-439`; `main` `:543-546`;
the fmt tests inject only at the `BatchResult[]` level into `crashedBatches`/`formatFailedBatches`).
S3's listed gates "malformed-summary, inconsistent-probe" controls are unit-level fixtures that
cannot be produced by a real disposable project and therefore require a runner seam that does not
exist. In-envelope fix, but the plan must say S3 introduces it.

**F2 — Unflagged open decision: crash-vs-coverage precedence and crash-batch coverage accounting.**
Reproduction: `deno lint syntax.ts` prints `Error linting: …` then `Checked 1 file`, exit 1, zero
`error[rule]` occurrences → today's crash class (`run-deno-lint.ts:503-513`);
`deno fmt --check syntax.ts clean.ts` prints `error: Found 1 not formatted file in 2 files` with no
`from` block → today's fmt crash class (`crashedBatches`, `run-deno-fmt.ts:490-496`). Deno therefore
still emits a processed count on crash batches. The plan's failure-precedence table (`plan.md`
§"Failure precedence") defines refusal-over-ordinary-finding (D6) but not refusal-vs-crash, and
never states what `coverage.filesProcessed`/`droppedFiles`/`refusals` contain for a crashed batch's
files. For a selected set {parse-error file, dropped file}: size 200 → one crash batch, exit 1, no
refusal; size 1 → crash batch + wholly-excluded batch, exit 2 with `partial-exclusion`. The
run-level invariant "same exit, cause, processed/dropped identities" (`plan.md` §"Shared structured
JSON contract") is thus unsatisfiable as written, and the S2/S3 "crash controls" at 1/2/200 cannot
be authored without this decision. Deferring it forces rework of both wrappers' exit logic and their
1/2/200 test matrices.

**F3 — Soft validation wording and missing drop-free proof.** Validation row 8 ("root tasks remain
non-zero only for real baseline/coverage state") tolerates a red root gate, which contradicts the
must-not-regress section. The evaluator's batch-size-1 evidence (§7) shows both root selections are
drop-free, so the row can and should demand exit 0, and S1/S2 evidence should include a per-file
(batch-size-1 or per-batch `Checked N` sum) proof rather than `failedBatches: 0`.

## Open-decision sweep (evaluator-run)

| Decision                                                                   | Verdict                      | Notes                                                                                                     |
| -------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| Crash-vs-coverage precedence; coverage accounting for crashed batches (F2) | **must resolve now**         | Not flagged by the plan; forces rework of exit logic and 1/2/200 tests if deferred.                       |
| S3 must add a runner seam to `run-deno-fmt.ts` (F1)                        | must resolve now (plan text) | No scope change; correct the premise and the S3 slice/gate description.                                   |
| `coverage` object in lint `--input` (saved-log) mode                       | safe to defer                | `selection` is already omitted there; state that `coverage` is omitted in file mode. Advisory A1.         |
| Write-mode probes via `--check` instead of mutating `deno fmt <file>`      | safe to defer                | Current design is side-effect-free in the steady state; `--check` probes are strictly safer. Advisory A2. |
| Pin a CRLF-terminated summary fixture in parser tests                      | safe to defer                | Piped Deno output is `\n`; cheap insurance for Windows runners. Advisory A3.                              |
| Local helper/type names                                                    | safe to defer                | Agrees with the plan.                                                                                     |

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **F2 (open-decision sweep box)** — Add a crash row to the failure-precedence table and define
   crash-batch coverage semantics. Recommended, and supported by the evidence above: because Deno
   emits `Checked N` (lint) / `Found M … in N` (fmt) even on parse-error batches, evaluate coverage
   on crash batches too; a run containing any coverage refusal exits 2 regardless of crash batches
   (refusal ≥ crash ≥ ordinary finding), crash diagnostics still render once via the existing
   `failures`/crash paths, and `coverage` never copies crash text. If the author instead scopes
   crash batches out of coverage, the invariant must be explicitly restated as applying to non-crash
   runs, crash files must be reported as neither processed nor dropped (e.g. an explicit
   `unverifiedFiles` refusal), and the 1/2/200 crash controls must pin whichever rule is chosen.
   Either way the S2 and S3 "crash controls" rows must name the expected exit and `coverage` shape.
2. **F1 (decisions-locked box)** — Correct `plan.md` step 3 and the worklog "Ports / seams" text:
   only lint has an injectable `BatchRunner`; S3 introduces an equivalent injectable runner seam
   inside `run-deno-fmt.ts` (no new file), and the fmt malformed-summary / inconsistent-probe
   controls are unit fixtures through that seam. Update the S3 slice row accordingly.
3. **F3** — Tighten validation row 8 to "exit 0 for both root tasks" and add per-file drop-free
   evidence (batch-size-1 root lint/fmt, or summed per-batch `Checked N == filesSelected`) to the S1
   and S2/S3 proving gates; cite this evaluation's §7 numbers as the pre-implementation baseline.

Advisories (not gate-blocking): A1 state `coverage` is omitted in lint `--input` mode; A2 consider
`--check` probes in write mode; A3 pin a CRLF summary fixture.

## Notes

- Everything the brief asked to be re-derived was re-derived and confirmed: adapter shapes
  (singular/plural/ANSI), anti-inference, probe forms, both refusals in both wrappers,
  `allowCount: 7`, lint-only publish surface, generator idempotence, `2037/35/0 → 2041/36/0`,
  malformed sibling unexposed, no seventh path. The two failing boxes are specification gaps that
  are cheap to close now and expensive after S2's tests exist.
- No implementation grant exists and none is recommended before a separate coordinator
  authorization; this evaluation does not authorize implementation.
- Hard bounds honoured: no product/tooling/config/workflow mutation; reproductions in
  `$CLAUDE_JOB_DIR/tmp`; no runtime lease, Aspire, Docker, browser, or `e2e:cli`; no label, ready,
  merge, checkbox, or acceptance-evidence mutation.
