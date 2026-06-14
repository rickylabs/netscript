You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/moonshotai/kimi-k2.7-code output=pr-comment use harness

Activate SKILL
- netscript-harness
- netscript-doctrine
- jsr-audit
- deno-fresh
- aspire

You are the PLAN-phase generator for **Wave 5d sub-gate 3/6 (`./route` — manifest + contract runtime of `@netscript/fresh`)**. Your FULL instructions are on this branch — read first, follow literally:

1. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d3-plan.md`
2. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (**BINDING** umbrella target architecture; divergence = drift entry)

**Cloud-run adaptations**: you work in the Actions checkout of this PR branch — ignore local Windows worktree paths. Do NOT post PR comments yourself (final comment comes from `OPENHANDS_SUMMARY_PATH`). Commit artifacts per milestone, never amend, trailer `Co-Authored-By: openhands <openhands@all-hands.dev>`.

**Supervisor scan hints** (verified): over-cap set is `route/mod.ts` 27K, `route/contract.ts` 21.2K, `route/manifest.ts` 14.1K (tests: contract 10.1K, manifest 12.1K). The contract runtime is the **typesafety spine of the whole wave**: one route contract must type the server handler, the client sdk call (5b `createServiceClient`), and the island props (5d6 query bridge) — document that chain end-to-end as your north star, it is the thing I will probe hardest at review. Investigate how route contracts relate to the oRPC contracts under `contracts/versions/` so the two contract worlds share vocabulary instead of forking. Manifest: establish what NetScript adds over Fresh 2's own fsRoutes (contracts, telemetry route naming) and keep the rest thin wrapping — wrap, don't reinvent. A3 obligations: plan the Aspire-backed runtime proof (playground boots, routes resolve, contract violations surface correctly) and handler-lifecycle abort/cleanup tests as named slices, not afterthoughts.

**Expected output — files committed to THIS branch**, in `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/`:
`research.md` (MEASURE-FIRST numbers + public-symbol map + contract-chain analysis + market comparison: TanStack Router route-tree typing, Next.js typed routes — with sources), `design.md` (decomposition + contract/manifest target + oRPC alignment verdict), `plan.md` (PROPOSED slice lock ≤30, per-slice gates incl. F-13 + runtime-validation slices), `drift.md` (`D-5d3-n`), `context-pack.md`. `plan.md` MUST end with: **Review map** (slice → files → gates → budget retired) · **Assumptions** · **Questions for supervisor** · **Dependencies & merge impact** (you implement after 5d2 lands; name the 5d1 conventions and 5d2 builder seams you consume, and the contract surface you hand to 5d6) · **Side-effect ledger** (CLI scaffold/templates that generate routes, `apps/playground`/`examples` consumers, `contracts/versions/` alignment, RFC 12/17 doc drift).

**Expected output — PR comment** (via `OPENHANDS_SUMMARY_PATH`): Summary; artifact paths + commit hashes; MEASURE-FIRST table (combined doc-lint for `./route`, over-cap, private-type-refs, dry-run); slice count; top 5 decisions/risks; final line `READY FOR PLAN-EVAL` (or blockers).

Hard rules: PLAN only — zero implementation; no self-eval/merge; never touch lock files or run `deno cache --reload`; measure with combined `deno doc --lint` + `deno check --unstable-kv` (root check excludes `packages/fresh`).

Issue/PR title: [5d3] fresh route — manifest + contract runtime (PLAN pending)

Operational contract:
- Read AGENTS.md first.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27442056651-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27442056651-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-36/run-27442056651-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 36
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27442056651
