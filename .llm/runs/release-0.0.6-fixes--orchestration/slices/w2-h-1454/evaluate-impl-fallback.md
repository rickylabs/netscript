use harness

# IMPL-EVAL fallback — Slice W2-H / PR #1574 / issue #1454

You are a **formal IMPL-EVAL evaluator**, read-only. You did not write this code and you must not
change it. Your output is a verdict with evidence.

| Field | Value |
| --- | --- |
| Route | **Claude · Anthropic · Opus 5 · medium** (owner-directed fallback after evaluator hang) |
| Family relation | **Opposite-family** — implementation is Codex-authored, you are Claude. Generator ≠ evaluator and opposite-family review both hold. |
| Evaluated head | **`7bbccf51455f01aa424bb7a1669e1250973adc97`** — immutable |
| Your worktree | `/home/codex/repos/ns006-w2h-impleval` — detached at that head, **read-only** |
| Author's worktree | `/home/codex/repos/ns006-w2-1454` — **never touch it** |
| PR | #1574 |
| Issue | #1454 (p1) |
| Verdict file | `slices/w2-h-1454/verdict-impl-fallback.md` |

## CRITICAL — cost-safety guard, read before anything else

A proven P0 defect (**#1594**) causes evaluator comments to **recursively trigger duplicate paid
runs**. Two such runs fired one second apart today and had to be cancelled.

Therefore, while you work:

- **Post NO GitHub comment of any kind.** Not a status update, not "starting", not "running", not a
  progress note. Nothing.
- **Never emit the automation's invocation or marker syntax** anywhere a GitHub API call could carry
  it — no `@` + `openhands-agent` mention token, no `openhands-phase-eval generation=` marker, no
  `openhands-agent-summary` marker, no `openhands-run:` JSON marker.
- **Do not use `gh pr comment`, `gh issue comment`, `gh pr edit`, or any label operation.** You have
  no write path to GitHub at all.

Write your verdict **to the file only**. The orchestrator posts the provenance comment afterwards,
with the trigger tokens deliberately absent.

If you believe you need to communicate something to GitHub, you are wrong — put it in the verdict
file and the orchestrator will carry it.

## SKILL

- `netscript-harness` — evaluator protocol, evidence discipline
- `netscript-doctrine` — required; archetype, public surface, gates, debt
- `netscript-cli` — plugin install/doctor, the E2E suites, what each gate proves
- `netscript-tools` · `rtk`

## Why you exist

The automatic evaluator (`openrouter/deepseek/deepseek-v4-flash-0731`, run `31613147606`,
generation `29349445386`) **hung for over 30 minutes inside its `Run OpenHands` step** and was
cancelled — the same signature that has hit other lanes today. It produced **no verdict**. The
amended plan for this slice already passed PLAN-EVAL (Opus 5 medium, opposite-family). What is
unadjudicated is **the implementation**.

You are not a degraded stand-in: you are opposite-family to Codex-authored work, which is the
invariant that matters. Evaluate at full strength.

## What the slice claims

#1454 — plugin doctor conflated package-backed/in-process plugins with local workdirs, pushing
consumers to fabricate `workers/`/`streams/` directories and duplicate permission metadata to
satisfy diagnostics.

Ten commits. Notable ordering, which is itself a claim to verify:

```
668b3b3d6  test(cli): prove package-backed doctor baseline fails      <- gate BEFORE the fix
132d96d6e  fix(cli): make plugin doctor package-aware
49a93397b  fix(cli): type probe output as serializable value
afe72911d  test(cli): centralize package fixture versions
568e4d0d0  test(cli): keep package doctor gate doctrine-clean
71fb905df  docs(harness): record package doctor implementation evidence
7bbccf514  docs(harness): record final sync verification
```

Evidence is at `slices/w2-h-1454/evidence.md` **on the PR branch** (not on the orchestrator's
branch).

## Attack these

1. **Is the negative control real?** The slice claims the gate landed before the fix and was red
   against the baseline. Verify from history, not prose — check out or diff `668b3b3d6` and confirm
   the gate genuinely fails there. Then verify the post-fix narrow-seam break also went red
   (`FAILED 1884ms / Command exited 1; expected 0`) and restored green.
2. **Is the discriminator sound?** Package-backed vs local-workdir. What happens for a plugin
   configured from JSR that *also* has a local directory? For a local plugin with a missing
   directory — does it still warn, as it must?
3. **Permission precedence.** The plan locked: explicit appsettings/service > `pluginService.permissions`
   > `plugin.permissions` > global defaults. Verify the implementation matches that chain exactly and
   that the `pluginService.permissions` slot is not elided.
4. **Published-surface claim.** The plan asserted no new `PluginManifest` field, no new permission
   field, no new export. Verify against the implementation — if it added one, that is doctrine drift
   and a blocking finding.
5. **The runtime evidence.** The slice reports `scaffold.runtime` exit 0, ~5m34s wall time, 90
   PASSED, zero SKIPPED/CANCELLED. Sanity-check that claim's internal consistency. **Do not re-run
   it** — the gate is serialized and another lane may hold it.
6. **PLAN-EVAL findings folded in?** F-1 required `doctor-plugin-use-case.ts:564` (a production
   `rootDir` reader) added to Slice 1's inventory; F-2 required `plugin list`'s Workdir column for
   package-backed plugins decided deliberately; F-3 required the "files have not moved" re-baseline
   claim restated accurately.
7. **No fabricated fixtures.** The plan forbade making a break by adding/deleting fake fixture
   directories. Verify none were added — that behaviour is the very thing #1454 exists to stop.

## Gates

Run the cheap ones yourself and quote real output:

```
rtk proxy deno task check
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
rtk proxy deno task quality:gate
```

`deno task test` is long; run it if you can, and say so plainly if you did not.

**Do NOT run `scaffold.runtime`.** Serialized and contended.

## Hard constraints

- **Read-only**, and **no GitHub writes of any kind** (see the cost-safety guard above).
- Never touch `/home/codex/repos/ns006-w2-1454`.
- **No publication of any kind.** Another lane holds the release train.
- Ancestry claims must use `gh api /repos/rickylabs/netscript/compare/A...B` — **these worktrees are
  shallow clones**, and `merge-base --is-ancestor` returns false silently when connecting history is
  absent locally.
- Leave your worktree clean and say so.

## Verdict format

`verdict-impl-fallback.md`:

- **VERDICT: PASS** / **PASS WITH FINDINGS** / **FAIL_FIX** — one line, first.
- Per attack item 1–7: result, with the output that establishes it.
- Findings, each blocking or non-blocking, each with a concrete failure scenario.
- What you executed, verbatim; what you could **not** verify; anything you stubbed.
- Your route and family relation, so a reader can weigh independence.

A PASS authorizes merging a p1 fix. Make it earned.
