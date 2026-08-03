use harness

# Slice: agentic runtime, lane bindings and release tooling (#1074, #1056, #1048, #1004)

Worktree: `/home/codex/repos/ns004-agentic` · branch `fix/1056-agentic-tooling` · base `origin/main`
@ `f663fe0e4`.

**This slice is on the critical path** — the docs lane (#1068–#1070) cannot be dispatched until the
Gemini binding below exists in `config/`. Do that part first, commit it ALONE, and push it before
you touch anything else.

## SKILL

Load, in order:

- `.agents/skills/netscript-harness` — run loop, slice contract, lane policy, commit trail.
- `.agents/skills/netscript-tools` — repo tooling, validation evidence, lock hygiene.
- `.agents/skills/netscript-pr` — branch/PR/label/milestone rules. `Closes #N` goes in the PR
  **body**; every `gh` call passes `--repo rickylabs/netscript`.
- `.agents/skills/netscript-release` — for #1004 only.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Non-negotiables

- Read every issue body in full before touching its code:
  `gh issue view <N> --repo rickylabs/netscript` for 1074, 1056, 1048, 1004. The acceptance boxes
  are written so a happy-path test cannot close them.
- **Verify the artefact, never the exit code.** `deno task check | tail` exits 0 while type checking
  fails. Read the actual output.
- **Do NOT touch `/home/codex/repos/wave4-*`** — live demo runs owned by someone else. Do not run
  `aspire stop --all`, do not stop containers, do not kill processes you did not start.
- No `// deno-lint-ignore` and no `as unknown as` added to green a gate. That is a review-blocking
  finding, not a pass.
- Commit per section. Push after each. Do not batch section 1 behind the rest.

## Section 1 — Gemini documentation lane (DO THIS FIRST, COMMIT AND PUSH ALONE)

The owner has **decided** that documentation issues route to **Gemini 3.6 Flash**. The verified live
OpenRouter id is **`google/gemini-3.6-flash`** (confirmed against the registry 2026-08-03). Do not
guess a different spelling.

1. Add the id to `.llm/tools/agentic/config/models.ts` `OPENROUTER_MODEL_IDS` (key `gemini`).
2. Add the matching preset to `.llm/tools/agentic/runtime/provider-profiles.ts`
   `OPENROUTER_PRESETS`, following the shape of the existing GLM/Qwen presets.
3. Add an explicit **documentation authoring** lane to `CANONICAL_ROUTE_POLICY` in
   `.llm/tools/agentic/runtime/routing-policy.ts`, bound to that model. Suggested lane key
   `documentation_authoring`. It is a **generator** lane on the Claude + OpenRouter transport.
4. Render it in the canonical-routes table in `.llm/harness/workflow/lane-policy.md`, and
   **replace** lines 53–55 (the "The issue-body 'Gemini 3.5 Flash' reference… A distinct
   Gemini-model lane is an owner open question, not an inferred route." paragraph) with a dated
   **owner decision record (2026-08-03)** stating that documentation authoring routes to Gemini 3.6
   Flash on the OpenRouter transport, and that this does not touch the evaluator lane.

### Two invariants that must SURVIVE your edit — do not relax either

- **The formal evaluator lane stays open-models-only.** `OPEN_EVALUATOR_MODEL_IDS` must remain
  exactly `[minimax/minimax-m3, qwen/qwen3.7-max]`. Gemini is a **generator** lane and must never
  be reachable as an evaluator. `resolveCanonicalFormalEvaluatorRoute()` must still **throw** for
  anything that is not Claude + OpenRouter + `open_only` with an approved open model. Add a test
  asserting that the new Gemini lane is **rejected** by that resolver — a positive assertion that
  the door stayed shut, not just an untouched existing test.
- **`qwen/qwen3.7-max` is correct and stays.** A "Qwen 3.8 max" was mentioned in briefing; it does
  **not** exist — verified against the live OpenRouter model list, where the newest Qwen max is 3.7.
  Change nothing there.
- `lane-policy.md` invariant 6 currently lists Gemini among models **prohibited on evaluator
  transports**. That sentence stays true and must remain. Adding a Gemini *generator* lane does not
  license Gemini on the evaluator transport; if you touch that paragraph at all it is only to make
  the generator/evaluator distinction explicit.

**Do not hardcode a model id outside `config/`.** Run `config/no-hardcoded-volatile_test.ts` and
show its output.

Then: commit, push, and stop to report the commit hash before starting section 2.

## Section 2 — #1074 (p1): repair wedged by dead rollouts + wrong process count

Two defects. I have already diagnosed both against the live machine; the diagnoses below are
verified, not guesses.

### 2a. `recentActiveSessions()` infers liveness from a dead file

`.llm/tools/agentic/runtime/adapters/local-codex-remote-adapter.ts:31-58`:

```ts
if (sessionId && !tail.includes('"type":"task_complete"')) active.push(sessionId);
```

A killed or crashed session never writes `task_complete`, so it is counted active **forever**, and
`repairRefusal()` (`runtime/codex-remote-repair.ts:79`) then blocks every repair attempt — including
in state `absent`, where `appServers` is empty and `controlSocketPresent` is false, i.e. where a
live session is impossible by construction.

**Liveness must come from process/socket reality, not from a file a dead process left behind.** A
rollout tail may *narrow* the candidate set, but it may never *establish* liveness on its own. The
intended shape: a rollout without `task_complete` only counts as an active session if there is a
corresponding live app-server process (and/or the control socket exists). When no anchored
app-server process exists and no control socket exists, `activeSessionIds` must be empty.

Required tests in `runtime/codex-remote-repair_test.ts` and/or `runtime/adapters_test.ts`:

- Repair **proceeds** from state `absent` with stale non-completed rollout files present. This test
  must fail against the current code — verify that by running it before your fix, and say so.
- A genuinely live session (app-server process present) still **blocks** repair. Do not fix the
  false positive by deleting the safety property.

### 2b. `agentic:codex-status` overcounts `appServerProcesses` — root cause found

`.llm/tools/agentic/codex/codex-status.ts:99`:

```
echo "PROCS=$(ps -eo pid,etime,cmd 2>/dev/null | grep -E "[a]pp-server" | wc -l | tr -d ' ')"
```

The count matches **any** process whose command line contains `app-server` — which includes the
wrapper shell running this very command, because the same command string contains
`codex app-server daemon version`. That is why the tool reports a count that `ps` does not.

**Live measurement I took on this machine, 2026-08-03, use it as your acceptance oracle:**

```
$ ps -eo pid,cmd | grep -E "[a]pp-server"
1258642 /home/codex/.codex/packages/standalone/current/codex app-server --remote-control --listen unix://
    (exactly 1 real app-server)

$ deno task agentic:codex-status
... "appServerProcesses":3      <-- WRONG, overcounts by the wrapper shell(s)
```

Fix it by parsing the process table and matching a **real anchored codex app-server argv** — reuse
`parseProcessTable()` / `isAnchoredCodexAppServer()` from `adapters/local-codex-remote-adapter.ts`
rather than writing a second, differently-wrong matcher. Two probes must not disagree.

Required tests:
- The zero-process case reports `0` (issue #1074 names this explicitly).
- A process table containing the *probe's own wrapper command line* (a shell whose argv includes
  `codex app-server daemon version` and the grep pattern) is **not** counted. Build that fixture
  from the real shape above.

After your fix, run `deno task agentic:codex-status` and `ps -eo pid,cmd | grep -E "[a]pp-server"`
and show that the two agree. Note the daemon count may differ from 1 by then — agree with whatever
`ps` says at that moment, that is the point.

## Section 3 — #1056 (p1): gate merges on answered review threads

Read the issue body in full; it is precise about the bar.

- New read-only `deno task` verb (issue suggests `agentic:review-threads`) that lists every review
  thread on a PR with **author, path:line, severity when present, and answered/unanswered**, and
  **exits non-zero when any thread is unanswered**. Usable locally before pushing.
- A CI gate that fails the PR while an unanswered thread exists and passes once every thread has a
  reply. Follow the existing `close-gate` shape — that is the named precedent in the issue.
- **A reply is the bar, not resolution.** Do not require the thread to be marked resolved; that is a
  manual UI click and would make CI depend on a human clicking a button.
- **A reasoned decline satisfies the gate.** No code change may be required. Silence is the failure
  mode; disagreement is fine.
- **`isOutdated` threads do not block.**
- **Discoverability is an acceptance criterion, not a nicety:** index the verb *from the symptom*
  ("my PR is green but should not merge yet") in `AGENTS.md` and the tools index — not merely as a
  row in a task table. The issue states shipped-but-undiscovered tooling is measurably unused here.
- Regression test covering all four cases: unanswered blocks · replied passes · declined passes ·
  outdated ignored. Four cases, four assertions.

## Section 4 — #1048 (p2): remove host-wide Aspire stop guidance from shipped skills

The consumer skill bundle merged in #1034 recommends a **shared-host-wide** Aspire stop in shipped
guidance. On a parallel agent host that stops sibling runs and destroys their in-flight state.

- Replace host-wide stop guidance with **per-AppHost cleanup using the exact AppHost path**.
- Regenerate the CLI asset barrel.
- **Verify the generated consumer bundle no longer recommends host-wide teardown** — grep the
  generated output, not just the source, and show the grep.
- #1046's forbidden-command guard tracks this as an explicit pre-existing inventory entry; remove it
  from that inventory as part of the fix, so the guard now enforces rather than excuses it.

Live environment fact worth encoding in the replacement guidance: `aspire stop --all` reports
"No running AppHost found" and exits 0 **while processes rooted at the AppHost survive**. Three
independent agents hit this in one night. Host-wide stop is both dangerous and unreliable.

## Section 5 — #1004: canary same-semver republish, remaining scope only

**Read the issue's pinned comment first.** PR #1035 already merged the reported defect's fix into
0.0.3 and deliberately carried `Refs #1004`, not a closing keyword. Two acceptance boxes are already
ticked. The remaining unmet box is exactly one:

- [ ] the retry publishes **only the missing members** and logs `Skipping, already published` for
      the rest.

Scope yourself to evidencing/implementing that box. Check what #1035 actually landed before writing
anything (`gh pr view 1035 --repo rickylabs/netscript --json files,body`). Do not re-implement work
that is already merged, and do not silently re-tick the two boxes that are already checked. If the
remaining box turns out to need real CI-workflow behaviour that cannot be evidenced without a live
partial publish, **say so explicitly in your report** rather than faking evidence — a truthful
"partial, here is what is left" is the correct outcome and I will carry it.

## Gates

Run and show real output for:

- `deno task check`
- `deno task test` — must include `config/no-hardcoded-volatile_test.ts`,
  `runtime/adapters_test.ts`, `runtime/codex-remote-repair_test.ts`, `runtime/routing-policy_test.ts`
- scoped lint/fmt wrappers:
  `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts`
  and the matching `run-deno-fmt.ts`
- if you touch `packages/**` or `plugins/**` at all: `deno task quality:scan` and
  `deno task arch:check`

Deno refuses dependencies younger than ~24h — use `--minimum-dependency-age=0` if that bites; note
`deno x` re-invokes in a child that does not inherit the flag.

## Reporting contract

After **each** section: commit, push, and write the commit hash plus the gate output you trusted
into the run worklog. Report section 1's hash immediately and separately — another slice is blocked
on it.

Do not open or edit the pull request yourself; the supervisor owns the PR. Push commits only.
