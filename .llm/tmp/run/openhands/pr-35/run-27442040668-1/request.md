You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- frontend-design
- ux-patterns

You are the PLAN-phase generator for **Wave 5d sub-gate 2/6 (`./builders` — the `definePage` DSL of `@netscript/fresh`)**, the heaviest cluster of the wave. Your FULL instructions are on this branch — read first, follow literally:

1. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d2-plan.md`
2. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (**BINDING** umbrella target architecture; divergence = drift entry)

**Cloud-run adaptations**: you work in the Actions checkout of this PR branch — ignore local Windows worktree paths in the handover. Do NOT post PR comments yourself (workflow owns comments; final comment comes from `OPENHANDS_SUMMARY_PATH`). Commit artifacts per milestone (research / design / plan), never amend, trailer `Co-Authored-By: openhands <openhands@all-hands.dev>`.

**Supervisor scan hints** (verified): the over-cap set is `builders/mod.ts` 41.5K, `define-page/builder.tsx` 38.6K, `define-page/types.ts` 22.6K, `navigation.tsx` 20.7K, `runtime.tsx` 18.6K, plus `define-page.test.tsx` 46K which must decompose along the same seams. Method that works: map EVERY public symbol first (`deno doc`), then design the file split (`_internal/` for non-public helpers) with **zero export-specifier or public-type-name changes**. Benchmark `definePage` head-on vs TanStack Start routes/loaders, Next.js App Router (layouts, server actions, streaming), Remix data APIs — name DX gaps and verdict each as in-scope polish vs deferred. `define-partial.tsx` + Fresh 2 partials: read `.llm/tmp/docs/fresh2-islands-partials.md`. The typed loader→island data seam you design is consumed by 5d6 (query bridge) — specify it explicitly. RFC 14: audit which builder options would break under a non-Fresh adapter (seams only, no implementation). The umbrella sanctions splitting this unit into TWO locked plans if your measurements justify it — decide from numbers, not vibes.

**Expected output — files committed to THIS branch**, in `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/`:
`research.md` (MEASURE-FIRST numbers + full public-symbol map + market comparison with sources), `design.md` (decomposition + DSL gap verdicts + island/RFC-14 seams), `plan.md` (PROPOSED slice lock ≤30 per plan; if two plans, an explicit boundary), `drift.md` (`D-5d2-n`), `context-pack.md`. `plan.md` MUST end with: **Review map** (slice → files → gates → budget retired) · **Assumptions** · **Questions for supervisor** · **Dependencies & merge impact** (you implement AFTER 5d1 lands — name the 5d1 conventions you consume: error taxonomy, telemetry, `./testing`; name what you hand to 5d3/5d6) · **Side-effect ledger** (CLI scaffold templates, `apps/playground`/`examples` consumers, RFC 12 doc drift, anything in `packages/cli` that emits definePage code).

**Expected output — PR comment** (via `OPENHANDS_SUMMARY_PATH`): Summary; artifact paths + commit hashes; MEASURE-FIRST table (combined doc-lint for `./builders`, over-cap inventory, private-type-refs, dry-run); one-plan-vs-two verdict + slice count; top 5 decisions/risks; final line `READY FOR PLAN-EVAL` (or blockers).

Hard rules: PLAN only — zero implementation; no self-eval/merge; never touch lock files or run `deno cache --reload`; measure with combined `deno doc --lint` + `deno check --unstable-kv` (root check excludes `packages/fresh`).

Issue/PR title: [5d2] fresh builders — definePage DSL decomposition (PLAN pending)

Operational contract:
- Read AGENTS.md first.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27442040668-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27442040668-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-35/run-27442040668-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 35
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27442040668
