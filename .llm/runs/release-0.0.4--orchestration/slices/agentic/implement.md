use harness

# Slice: agentic runtime, lane bindings and release tooling (#1074, #1056, #1048, #1004)

Worktree: `/home/codex/repos/ns004-agentic` · branch `fix/1056-agentic-tooling` · base `origin/main`
@ `f663fe0e4`.

**This slice is on the critical path** — the docs lane (#1068–#1070) cannot be dispatched until the
Gemini binding below exists in `config/`. Do that part first and push it early.

## SKILL

Load, in order:

- `.agents/skills/netscript-harness` — run loop, slice contract, lane policy, commit trail.
- `.agents/skills/netscript-tools` — repo tooling, validation evidence, lock hygiene.
- `.agents/skills/netscript-pr` — branch/PR/label/milestone rules. `Closes #N` goes in the PR
  **body**; every `gh` call passes `--repo rickylabs/netscript`.
- `.agents/skills/netscript-release` — for #1004 only.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Scope, in this order

### 1. Gemini documentation lane — owner decision, do this first

The owner has **decided** that documentation issues route to **Gemini 3.6 Flash**.
`.llm/harness/workflow/lane-policy.md` currently records a distinct Gemini lane as an *owner open
question* ("The issue-body 'Gemini 3.5 Flash' reference for research/extraction was superseded…
A distinct Gemini-model lane is an owner open question, not an inferred route."). That is now
answered and the policy document must stop contradicting what we run.

- Add the model id to `.llm/tools/agentic/config/models.ts` `OPENROUTER_MODEL_IDS`. The verified
  live OpenRouter id is **`google/gemini-3.6-flash`** (confirmed against the registry 2026-08-03).
- Add the matching preset in `runtime/provider-profiles.ts` `OPENROUTER_PRESETS`.
- Add an explicit **documentation authoring** lane to `CANONICAL_ROUTE_POLICY` in
  `runtime/routing-policy.ts` bound to that model.
- Render it in `lane-policy.md` and **replace** the open-question paragraph with a dated owner
  decision record (2026-08-03).
- **Do not hardcode a model id outside `config/`** — `config/no-hardcoded-volatile_test.ts` fails
  the suite if you do. Run that test.

Two constraints that are **not** being relaxed and must survive your edit:

- The **formal evaluator lane stays open-models-only** (`qwen/qwen3.7-max` / `minimax/minimax-m3`).
  Gemini is a **generator** lane only. `resolveCanonicalFormalEvaluatorRoute()` must still throw for
  anything else.
- **`qwen/qwen3.7-max` is correct and stays.** A "Qwen 3.8 max" was mentioned in briefing; it **does
  not exist** — verified against the live OpenRouter model list, where the newest Qwen max is 3.7.
  Change nothing there. Record that check in the PR body so nobody re-opens it.

### 2. #1074 (p1) — `repair codex-remote` permanently refused by dead session rollouts

`runtime/adapters/local-codex-remote-adapter.ts:31` `recentActiveSessions()` treats any recent
rollout `.jsonl` whose tail lacks `"type":"task_complete"` as an active session. Killed or crashed
sessions never write that marker, so they wedge `repairRefusal()`
(`runtime/codex-remote-repair.ts:79`) forever — even in state `absent`, where no app-server process
and no control socket exist. Liveness must come from process/socket reality, not from a file a dead
process left behind.

Also in scope from the same issue: `agentic:codex-status` reported `appServerProcesses: 2` while
`ps` showed zero and the socket was absent. Make the count consistent with `ps` and test the
zero-process case.

### 3. #1056 (p1) — gate merges on answered review threads

A green PR can still carry unanswered review findings.

### 4. #1048 (p2) — remove shared-host-wide Aspire stop guidance from shipped skills

Live environment fact worth encoding: `aspire stop --all` reports "No running AppHost found" and
exits 0 while processes rooted at the AppHost survive. Three independent agents hit this in one
night. Host-wide stop guidance on a shared machine is actively dangerous.

### 5. #1004 — canary lane has no same-semver republish path

A 503 mid-publish forces a wasted `canary.N`.

## Rules

- Volatile values have exactly one home: `config/models.ts`, `config/versions.ts`,
  `config/endpoints.ts`.
- Do not weaken the generator-≠-evaluator invariant or the closed-model prohibition on the evaluator
  transport. That prohibition is cost protection, not an implementation detail.
- Do not touch `/home/codex/repos/wave4-*` — live demo runs, another owner.

## Gates

`deno task check` · `deno task test` (must include `config/no-hardcoded-volatile_test.ts`,
`runtime/adapters_test.ts`, `runtime/codex-remote-repair_test.ts`) · scoped lint/fmt wrappers.
Verify the artefact, never the exit code.

## Deliverable

One draft PR closing #1074, #1056, #1048, #1004, driven to ready-for-merge. Push the Gemini binding
as the **first** commit and report it immediately — another slice is blocked on it. Commit per
slice; push and comment commit hash + gate evidence on the draft PR before the next slice.
