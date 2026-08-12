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
