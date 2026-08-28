# Brief — #1709 `lint-partial-exclusion-fail-closed` — RESEARCH + PLAN ONLY

You are the harness **author** for this leaf. You are not the evaluator and not the supervisor.

## Absolute bound, read first

**Create only harness artifacts** — `research.md`, `plan.md`, `context-pack.md`, `worklog.md`,
`drift.md`, `supervisor.md`, `codex-thread-ids.md`, and a draft PR if the normal harness plan stage
requires one. **Mutate no product, tooling, config, or workflow source.** Not `deno.json`, not the
wrappers, not the barrel — not even the change the plan will later prescribe. If you find yourself
editing a file outside this leaf's run dir, stop and report.

Implementation is a **later, separately authorized** stage gated on PLAN-EVAL. Do not begin it, and
do not assume it.

## Identity

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Leaf key      | `lint-partial-exclusion-fail-closed`                                    |
| Issue         | #1709 — https://github.com/rickylabs/netscript/issues/1709              |
| Lane / wave   | internals / wave 3                                                     |
| Worktree      | `/home/codex/repos/netscript-007-lint-fail-closed`                     |
| Branch        | `fix/lint-partial-exclusion-fail-closed` @ `cf648f1ff`, **no upstream by design** |
| Push rule     | explicit refspec only: `git push origin HEAD:refs/heads/fix/lint-partial-exclusion-fail-closed` |
| Base          | `cf648f1ff973d74c213bb125a6f5f5b9328e693b` (live main; the #1663 merge) |
| Archetype     | `6-cli-tooling`, no overlays                                            |
| Run dir       | `.llm/runs/release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed/` |

## Frozen contract — central `leaf-contracts.json` at `4686fab33`

**`fileSurfaces` (exactly four, the plan's outer bound):**

- `.llm/tools/run-deno-lint.ts`
- `.llm/tools/run-deno-lint_test.ts`
- `deno.json`
- `packages/cli/src/kernel/assets/agent-tools.generated.ts` — **canonical regeneration only**

**`provingGates`:** `check`, `test`, `publish-dry-run`, `quality-job`, `check:assets-barrel`.

**Not applicable, do not plan for and do not request:** `scaffold.runtime`, Aspire, Docker,
browser/Playwright, `e2e:cli`, MCP JSR audit, docs-site gates. No evaluator or runtime lease exists
for this leaf.

## Accepted architecture — decided, not open

The coordinator has already chosen. Do not re-litigate it; plan it.

1. **Fail closed** whenever Deno silently drops any file the wrapper selected. A green structured
   report must mean the selected files were actually covered. **Reporting a delta while still
   exiting 0 is explicitly rejected.**
2. **Sequence: remove the root `lint` task's obsolete doctor-family exclusion *first*,** then enable
   the stricter partial-exclusion refusal. The coverage correction lands before the guard tightens.

## Prior evidence — start from it, verify it, do not redo it blindly

The supervisor's research is committed at topic checkpoint `d682db680` in
`.llm/runs/release-0.0.7-internals--orchestration/research/l2-lint-exclusion-false-green.md`. Its
executed findings at this exact base:

- The existing guard (`run-deno-lint.ts:724`) refuses only a **wholly** excluded batch.
- Decisive repro: `--file .llm/tools/<probe>.ts --file .github/scripts/ci-classify-changes.ts` gives
  `filesSelected: 2, batches: 1, failedBatches: 0`, **exit 0**, with a real `no-explicit-any` in the
  probe never linted; the **same two files** at `--batch-size 1` exit **2**.
- `.github/scripts/*.ts` is the reachable mixing partner because it shares the **root** config with
  `.llm/` — nearest-config batching does not separate them.
- Root `lint` task as shipped: `filesSelected: 2037`, 35 batches, exit 0. With the doctor `--exclude`
  removed: **`2041`, 36 batches, exit 0** — a clean +4-file coverage gain.
- `lint.exclude`'s doctor entry is **inert** for `doctor/healthy/**` under nested-config precedence.
- CI is **not** exposed today: the gate catalog maps `lint` → `deno task lint`, rooted only at
  `packages`/`plugins`. Record that bound accurately; do not overstate severity.

Re-derive anything you rely on. Correct the research if you find it wrong — that is a finding, not
an insult.

## The plan must specify, explicitly

1. **Selected-vs-processed identity proof** — how the wrapper will establish which files Deno
   actually processed versus which it was handed, and why that signal is trustworthy. Name the
   mechanism (e.g. parsing `Checked N files`, per-file probing, or an alternative) and state its
   failure modes. This is the crux of the whole leaf; a hand-wave here fails the plan gate.
2. **Mixed-batch RED** — the exact negative control that must go non-zero, using the two-file case
   above.
3. **Batch-size invariant** — the same selected file set must produce the same refusal verdict at
   any batch size. Today it does not; that is the defect.
4. **Must-not-regress refusals** — pure all-excluded selection still exits 2; empty selection still
   refuses; no Deno rule weakened; no new allowance (`quality:scan` `allowCount` must stay **7**).
5. **Canonical asset regeneration and idempotence** — `deno task gen:assets-barrel` only, never a
   hand edit; regeneration must be idempotent and `check:assets-barrel` green, with the generated
   delta limited to `agent-tools.generated.ts`.
6. **CLI publish dry-run + per-member JSR audit** — disclose the embedded consumer-tool text and
   `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` delta honestly, with **no** export/API change claimed. Report
   existing CLI baseline debt as baseline; do not silently green it.
7. **Structured JSON failure output** — the report must identify the dropped file(s) and the refusal
   cause **without duplicating diagnostics**, and must remain machine-consumable.
8. **The root-task sequencing** — the doctor `--exclude` removal as its own earlier slice, with the
   `2037 → 2041` transition proven and the malformed sibling still not exposed.

## `run-deno-fmt.ts` — read-only audit, mandatory

Audit it during planning for the **same partial-exclusion class**. Record the verdict either way in
`research.md` and `plan.md`. **It is not in the envelope.** If it proves defective, say so plainly
and state that mutating it requires **explicit coordinator rescope** — do not add it to the surface,
do not edit it, and do not quietly widen the plan to cover it.

## Ordinary harness obligations

Slice the work, name proving gates per slice, keep a risk register, state deferrals, and record the
PLAN-EVAL judgement. Follow `.agents/skills/netscript-harness`, `netscript-pr`, `netscript-tools`,
and `netscript-deno-toolchain`. Re-baseline against `cf648f1ff` rather than carrying assumptions.

If a draft PR is opened: base `main`, draft, `Closes #1709`, milestone `0.0.7`, labels `type:fix` +
`area:tooling` + exactly one `status:` label. Do **not** flip readiness, relabel to ready-merge,
check issue boxes, or post acceptance-evidence blocks.

## Output and stop condition

Commit the harness artifacts, push by explicit refspec, and post the opening phase comment if you
opened a PR. **Then stop.** The supervisor performs a fresh independent Tier-A on your exact plan
head; PLAN-EVAL and implementation are separate, later authorizations. Report your thread id, commit
SHA, plan head, PR number/URL if any, and any rescope finding.
