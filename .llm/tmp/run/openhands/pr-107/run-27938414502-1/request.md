You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

use harness

# PLAN-EVAL — docs-v4-ia-deepening (cycle 2 of 2, FINAL)

You are the **PLAN-EVAL** evaluator (separate session from the generator). This is the layered PLAN
gate's binding Layer-A pass. Cycle 1 returned `FAIL_PLAN` with 3 required fixes; this is the single
remaining cycle before escalation. Read `.llm/harness/evaluator/plan-protocol.md` and
`.llm/harness/gates/plan-gate.md`, then evaluate the corrected plan and emit `PASS` or `FAIL_PLAN`.

This is a PLANNING evaluation only. Do NOT author docs, do NOT change framework code, do NOT touch
`docs/site`. Work from the local worktree + `deno doc` + source reads. Write your verdict to
`.llm/tmp/run/docs-v4-ia-deepening/plan-eval.md` AND post it as this PR comment.

## What changed since cycle 1
- **Cycle-1 required fixes (commit `949d1d99`):** (1) saga symbol corrected, (2) risk register
  RR-1/RR-2 added, (3) W4 R1 schema-gen caveat added.
- **WSL Codex adversarial panel (Layer B, separate session) returned `CHANGES_REQUIRED` with 7
  findings; all folded in commit `b9f46222`.** The fold-in record + what-could-not-be-broken is in
  `.llm/tmp/run/docs-v4-ia-deepening/panel/fold-in.md`. The panel independently concurred with your
  cycle-1 rulings on the 3 open IA questions.

NOTE/CORRECTION you should verify: cycle-1 plan-eval.md stated `createSagaRuntime` is re-exported via
`packages/plugin-sagas-core/src/public/mod.ts`. The Codex panel and a source re-check found this is
WRONG — `createSagaRuntime` is reachable ONLY via the `./runtime` export subpath
(`@netscript/plugin-sagas-core/runtime` → `src/runtime/mod.ts:75`), NOT root `.` and NOT
`src/public/mod.ts`. `deno.json` maps `.`→`./mod.ts`, `./runtime`→`./src/runtime/mod.ts`. The plan
now cites the subpath; please confirm the corrected claim against source rather than re-asserting the
cycle-1 path.

## Inputs to read (under `.llm/tmp/run/docs-v4-ia-deepening/`)
- `plan.md` — locked decisions (esp. 1, 4, 5), workstreams W0–W6, build/eval/merge flow
- `ia-tree.md` — the concrete 3-level Capability-Hub IA tree
- `seam-coverage.md` — capability seam audit + the better-auth R0 decision + R1 table-backed caveat
- `drift.md` — D1 process failure, D2 saga-symbol drift (corrected), risk register RR-1/RR-2
- `research.md` — Phase-0 scout synthesis
- `panel/fold-in.md` — the 7 panel findings + how each was resolved
- `.llm/harness/debt/arch-debt.md` — entry "packages/auth-better-auth — seamless better-auth
  integration roadmap" (R0–R5)

## Verify (emit FAIL_PLAN only on a genuine, evidenced defect)
1. The 3 cycle-1 required fixes are correctly applied (re-verify the saga subpath per the correction
   above; confirm RR-1/RR-2 and the W4 R1 caveat are concrete and correct).
2. The 7 panel fixes are sound: (a) saga subpath citation; (b) "10 export-backed + 1 examples leaf"
   page accounting matches `ia-tree.md`; (c) query leaf names the root `.` cache helpers that
   actually exist; (d) W5 gates are now mechanically enforceable (marker grammar + named check
   scripts + featureGrid/diagram throw-on-missing); (e) Track-D is repoint-only; (f) table-backed
   better-auth plugins carry the R1 caveat and only bearer/jwt are turnkey via R0; (g) W0 Mermaid
   determinism/rollback gate exists.
3. Plan-Gate checklist items (`gates/plan-gate.md`): scope bounded, archetype/overlay correct
   (SCOPE-docs + the auth R0 ARCHETYPE slice), every documented capability either seamed or
   tracked-as-limitation, no >3 authored IA levels, no orphan leaf.
4. Ground every symbol/export claim in `deno doc` or a source read — no assertions from memory.

## Output
Emit a one-line verdict (`PASS` or `FAIL_PLAN`) at the top, then the rationale. If `FAIL_PLAN`, list
ONLY genuine blocking defects with file:line + source evidence + concrete fix — do not re-litigate
already-correct items. Preserve lock hygiene: do not commit `deno.lock` or source churn.

## SKILL
- `.agents/skills/netscript-harness` — harness phases, PLAN-EVAL/plan-gate doctrine, verdict shape
- `.agents/skills/netscript-doctrine` — package/plugin archetype + public-surface gates (auth R0
  touches ARCHETYPE code; IA pillars mirror package boundaries)
- `.agents/skills/netscript-deno-toolchain` — `deno doc` / `deno doc --filter` to verify export
  surfaces (Fresh subpaths, saga/auth symbols) — primary verification tool
- `.agents/skills/netscript-tools` — raw-git verification + validation-evidence conventions
- `.agents/skills/netscript-cli` — CLI surface (`netscript db add`, scaffold) referenced by Data/Identity pillars


Issue/PR title: docs-v4: IA-deepening plan + seam audit + auth roadmap (planning only)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27938414502-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27938414502-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-107/run-27938414502-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 107
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27938414502
