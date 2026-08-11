use harness

You are the **PLAN-EVAL evaluator, cycle 4**, for NetScript PR #1444 (closes #1443 and #1445).

**Provenance:** same evaluator thread as cycles 1–3, resumed (the launcher blocks a second
concurrent sender in this worktree). Generator ≠ evaluator holds: the plan's author is a native
Claude Opus 5 session, not you.

**What changed.** Cycle 3 returned `FAIL_PLAN` on v4 with seven findings — and explicitly found **no
architecture defect**, no paper-over, and no need to split the PR. All seven were internal
inconsistencies left by incremental editing. The supervisor therefore **rewrote `plan.md` from
scratch as v5** rather than patching it a fourth time, and resynced `worklog.md`'s Design section,
`phase-registry.md`, and the PR body.

## SKILL

- `netscript-harness`, `netscript-doctrine`, `jsr-audit`, `netscript-cli`, `netscript-tools`,
  `netscript-deno-toolchain`, `netscript-pr`, `rtk`, `codex-wsl-remote`.

## Pre-flight

```bash
cd /home/codex/repos/ns-1443-plugin-ai-orchestrator
rtk git status --short --branch
rtk git log --oneline -3
```

Expect head `fd3476a9d`. Do not fetch, reset, rebase, or modify the working tree.

## What to read

`plan.md` (**v5 — read it whole; it does not defer to any prior revision**), `plan-eval-cycle3.md`,
`research.md`, `drift.md`, `worklog.md` `## Design`, `phase-registry.md`. Live: issues #1443 and
#1445, PR #1444 body and its `[PHASE: PLAN] [REVISION: v5]` comment.

## Your job

**A. Are cycle-3's seven findings answered?** For each: `ANSWERED` / `PARTIALLY ANSWERED` /
`NOT ANSWERED`, with the v5 location and your own source verification. Specifically confirm:

1. No stale sibling-metadata/metadata-path mechanism survives anywhere; S4 asserts
   `loadRegisteredPlugins`.
2. #1445 box 4 has an owning slice — D7 check 2 `configured-module-exports-manifest` in S8, covering
   zero, multiple, and import-throwing modules.
3. `official-plugin-source.ts` and `copy-official-plugin.ts` are in S1's Files column, and the
   service-less official-source representation is locked.
4. The D6 contract states **5 items / 11 files / 13 npm deps / CSS imports** consistently — no
   surviving "11 dependencies" anywhere, nothing about the closure deferred.
5. Design (`worklog.md`), `phase-registry.md`, the PR body, and the v5 PHASE comment all describe
   **13 slices**, two issues, and assign `evidence/consumer-verify.sh` to S9.
6. jsr-audit, scoped tests, gates, and the risk register cover **all six** plugin packages.
7. No stale slice numbering — the full-install runtime-schema proof and the E2E proof both route to
   S13, and the installed set is named as six kinds.

**B. Does v5 pass the plan-gate?** All eight boxes, concrete evidence (file + line, or command +
output). Then verify the genuinely new material cycle 3 never saw:

- **D7 check 2** — is a load-and-count-exports doctor check implementable plugin-agnostically without
  importing untrusted code in a way the CLI cannot recover from? Does it duplicate or conflict with
  `resolveExportedPluginManifest`?
- **D4a additivity** — check each of `plugins/{ai,auth,sagas,streams,triggers,workers}`: does the
  package export a `PluginManifest`-shaped value it can re-export, and would adding it to the emitted
  barrel produce **exactly one** manifest-shaped export? Name any plugin where a manifest does not
  exist or where a collision would occur.
- **S9** — is "the gate must go red against published 0.0.5 and green against fixed local source" a
  sound self-test for a consumer gate?
- **D1's service-less official-source representation** — does omitting the service leg break
  `copy-official-plugin.ts` or the maintainer sync tests?

## Output

Write `.llm/runs/orchestrator-1443-plugin-ai-next-canary--supervisor/plan-eval-cycle4.md` from
`.llm/harness/templates/plan-eval.md`: part A disposition, the eight boxes with evidence,
per-acceptance-box coverage for **both** #1443 and #1445, numbered findings, final
`VERDICT: PASS` or `VERDICT: FAIL_PLAN`.

Post it as a PR comment on #1444 leading with `**[PHASE: PLAN-EVAL] [VERDICT: APPROVED]**` or
`**[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]**`.

Do not commit. Report your thread id and verdict in your final message.

**Calibration — read this before deciding.** `FAIL_PLAN` is for defects that would cause **rework if
implementation proceeded**: a wrong mechanism, an unimplementable decision, an uncovered acceptance
box, a slice whose gate cannot pass when it lands. It is **not** for wording, ordering preference,
detail a slice is explicitly scoped to determine, or scope correctly deferred with a written
rationale. You have already confirmed the architecture is sound and the scope is landable. This is a
P0 blocking a downstream consumer, and three cycles have been spent. If v5 is implementable as
written, return `PASS` and let the work start. Findings and evidence only — no praise, no adjectives.
