You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh

You are the PLAN-phase generator for **Wave 5d sub-gate 1/6 (support spine of `@netscript/fresh`)**. Your FULL instructions are on this branch — read them first and follow them literally:

1. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d1-plan.md` (your complete handover prompt)
2. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (**BINDING** umbrella target architecture — every divergence is a drift entry, never a silent rescope)

**Cloud-run adaptations** (override the handover where they conflict): you work in the Actions checkout of this PR branch — ignore the local Windows worktree paths. Do NOT post PR comments yourself; the workflow owns comments — your final PR comment comes from `OPENHANDS_SUMMARY_PATH`. Commit artifacts to this branch per milestone (research / design / plan), never amend, trailer `Co-Authored-By: openhands <openhands@all-hands.dev>`.

**Supervisor scan hints** (verified on this branch — start here, then deep-dive):
- `error/` = `handler.ts` (11.8K) + thin `primitives.ts` + a stray `components/ErrorDisplay.tsx` (5.7K). Umbrella default: ErrorDisplay dissolves INTO `error/`. Design the public error taxonomy first — 5d2–5d6 all consume it.
- `defer/telemetry.ts` and `form/telemetry.ts` are forks of the same idea. Your single biggest deliverable: ONE cross-cutting telemetry convention (span/event naming, OTel alignment) that 5d4/5d5 adopt. This is the E2E-telemetry keystone of the wave.
- `config/vite.ts` (7.6K, has tests + own README) wraps the Fresh 2 vite plugin → `./vite`. Wrap, don't reinvent: define the minimal stable wrapper surface. See `.llm/tmp/docs/fresh2-islands-partials.md` + `.resources/deps-docs/` before web.
- `./interactive` currently re-exports only `usePromise` from `hooks/`. Decide the package-owned interactive seam vs what belongs to fresh-ui; umbrella default: `hooks/` dissolves into the interactive seam's backing module.
- Doctrine spine: single `deno.json` task set, `./testing` entrypoint scaffold (consumers of builders/route/form need harnesses later — design the skeleton now), `docs/` scaffold + doctest fixture plan, curated-root policy for `mod.ts`.
- You set conventions binding on all later units — prefer small, boring, stable surfaces over clever ones.

**Expected output — files committed to THIS branch**, in `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/`:
`research.md` (MEASURE-FIRST numbers + inventory + market comparison with sources), `design.md`, `plan.md` (PROPOSED slice lock, ≤30 slices, per-slice gates + retired budget), `drift.md` (entries labeled `D-5d1-n`), `context-pack.md`. `plan.md` MUST end with these sections (I review against them): **Review map** (slice → files → gates → doc-lint/over-cap budget retired) · **Assumptions** · **Questions for supervisor** · **Dependencies & merge impact** (what you hand to 5d2–5d6; you are first in the implementation chain) · **Side-effect ledger** (what implementation will force updates to: CLI scaffold templates in `packages/cli`, `apps/playground` + `examples/` consumers, RFC/docs drift, fresh-ui/sdk seams).

**Expected output — PR comment** (write to `OPENHANDS_SUMMARY_PATH`): Summary; artifact paths + commit hashes; MEASURE-FIRST table (combined doc-lint per entrypoint, over-cap files, private-type-refs, dry-run status); proposed slice count; top 5 decisions/risks for the reviewer; final line `READY FOR PLAN-EVAL` (or explicit blockers).

Hard rules: PLAN only — zero implementation; no self-eval, no merging; never touch lock files, never `deno cache --reload`; root check excludes `packages/fresh` — measure entrypoints directly with `deno doc --lint` (combined, never root-barrel-only) and `deno check --unstable-kv`.

Issue/PR title: [5d1] fresh support spine — error · utils · vite config · interactive · mod skeleton (PLAN pending)

Operational contract:
- Read AGENTS.md first.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27442019802-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27442019802-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-34/run-27442019802-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 34
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27442019802
