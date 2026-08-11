use harness

You are the **PLAN-EVAL evaluator, cycle 2**, for NetScript issue #1443 (P0 consumer blocker).

**Provenance, stated accurately:** you are the *same* evaluator thread that produced cycle 1, resumed
— not a fresh session. The launcher's one-active-sender-per-worktree guard
(`duplicate_sender_risk`) blocks a second concurrent sender in this worktree, and the harness
invariant that matters is generator ≠ evaluator, which still holds: the plan's author is a native
Claude Opus 5 session and is not you.

The obvious hazard of resuming is anchoring — grading the answers to your own findings. Counter it
deliberately: **you are expected to reverse yourself where the source says you were wrong.** Cycle 1's
finding 1 is disputed on exactly those grounds below. Reversing a finding on evidence is a correct
outcome here, not an embarrassment; defending it without re-reading the source is the failure mode.

You evaluate; you do not implement. **Do not edit source, do not commit, do not push.** Your only
writes are the verdict artifact and one PR comment.

This is the **second and final** allowed `FAIL_PLAN` cycle before the run escalates to the owner.
Judge the plan as it now stands — not the plan you would have written.

## SKILL

- `netscript-harness` — primary: run-loop phases, evaluator separation, plan-gate, lane policy.
- `netscript-doctrine` — archetype and fitness-gate authority. v2 claims ARCHETYPE-5 (`plugins/ai`),
  ARCHETYPE-6 + `F-CLI-1…31` (`packages/cli`), **ARCHETYPE-4** (`packages/plugin`), and declares
  `SCOPE-frontend` **N/A with a written rationale**. Verify all four.
- `jsr-audit` — publishability rubric over `packages/plugin`, `packages/cli`, `plugins/ai`.
- `netscript-cli` — the install/registry/doctor/E2E surface being changed.
- `netscript-tools` — trustworthy verdict sources, scoped wrappers, gate evidence.
- `netscript-deno-toolchain` — `deno doc` for public-surface inspection; lock hygiene.
- `netscript-pr` — PR body/label/milestone/close-gate conventions.
- `rtk` — prefix read-heavy `git`/`grep`/`ls` to stay token-cheap.
- `codex-wsl-remote` — you are the daemon-attached session it describes.

## Pre-flight

```bash
cd /home/codex/repos/ns-1443-plugin-ai-orchestrator
rtk git status --short --branch
rtk git log --oneline -3
```

Expect branch `orchestrator/1443-plugin-ai-next-canary` at `42606724f`. Do **not** fetch, reset,
rebase, or touch the working tree.

## What to read

1. `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/gates/plan-gate.md`,
   `.llm/harness/evaluator/verdict-definitions.md`.
2. `plan-eval.md` — **cycle 1's verdict**, in the run dir. This is what v2 must answer.
3. `plan.md` (**v2**), `research.md`, the `## Design` + `## PLAN-EVAL selection` sections of
   `worklog.md`, `drift.md`, `phase-registry.md`, `supervisor.md`.
4. Issue #1443 live; PR https://github.com/rickylabs/netscript/pull/1444 and its
   `[PHASE: PLAN] [REVISION: v2]` comment.

## Your job

Two questions, in order.

**A. Did v2 actually answer cycle 1?** Walk cycle 1's seven findings and five failed plan-gate boxes
one at a time. For each, state `ANSWERED` / `PARTIALLY ANSWERED` / `NOT ANSWERED` with the v2
location and your own source verification. Note especially that v2 **disputes** cycle 1's finding 1
mechanism: it claims `plugin-registry.ts:191-207` resolves a sibling `scaffold.plugin.json` before
`resolvePluginManifest` is reached, so a barrel module with no manifest export is valid — and that
this is how `workers/mod.ts` loads today. **Verify that claim against source and say plainly whether
v2 or cycle 1 is right.** If v2 is wrong, that is a `FAIL_PLAN` on its own.

**B. Does v2 pass the plan-gate on its own merits?** Check all eight boxes with concrete evidence
(file + line, or command + output). Then re-check the things v2 newly introduces, which cycle 1
never saw:

1. **D4b** — deriving installed identity/workdir from the configured module changes behavior for
   **every** plugin, not just AI. Read `plugin-registry.ts:220-256`, `plan-plugin-install.ts:120-156`,
   `plugin-reference-reconciler.ts:47-58,146-179`, `list-plugins-command.ts`, and
   `doctor-plugin-use-case.ts`. Does slice 5 as scoped actually cover the blast radius? Does it
   break, or silently change, the workers/auth/triggers/streams paths?
2. **D1 atomic shape** — is an all-present-or-all-absent refinement expressible in the existing
   `.strict()` Zod objects without changing the export list or introducing a slow type? Is the
   consumer inventory in D1 complete, or does a consumer of the four fields go unnamed?
3. **D6 locked contract** — verify the exact emitted set against
   `packages/fresh-ui/registry.manifest.ts` (item `markdown`) and
   `packages/cli/src/kernel/application/ui/registry.ts`. Is the locked table right? Does
   `theme-seed`/`citation-chip` pull anything v2 did not enumerate? Does writing
   `ai/assets/styles.css` + `ai/deno.json` into a non-app root break any invariant?
4. **Slice order** — with markdown now landing in S6 before the full `ai/**` check in S7, does every
   slice's named gate pass at the moment that slice lands?
5. **`SCOPE-frontend` N/A** — is v2's rationale sound, or does #1443 require an overlay gate that
   the targeted compile gate does not cover?
6. **Paper-over sweep** — the owner forbids docs-only fixes, skips, hardcoded plugin names, casts,
   `any`, lint suppressions, deleted tests, and fixture-only special cases. Flag any v2 decision
   trending that way.
7. **Acceptance coverage** — v2 claims all seven #1443 boxes are closed, including #2 and #3 which
   cycle 1 marked uncovered. Verify per box.

## Output

Write `.llm/runs/orchestrator-1443-plugin-ai-next-canary--supervisor/plan-eval-cycle2.md` from
`.llm/harness/templates/plan-eval.md`, containing: the cycle-1 findings disposition table (part A),
the eight plan-gate boxes with evidence, the per-acceptance-box coverage table, numbered findings
(each: what is wrong, where, required fix), and a final line `VERDICT: PASS` or
`VERDICT: FAIL_PLAN`.

Then post it as a PR comment on #1444 leading with
`**[PHASE: PLAN-EVAL] [VERDICT: APPROVED]**` or `**[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]**`
(`gh pr comment 1444 --repo rickylabs/netscript --body-file <file>`).

Do not commit. Report your thread id and verdict in your final message.

Calibration: `FAIL_PLAN` is for defects that would cause rework if implementation proceeded — not
for stylistic preferences, not for work correctly deferred with a written rationale, and not for
detail a slice is explicitly scoped to determine. If v2 is implementable as written, return `PASS`.
No praise, no adjectives. Findings and evidence only.
