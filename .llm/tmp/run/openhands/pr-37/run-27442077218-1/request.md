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

You are the PLAN-phase generator for **Wave 5d sub-gate 4/6 (`./defer` + `./streams` + the server streaming internals of `@netscript/fresh`)** — RFC 13 progressive streaming rendering + RFC 16 end-to-end streams. Your FULL instructions are on this branch — read first, follow literally:

1. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d4-plan.md`
2. `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (**BINDING** umbrella target architecture; divergence = drift entry)

**Cloud-run adaptations**: you work in the Actions checkout of this PR branch — ignore local Windows worktree paths. Do NOT post PR comments yourself (final comment comes from `OPENHANDS_SUMMARY_PATH`). Commit artifacts per milestone, never amend, trailer `Co-Authored-By: openhands <openhands@all-hands.dev>`.

**Supervisor scan hints** (verified): your inventory spans three places that must become ONE coherent streaming story — `defer/` (DeferPage 8.4K, DeferIsland 7.5K, policy 5K, telemetry 5.7K), `streams/` (`create-stream-db.ts` over the Wave 4 `@netscript/plugin-streams(-core)` merged surface), and `server/` streaming internals (`sse.ts` 10.8K, `stream.ts` 6.6K, `stream-error-boundary.tsx`). Design the layering: `./defer` owns rendering, `./streams` owns transport over plugin-streams, `server/` keeps only glue — and document exactly which plugin-streams exports you wrap so nothing re-implements transport locally (~27 fresh files reference sdk/streams; re-verify the coupling on this branch). **Abort/cleanup is the unit's spine**: every defer/SSE/stream surface needs provable AbortSignal propagation, backpressure behavior, and cleanup on client disconnect — make the test strategy a named deliverable with named slices. `defer/telemetry.ts` must adopt the 5d1 cross-cutting telemetry convention; design the streaming span/event vocabulary (TTFB, chunk timings) — it is the E2E-telemetry showcase of the wave. Note: `server.ts`/`defineFreshApp` surface ownership belongs to 5d6 — you own streaming internals, not the app builder. Benchmark: React 18/Next.js streaming + Suspense, TanStack Start streaming loaders, Remix defer.

**Expected output — files committed to THIS branch**, in `.llm/tmp/run/feat-package-quality-wave5-apps--5d4-streaming/`:
`research.md` (MEASURE-FIRST numbers + plugin-streams coupling map + market comparison with sources), `design.md` (streaming layering + abort/cleanup test strategy + telemetry vocabulary), `plan.md` (PROPOSED slice lock ≤30, per-slice gates incl. runtime/Aspire validation: a real streaming route + SSE endpoint with chunk-level assertions), `drift.md` (`D-5d4-n`), `context-pack.md`. `plan.md` MUST end with: **Review map** (slice → files → gates → budget retired) · **Assumptions** · **Questions for supervisor** · **Dependencies & merge impact** (you implement after 5d3 lands; name consumed 5d1 telemetry/error conventions + 5d2/5d3 seams; name the streaming defaults you hand to 5d6 `defineFreshApp`) · **Side-effect ledger** (plugin-streams(-core) surface assumptions, CLI scaffold/templates with SSE/defer examples, `apps/playground`/`examples`, RFC 13/16 doc drift).

**Expected output — PR comment** (via `OPENHANDS_SUMMARY_PATH`): Summary; artifact paths + commit hashes; MEASURE-FIRST table (combined doc-lint for `./defer` + `./streams` + server streaming files, over-cap, private-type-refs, dry-run); slice count; top 5 decisions/risks; final line `READY FOR PLAN-EVAL` (or blockers).

Hard rules: PLAN only — zero implementation; no self-eval/merge; never touch lock files or run `deno cache --reload`; measure with combined `deno doc --lint` + `deno check --unstable-kv` (root check excludes `packages/fresh`).

Issue/PR title: [5d4] fresh defer + streams — PSR (RFC 13) + e2e streams (RFC 16) (PLAN pending)

Operational contract:
- Read AGENTS.md first.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27442077218-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27442077218-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-37/run-27442077218-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 37
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/moonshotai/kimi-k2.7-code
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27442077218
