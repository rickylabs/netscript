use harness

# Slice D — DB-backed island emitted-import guard (#1428)

You are the implementation agent for PR D of the NetScript 0.0.6 **fixes lane**.

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-f-d-island` |
| Branch | `fix/1428-db-island-emitted-imports` |
| Base | `origin/main@01aa12b67` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **low** (`light_implementation`) |
| Slice dir | `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/d-1428/` |
| PLAN-EVAL | **N/A** — the fix is specified in the issue (run `drift.md` D-2) |
| IMPL-EVAL | **Owner waiver — conditional.** Holds only if you demonstrate strong negative tests (guard red before the fix, green after, by real execution). Weak or absent demonstration ⇒ a separate Fable 5 · medium IMPL-EVAL runs. |

**Read `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/context-pack.md` first.**

## SKILL

- `netscript-harness` — evidence discipline, evaluator separation, run artifacts.
- `netscript-cli` — CLI scaffold output, emitted trees, plugin/island templates.
- `netscript-tools` — scoped validation wrappers, gate evidence, git ground truth.
- `netscript-doctrine` — required before changing anything under `packages/**`.
- `netscript-pr` — branch/PR lifecycle, labels, milestone, closing keywords.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`; `rtk proxy` for `deno task`.

## The gap

`packages/cli/src/public/features/root/public-command-tree_test.ts` resolves every emitted relative
import under `routes/examples` against the emitted tree. That guard was added for the C2-F1
regression, where **both** island templates imported
`'../service/(_lib)/optimistic-list-mutation.ts'` while the factory emits to
`<serviceName>/(_lib)/`.

The guard is genuinely falsifiable for the **memory** island: restoring the broken specifier and
regenerating the barrel produces `Unresolved emitted relative import: … but … does not exist`
(2 passed / 1 failed).

**It does not cover the DB-backed island.** The fixture scaffolds `--db none`
(`public-command-tree_test.ts:166-167`), which emits only the memory island, so the same broken
specifier in `ServiceShowcaseLab.tsx.template` leaves the suite green (3 passed).

**This is not a defect at the merged head** — both barrel entries are correct there, and ledger row
75's `generated.deno-check` ran against a DB-backed scaffold and passed. The DB variant is *proven*
at this head, just not by the *fast* guard. What is being fixed is the feedback loop: a future
regression confined to the DB-backed island would evade the cheap guard and surface only at the next
serialized `scaffold.runtime` — the expensive gate we deliberately run rarely. That is a slow,
costly loop for a defect class already hit once.

## Required work

1. **Cover the DB-backed island.** Extend the fixture to scaffold a DB-backed variant, or add a
   second fixture, so both islands are emitted and their imports resolved. Judgement call on which:
   if extending the existing fixture makes it materially slower, a second fixture is better — this
   guard's entire value is being *fast*. Say which you chose and why in the PR body.
2. **Widen the specifier check.** The evaluator also noted the guard's regex matches only `./` and
   `../` relative forms, so a broken **non-relative** specifier evades it too. Widen it. Be
   deliberate about what a non-relative specifier should resolve against — a bare `npm:`/`jsr:`
   specifier is not a tree path and must not be reported as unresolved. Handle import-map/alias
   forms correctly rather than producing false positives; a guard that cries wolf gets disabled.

## Acceptance

#1428 carries no checkboxes, so **state acceptance explicitly in the PR body** (pre-merge check 7
verifies the PR body against what shipped). At minimum:

- [ ] Both the memory island and the DB-backed island are emitted by the test fixture(s) and have
      every emitted import resolved against the emitted tree.
- [ ] A broken specifier in `ServiceShowcaseLab.tsx.template` (the DB-backed island) makes the
      suite **fail** — demonstrated by execution, not asserted.
- [ ] The specifier check covers non-relative forms, without false-positiving on `npm:`/`jsr:`/
      import-map specifiers.
- [ ] The existing memory-island coverage still fails on its own broken specifier (unchanged
      behaviour).
- [ ] The guard remains fast enough to stay a cheap pre-`scaffold.runtime` check; state the runtime
      before and after.

## The negative tests are the deliverable

This lane exists because checks reported clean while not doing their job — and #1428 *is* a report
that a guard silently covers less than it appears to. Shipping a widened guard without showing it
go red would repeat the exact defect.

Demonstrate by real execution, pasting output into `evidence.md`:

1. Break the specifier in `ServiceShowcaseLab.tsx.template` (DB-backed island) → new suite goes
   **red**. Restore → green. *(On the current `main` this same break leaves the suite green at
   3 passed — capture that "before" state too; it is the proof the gap was real.)*
2. Break the memory island's specifier → still red (unchanged coverage). Restore.
3. Introduce a broken non-relative specifier → red. Restore.
4. Show that a legitimate `npm:`/`jsr:` specifier does **not** trip the widened check.

## Gates

```
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
rtk proxy deno task quality:gate
```

`quality:gate` is **required** — you are touching `packages/**` (framework-wave gate law, #745).

### Expensive gate — ask first

`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` is **serialised across this
lane**. Do **not** start it on your own initiative. The whole point of #1428 is to catch this defect
class *without* it. If you believe it is needed, say so and wait for the orchestrator.

## Known hazards

- **`deno fmt` rewraps prose and can silently undo a scripted string edit.** Verify every edit
  after formatting.
- **Restore every deliberate break.** You are intentionally breaking templates to prove the guard
  fires; a left-behind break ships a real regression. Assert `rtk git status --porcelain` is clean
  of unintended changes before you commit, and diff your templates against `origin/main`.
- **`deno.lock`:** do not commit it; never `deno cache --reload`.
- No new `deno-lint-ignore` / `as unknown as` / `@ts-ignore` — pre-merge check 3 scans for these.

## Deliverables

1. The fix on `fix/1428-db-island-emitted-imports`.
2. `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/d-1428/evidence.md`
   — every gate command with **real, untruncated** output, plus all four negative-test
   demonstrations above.
3. A **draft PR against `main`** via `netscript-pr` conventions:
   - `Closes #1428` in the **body**.
   - Labels: `type:fix`, `area:cli`, `gate:e2e`, `priority:p2`, exactly one `status:`.
   - Milestone **`0.0.6`**.
   - The acceptance checklist above, ticked **only** where truthfully done.
4. Report the PR number back. **Do not merge.**

If you hit a red gate you cannot turn green, **escalate rather than going idle** — write the blocker
into `evidence.md` and say so.
