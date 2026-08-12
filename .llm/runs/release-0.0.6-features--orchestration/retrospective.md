# Retrospective — 0.0.6 runtime / public-surface lane

Factual account of one topical milestone lane, 2026-08-12. Both owned issues landed on `main`:
**#1405 → `8ff1bcb8f`**, **#1398 → `d7e2b67b2`**.

Per the brief: this records what the run's own evidence supports. Where a lesson is a candidate
rather than a demonstrated rule, it says so. **No policy is promoted from a single occurrence.**

## What the lane produced

| Issue | PR | Merge | Evidence that closed it |
| --- | --- | --- | --- |
| #1405 durable producer rejection taxonomy | #1528 | `8ff1bcb8f` | 4 negative tests, each pinned to its own reason; full CI green; 7-check pre-merge gate |
| #1398 job executions to the durable stream | #1536 | `d7e2b67b2` | Two formerly-deferred OTEL gates un-deferred and **passing live by name on both CI runtime tiers**; 7-check pre-merge gate |

Two follow-ups filed from inside the run: **#1542** (`quality:gate` root coverage) and **#1543**
(undeclared `plugin-streams-core` imports).

## The one thing most worth carrying forward

**#1398's definition of done was made mechanical instead of rhetorical, and that decision did the
work.** The issue's acceptance included "a live subscription observes the execution record within a
bounded time" — a criterion trivially satisfiable with a confident sentence. The plan instead bound
it to two gates the repo had **already deferred against this very issue**
(`SCAFFOLD_RUNTIME_DEFERRED_GATES`, reason: *"workers-combined does not install the stream mutation
hook"*). Done then meant: remove the deferral, and have the gates pass.

That reframing is what made every later step falsifiable. It is also what made two red local runs
*informative* rather than negotiable — there was nothing to argue about, the gates either ran or
they did not.

**[observed, single run]** — one instance. The candidate rule is: *when an issue's acceptance is
observational, look for an existing deferred/skipped gate that encodes it before writing a new
criterion.* It worked once here; it is not yet a rule.

## Layered review caught what each layer above it missed

Concretely, on the same defect class — stale pins of the #1398 deferral:

| Layer | Found |
| --- | --- |
| Orchestrator plan | `suite-registry_test.ts:204-215` |
| PLAN-EVAL (MiniMax M3) | a **second** pin at `:209-234` |
| Implementer (Codex Sol medium) | a **third** in `suite-runner_test.ts`, by running full package tests rather than only the tests it was pointed at |

PLAN-EVAL also caught **F1**: the trace-context join was implicit in the plan and would have failed
*silently* — `StreamsTracerPort.startSpan` takes no parent-context argument, so without an explicit
`context.with(...)` wrapper the hook looks correct and fails TC-14 on the pre-span `create()` record.
The final Qwen IMPL-EVAL then traced that same mechanism end-to-end independently.

**[observed]** Each layer found something the previous one could not. This is the strongest evidence
in the run for the existing generator ≠ evaluator invariant, and it cost two evaluator sessions.

## Verification discipline that changed an outcome

- **Negative-case proof.** For #1405 the orchestrator reverted both fixes (29/34 → 5 failures) and
  the IMPL-EVAL reverted each **individually**, showing each test fails for its *own* reason. The
  aggregate check would have passed a suite where all four tests rode on one mechanism.
  Acceptance box 4 asks for the per-reason property; only the individual reverts demonstrate it.
- **Reading logs, not summaries.** Both OTEL gates were confirmed **by name** in job logs, with
  `skipped=0` treated as load-bearing alongside `failed=0`. `gh pr checks` twice reported something
  materially misleading (all-`skipping` on a draft; a stale `close-gate` red from a job that predated
  the changes it complained about).
- **Head discipline.** When #1536's head changed mid-flight, gate evidence was re-read against the
  new head. The new job ids (`94073971396` / `94073971501`) differ from the pre-sync pair, which is
  the concrete proof that reusing the earlier verification would have cited a head no longer on the
  PR.

## Mistakes made by this orchestrator

Recorded because a retrospective that only lists what went well is not evidence of anything.

1. **Wrong default on the IMPL-EVAL waiver** (D-3). The brief said a waiver was "acceptable" for the
   #1405 class; that was read as a blocked-transport fallback rather than the class default, costing
   one unnecessary evaluator run. The ruling arrived after #1405 had already merged, so it changed
   policy, not that outcome.
2. **A scope inference from the wrong file.** Read `workers-contribution.ts`, saw no `streams`
   reference on the background resource, and concluded the env was unwired — which would have added
   an unnecessary Aspire slice. `PluginReferences` is reconciled from the plugin manifest, not that
   file. Verifying the *mechanism* rather than the first plausible file is what caught it.
3. **A broken gate command in my own slice brief** — `deno test <path>` without `--allow-env`. The
   implementer reported the red with its cause instead of hiding it; the brief was wrong, not the
   slice.
4. **A watcher that could not have fired**, twice: one keyed on comment count against a tool that
   edits in place, and one waiting for a dispatcher that did not exist in the PR's merge ref.

## Candidate rules — not promoted

Each appeared **once**. Recorded so a future run can confirm or falsify, not encoded as doctrine:

- For `pull_request` events, a workflow must exist in the PR's **merge ref**; a newly merged
  dispatcher cannot fire on an older head. *Check presence before diagnosing a trigger failure.*
- A local expensive-suite red is not a flake until a clean control run exists elsewhere.
- Watch a run's status and its terminal marker, never comment count, for tools that update in place.
- Re-verify the `status:` label set after automated phase transitions, not only manual edits.

## Open items leaving this lane

- **#1542** — `quality:gate` roots omit published packages. Hit independently by three sessions here;
  both merge records in this lane explicitly rest on **explicit target scans** rather than the repo
  gate. The most consequential thing this lane found and did not fix.
- **#1543** — undeclared `plugin-streams-core` imports, filed as **unverified**: nobody checked
  whether `deno publish` rejects them, and the issue makes that evidence its first acceptance box
  rather than asserting a defect.
- Canary and stable cut are **root's**, not this lane's. Nothing here was published.
