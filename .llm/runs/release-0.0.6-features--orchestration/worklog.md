# Worklog — 0.0.6 runtime / public-surface lane

## 2026-08-12 — Stage A, bootstrap

**Identity / worktree proof.**

| Check | Command | Result |
| --- | --- | --- |
| Branch | `git rev-parse --abbrev-ref HEAD` | `chore/release-0.0.6-features-orchestration` |
| HEAD | `git rev-parse --short HEAD` | `01aa12b67` |
| Tree | `git status --porcelain` | clean at open |
| Remote | `git fetch origin main` | `origin/main@01aa12b67` — lane starts at tip |
| Runtime | `deno task agentic:runtime doctor` | `no_change (schema 1.0)`; components 18; **sessions 0** |

**Correction to the line above.** `doctor`'s `sessions: 0` counts *desired-state runtime controller*
sessions, **not** live Codex threads. A later `deno task agentic:codex-status` showed a sibling lane
working in `/home/codex/repos/ns006-1374-compilegate` plus three idle `agy` sessions elsewhere. No
collision occurred — this lane uses its own fresh worktrees — but "sessions: 0" must not be read as
"nothing is running", and is not cited as such anywhere else in this run.

**Issue re-baseline (live bodies fetched, not recalled).**

| Issue | State | Milestone | Labels | Acceptance boxes |
| --- | --- | --- | --- | --- |
| #1405 | OPEN | 26 / `0.0.6` | `type:fix`, `area:plugins`, `status:triage`, `priority:p2` | 5, all unticked |
| #1398 | OPEN | 26 / `0.0.6` | `type:fix`, `area:plugins`, `area:telemetry`, `status:triage`, `priority:p1` | 4, all unticked |

Both still carry `status:triage` and no assignee — neither has been started by another lane.

**Predecessor state.** PR #1395 merged 2026-08-09T01:25:15Z; PR #1402 merged 2026-08-09T05:11:32Z.
Both are ancestors of the baseline, so #1398 is being planned against the landed envelope and the
landed reconnect supervisor, not against their PR branches.

**Evaluator-transport precondition.** `gh pr view 1524` → **OPEN**, `mergedAt: null`. Its own DoD
still has `Bounded live DeepSeek smoke` and `Repository default variable is updated` unticked. The
brief's OpenHands eval route is conditional on #1524 passing/landing, so this run falls back to
fresh local sessions. Recorded as `drift.md` D-2; re-checked before each eval dispatch.

**Research.** #1405 researched in-session (small, fully specified) →
`slices/research-1405.md`, both defects confirmed at exact call sites with a line-cited call-site
table for `#failActive`. #1398 research delegated to a Claude Opus sub-agent (read-only, `drift.md`
D-1 records the lane override) — report pending.

## 2026-08-12 — #1398 research returned early (budget), root cause found

The delegated research sub-agent was **stopped on token budget** mid-pass and asked for concise
findings rather than killed, so its evidence survived. Report: `slices/research-1398.md`.

It found the root cause and, importantly, found that **the repo already records it**: the two Flow-B
OTEL gates are deferred against #1398 with the reason "workers-combined does not install the stream
mutation hook" (`packages/cli/e2e/suites/scaffold/capability-suites.ts:23-34`). The workers API
service installs the hook (`plugins/workers/services/src/main.ts:67`); the background entrypoints
that generated projects actually run never do (`plugins/workers/bin/runtime.ts:89-152`).

The report's honest **unverified list** is carried into `plan.md` as blocking slice S0 rather than
being smoothed over — the first item (does `workers-combined` actually receive the streams env)
decides whether the fix is a hook installation or something larger.

**Orchestrator-verified fact** (not delegated, checked in-session, because the whole plan turns on
it): `job-dispatcher.ts:44` derives `parentContext` from the stored trace headers and passes it to
`traceJobExecution` at `:108`, so `job.execute` shares its trace id with the record's stored
`traceparent`; and `instrumentation.ts:160` starts the publish span on the **ambient** context. That
pair is what lets every published execution record join the `job.execute` trace, including the
pre-span `create()` record — which is the sharp edge the research flagged.

## 2026-08-12 — #1405 slice dispatched (Tier-D, mobile-visible)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-1405` (fresh leaf) |
| Branch | `fix/1405-durable-producer-rejection-taxonomy` @ `01aa12b67`, **no upstream by design** |
| Thread id | `019ff4f0-0e1c-7333-8138-bbb107e4f1b3` |
| Rollout | `/home/codex/.codex/sessions/2026/08/12/rollout-2026-08-12T09-46-40-019ff4f0-0e1c-7333-8138-bbb107e4f1b3.jsonl` |
| Requested route | openai · gpt-5.6-sol · low |
| Observed route | openai · gpt-5.6-sol · low — **verdict: matched** |
| Runtime | approval=never · sandbox=dangerFullAccess |
| Steering | `codex exec resume 019ff4f0-0e1c-7333-8138-bbb107e4f1b3 -- "<follow-up>"` |
| Brief | `slices/implement-1405.md` (staged to `/home/codex/ns006-1405-brief.md`) |

Launched through `deno task agentic:launch-codex-slice` after a clean `--dry-run`; the first dry-run
**failed git-safety** because the leaf branch tracked `origin/main`, which was cleared before launch
(push is explicit-refspec only). Watching with `agentic:codex-watch --mode turn` on that thread —
event-driven, not polled.

The brief locks both reason decisions (reuse `producer-stopping`; add exactly one new member
`transport-refused`), names the gates as deliverables including the mandatory `quality:gate`,
pre-empts the known `deno fmt` rewrap hazard, and forbids the agent from merging or flipping to
ready.

## 2026-08-12 — #1405 slice landed on its branch; Tier-A review done

Codex thread `019ff4f0-0e1c-7333-8138-bbb107e4f1b3` completed its turn (detected by
`agentic:codex-watch --mode turn`, not by polling). Commit `c491c6989`, pushed by explicit refspec,
**draft PR #1528** open against `main` carrying `Closes #1405`, a fenced `acceptance-evidence` block
mapping all five boxes, and a DoD whose last two boxes (IMPL-EVAL, orchestrator review) are
correctly left unticked.

**Independent re-verification (not read off the slice report):**

| Check | Command | Result |
| --- | --- | --- |
| Package suite | `deno task --cwd packages/plugin-streams-core test` | **33 passed, 0 failed** |
| Negative case | both fixes reverted, suite re-run | **29 passed, 5 failed** — the guards fire |
| Restore | `git checkout` + re-run | 33/33, clean tree |

The negative-case run is the `milestone-run.md` gate-integrity rule applied: a guard enters only
with its predicate demonstrated. 0.0.4 shipped two guards that could never fire and looked correct;
this one was checked rather than assumed.

**Diff conforms to the locked decisions.** `transport-refused` is the only public-surface addition;
close-drain reuses `producer-stopping`; `#failActive` branches on `isRetryable`; the conflated
connect guard is split. The façade's duplicate `stateRejection()` was **deleted** and both write
entry points delegate to `supervisor.writeRejectionReason()` — so the two selectors that drifted
apart to produce this defect can no longer drift again.

**Two advisory findings, neither blocking** (posted to #1528): the reverted-state failure arrives as
an uncaught-error cascade rather than four individual assertion failures; and `arch:check` carries
`WARN=1` because the supervisor file is now 515 lines against a 500-line advisory cap (`FAIL=0`).

**A defect in my own brief, surfaced by the implementer.** The brief's gate list named
`deno test packages/plugin-streams-core`, which exits 1 with 19 `NotCapable` failures for want of
`--allow-env`. The slice reported the red with its cause instead of hiding it and used the
package-declared task. The brief was wrong; corrected before the #1398 brief goes out.

**IMPL-EVAL dispatched** — separate session, separate worktree `/home/codex/repos/ns006-1405-impleval`
at `c491c6989`, DeepSeek V4 Flash 0731 max (small-impl evaluator lane, local fallback transport per
D-2). Its prompt (`slices/impl-eval-1405-prompt.md`) directs it at the highest-value failure mode —
whether a genuinely failed producer can now be masked as merely closing, which would be a worse
defect than the one being fixed — and requires it to revert each fix **individually** to prove each
test fails for its own reason.

## 2026-08-12 — #1398 S0 resolved (and an orchestrator inference corrected)

The plan's blocking precondition — does `workers-combined` actually receive the streams URL — is
**answered: yes**, so S0 stops being a blocking unknown and becomes a runtime confirmation in S3.

Evidence: `generate-register-background.ts:200-218` emits `services__<ref>__http__0` for every
background-processor `PluginReferences` entry, and
`packages/cli/src/public/features/plugins/install/install-plugin_test.ts:1393-1396` asserts
`BackgroundProcessors.workers.PluginReferences === ['streams', 'workers-api']`.

**Correction.** My first read was `plugins/workers/src/aspire/workers-contribution.ts:55-63`, where
`addDenoBackground` declares no `streams` reference and only `builder.waitFor(combined, api)` — from
which I concluded the env was missing and the plan needed an extra Aspire slice. That inference was
wrong. `PluginReferences` is not derived from the contribution file; it is reconciled from the plugin
manifest's `.withDependencies({ streams: streamsPlugin })` (`plugins/workers/src/public/mod.ts:61`).
Verifying the mechanism rather than stopping at the first plausible file is what kept an unnecessary
slice out of the plan. Recorded here rather than silently amended, because the wrong version was
briefly the basis for a scope judgement.

Residual for S3 only: the generated wiring guards with `if (<ref>Endpoint)`, so the env is silently
omitted if the streams resource exposes no `http` endpoint at wiring time. Runtime observation, not
a design unknown.

**Evaluator sessions in flight** (both real agentic turns, not nominal): PLAN-EVAL #1398 on MiniMax
M3 high (208 stream events at 07:59Z) and IMPL-EVAL #1405 on DeepSeek V4 Flash 0731 max (1012
events). Preset validation ran first — `agentic:provider-canary --all` reported all six presets
`passed`, with `claude-evaluator-minimax-m3` and `claude-evaluator-deepseek-v4-flash-0731` both
`liveEligible: true`, `agenticTurn: supported`.

## 2026-08-12 — #1398 PLAN-EVAL PASS, plan amended, slice dispatched

**PLAN-EVAL verdict: PASS** (MiniMax M3 high, fresh session, worktree
`/home/codex/repos/ns006-1398-planeval` @ `01aeafbfa`, 562,947 ms, `is_error: False`, 215 stream
events — a real agentic turn, not a nominal one). Verbatim verdict in `plan-eval.md`; a leaked
one-line preamble before the verdict token was stripped and that edit is disclosed in the file.

It confirmed the causal chain one hop deeper than I had traced it — through `withSpan` into
`packages/telemetry/src/application/span.ts:38-43`, where `parentContext` is passed as the third
argument to `tracer.startSpan` — and confirmed TC-14 compares **trace id only**
(`select-flow-b-stream-change.ts:131-153`) and that the selector returns the **first**
`correlationId` match (`:96-105`). It also answered S0 `yes` by a **different route** than I did
(`plugin-reference-reconciler.ts:70-91` rather than `install-plugin_test.ts`), so that precondition
is now confirmed twice from two directions.

**Two findings folded into the plan after I verified each myself:**

- **F1** — the join mechanism was implicit and would have failed silently.
  `StreamsTracerPort.startSpan` (`instrumentation.ts:92-102`) takes **no** parent-context argument,
  so only an explicit `context.with(extractContext({traceparent, tracestate}), …)` wrapper around
  `producer.upsert` makes the publish span inherit the job trace. `createStreamMutationHook`
  (`plugin-workers-core/src/streams/producer.ts:108-118`) does no wrapping today. D3 now says so.
- **F2** — the plan named one of the **two** tests that pin the deferral. The second,
  `suite-registry_test.ts:209-234`, asserts `SCAFFOLD_RUNTIME_DEFERRED_GATES` equals the exact
  two-entry list and that neither runtime tier executes a deferred gate. I read both tests directly
  to confirm. Emptying the constant without rewriting that test leaves S2 red. D5 now names both.

Neither was blocking; both earned the pass.

**Slice dispatched (Tier-D, mobile-visible).**

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-1398` (fresh leaf, upstream cleared before launch) |
| Branch | `fix/1398-publish-job-executions-to-durable-stream` @ `01aa12b67` |
| Thread id | `019ff4ff-a633-7062-ae9c-21930930b5d6` |
| Rollout | `/home/codex/.codex/sessions/2026/08/12/rollout-2026-08-12T10-03-42-019ff4ff-a633-7062-ae9c-21930930b5d6.jsonl` |
| Requested / observed route | openai · gpt-5.6-sol · **medium** — **verdict: matched** |
| Steering | `codex exec resume 019ff4ff-a633-7062-ae9c-21930930b5d6 -- "<follow-up>"` |
| Brief | `slices/implement-1398.md` |

The brief carries F1 and F2 as locked requirements, names the `create()` trap explicitly (install the
hook without D3's wrapping and it looks correct, then fails TC-14 on the first matched record),
corrects the `--allow-env` gate-command defect from the previous brief instead of repeating it,
fences the out-of-scope items (#1405's surface, the undeclared imports, any schema change), and
requires the expensive `scaffold.runtime` gate to be confirmed un-contended before it runs.

**Note on tooling:** `slices/codex-thread-ids.md` is written per slice-dir and was **overwritten** by
the second launch, so it now shows only the #1398 thread. The #1405 identity is preserved in this
worklog above; nothing was lost, but the file is not an accumulating registry.

## 2026-08-12 — #1405 MERGED (`8ff1bcb8f`)

IMPL-EVAL returned **PASS** (DeepSeek V4 Flash 0731 max, fresh session, 642,836 ms, 5,226 events).
Its per-fix revert isolation is the substantive result: reverting only the `#closing` change fails
only the close-drain test; reverting only the `#failActive` change fails only the refusal tests.
My earlier both-at-once revert proved the tests fire but **not** that each guards its own defect —
that distinction is what acceptance box 4 actually asks for.

**One evaluator suggestion declined, with reasons on the PR.** It proposed dropping the unreachable
`?? 'producer-failed'` fallback (`create-durable-stream.ts:132,160`). The unreachability is correct,
but the cleanup does not typecheck: `writeRejectionReason()` returns
`StreamWriteRejectionReasonV1 | undefined`, so removing the `??` needs a non-null assertion — which
the slice brief forbids — or a wider refactor. A total, type-safe expression is the better trade.
Declining with a reason satisfies the review-thread gate; silently ignoring it would not.

**The draft-CI trap fired exactly as the profile predicts.** Every check on #1528 read `skipping`
while it was a draft. Under check 4 that is *unproven*, not clean — the #778/#775 failure mode where
"clean" meant "nothing ran". Flipping to ready produced real runs, and the named expensive gates then
reported genuine `SUCCESS`: `scaffold-runtime (aspire + docker + postgres)`,
`scaffold-runtime-sqlite`, `scaffold-static`, `code-quality`, `quality`, `check-test`,
`surface-diff`, `deps-report`, `close-gate`. Terminal after 440 s.

The evidence mirror was **pre-flighted with `--dry-run` before labeling** and reported it would skip
without `status:ready-merge`; applying the label let it tick all five #1405 acceptance boxes from the
PR's fenced `acceptance-evidence` block rather than by hand.

**Pre-merge gate:** `slices/pre-merge-gate-1528.md`, all seven checks PASS with named sources, plus
`agentic:review-threads` → `PASS threads=0 unanswered=0`. Merged squash → `8ff1bcb8f`; #1405
auto-closed `COMPLETED` by the body's closing keyword; `status:shipped` on both.

**Caveat carried into the merge record rather than dropped:** `quality:gate`'s configured roots omit
`packages/plugin-streams-core`, so this package's quality verdict rests on the explicit target scan
(`findings=[]`, `allowCount=0`), not on the repo gate. CI `code-quality` passing is not by itself
proof for this package. Repo gate-coverage gap, not a defect in the change — candidate for a
follow-up issue at lane close.

## 2026-08-12 — #1398 slice landed on branch; live gate red **twice**, no verdict yet

Codex thread `019ff4ff-a633-7062-ae9c-21930930b5d6` completed. Three commits, draft PR **#1536**
against `main`. Diff conforms to every locked decision — D1 (hook on worker + combined, correctly not
scheduler), D2, **D3** (`withContext(extractContext({traceparent, tracestate}), …)` — the PLAN-EVAL
F1 trap, implemented), D4 (`streams/schema.ts` untouched, 0 changes), D5 (both named tests).

**A third stale deferral pin, found by neither the plan nor PLAN-EVAL.** The plan named
`suite-registry_test.ts:204-215`; PLAN-EVAL F2 found `:209-234`; the implementer found a **third** in
`suite-runner_test.ts` still expecting two deferred skipped steps, and fixed it in the same commit —
by running the full package tests rather than only the tests it was pointed at. Each layer caught
what the one above missed. It also hit a genuine type trap: an empty
`as const satisfies readonly DeferredGate[]` infers its element as `never`, breaking fixture code
that reads `issue`/`reason`; fixed by declaring against the explicit contract without relaxing an
assertion.

### The live gate has not produced a verdict — two runs, two different pre-gate failures

| Run | Where it died | Result | Reached the restored gates? |
| --- | --- | --- | --- |
| 1 (slice) | `runtime.flow-b-fixture` — `netscript generate plugins failed: fetch failed` | `passed=33 failed=1`, exit 1 | **no** |
| 2 (orchestrator, branch updated to current `main`) | `runtime.wait.triggers-api` — timed out unhealthy after 120 s | `passed=50 failed=1`, exit 1 | **no** |

Run 2 got substantially further: the run-1 fetch failure did **not** reproduce, and fixture
generation, Aspire start, database init/migrate/generate/seed, AppHost restart, and health waits for
postgres, garnet, workers-api, **workers**, sagas-api and sagas all passed. It then timed out on
`triggers-api`.

**Neither run gives `behavior.otel.stream-consumer` or `behavior.otel.traces` a live verdict, so
#1398's acceptance criterion 3 remains unproven and the PR cannot merge.** The slice said this
plainly about run 1 and did not retry to manufacture a green; that was correct.

**What I can and cannot say about run 2.** #1398 touches workers and the CLI e2e suite definitions —
not triggers. `runtime.wait.workers` passed while `runtime.wait.triggers-api` timed out. The Aspire
AppHost log shows no triggers error, only an unrelated dev-certificate trust warning, and an issue
search found no known `triggers-api` health defect. That is **consistent with** an environmental
failure but does **not** prove one — I have not reproduced the suite on a clean `main` checkout, so I
cannot state as fact that the change is uninvolved.

**Serialisation was verified before run 2**, per the expensive-gate rule: no
`/tmp/netscript-e2e-scaffold-runtime.lease`, no competing `e2e:cli` process, zero Docker containers.
`agentic:leak-check` after run 1 reported no survivors.

### Escalating the verdict to CI rather than burning more local runs

Two local failures at two unrelated points, neither reaching the target gates. CI ran
`scaffold-runtime (aspire + docker + postgres)` **green** on PR #1528 (main + #1405) an hour earlier,
so the CI environment starts this suite cleanly. #1398 adds both OTEL gates to `RUNTIME_GATES`, so
CI's own scaffold-runtime job now exercises them — the same gate, in an environment that is currently
working.

PR #1536 flipped to ready to trigger the blocking tier, held at `status:impl-eval` (**not**
`ready-merge`) so it cannot be mistaken for merge-ready. IMPL-EVAL is still required — the D-3 owner
ruling waives evaluation only for the small deterministic class, explicitly not for this issue.

## 2026-08-12 — #1398 live gates PASS in CI, both tiers

The two gates deferred against #1398 ran **by name** and passed in CI, verified from job logs rather
than inferred from a suite-level green:

| Tier | Job | Gates observed | Summary |
| --- | --- | --- | --- |
| `scaffold-runtime (aspire + docker + postgres)` | `94062070840` | `behavior.otel.stream-consumer`, `behavior.otel.traces` | `passed=88 failed=0 skipped=0` |
| `scaffold-runtime-sqlite (aspire + sqlite + garnet)` | `94062070984` | both, same | `passed=83 failed=0 skipped=0` |

`skipped=0` matters as much as `failed=0`: a silently skipped gate is the exact false-green the
deferral list existed to prevent. Confirmed the SQLite tier really carries them —
`POSTGRES_ONLY_RUNTIME_GATES` (`capability-suites.ts:146-151`) lists only the four DB-specific gates,
so `RUNTIME_SQLITE_GATES` inherits both OTEL gates. Both tiers is stronger than the plan required.

**This retires the open question about the two red local runs.** I had recorded that the
`triggers-api` timeout was *consistent with* an environmental failure but not proven to be one, since
I had not reproduced the suite on a clean `main`. CI now runs the same suite **with this change**
through `runtime.flow-b-fixture` and past `triggers-api` to a clean finish on both tiers. That is the
missing control: the failures were local-host environmental, not caused by the change. Upgraded from
"consistent with" to "established", with the evidence named.

**#1398 acceptance criterion 3 is now live-verified** — a subscription opened before the trigger
observes the execution record within a bounded time, proven by the gate's own live SSE loop
(`consume-flow-b-stream.ts:203-230`), not by asserted timing.

**CI state:** every check green except `close-gate`, which is correctly red — DoD box 5 unticked and
#1398's acceptance boxes unmirrored. Both are now truthfully tickable and will be handled when the
merge gate is finished.

**Held, deliberately.** Per D-4 the PR stays on head `e4319c685` at `status:impl-eval`. I have made
no label change, no body edit, no OpenHands trigger, and no local evaluator launch. IMPL-EVAL will
arrive via the automatic dispatcher after #1524 lands; root re-enters the label to fire it. This
lane's remaining work is to watch that verdict, then run and record the seven-check pre-merge gate.

## 2026-08-12 — deferred findings filed as their own issues (scope-drift checkpoint)

Two findings were fenced out of this lane's PRs on purpose. Filing them rather than letting them die
in a run artifact, per the profile's rule that scope drift is an explicit checkpoint and that
findings raised inside a run get filed from inside the run:

| Issue | Title | Milestone | Origin |
| --- | --- | --- | --- |
| **#1542** | `quality:gate` roots omit published packages, so a green gate is not proof they were scanned | 0.0.7 | found **independently three times**: #1405 implementer, #1405 IMPL-EVAL (against `deno.json:156`), #1398 implementer |
| **#1543** | `plugin-workers-core` and `plugins/triggers` import `plugin-streams-core` without declaring it | 0.0.7 | #1398 research + PLAN-EVAL, recorded as plan risk R3 |

**#1542 is the more serious of the two** and is the reason the #1405 merge record says explicitly
that this package's quality verdict rests on the explicit target scan and **not** on the repo gate.
A `quality:gate` that silently skips a package leaves the framework-wave gate law unenforced while
appearing enforced — the same shape as pre-merge check 4 ("clean" meaning "nothing ran"), one level
down. Three independent sessions each hit it and each hand-compensated, which is exactly the pattern
that eventually gets forgotten once.

**#1543 is filed honestly as unverified.** Whether `deno publish` actually rejects the undeclared
import was never checked; the issue says so and makes `publish:dry-run` evidence the first
acceptance box rather than asserting a defect. Both the research pass and the PLAN-EVAL recorded it
as unverified, and it is carried forward that way rather than upgraded by repetition.

Neither issue is a 0.0.6 blocker; both are `0.0.7` with `status:triage`.

## Waiting state — #1524 has not landed

`gh pr view 1524` → `OPEN`, `mergedAt: null`. The automatic phase dispatcher is therefore not live,
root has not re-entered `status:impl-eval`, and no automatic verdict exists. The merge gate for
#1536 genuinely cannot proceed, and nothing has been done to it: head `e4319c685`,
`status:impl-eval`, no label change, no body edit, no evaluator, no OpenHands trigger.

Watcher confirmed **alive** (PID 224681) rather than assumed — a dead watcher and a quiet one look
identical, and "liveness is not progress" cuts both ways.

The merge-gate finish is staged and **dry-run against a throwaway copy of the PR body**
(`scratchpad/finish-1536.py`): it ticks the three remaining DoD boxes, replaces the now-false claims
("blocked before those gates by `runtime.flow-b-fixture` fetch failure", "Not yet live-verified") with
the CI job evidence, and rewrites the four acceptance-evidence entries to `box-index` form because
#1398's boxes wrap across lines and the mirror matches on a checkbox's first line. Every edit asserts
it matched and the script refuses to finish with an unticked DoD box or a surviving stale claim.
It is **not applied**: DoD box 6 asserts IMPL-EVAL passed, which is not true until the verdict lands.

## 2026-08-12 — #1524 landed; watching for the automatic verdict

`gh pr view 1524` → **MERGED** `7837ef470` at 2026-08-12T09:24:15Z. The automatic phase dispatcher is
live, so D-4's routing is now in force: phase evaluations go through the automatic status workflow
unless the owner documents a local route or skip.

Per D-4, **root re-enters `status:impl-eval` with the Qwen override** to fire the dispatcher — that
is root's action. This lane does not touch the label, the head, or the body, and does not launch a
local evaluator or an OpenHands comment. #1536 verified unchanged at the moment #1524 landed: head
`e4319c685`, labels `type:fix, status:impl-eval, area:plugins, area:telemetry`, 5 comments.

Now watching #1536 for the automatic verdict — a new comment carrying an `IMPL-EVAL`/`VERDICT`
marker, and any label transition — from a recorded baseline of 5 comments and the exact current
label set, so a change is detected as a change rather than inferred.

On a PASS the merge gate finishes in this order: apply the staged body transform (already dry-run
against a copy), move to `status:ready-merge` so the mirror populates #1398's four issue boxes from
the `box-index` entries, confirm `close-gate` flips green, run and record the seven-check pre-merge
gate plus `review-threads`, merge, then append the row to `cut-trace.md` captured from
`git log origin/main` **after** the merge.

On findings, none of that runs; the findings go to the slice thread for a fix cycle and the eval loop
limit of two failures applies before escalation.

## 2026-08-12 — label re-entry executed; dispatcher structurally cannot fire on this head

Executed the owner's instruction exactly: applied the one-shot `eval:model:qwen`, moved away from
`status:impl-eval`, then re-added it. Timeline confirms a clean sequence with exactly one `status:`
label at every point and **no head change**:

| UTC | Event |
| --- | --- |
| 09:39:17Z | `eval:model:qwen` labeled; `status:impl` labeled; `status:impl-eval` unlabeled (move away) |
| 09:39:25Z | `status:impl-eval` labeled; `status:impl` unlabeled (**the trigger**) |

`impl-eval:skip` is not present, so nothing suppressed the eval.

**It did not run, and it cannot run on this head.** Three workflow runs fired around the label
changes — all of them `openhands-agent.yml` ("OpenHands Agent"), all `completed/skipped`, job `agent`
skipped with zero steps. The new dispatcher, `openhands-phase-eval.yml` ("OpenHands phase
evaluation"), produced **no run on this branch at all**, while it has runs on other branches the same
morning.

Root cause, verified rather than inferred:

```
git cat-file -e e4319c685:.github/workflows/openhands-phase-eval.yml  ->  ABSENT
```

For `pull_request` events GitHub resolves workflows from the PR's merge ref, so a workflow absent
from the PR head does not exist for that PR. The branch's last sync with `main` is `e4319c685` at
**2026-08-12T08:45:46Z**; #1524 merged at **09:24:15Z** — 38 minutes later. No amount of label cycling
can trigger a workflow the PR does not contain.

`main` has since moved again: `281ab7688 fix(agentic): use chainable token for eval statuses (#1547)`,
which addresses the dispatcher's own `PAT_TOKEN` requirement — the "Require chainable trigger token"
step that hard-fails when the secret is absent. So the current head is missing both the dispatcher
and its follow-up fix.

**Not actioned unilaterally.** The only path is to sync the branch with current `main`, which
**changes the head SHA** — directly against the standing instruction to keep #1536 on its current
head — and invalidates the present green CI, forcing a full re-run including both expensive
`scaffold-runtime` tiers. That is a material, owner-visible trade, so it is being raised rather than
taken. The prior green evidence (both OTEL gates passing by name on both tiers) would need to be
re-established against the new head, which is arguably better evidence anyway since it would match
what actually merges.

## 2026-08-12 — branch synced (owner-approved head change); dispatcher fired; Qwen evaluator running

Owner selected "sync branch with main, then re-enter", accepting the head change and the full CI
re-run. Executed:

| Step | Result |
| --- | --- |
| `git merge origin/main` into the slice branch | new head **`f7d503fee`** |
| Dispatcher present in head? | `git cat-file -e HEAD:.github/workflows/openhands-phase-eval.yml` → **PRESENT** (was ABSENT at `e4319c685`) |
| #1547 token fix included? | yes — `281ab7688 fix(agentic): use chainable token for eval statuses` |
| #1398 changes survived the merge? | verified: `withContext` ×2, `setMutationHook(createStreamMutationHook())` ×2, deferral list still `= []`, `streams/schema.ts` still 0 changes, 7 non-run-artifact files unchanged in set |
| Re-entered `status:impl-eval` | move away → re-add, exactly one `status:` at each point |

**The dispatcher then fired and succeeded**: `OpenHands phase evaluation` at 09:42:56Z →
`completed/success` (the 09:42:49Z run correctly skipped — that was the move-away event). Contrast
with the previous attempt on `e4319c685`, where this workflow produced **no run at all**. That is the
control proving the diagnosis: same labels, same sequence, different head — the only variable was
whether the workflow existed in the merge ref.

**Automatic evaluator is running on the requested override:** `openrouter/qwen/qwen3.8-max`,
provider `OPENROUTER`, output `pr-comment`, run `31584188459`. No manual OpenHands dispatch was made;
the trigger was the label pair alone, per D-5.

### Watcher corrected — a counting watcher would never have fired

The dispatcher's comment carries `<!-- openhands-agent-summary -->` and
`<!-- openhands-run: {…,"conclusion":"running"} -->`, i.e. OpenHands **updates that comment in place**
rather than posting a new one on completion. The original watcher keyed on *comment count* and would
have polled to timeout while the verdict sat in an edited comment — the same silence-looks-like-
waiting failure that already bit this lane twice today (draft CI `skipping`, and the dispatcher not
existing on the old head).

That watcher was stopped and replaced with **one** watcher keyed on the run's terminal status and the
comment's `conclusion` marker. Still exactly one active watch, as instructed — corrected for how the
tool actually reports, not left running on a false assumption.

CI is also re-running against `f7d503fee`; the previously proven OTEL gate evidence must be
re-established on this head before merge, and the earlier job ids no longer describe what would land.

## 2026-08-12 — CI evidence re-established on the merging head `f7d503fee`

The pre-sync evidence was **not** carried forward. Both OTEL gates were re-read by name from the new
head's job logs:

| Tier | Job (head `f7d503fee`) | Gates observed | Summary |
| --- | --- | --- | --- |
| `scaffold-runtime (aspire + docker + postgres)` | `94073971396` | `behavior.otel.stream-consumer`, `behavior.otel.traces` | `passed=88 failed=0 skipped=0` |
| `scaffold-runtime-sqlite (aspire + sqlite + garnet)` | `94073971501` | both, same | `passed=83 failed=0 skipped=0` |

**These are different job ids** from the pre-sync run (`94062070840` / `94062070984`), which is the
concrete proof that reusing the earlier verification would have cited evidence for a head no longer
on the PR. The staged body transform now takes head SHA and both job ids as **required arguments**
and asserts that none of `94062070840`, `94062070984`, or `e4319c685` survives anywhere in the
resulting body — it fails loudly rather than silently carrying a stale citation.

Full CI on `f7d503fee`: terminal after 300 s, every check green except `close-gate` (expected — DoD
box 5 and the issue's acceptance boxes are not yet updated). `agent` ×2 and `code-quality-repo`
report `skipping`; none is in the named-gate set for this change, and `code-quality` itself passed.

The `dispatch` job also shows `pass` — that is the phase-eval dispatcher, present and running on this
head, which it was not on the previous one.

**Qwen evaluator still `in_progress`** (run `31584188459`, summary comment marker still
`"conclusion":"running"`). Nothing is applied to the PR body or labels until that verdict lands.

## 2026-08-12 — #1398 MERGED (`d7e2b67b2`) — lane complete

**IMPL-EVAL: PASS** — `OPENHANDS_VERDICT: PASS`, automatic phase dispatcher,
`openrouter/qwen/qwen3.8-max`, run `31584188459`, evaluated at head `f7d503fee` against trusted base
`281ab76887`. Triggered by the label pair alone; no manual OpenHands dispatch and no local evaluator,
per D-5.

It independently traced the join mechanism end-to-end — hook → `producer.upsert` →
`DurableStreamProducer#startPublish` → `instrumentation.startPublish` (`tracer.startSpan` on ambient
context) — which is precisely the link no unit test in this slice could settle and which would have
failed silently if wrong. Its three advisories were all pre-existing and already tracked (#1542,
#1543) or resolved by the merge sequence itself.

### Finishing the gate exposed two real problems, both caught rather than merged past

1. **A second `status:` label.** Automation applied `status:augment-review` one second after I moved
   off `status:impl-eval`, so the PR briefly carried two `status:` labels against the
   exactly-one-status rule. Removed to restore the invariant before merging.
2. **A stale close-gate result.** `gh pr checks` reported `close-gate` red, but that job ran at
   09:42:44Z — before `status:ready-merge` (10:22:50Z) and before the body update. Reading the job
   log rather than the summary showed the mirror's own notice: *"Mirror skipped because live PR
   labels do not include status:ready-merge"*. The red was genuine **against the body as it then
   was**, listing all four unticked issue boxes and all three unticked DoD boxes by line — not a
   flake to retry past. A re-run with the live labels turned it green and the mirror ticked all four
   #1398 boxes from the `box-index` entries.

**Stale evidence was actively prevented, not merely avoided.** The head changed mid-flight
(`e4319c685` → `f7d503fee`), so both OTEL gates were re-read by name from the new head's logs —
postgres `94073971396` (`passed=88 failed=0 skipped=0`), sqlite `94073971501`
(`passed=83 failed=0 skipped=0`). These job ids differ from the pre-sync pair, which is the concrete
proof the earlier citation would have described a head no longer on the PR. The body transform takes
head and job ids as required arguments and asserts no pre-sync reference survives.

**Pre-merge gate:** `slices/pre-merge-gate-1536.md`, all seven checks PASS with named sources, plus
`review-threads` → `PASS threads=0 unanswered=0`. Merged squash → `d7e2b67b2`; #1398 auto-closed
`COMPLETED`; `status:shipped` on both.

**Both owned issues are now on `main`.** #1405 → `8ff1bcb8f`; #1398 → `d7e2b67b2`.

## 2026-08-12 — reopen: all three dispatched, evaluations running on the automatic policy

| Issue | PR | Phase | Evaluation |
| --- | --- | --- | --- |
| #1457 | **#1556** | impl complete, ready | IMPL-EVAL running (run `31590876488`) |
| #1459 | **#1558** | plan committed, draft | PLAN-EVAL dispatched |
| #1548 | **#1559** | plan committed, draft | PLAN-EVAL dispatched |

All three fired through the **label-driven automatic policy** — no manual OpenHands dispatch, no
local evaluator. The PLAN-EVAL pair behaved exactly as documented: applying `openhands` alone
produced a `skipped` dispatch, and applying `status:plan-eval` completed the pair and produced
`completed/success`. Each PR carries exactly **one** agent-summary comment.

### #1457 landed and reviewed

Two commits, draft PR #1556 → ready. Diff conforms to all four locked decisions. The one worth
calling out is **D2**: `resolvedQueryNames` is snapshotted **before** the append loop, so client input
can never override a key the configured `streamPath` already set, and `append` (not `set`) preserves
repeats. Getting that direction backwards would have created a request-forgery seam and would still
have passed a naive "the query is forwarded" test.

Verified independently: `deno task --cwd packages/fresh test` → **223 passed, 0 failed**. Negative
case: reverting the forwarding → **217 passed, 6 failed**; restored, clean, 223/223. One of the six is
the **pre-existing** `#219` eis-chat test, so the existing suite now genuinely covers forwarded query
rather than only the new tests doing so.

### My error: a redundant second trigger on #1556

Flipping #1556 to ready fires the initial IMPL-EVAL by itself. I *then* also swapped
`status:impl` → `status:impl-eval`, which is the **rerun** trigger — two dispatcher runs
(`11:13:07Z` ready_for_review, `11:13:16Z` labeled), both `completed/success`.

**Observed outcome: no duplicate spend** — the PR carries exactly one agent-summary comment and one
run id (`31590876488`). But the double-trigger was avoidable and is exactly what D-5 warns against.
Not repeated for #1558/#1559, which were left as drafts so only the PLAN-EVAL pair fired.

### #1459 rescoped before dispatch, not at merge

Research found the issue is materially larger than titled: `DeferIsland.tsx` is **not registered as
an island at all**, and a second defect sets `f-client-nav` false in exactly the `partial-miss` case,
so hydration alone may still produce a document navigation. Those two are technically inseparable and
stay together.

Its acceptance also requires a regression test that builds the client bundle and drives a browser —
capability this repo **does not have** (no browser driver in test infra; no gate builds or inspects a
client bundle). Per `milestone-run.md`, an issue whose acceptance cannot all be truthfully ticked by
one PR is split **before** dispatch rather than discovered at merge (the #1024/#1061 precedent). That
criterion moved to **#1557** with a written reason; #1558's body states which criteria it proves and
which it does not.

## 2026-08-12 — #1548 MERGED (`59e435c5d`)

IMPL-EVAL **PASS**, run `31593936968` — confirmed by root as the **sole authoritative** evaluator for
head `ccfa5407`; the extra phase/generic entries were no-op/skip events and the pending run root
cancelled (`31593958280`) was skip-only with no model spend. **Exactly-once held**, and no evaluator
was retriggered from this lane. My earlier concern about two summary comments was **wrong and
self-corrected before root's confirmation**: they were two *phases* (PLAN-EVAL `31591064684`,
IMPL-EVAL `31593936968`), each of which posts its own summary.

**Evaluated head == merge head** (`ccfa5407e`), verified before merging, so the verdict describes what
landed. That check exists because #1536's head moved mid-flight earlier in this lane and its pre-sync
evidence had to be discarded.

### The final guard caught a real hazard

An intermediate reading of `gh pr checks` showed **0 failing** while
`scaffold-runtime (aspire + docker + postgres)` was still **pending**. Counting failures alone would
have cleared a merge with an expensive gate unfinished — the same family as the draft-`skipping`
trap, one step subtler. The merge waited until `pending = 0`, then all named gates read `pass`.

The `status:augment-review` label was auto-added again on the ready-merge transition, giving two
`status:` labels; removed. That is the **third** occurrence in this lane, so it is automation
behaviour rather than a one-off.

### Substance

I regressed the reader to a **computed index** — behaviourally identical, every precedence test still
green — and the shape guard fired (`36 passed, 2 failed`); restored → `38 passed, 0 failed`. That is
the silent-regression class the plan predicted, demonstrated rather than asserted.

**Still true and unfixed:** `packages/sdk/src/discovery/browser-env.ts:65` carries the same
substitutability defect. The SDK was a structural precedent only. To be filed once this shape is
proven in a real Vite build, not fixed blind.

## 2026-08-12 — #1459 dispatched (correcting a claim I made without acting)

**I announced dispatch of the #1459 implementation and did not perform it.** The lane sat at plan
head `63ae41bb4` with no Codex session and no worktree activity. That gap was caught by the watcher,
not by me. Recorded because a stated action that did not happen is worse than an omitted one — the
run record briefly claimed work that did not exist.

Dispatched properly:

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-1459`, synced to `origin/main@59e435c5d` |
| Branch head at launch | `4f93a0c2e` |
| Thread id | `019ff5e6-812b-7c03-8815-d4c93d984a1d` |
| Rollout | `/home/codex/.codex/sessions/2026/08/12/rollout-2026-08-12T14-15-52-019ff5e6-812b-7c03-8815-d4c93d984a1d.jsonl` |
| Requested / observed route | openai · gpt-5.6-sol · **high** — **verdict: matched** |
| Runtime | approval=never · sandbox=dangerFullAccess |
| Daemon | `agentic:runtime doctor` → `no_change`, components 18, before launch |

**Sol high** rather than medium: this slice spans island registration, a scaffold-template change,
and net-new client-bundle fixture infrastructure — `complex_implementation`, not a scoped fix.

A first attempt to carry the brief onto the branch failed —
`origin/chore/release-0.0.6-runtime-reopen` is not a valid ref inside the leaf worktree — and the
files were copied directly instead. Noted so the next dispatch does not repeat the assumption that a
leaf worktree tracks the control branch.

## 2026-08-12 — lock-hygiene intervention on the live #1459 slice

The watcher flagged an uncommitted `deno.lock` change in the slice worktree. Verified before acting:
**+388 / −9 lines**, adding `jsr:@deno/loader@0.4`, `jsr:@fresh/core@2`, and
**`jsr:@fresh/plugin-vite@1.1.2` pinned exact** where the scaffold's declared range is `^1.1.2`.

The approved plan authorizes no dependency or lock mutation, and AGENTS.md rule 6 puts lock files
behind explicit approval. **Steered the live thread** through `agentic:codex-resume` on the same
thread — one sender per worktree, no second send, and no orchestrator edit of a worktree a live agent
owns. The steer requires the implementer to:

1. attribute each new lock entry to a specific command or edit;
2. **revert the lock outright if incidental** (a `deno check`/`vite build`/test side effect);
3. if any part is genuinely necessary, name the dependency, the declaring file, why the fix cannot
   work without it, and account for a delta of that magnitude;
4. treat the **exact** `@fresh/plugin-vite@1.1.2` pin as a specific red flag against the repo's range
   convention;
5. **default to revert** when the audit is inconclusive.

Explicitly told not to commit the lock "to keep the tree clean", and told that "the fix needs a
dependency change" is a legitimate stop-and-report rather than a failure.

## 2026-08-12 — #1459 lock churn reverted; default-restore held

**Outcome: `deno.lock` matches HEAD.** `git diff --quiet HEAD -- deno.lock` → clean, and there is no
committed lock delta against `origin/main`. The implementer reverted the churn rather than committing
it, which is the default the steer required.

**What the churn was.** At its peak the delta was **+397 / −9**, adding broad Fresh / Vite / Babel /
Preact resolver entries plus `jsr:@fresh/plugin-vite@1.1.2` pinned **exact** against the repo's
`^1.1.2` range convention. The composition is diagnostic: Babel and Preact resolver entries are what a
**client-bundle build** pulls in transitively. That points at the B3 fixture work (`vite build`)
writing the lock as a **harness side effect**, not at any manifest dependency the fix requires —
transitive resolution, not declaration. Treating it as unauthorized incidental churn was correct.

**Standing requirement, unchanged for the rest of this slice:** `deno.lock` is restored to HEAD by
default before any commit. A lock change lands only if the leaf proves a **specific required manifest
dependency** and an **exact minimal delta** to match — a stop-and-report, not a silent inclusion.

### Work in flight looks on-plan (uncommitted, 17 modified + 4 new)

Mapping the working tree against the locked decisions:

| Path | Decision it serves |
| --- | --- |
| `packages/fresh/src/application/defer/island.ts` *(new)* | B2 — the island entry the specifier names |
| `packages/fresh/deno.json` | B2 — the sub-export, which did not exist |
| `packages/cli/src/kernel/assets/app/vite.config.ts.template` | D1 — `fresh({ islandSpecifiers: [...] })` |
| `packages/fresh/tests/fixtures/defer-island-client/` *(new)* | B3 — the fixture location, committed rather than deferred |
| `packages/fresh/tests/defer-island-client-bundle_test.ts` *(new)* | B3 — the client-bundle presence assertion |
| `DeferIsland.tsx`, `DeferPage.tsx` | D2 `f-client-nav`, D3 form moved inside the `<Partial>` |
| scaffold plumbing (`import-resolver`, `jsr-import-resolver`, `scaffold-packages`, `fresh-adapter`) | B2/B4 — specifier resolution and template wiring |

**Two generated files to interrogate at audit, not to wave through:**
`packages/cli/src/kernel/assets/embedded.generated.ts` and `agent-docs.generated.ts` are modified.
`embedded.generated.ts` embeds the app assets, so a `vite.config.ts.template` change **legitimately
requires** regenerating it — that one is expected. `agent-docs.generated.ts` is **not** obviously
implied by this slice; it must be attributed to a specific generator run or reverted, the same
standard applied to the lock. Generated-asset churn is the same incidental class, one step removed.

**Audit gate:** nothing is pushed or flipped to ready until `git status` after the Codex turn is
audited against this table, with the lock confirmed at HEAD and both `.generated.ts` files accounted
for.

## 2026-08-12 — #1459 lock churn recurred: root cause found, not just reverted

The lock reappeared modified at the audit boundary (**+385 / −9**) after having been restored. The
added specifiers name the cause unambiguously:

```
npm:vite@^7.1.4  npm:rollup@^4.55.1  npm:@babel/preset-react  npm:@prefresh/vite
npm:@types/babel__core  jsr:@fresh/plugin-vite  jsr:@fresh/core  jsr:@deno/loader
```

That is a **Vite/Rollup/Babel client-build toolchain**. The **B3 bundle fixture runs a real
`vite build`, and that build writes the root lock.**

**So a plain revert cannot hold.** It restores the file and the next test run regenerates it — which
is exactly what happened between the previous restoration and this audit. Treating the first
occurrence as a one-off edit was an incomplete diagnosis on my part; the recurrence is what exposed
the mechanism.

**This is my own brief's second-order consequence.** I mandated B3 ("build the client bundle and
assert the island is present") without considering that a real `vite build` mutates the workspace
lock. The requirement and the lock policy are in tension, and that tension is mine to resolve, not
the implementer's to absorb silently.

**Steered with three ordered resolutions, one of which is "this does not work":**

1. **Preferred — isolate the build from the root lock:** run the fixture's `vite build` with
   `--no-lock`, or give it its own lock inside
   `packages/fresh/tests/fixtures/defer-island-client/`. A test fixture's toolchain resolution has no
   business in the workspace lock.
2. **Prove a narrow required manifest delta:** declare the dependencies explicitly and show the
   **exact minimal** delta. `+385` lines of transitive resolution is explicitly rejected as "minimal".
3. **Stop and report that B3 is not viable under the lock policy** — a legitimate answer. B3 then gets
   rescoped and the client-bundle assertion joins the browser-level evidence already split to #1557.

Hard conditions: re-run `git status` and `git diff --stat HEAD -- deno.lock` **immediately before**
the commit rather than earlier (the gap between audit and commit is where this recurred); default to
reverting the whole churn if the chosen approach is not fully working at commit time; never add the
lock to a commit to make the tree look clean.

Also flagged for attribution in the same pass: `agent-docs.generated.ts` is modified and is not
obviously implied by this slice, unlike `embedded.generated.ts` which the template change legitimately
requires.

**Nothing has been committed or pushed on this branch.** The branch head remains `4f93a0c2e`
(docs-only), so no churn has landed anywhere.

## 2026-08-12 — #1459 lock corrected; root-approved one-line delta; advancing

**Corrective slice performed by the orchestrator**, not delegated. The Codex thread finished its turn
and went **idle** without acting on the corrective steer (it had already committed by the time the
steer landed). `codex-status` confirmed no live writer on the worktree before I touched it — the
delegation attempt came first precisely to avoid being a second writer, and only after the thread
released the worktree did I act directly.

**History preserved — no amend, no rebase, no force-push:**

| Commit | Purpose |
| --- | --- |
| `1a5c1d688` | the offending commit, **left in the record** |
| `0fc2c0158` | restores `deno.lock` byte-for-byte from pre-slice parent `4f93a0c2e` |
| `2d515de75` | re-adds exactly one proven line — the corrected head |

**Root's proofs, both satisfied:**

- `git diff 2d515de75 -- deno.lock` → **empty**
- total PR lock diff vs `main` → **1 insertion, 0 removals**:
  `+ "jsr:@fresh/plugin-vite@^1.1.2",` under the `packages/fresh` workspace member, nothing else

**The delta is required, and I proved it by trying to remove it.** My hypothesis was that the
fixture's fully-qualified `jsr:@fresh/plugin-vite@1.1.2` import made the `packages/fresh/deno.json`
declaration unnecessary — and that removing it would also drop the lock line and keep the published
dependency surface clean. I removed it, re-ran the client-bundle test, and it **failed**. Restored;
test passes. **The hypothesis was wrong, and testing it rather than asserting it is what settled it.**

**A finding the churn concealed:** the +384-line version is a **cold-cache first-resolution artifact**.
Warm-cache runs of both the full suite and the isolated bundle test leave the lock clean — verified
repeatedly. An earlier bisect appeared to prove "the bundle test is the writer", but 227 tests passed
in both arms, which meant the `--ignore` had not excluded anything and the clean result was cache
warmth, not exclusion. Re-tested properly rather than reporting the convenient conclusion.

**Gates:** check/lint/fmt 0 findings across 188 files; `227 passed, 0 failed`; explicit target quality
scan `ok:true, findings:[]` with its single allowance **pre-existing** at `route-support.ts:96`
(untouched by this slice); `quality:gate` WARNs only. **`deno.lock` clean after the full gate run.**
No new lint-ignore, unsafe cast, or ts-ignore anywhere in the diff.

**Generated files attributed, not waved through:** `agent-docs.generated.ts`'s entire diff is
`+ './defer/island',` — exactly the B2 sub-export — from `deno task gen:assets-barrel`.
`embedded.generated.ts` follows from the edited template.

**Review on Opus 5 · high per D-6**; the canonical `review_codex_complex` route (Fable 5 · medium) was
**not** dispatched. Flipped to ready **once**, firing the initial automatic IMPL-EVAL at head
`2d515de75`.

## 2026-08-12 — HARD POLICY: Fable prohibited for all remaining 0.0.6 work

**Owner, hardened.** Fable is fully prohibited for **all remaining 0.0.6 work** until explicitly
lifted (quota at 95% through Saturday). Do **not** launch or resume any Fable session or subagent.

Permitted for the remainder of this lane:

- **Claude · Opus 5** — orchestration and sub-agents (research, planning, slice review).
- **Codex · GPT-5.6 Sol** — implementation.
- **The automatic evaluator workflow** — label-driven only. **Never manually trigger OpenHands.**

This hardens `drift.md` **D-6** from lane-scoped to all-remaining-0.0.6, and adds the explicit
never-manually-trigger-OpenHands clause.

**Compliance to date, audited per work item rather than asserted:** zero Fable dispatches in this
lane. Research on Opus, all five slice reviews on Opus 5 · high, PLAN-EVALs on MiniMax M3, IMPL-EVALs
on DeepSeek and Qwen through the automatic dispatcher, implementation on Codex Sol. Every evaluation
this lane has run was triggered by labels; **no manual OpenHands dispatch was ever issued.**

**The one route that would have selected Fable** — `review_codex_complex` (Fable 5 · medium), the
canonical pairing for the Sol·high #1459 slice — was stopped and performed on Opus 5 · high, which is
that route's own documented fallback. Opposite-family review of Codex work is preserved.

**Forward:** #1562's plan, PLAN-EVAL, implementation, and IMPL-EVAL all run under this constraint.

## 2026-08-12 — #1459 MERGED (`5705aeb19`) — reopen scope complete

IMPL-EVAL **PASS**, run `31598821606`, `completed/success` at head `2d515de75` — **verified live
against the Actions API**, after an earlier steer reported it as already PASS while the API and the
PR comment both still read `in_progress`/`"running"`. Advancement was declined until the verdict
existed. That is the third steer this session that arrived ahead of live state, so
verify-before-acting is now the standing default rather than an exception.

**Overlap guard:** `main` had advanced **3 commits** past the merge-base; files touched by both
`main`-since-base and the PR: **none**. `MERGEABLE` / `CLEAN`.

**Exact-main validation after merge:** `packages/fresh/src/application/defer/island.ts` present on
`main`; lock delta on `main` is exactly `+ "jsr:@fresh/plugin-vite@^1.1.2",` — one line, nothing else.

**#1459 closed by hand, deliberately.** The PR carried `Refs`, not a closing keyword, so the call was
left to the orchestrator. The runtime defect is fixed and proven; the Expected section's
**navigation + exactly-one-swap** assertion needs a browser driver this repo lacks and is routed to
**#1557** under the #1090 pattern. Closed on the runtime fix with the verification depth tracked —
**not** claiming the navigation assertion exists.

`status:augment-review` was auto-added on the ready-merge transition for the **fourth** time in this
lane and removed again. Consistent automation behaviour, worth a follow-up rather than repeated manual
cleanup.

### Reopen scope complete

| Issue | PR | Merge |
| --- | --- | --- |
| #1457 | #1556 | `5db37e7bb` |
| #1548 | #1559 | `59e435c5d` |
| #1459 | #1558 | `5705aeb19` |

Filed from inside the reopen: **#1542**, **#1543**, **#1557**, **#1561**, **#1563**.

**Next and last: #1562**, now unblocked — no competing writer remains.

## 2026-08-12 — Canary.3 FAILED before mint; my lock call was wrong

`release-canary.yml` run **`31600415045`** failed at **step 6, "Cut ephemeral canary branch and tag"**:

```
error: The lockfile is out of date. Run `deno install --frozen=false` …
error: deno ci --prod failed with exit 1.
```

**Nothing was published.** Steps 7–19 skipped, including step 13 (real upload). Step 4 (JSR budget)
had already passed, so **no publish attempt was consumed**; only `v0.0.6-canary.1`/`.2` exist and no
`release/canary-*` branch remains. The canary did its job — it caught this before minting.

### The root cause is my own earlier decision, stated plainly

`packages/fresh/deno.json` declares `@fresh/plugin-vite@^1.1.2`, but `main`'s lock carries **only**
the workspace-member dependency line and **none of the resolution closure**, so the lock is
internally inconsistent and `deno ci --prod` correctly refuses it.

I measured the correct state in a disposable worktree: regenerating with the repo-pinned **Deno
2.9.5** yields **386 insertions / 9 deletions** — `jsr:@fresh/plugin-vite@^1.1.2`, `npm:@babel/core`,
`npm:@prefresh/vite`, `npm:@remix-run/node-fetch-server`, `npm:@types/babel__core`, `npm:rollup`,
`npm:vite`, plus `jsr:@fresh/core@2`, `jsr:@deno/loader@0.4`, `@std/dotenv`, `@std/fmt`,
`@std/media-types` and the derived Babel/Vite graph — and **`deno ci --prod` then passes**.

**That is the same content I rejected as "incidental harness churn" during #1459.** It was never
noise. Its composition *looks* like build-toolchain noise, and a real `vite build` did write it — but
what the build wrote was the **required closure of the newly declared dependency**. Reducing it by
hand to one line, and then adding `--no-lock` to stop the fixture regenerating it, produced an
incomplete lock that looked settled and broke the release two merges later.

**The corrected rule:** when a manifest gains a direct dependency, the lock delta is whatever Deno
deterministically produces. "Minimal" is not a target to hand-tune toward, and a lone
workspace-member line is a **symptom of an incomplete lock**, not evidence of a clean one. My
narrow-delta enforcement was right about hygiene and wrong about this case, and it cost a canary
cycle.

### Repair delegated, not absorbed

Per the process guard, I keep orchestrator/reviewer/release-owner role and **delegate the repair**.
Reproduction and measurement stayed with me; the disposable measurement worktree was **removed** so
its regenerated lock could not be mistaken for the deliverable.

- Issue **#1571** filed (`type:fix`, `area:deps`, **`priority:p0`**, milestone 0.0.6).
- Fresh worktree `/home/codex/repos/ns006-1571`, branch `fix/1571-plugin-vite-lock-closure`, cut from
  the exact blocked SHA `5705aeb19`.
- **Codex · GPT-5.6 Sol · low** dispatched with a bounded brief that states the expected delta shape
  and makes a mismatch a **stop-and-report**, requires **frozen** `deno ci --prod`, requires
  **second-run lock neutrality**, forbids hand-tuning the lock, and limits the PR to `deno.lock`.

### Scope additions queued (not started)

**#1568** (native `definePartial` generated-route binding) and **#1569** (managed-form redirects
under inherited Fresh client navigation) joined this lane. With **#1562**, three items are queued
**behind terminal-green Canary.3**. #1569 looks adjacent to #1459's `f-client-nav` work — worth
checking for overlap at triage. Fable prohibited; automatic evaluator lifecycle only.

## 2026-08-12 — #1571 second-run neutrality gap: two import forms, two lock entries

Supervision caught the leaf dirty again after its committed 386/9 closure. `HEAD..worktree` adds
**exactly one** derived entry at `deno.lock:34`:

```
"jsr:@fresh/plugin-vite@1.1.2": "1.1.2",      # exact-specifier form
"jsr:@fresh/plugin-vite@^1.1.2": "1.1.2",     # range form, already in the closure
```

**Mechanism, confirmed by inspection rather than inferred:** two import forms diverge, so the lock
legitimately needs both entries.

| Site | Form |
| --- | --- |
| `packages/fresh/deno.json:35` | `jsr:@fresh/plugin-vite@^1.1.2` — range, via the import map |
| `packages/fresh/tests/fixtures/defer-island-client/vite.config.ts:1` | `jsr:@fresh/plugin-vite@1.1.2` — **exact, fully qualified**, bypassing the map |

A gate that walks fixture sources resolves the exact specifier and writes its own entry. The
committed closure captured only the range form, so the second pass is not byte-identical. **The PR
body correctly still marks neutrality pending** — the claim was never overstated, which is the right
failure mode.

**Not flipped to ready.** Steered the existing worker (thread
`019ff621-00ba-7323-8353-a1e9c5654390`, Sol low, route matched) to: identify the generating gate **by
running them one at a time from a clean lock** rather than guessing; incorporate the entry through
the generating Deno command, never a hand-edit; commit the deterministic final closure; run the
frozen `deno ci --prod` plus `publish:readiness`/`check`/`lint` **twice** and prove an empty
`git status` and lock diff on the second pass; and **measure** the final numstat rather than
repeating my ~387/9 estimate.

**One question posed, deliberately not actioned:** the fixture's exact pin against the manifest's
range is what forces two entries for one dependency. Collapsing the fixture to the bare mapped
specifier may be the better fix — but that is a **source** change, and this is a p0 release blocker
scoped to `deno.lock`. The worker reports its opinion; I decide whether it becomes a follow-up. Not
widening a p0 to take a tidier design.

Note: the worker reverted my brief commit off the slice branch, keeping the PR `deno.lock`-only. That
is consistent with the brief's own constraint, so it stands.

## 2026-08-12 — #1572: broke a circular close-gate; scaffold rows were CANCELLED, not failures

**Two distinct CI signals, and conflating them would have caused real damage.**

- `scaffold-runtime (aspire + docker + postgres)` and `scaffold-runtime-sqlite` read
  **`CANCELLED`**, not `FAILURE` — run `31602137850` is `completed/cancelled`. Verified directly
  rather than taken on report. **No product defect, so no runtime code was touched.** Reading a
  cancelled row as a red and "repairing" runtime code would have manufactured a change nobody needed,
  on a p0 release blocker.
- `close-gate` was the genuine `FAILURE`, and it was **circular**: #1571's fifth acceptance box
  requires terminal-green `v0.0.6-canary.3`, which can only exist **after** this lock fix reaches
  `main`. Carrying `Closes #1571` made a post-merge fact a pre-merge merge condition. The gate was
  correct; the PR's framing was wrong.

### Correction applied to PR #1572

1. `Closes #1571` → **`Refs #1571`**, with the circularity stated in the body so the choice reads as
   deliberate rather than an omission.
2. **Structured closing-evidence block removed.** With no closing keyword the mirror never mutates
   #1571, so the block was inert — and its box-5 entry asserted a pending fact. The per-box evidence
   still lives in the body and the review comment; it attaches to **#1571 itself** after the re-cut.
3. **Canary re-cut moved out of the pre-merge Definition of Done** into an explicit
   *"Post-merge follow-through (not a merge condition)"* section. Encoding a post-merge action as a
   DoD item is precisely what made the gate circular. DoD now has **0** unticked boxes.

**#1571 remains OPEN with all five boxes unticked**, box 5 included. Its boxes get ticked in one
honest transaction when the release proof is attached — not incrementally against a merge that cannot
yet prove them.

### Deliberately not doing

- **No ad-hoc CI rerun.** The cancelled scaffold rows may be superseded by the lifecycle/status
  transition; normal harness event behaviour applies. A rerun happens only if a documented required
  gate is still absent after the evaluation completes.
- **No manual OpenHands trigger**, no Fable.

### Sequence from here

Automatic DeepSeek IMPL-EVAL PASS → required **non-cancelled** gates + current-main overlap guard →
merge #1572 **without closing #1571** → re-dispatch Canary.3 from the corrected `main` SHA → attach
the exact release proof to #1571 → tick box 5 and close it.
