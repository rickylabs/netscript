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

You are the PLAN-phase generator for **Wave 5d sub-gate 6/6 (`./query` + `./server`/`defineFreshApp` + the FINAL package surface of `@netscript/fresh`)** — the unit that closes the wave. Your FULL instructions are on this branch — read first, follow literally:

1. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d6-plan.md`
2. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (**BINDING** umbrella target architecture — you are its enforcement unit: your closeout slices verify the whole-package quality bar)

**Cloud-run adaptations**: you work in the Actions checkout of this PR branch — ignore local Windows worktree paths. Do NOT post PR comments yourself (final comment comes from `OPENHANDS_SUMMARY_PATH`). Commit artifacts per milestone, never amend, trailer `Co-Authored-By: openhands <openhands@all-hands.dev>`.

**Supervisor scan hints** (verified): `query/` is deceptively thin (hooks 705B, hydration 1.6K, query-client 1.9K, query-island 1.2K) — the RFC 17 work is mostly DESIGN: the dehydrate-on-server / hydrate-in-island bridge over the merged 5b sdk query factories (`createQueryFactories`, `createServiceClient` Transport seam), fully typed from route contract (5d3) through builder (5d2) to island hook. Benchmark TanStack Start's server-function + Query integration. `server/define-fresh-app.ts` is only 2.2K today — design the final `defineFreshApp`: plugin/middleware mounting, telemetry bootstrap (5d1 convention), streaming defaults (5d4), and RFC 14 unified-mode extension points (adapter seam so the alpha surface never breaks — audit `server.ts` exports accordingly; seams only, NO implementation). Then the final-surface pass: F-16 cardinality over all 13 entrypoints (incl. 5d1's `./testing`), curated-root policy on `mod.ts`, F-18 sub-barrels, kill remaining private-type-refs package-wide. Closeout slices: whole-package combined doc-lint 0, `deno publish --dry-run` PASS incl. slow types, doctested README/getting-started, lift `packages/fresh` into the root check/fmt/lint gates (mirror how sdk and fresh-ui were lifted in `deno.json` — see commit c64cb16), final consumer-import + Aspire runtime proof on the playground.

**Expected output — files committed to THIS branch**, in `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/`:
`research.md` (MEASURE-FIRST numbers + query-bridge + defineFreshApp analysis + RFC 14 seam audit + market comparison with sources), `design.md` (hydration flow + app-builder extension points + final surface), `plan.md` (PROPOSED slice lock ≤30 incl. the wave-closeout gate slices, explicitly marked "re-measure at implementation time" since they depend on 5d1–5d5 landings), `drift.md` (`D-5d6-n`), `context-pack.md`. `plan.md` MUST end with: **Review map** (slice → files → gates → budget retired) · **Assumptions** (state every assumption about prior units' landings) · **Questions for supervisor** · **Dependencies & merge impact** (you implement LAST, after 5d5; list the consumed seams from EVERY prior unit: 5d1 conventions/testing, 5d2 island data seam, 5d3 contracts, 5d4 streaming defaults, 5d5 form state) · **Side-effect ledger** (sdk coupling assumptions, CLI scaffold/templates — the post-5d scaffold revamp consumes `defineFreshApp` directly, `apps/playground`/`examples`, RFC 14/17 doc drift, root `deno.json` gate lift).

**Expected output — PR comment** (via `OPENHANDS_SUMMARY_PATH`): Summary; artifact paths + commit hashes; MEASURE-FIRST table (combined doc-lint for `./query` + `./server` + `.`, over-cap, private-type-refs, dry-run, plus the whole-package residue estimate); slice count; top 5 decisions/risks; final line `READY FOR PLAN-EVAL` (or blockers).

Hard rules: PLAN only — zero implementation; no self-eval/merge; never touch lock files or run `deno cache --reload`; measure with combined `deno doc --lint` + `deno check --unstable-kv` (root check excludes `packages/fresh`).

Issue/PR title: [5d6] fresh query + server + final surface — RFC 17 bridge, defineFreshApp, RFC 14 seam audit (PLAN pending)

Operational contract:
- Read AGENTS.md first.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27442118991-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27442118991-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-39/run-27442118991-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 39
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27442118991
