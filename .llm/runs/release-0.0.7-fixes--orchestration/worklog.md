# Worklog — release 0.0.7 fixes topic

| Host-clock time (UTC) | Event | Evidence |
| --- | --- | --- |
| 2026-08-13T20:18:45Z | Activated the fixes topic run and loaded all required skills plus approved coordination artifacts. | `supervisor.md`; coordinator run artifacts |
| 2026-08-13T20:18:45Z | Reconciled live repository and Wave 0 issue state. `origin/main` is unchanged; all four issues are open in `0.0.7`; no colliding branches/PRs exist. | raw Git ground-truth commands; authenticated GitHub API reads |
| 2026-08-13T20:18:45Z | Created two isolated no-upstream leaf branches/worktrees from live `origin/main`. | `leaf-registry.md`; raw Git worktree/branch checks |
| 2026-08-13T20:22:40Z | Launched both Wave 0 implementers attached through `agentic:launch-codex-slice`; requested and observed routes match, exact worktrees match, and WIP is 2 implementers / 0 evaluators. | leaf `codex-thread-ids.md`; `agentic:codex-status`; `leaf-registry.md` |
| 2026-08-13T20:22:40Z | Global expensive-gate lease remains ungranted. Both agents were explicitly barred from `scaffold.runtime`, Aspire, and Docker until coordinator confirmation. | launch briefs; Expensive-gate lease section below |
| 2026-08-13T20:26:59Z | Legacy leaf opened draft PR #1643 after a plan/bootstrap commit with a justified mechanical `PLAN-EVAL: N/A`. | PR #1643; `e49948bbf` |
| 2026-08-13T20:30:35Z | Legacy leaf stopped on significant frozen-contract drift before committing product code: current shared schema/copy compatibility requires the filed manifest fields, while the viable fail-loud CLI fix requires an undeclared test file. | PR #1643 PLAN comment; focused structured test exit 1 (10 pass, 8 fail); `69aaeba2a` |
| 2026-08-13T20:33:45Z | Topic orchestrator declined to expand the contract, preserved the exact proposed patch as evidence, restored a clean leaf worktree, and kept PR #1643 draft at `status:plan`. | `f3cf40909`; clean raw Git status; same-thread steering record |
| 2026-08-13T20:38:25Z | Scaffold leaf completed independent red-first probes. #1262 seed output lacks model-aware rows, #1263 generated runtime lacks GET/PATCH/DELETE not-found handling, and #1588 SQLite output retains other-provider parsers. The #1263 OpenAPI 404 sub-symptom is already fixed on current main and is retained as an approved regression-test fallback. | leaf `receipts/red-first.md`; leaf research/worklog |
| 2026-08-13T20:41:24Z | Scaffold leaf locked its non-mechanical plan but stopped before product edits because provider selection and model-aware seed generation require two generator surfaces omitted from the frozen contract. | draft PR #1654 RESEARCH/PLAN comments; `88b735a36` |
| 2026-08-13T20:44:08Z | Scaffold leaf committed and explicitly pushed its clean artifact-only paused state. It now requires a coordinator-amended contract followed by a separate PLAN-EVAL before the implementation thread may resume. | `42572af32`; draft PR #1654; clean raw Git status |
| 2026-08-15T00:00:00+02:00 (reset boundary) | Owner revoked the temporary Codex topic-orchestrator fallback for this lane; coordinator `codex-root-0.0.7` parked the prior Codex topic thread `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` at `TOPIC_CONTROLLER_PARKED`/idle/clean and it must never be resumed as topic controller. Native Claude Sonnet 5 low replaces it on the same preserved worktree/branch. A prior fixes-topic DeepSeek/OpenRouter IMPL-EVAL attempt for #1643 was stopped pre-verdict by the coordinator; its transport artifact was removed and the evaluator brief amended to require a fresh native Claude/Fable gate after reset. | coordinator `supervisor.md` reset-transition section; `briefs/reset-gates/dispatch.json` |
| 2026-08-15T22:22:23Z (host clock, pre-reset UTC stamp) | First-turn Claude reconciliation. Read the common reset contract and coordinator dispatch set. Verified both leaf worktrees clean and both draft PRs (#1643, #1654) open/mergeable at exactly the heads named in `dispatch.json`: legacy leaf at `e6ba15ec6414c0a42b1f9870791131162ea71c36` (dispatch order 2, fresh IMPL-EVAL, Sonnet 5 low) and scaffold leaf at `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9` (dispatch order 5, fresh PLAN-EVAL cycle 1, Sonnet 5 medium). No drift found — the topic-local coordinator-decision-required blockers recorded 2026-08-13 for both leaves were resolved upstream (contracts amended, implementation advanced past the paused heads) between this topic's last local update and the reset. `leaf-registry.md` state/base columns updated to match. No Docker containers running, no expensive-gate lease held. Per the reset contract and this session's exact brief, no leaf or evaluator is launched this turn; both remain held pending the coordinator's explicit serial dispatch grant. | `leaf-registry.md`; `gh pr view 1643/1654 --json headRefOid,state,isDraft,mergeable`; `git log`/`git status` in both leaf worktrees; `docker ps` |

| 2026-08-14T22:56:20Z (`2026-08-15T00:56:20+02:00` Europe/Zurich — past the reset boundary) | **Opus 5 / high replacement first turn — reconcile and journal only.** Read the common reset contract, the coordinator supervisor/context-pack/drift/cluster-state/leaf-plan/DAG and `briefs/reset-gates/dispatch.json` + both fixes evaluator briefs, and the complete topic-local run, then re-established live ground truth. Proved this session's identity: Claude session `c7597d28-6774-44c9-aa00-b8b40b776165`, PID `2430399`, cwd `/home/codex/repos/netscript-007-fixes` (sole Claude process at that cwd), non-empty `bridgeSessionId` `session_014pCd2QWkCscgZpVdjcUPST`, Remote Control `https://claude.ai/code/session_014pCd2QWkCscgZpVdjcUPST` attached, observed launch flags `--model claude-opus-5 --effort high --permission-mode bypassPermissions --remote-control`. Predecessor Codex thread `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` verified parked: rollout tail `task_complete` / `TOPIC_CONTROLLER_PARKED` at `2026-08-14T22:18:41Z`, not resumed. Both leaf worktrees clean at exactly the dispatch heads, both leaf Codex threads idle at `task_complete`, both draft PRs `OPEN`/`MERGEABLE`/`CLEAN` at those heads with the expected single `status:` label (#1643 `status:impl`, #1654 `status:plan-eval`). Topic branch already pushed at `0aa64fe44` = local `HEAD`; `origin/main` unchanged at `01e096049`. Zero Docker containers, no expensive-gate lease, no evaluator running, Codex daemon `0.147.0` managed with an intact control socket. **Corrected the stale local record**: this lane's replacement route and both evaluator routes were journaled as Sonnet 5, which is the owner-rejected model-floor canary — restored to Opus 5 / high (controller), Opus 5 / low (order 2 IMPL-EVAL), Opus 5 / medium (order 5 PLAN-EVAL) per `dispatch.json` and cluster state. No leaf resumed and no evaluator launched; both gates held pending the coordinator's explicit serial grant. | `~/.claude/sessions/2430399.json`; `~/.claude/jobs/c7597d28/state.json`; `~/.codex/sessions/**/rollout-*-019ffcc0-e1ae-*.jsonl` tail; `git worktree list`; `git status`/`git log` in both leaf worktrees; `git ls-remote origin`; `gh pr view 1643/1654 --json state,isDraft,mergeable,mergeStateStatus,headRefOid,labels`; `deno task agentic:codex-status --pretty`; `docker ps -a` (empty); `milestone-cluster-state.json` lane `fixes` |

| 2026-08-14T23:16:24Z | **Coordinator granted dispatch order 2; launched exactly one evaluator.** Verified coordinator head `168715e27` (`chore(harness): scope evaluator queues per topic` — evaluator serialization is per topic orchestrator: `concurrency: 4`, `perOrchestratorConcurrency: 1`; evaluator leases no longer consume `expensiveGates`). Re-verified source head `e6ba15ec6414c0a42b1f9870791131162ea71c36` three ways (local `HEAD`, `origin/fix/legacy-port-pin-sweep`, PR #1643 `headRefOid`) with a clean worktree, and confirmed no process owned the leaf worktree and no evaluator was running in this lane. Launched a fresh native Claude · Opus 5 · low Remote Control IMPL-EVAL in the exact leaf worktree with the coordinator brief passed verbatim (sha256 `3ce9dddd…b706b`, 2174 bytes). Attachment: session `8c47751a-6a30-4dab-b25c-dbafe9873455`, PID `2450732`, bridge `session_01LmSFUzxkHGuH98fiDhgHxH`, `https://claude.ai/code/session_01LmSFUzxkHGuH98fiDhgHxH`, observed `--model claude-opus-5 --effort low --remote-control`. Generator separation holds (generator is Codex thread `019ffcca-8bdc…`, idle, not resumed). No other gate or implementation turn started. | `git show 168715e27`; three-way head resolution; `~/.claude/sessions/2450732.json`; `~/.claude/jobs/8c47751a/state.json`; `sha256sum` of the brief |
| 2026-08-14T23:20:50Z | **Order 2 terminal — IMPL-EVAL `PASS`.** Verdict commit `a949a6cd1` (only `evaluate.md`, +161) at evaluated head `e6ba15ec6414c0a42b1f9870791131162ea71c36`; pushed to `origin/fix/legacy-port-pin-sweep`; one structured PR comment posted `2026-08-14T23:20:27Z`; session `state: done` at 17 753 tokens. Evaluator-executed evidence at the evaluated head: focused auth suite 11 passed / 0 failed (reproduces the receipt claim), `deno check --unstable-kv` clean, `git diff --check` empty. No `scaffold.runtime`, Aspire, Docker, or publish was run or requested; `docker ps -a` empty afterwards. Three non-blocking findings (N1 residual `--auth-url` localhost default, N2 `packages/cli` excluded from root `deno fmt` so the reformat was elective, N3 `plan.md` wording nit). **Topic Tier-A re-derived six of the verdict's checkable claims independently — all six hold** (see `supervisor.md`); N1 confirmed against source at L138. Corrected two evaluator self-reported identity fields against the durable registry (PID, bridge-id prefix). PR #1643 unchanged: `OPEN`, draft, `MERGEABLE`, single `status:impl`. Order 5 is now unblocked by serialization but **not launched** — it needs its own coordinator grant. | `git show --stat a949a6cd1`; `git rev-parse a949a6cd1^`; `git diff --name-status 01e096049..e6ba15ec6 -- . ':(exclude).llm/**'`; `git diff --name-only 6242edabc..e6ba15ec6 -- . ':(exclude).llm/**'`; `evaluate.md`; `gh pr view 1643`; `docker ps -a` |

| 2026-08-14T23:2xZ | **Post-verdict reconciliation of PR #1643.** Completed the Definition of Done: checked `Topic-orchestrator Tier-A review is complete` (Tier-A comment `5286347517` + `review-tier-a.md`) and `Separate opposite-family IMPL-EVAL passes` (`PASS` at `e6ba15ec6`, verdict commit `a949a6cd1`, `evaluate.md`, phase comment `2026-08-14T23:20:27Z`, session `8c47751a…`). Both replacements were asserted to match exactly once before applying, and the applied body was re-read: zero remaining `- [ ]` boxes. Posted one structured reconciliation comment `#issuecomment-5299139091`. **Declined the draft → ready-for-merge transition** — the coordinator conditioned it on this lane's protocol authorizing it, and the reset contract bars this lane from marking ready, relabeling, merging, publishing, and closing issues. Substantive reasons recorded: `draft → ready` would auto-dispatch a rival OpenHands IMPL-EVAL against a head that already holds a fresh native PASS (and the `impl-eval:skip` escape is itself an unauthorized relabel); the verdict head `e6ba15ec6` is one evidence-only commit behind the PR head `a949a6cd1`; and #1643 carries no closing keyword for #1243, whose disposition is the coordinator's call. PR left `OPEN`, draft, `MERGEABLE`, single `status:impl`, milestone `0.0.7`, head `a949a6cd1`. | `gh pr edit 1643 --body-file`; `gh pr view 1643 --json body,state,isDraft,labels,headRefOid`; `gh pr comment`; assert-on-miss replacement script |

| 2026-08-14T23:26:21Z | **Coordinator granted dispatch order 5; launched exactly one evaluator.** First retired the terminal order-2 session (`claude stop 8c47751a`; PID `2450732` gone, registry entry removed) so the lane holds exactly one evaluator under `perOrchestratorConcurrency: 1`, and re-confirmed the order-2 verdict commit `a949a6cd1` and clean leaf tree survived the stop. Re-verified #1654's immutable source head `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9` four ways (local `HEAD`, `FETCH_HEAD` after an explicit fetch, `git ls-remote origin`, PR `headRefOid`) with a clean worktree and no process owning the leaf. Launched a fresh native Claude · Opus 5 · medium Remote Control PLAN-EVAL cycle 1 with the binding brief passed verbatim (sha256 `d726741d…13a13d1`, 1942 bytes). Background id `bd703a7d`, session `bd703a7d-4757-4689-a603-5ca98f7d7323`, PID `2470890`, registry bridge `session_015wwEYoUsxCwzT3PQeSqi2A`, `https://claude.ai/code/session_015wwEYoUsxCwzT3PQeSqi2A`, observed `--model claude-opus-5 --effort medium --remote-control`. Generator separation holds (generator is Codex thread `019ffcca-8be0…`, idle, not resumed). No other lane touched, no merge, no publish, no global expensive-gate mutex acquired (`docker ps -a` empty), implementation not resumed. | `claude stop`; four-way head resolution; `~/.claude/sessions/2470890.json`; `~/.claude/jobs/bd703a7d/state.json`; `sha256sum` of the brief; `docker ps -a` |

| 2026-08-14T23:32:53Z | **Order 5 terminal — PLAN-EVAL cycle 1 `FAIL_PLAN`.** Verdict commit `13008abf8` (only `plan-eval.md`, +188) at evaluated head `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9` = the commit's parent; pushed. Three required fixes: (1) resolve OD-1 (generated memory router has no error map, so `notFound` cannot yield a defined 404) and add an explicit open-decision sweep also covering OD-2; (2) restate every slice as `proves → gate → files` and add `generate-engine-mod.ts` to the plan's surface list; (3) account for #1262 acceptance item 3 and correct the stale worklog status. **Topic Tier-A re-derived all three independently — all three genuine**: `contract.memory.ts.template` has 0 `errors` occurrences with routes from bare `oc.route` (L76/L81/L85) and `notFound` calls `constructors.NOT_FOUND` so an absent map throws; `grep -c generate-engine-mod plan.md` = 0 while the central `leaf-contracts.json` carries it; and `docs/site/data-persistence/database.md` documents `netscript db seed` as populating "baseline rows". Non-blocking note confirmed at `worklog.md:45`. Retired the evaluator session (`claude stop bd703a7d`, PID `2470890` gone) — it had settled in job state `blocked` with its process alive, and must not repair the plan it judged; verdict and clean tree re-confirmed after the stop. | `git show --stat 13008abf8`; `git rev-parse 13008abf8^`; `plan-eval.md`; `grep`/`sed` checks named above; `claude stop` |
| 2026-08-14T23:3xZ | **Plan repair dispatched to the existing Codex plan-author thread `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85`** via `agentic:codex-resume` — same thread, never a replacement, never a second `send-message-v2` at that worktree. Repair bound to exactly the three `plan-eval.md` fixes; plan-text only, no implementation, no product source, no gate run, no lease. Required outputs: a clean pushed plan-only head, one structured plan-update PR comment, and a stop at the PLAN-EVAL cycle-2 handoff. Cycle 2 is **not** launched — it requires an updated immutable source brief plus an explicit coordinator grant. | `leaf-registry.md` steering command; `agentic:codex-resume` invocation record |

| 2026-08-14T23:45:50Z | **Plan repair returned; verified independently.** Same-thread Codex `019ffcca-8be0…` produced head `5b3c6fcf21b0b4947a770d8e67ea5cc8082724d5` (one commit `5b3c6fcf2 chore(harness): repair scaffold plan-eval findings`), clean tree, pushed by explicit refspec, plus a structured plan-update PR comment. Boundary re-derived by this lane rather than accepted: `git diff --name-only 01e096049..HEAD -- . ':(exclude).llm/**'` empty (plan-only), `deno.lock` untouched, `docker ps -a` empty, no Claude session in any leaf, PR #1654 unchanged as draft with exactly one `status:plan-eval`. Each fix verified in source: `plan.md` gained an `## Open decisions` table with **OD-1 resolved as option (b) out of scope** (memory router excluded, recorded under Deferred scope with its reason), OD-2 resolved as a generator-level direct-call contract, OD-3 marked safe to defer, and locked design §2 now reads "persistent router **only**" with every surviving `P2025` prescription scoped to the Prisma path; `grep -c generate-engine-mod plan.md` now **2** with slices 2–6 restated as **Proves → Decisive gate → Files**; and #1262 acceptance item 3 recorded verified-by-inspection with the worklog's live phase wording corrected to `status:plan-eval`. Noted that `worklog.md:29` still contains `status:plan` and is **correct history**, not stale text. | `git log/status/diff` in the leaf; `plan.md` sections; PR #1654 comment `2026-08-14T23:45:50Z` |
| 2026-08-14T23:48:26Z | **Coordinator granted cycle 2; launched exactly one evaluator.** Verified control head `5769171cef9a3c06dc8cfa9c71d75a22c7716a5a` and — before launching — that both preconditions this lane had required were actually met: the binding brief really was updated (sha256 `d726741d…` → `7e95fd94…199f5132`, mtime `2026-08-14T23:46:33Z`, pins source head `5b3c6fcf2`, marks cycle 2 the final plan cycle, orders re-testing the three findings rather than trusting the repair summary, and preserves cycle 1 as `plan-eval-cycle-1.md`), and `dispatch.json` order 5 was re-pinned to `cycle: 2` with the new `sourceHead`. Re-verified head equality four ways (local `HEAD` = `FETCH_HEAD` = `ls-remote` = PR `headRefOid` = `5b3c6fcf2`), clean tree, and still plan-only. A process `2544277` momentarily appeared to own the leaf worktree; traced to this lane's own transient verification subprocess, already exited. Launched fresh native Claude · Opus 5 · medium Remote Control PLAN-EVAL cycle 2 with the brief verbatim: bg `06451c1e`, session `06451c1e-a9b8-47d2-8934-be2247ef5347`, PID `2487919`, registry bridge `session_01AFoKjRXMVCaXUzJ9HqDvGt`, `https://claude.ai/code/session_01AFoKjRXMVCaXUzJ9HqDvGt`. Plan author confirmed idle at `task_complete` and not resumed; no replacement author, no other lane, no merge, no publish, no lease. | `git show 5769171ce`; `sha256sum` brief; `dispatch.json` order 5; four-way head resolution; `~/.claude/sessions/2487919.json`; `~/.claude/jobs/06451c1e/state.json`; Codex rollout tail |

| 2026-08-14T23:54:02Z | **PLAN-EVAL cycle 2 terminal — `PASS`.** Verdict commit `b8fc5eb53a530d337602f7dc377239651a57d428` at evaluated head `5b3c6fcf21b0b4947a770d8e67ea5cc8082724d5` = the commit's parent; pushed; structured PR comment posted. Cycle 2 of the permitted 2, closed with `PASS`. Topic Tier-A verification: **the cycle-1 `FAIL_PLAN` was preserved byte-identical** as `plan-eval-cycle-1.md` (`sha256 9f3b3c8e…875c387` on both it and `git show 13008abf8:…/plan-eval.md`) — the superseded verdict was not silently rewritten; the commit carries only the two evaluator artifacts and no plan or product text; the head is still plan-only with `deno.lock` untouched; PR #1654 unchanged as `OPEN`/draft/`MERGEABLE` with exactly one `status:plan-eval`; `docker ps -a` empty. Evaluator session retired (`claude stop 06451c1e`, PID `2487919` gone); no Claude session remains in any leaf. **The `PASS` closes the plan gate only — this lane did not resume implementation**, which needs its own coordinator grant; the `scaffold.runtime`/Aspire/Docker singleton lease remains ungranted (slice 6 depends on it); and Tier-A slice review plus a fresh opposite-family IMPL-EVAL remain mandatory with no lane self-certifying. Carried the evaluator's non-blocking note: the leaf-local `plan.md` §Status, `supervisor.md`, and `context-pack.md` still read as "cycle 2 pending" and should be refreshed by the plan author or the leaf will be misread as blocked. | `git show --stat b8fc5eb53`; `git rev-parse b8fc5eb53^`; `diff`/`sha256sum` cycle-1 preservation check; `git diff --name-only` boundary checks; `gh pr view 1654`; `docker ps -a`; `claude stop` |

| 2026-08-14T23:5xZ | **Reconciled cycle-2 `PASS`, advanced #1654 to `status:impl`, and resumed the original implementation thread.** Verified the coordinator's stated facts first: PR comment `5299298009` exists as the cycle-2 `PASS` comment, and PR head `b8fc5eb53a530d337602f7dc377239651a57d428` equals the evaluator commit. Confirmed queue serialization is per-fixes-orchestrator only, matching `dispatch.json`. Applied `status:plan-eval` → `status:impl` with draft preserved; verified after as `draft=true`, `OPEN`, head unchanged, **exactly one** `status:` label. Confirmed safe to execute because #1654 carries no `openhands`/`eval:model:*`/`impl-eval:skip` label, so no phase automation dispatches, and staying draft fires no IMPL-EVAL — the opposite of the #1643 ready-transition, which would have dispatched a rival evaluator and was therefore declined. Resumed **the original** Codex thread `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85` via `agentic:codex-resume` (dry-run verified); pre-flight showed it idle at `task_complete`, no owner of the leaf worktree, head `b8fc5eb53` clean; post-launch `codex-status` shows exactly one agent at that worktree — no rival, no replacement, no second `send-message-v2`. Brief authorizes **slices 2→5 only and stops before slice 6** (its `e2e:cli run scaffold.runtime` needs the ungranted singleton lease), binds each slice to the plan's `Proves → Decisive gate → Files`, mandates structured wrappers as the sole verdict source plus `quality:scan` + `arch:check` for these `packages/**` slices, names a new `deno-lint-ignore`/`as unknown as` used to green a wrapper as review-blocking, and forbids Aspire/Docker/publish, lock churn, merge/ready/relabel/close, and self-certification. Leaf-local stale "cycle 2 pending" wording delegated to that thread rather than edited here, since leaf plan text is leaf-owned. | `gh api` comment `5299298009`; `gh pr edit`/`view 1654`; Codex rollout tail; `agentic:codex-resume --dry-run` then send; `agentic:codex-status --pretty` |

| 2026-08-15T00:2xZ | **Slices 2–5 landed; topic Tier-A review performed; sign-off HELD on finding T-1.** Thread `019ffcca-8be0…` returned four slice commits (`32cd429c0` #1588, `275ae091c` #1262, `589a01a55` #1263, `cab6d1feb` grouped acceptance prep) at head `cab6d1feb813a88afde7403ee21de44503503fa0`, clean and pushed, stopping before slice 6 as instructed. Re-executed independently rather than reading the report: slice-2 decisive gate reproduces `exitCode 0, passed 9/failed 0`; `quality:scan` is `"ok":true` with `findings: []` and all 7 allowances pre-existing and **none in a file this leaf touched** — so no new suppression was added to green a wrapper; `arch:check` warnings only, no FAIL rows; `deno.lock` unchanged; `docker ps -a` empty; PR still draft at one `status:impl` with no closing keyword. **Finding T-1:** `generators_test.ts` went 11 → 8 `it()` cases; the replacement four-engine required/forbidden matrix is stronger for #1588, but the deleted `it('normalizes mssql Aspire loopback endpoints to hostname URLs')` was the only pin on `normalizeSqlServerHost`, which is still live generated code (`connection-helpers.ts.template:145,148`, mirrored in `embedded.generated.ts`) and now has 3 source hits and **0** test hits. The slice-2 comment records what was added but not that five cases were removed or why, which `netscript-harness` requires. Sign-off withheld and IMPL-EVAL not requested until T-1 is resolved by a bounded fix-up on the same thread. | independent `run-deno-test.ts` rerun; `deno task quality:scan`; `deno task arch:check`; `git diff --stat/--name-only`; `grep -rn normalizeSqlServerHost`; `gh pr view 1654` |

| 2026-08-15T04:0xZ | **T-1 resolved; Tier-A PASS at `ebad68c80bc9079ba835901eb2245a1a31ab7b62`.** Bounded fix-up on the same thread `019ffcca-8be0…` from base `cab6d1feb` returned one commit `ebad68c80 test(cli): restore mssql loopback regression`, clean and pushed: +55 lines across `generators_test.ts` (+21) and two leaf run artifacts, with **no product source change** (`git diff --name-only cab6d1feb..HEAD -- . ':(exclude).llm/**' ':(exclude)*_test.ts'` empty), `deno.lock` unchanged, `docker ps -a` empty. Gates re-executed independently: slice-2 decisive gate `exitCode 0` **10 passed/0 failed**; `quality:scan` `ok:true`, 0 findings, 7 allowances all pre-existing and none in a touched file; `arch:check` raw exit 0, no FAIL rows; `git diff --check` clean; `check:assets-barrel` raw exit 0. The restored case is a **superset** of the deleted one (adds `::1`, `[::1]`, `tcp:` strip, port default, empty-host fallback), the four-engine forbidden matrix is intact, and anchored `it()` goes base 11 → slice-2 8 → **9** now, with each of the five removals dispositioned against a named covering assertion. RED-first was genuine and honestly reported: the first probe returned a **false green** (raw exit 0) because these tests consume `embedded.generated.ts` rather than the `.template` files; the thread recorded that as a discovery, regenerated, obtained the expected **RED raw exit 1**, restored source verbatim to sha256 `2f82179c…47e3d7`, and got **GREEN raw exit 0**. That seam is covered by the dedicated `check:assets-barrel` gate, not by unit tests. Scoped lint/fmt wrappers **failed closed** (raw exit 2 ×3) because `deno.json` excludes `packages/cli/`; re-run under a temporary no-exclude config preserving repo rules gave 0 findings and the config was removed — consistent with the independently-known N2 fact from #1643. **Leaf-level sign-off deliberately not committed**: the final implementation head does not exist until slice 6, which needs the ungranted singleton lease. IMPL-EVAL not launched. | independent `run-deno-test.ts`, `quality:scan`, `arch:check`, `check:assets-barrel`, `git diff --check`; anchored `it()` counts across `5b3c6fcf2`/`cab6d1feb`/`HEAD`; leaf `worklog.md` accounting table |

| 2026-08-15T05:0xZ | **Slice 6 leased gate PASSED on attempt 2; Tier-A `PASS_TO_IMPL_EVAL` signed off.** Attempt 1 was classified an infrastructure/transport interruption — independently confirmed at 37 `gate-end` / **zero `suite-end`**, ending mid-`database.generate`; its partial passes are not reused as acceptance and its log is preserved. My first retry brief wrongly required `run-gate.ts`; the thread correctly refused to edit `catalog.ts`, alter the fixed command, or fabricate a receipt, and stopped without consuming the lease. I verified all three blockers (no `scaffold.runtime` catalog entry, no `--report` flag on `e2e:cli`), **withdrew my own over-specification**, and re-dispatched with the approved plan's own contract (preserve the suite's JSON/domain report). Attempt 2 reached a terminal `suite-end`: `report.ok:true`, **88 `gate-end`, 0 failed verdicts**, 602 896 ms; receipt records `outcome: PASS`, `rawExitCode: 0`, `gitHead: ebad68c80…`, lease id, `attempt: 2`. Slice 6 committed evidence-only at `0b2cf5e7c` (no product delta, `deno.lock` unchanged). Grouped acceptance verified **in the artifact**: `.liveDbReceipt.value.crud` = `representativeId 1`, `missingId 2147483647`, `projected404Methods ['get','patch','delete']`, and the gate fails unless a row named `Seed User` is in the list response plus `assertCrud404Projection` on the OpenAPI. Host hygiene proven after the turn: `aspire ps` empty, `docker ps -a` empty **including stopped**, only default networks, no volumes, leak-check `PASS` with `survivors: []` and `foreignOrUnknownTouched: []`. Signed off at `f178ac663` with PR comment `#issuecomment-5300647925`. **T-2 non-blocking:** the runtime verdict is postgres-only (zero sqlite steps) — composition evidence, not runtime SQLite coverage; #1588's generator-output property is proven by the slice-2 forbidden-symbol matrix, and the `scaffold-runtime-sqlite` CI job is currently skipping on the draft, so the coordinator should choose deliberately before merge. IMPL-EVAL not launched. | slice-6 log `plugin-smoke-20260815-064348.log`; `receipts/scaffold-runtime.json`, `receipts/leak-check.json`; independent `quality:scan`/`arch:check`/`check:assets-barrel`/slice-2 gate reruns; `aspire ps`, `docker ps -a`, `docker network/volume ls`; `review-tier-a.md` |

| 2026-08-15T05:21:53Z | **IMPL-EVAL cycle 1 `PASS` for #1654.** Fresh native Claude **Fable 5 · medium** session `19f1be7b-db7d-47c0-b0f1-7cfca302d44a`, PID `105686`, bridge `session_01Qs22iAtnVYh2fLb26ABvja`, observed `--model claude-fable-5 --effort medium --remote-control`; separate from both the Codex implementer and this orchestrator. Evaluated head `f178ac663597a7b9cfd2e6a528026426d39d1173` = verdict commit's parent (the current PR head incl. Tier-A sign-off, not the older `0b2cf5e7c`); verdict commit `70843d169` touched `evaluate.md` + bookkeeping only. Route is the canonical `formal_impl_evaluation` lane for Codex-authored work, not a Fable escalation. Its audit went beyond the summaries: it sha256-matched **both** cli-e2e logs against the receipt's recorded hashes, independently rendered `generateEngineMod`/`generatePrismaConfig` for sqlite and postgres to confirm provider isolation, verified `assertDefinedNotFound` requires HTTP 404 **and** wire `code === 'NOT_FOUND'`, grepped to confirm attempt-1 is referenced only in non-reuse context, and mapped every live issue acceptance item. Also ran doc-lint and publish dry-run (both PASS). **It caught a real error in my Tier-A review**: I claimed `e2e:cli` exposes no `--report` flag; it does, at `run-command.ts:30` at the immutable base, and CI uses it — I had grepped the thin `cli.ts` entry and concluded from absence. Corrected on the leaf at `7cfaf70cc`; the genuine gap is only the missing `scaffold.runtime` entry in `run-gate` `catalog.ts`, and the implementer's refusal remains correct on its own terms. Verdict unaffected. Evaluator retired (`claude stop 19f1be7b`); no leaf session remains; `aspire ps` empty, `docker ps -a` empty. **Residual returned to the coordinator, not taken:** T-2 — accept generator-output proof for #1588, or apply `e2e-cli-gate`/`ci:full` at ready so `scaffold-runtime-sqlite` executes; the evaluator recommends the latter as a zero-cost hedge but does not require it for `PASS`. | `evaluate.md`; PR comment `2026-08-15T05:21:53Z`; `~/.claude/sessions/105686.json`; `~/.claude/jobs/19f1be7b/state.json`; `git show 01e0960:packages/cli/e2e/src/presentation/cli/commands/run-command.ts` |

| 2026-08-15T05:36:48Z | **Wave 0 terminal — both fixes leaves merged and closed.** #1654 merged from exact head `7cfaf70cc5a42e74af4ae8b7be76d5a5cbf4fcc5` as squash `da574111af05a5cded74250128b196fcab870274` after structured pr-checks PASS with zero current failures; #1262/#1263/#1588 all `CLOSED`/`COMPLETED` carrying exactly one `status:shipped`. Independently verified: PR state `MERGED`, merge commit present on `origin/main` (`da574111a fix(cli): correct generated scaffold output (#1654)`), and `origin/main` advanced `01e096049` → `da574111a`. Also reconciled #1643, which merged earlier at `0b3ed5d5a` (2026-08-14T23:39:37Z) with #1243 `CLOSED`/`COMPLETED`. **All evaluator, runtime and cleanup receipts are preserved** — `plan-eval-cycle-1.md`, `plan-eval.md`, `evaluate.md`, `review-tier-a.md`, `receipts/scaffold-runtime.json`, `receipts/leak-check.json` all landed on `main` via the squash. Post-merge host state re-checked by this lane: `aspire ps` reports no running AppHost and `docker ps -a` is empty — Aspire and Docker remained empty throughout and after. No lease is held; the consumed slice-6 lease is not reusable. | `gh pr view 1654/1643`; `gh issue view 1262/1263/1588/1243`; `git ls-remote origin main`; `git log da574111a`; `aspire ps`; `docker ps -a` |
| 2026-08-15T05:4xZ | **Lifecycle-label gap reported, not fixed (coordinator-only).** Merged PR #1643 still carries `status:ready-merge` and closed issue #1243 still carries `status:triage`; `netscript-pr` requires the phase label to be atomically replaced by terminal `status:shipped` on a completed close. #1654 and its three issues are correct at `status:shipped`. This lane does not relabel. | `gh pr view 1643 --json labels`; `gh issue view 1243 --json labels` |

| 2026-08-15T07:41:26Z | **Wave 1 dispatched — next eligible fixes leaf advanced.** Read the binding DAG and leaf plan: the fixes lane has 17 leaves; Wave 0 (#1243, and #1262/#1263/#1588) is now terminal. Wave 1 holds exactly two fixes leaves. **`sdk-typed-error-channel` (#1350) is BLOCKED** — `milestone-dependency-dag.json` carries edge `issue:1348 → issue:1350`, kind `rfc-prerequisite` ("RFC 0001 Stage 0 (#1348) must accept the RFC and align #1349-#1353 bodies before Stage 1a implementation"), and #1348 is **OPEN** (`type:umbrella`, `epic:sdk-client-contrib`, `status:plan`). **`design-registry-catalog-drift-gate` (#1358) has zero DAG edges and is eligible**, so it is the one leaf advanced. Created `fix/design-registry-catalog-drift-gate` + worktree `/home/codex/repos/netscript-007-leaf-design-registry-drift` from current `origin/main` `da574111a`, no upstream, clean, no branch/worktree/PR collision. Launched one attached Codex slice through `agentic:launch-codex-slice` (dry-run validated first): thread `01a003f0-7821-7a10-a555-e619a9280479`, requested **and observed** `openai` · `gpt-5.6-sol` · **medium** — route verdict `matched`; `--expect-base da574111a` enforced; exactly one sender at that worktree. Effort is medium rather than low because establishing why 16 of 66 registry items are invisible requires real mid-slice investigation. The brief freezes the 4-file contract surface, mandates red-first reproduction, requires the drift **gate** and not just a count fix, forbids self-certification, and **explicitly stops before the contract's `fresh-browser` gate** because no expensive-gate lease is held. WIP is 1 implementation leaf / 0 evaluators, inside the 2/1 bound. | `milestone-leaf-plan.json`; `milestone-dependency-dag.json` edges; `gh issue view 1348/1358`; `git worktree add`; `codex-thread-ids.md`; `agentic:codex-status` |

| 2026-08-15T06:0xZ | **#1657 reconciled at terminal implementation head `4a3c40321ac1e58aa337e02afeaa95fbc553ce7f`; nothing launched.** Head equal four ways (local, `FETCH_HEAD`, `ls-remote`, PR `headRefOid`), tree clean, `deno.lock` untouched. Three commits: `c3f978f5a` bootstrap, `1308c0b39` catalog completeness fix, `4a3c40321` drift gate. **Product delta is 2 of the 4 authorized surfaces** — `registry.ts.template` and `registry-doc-drift.test.ts` — narrower than the contract, never wider. PR draft, `status:impl`, `MERGEABLE`/`CLEAN`, milestone `0.0.7`. Author's non-browser gate set verified present and green: CLI + Fresh-UI structured check, focused test (5/0) and Fresh-UI package tests (172/0), focused lint and fmt, **`quality:scan` raw exit 0 no findings**, **`arch:check` raw exit 0 no failures**, CLI JSR audit, CLI and Fresh-UI publish dry-run. The report also transparently records its own failed command-selection iterations rather than hiding them, and states `fresh-browser` NOT RUN. Host hygiene re-verified by this lane: `aspire ps` no AppHost, `docker ps -a` empty, only default networks, no volumes. Central state shows **no active expensive lease** — the single `expensiveGates` entry (`scaffold-generated-output-correctness-runtime`) is `state: complete`, so the `globalExpensiveGates: 1` slot is free. `review-threads` gate **PASS**, threads=0 unanswered=0. All draft CI jobs are `skipping` per documented draft policy, so CI will not supply `fresh-browser` before the ready flip. Per the grant: no evaluator, no Tier-A, no readiness, no next leaf; same leaf and thread preserved. | four-way head resolution; `gh pr view/checks 1657`; `agentic:review-threads` exit 0; `milestone-cluster-state.json` `expensiveGates`; `aspire ps`; `docker ps -a`; `docker network/volume ls` |
| 2026-08-15T06:0xZ | **`fresh-browser` gate resolved for the lease request.** `.llm/tools/gates/catalog.ts:55` defines `'fresh-browser': ['deno','task','test:browser']`; `packages/fresh/deno.json` resolves `test:browser` to `deno test --allow-all ./tests/form-navigation_browser.ts`. CI runs it as `run-gate.ts --gate fresh-browser --id check-test-fresh-browser --cwd packages/fresh --output .llm/tmp/gate-receipts/check-test/fresh-browser.json`, after installing `@playwright/cli@0.1.17` and `playwright install --with-deps chromium`. **Unlike `scaffold.runtime`, this gate IS catalogued, so it has a durable `run-gate.ts` receipt route** — the exact gap that stalled the previous leased gate does not apply here. Its footprint is a headless chromium plus the Playwright runtime: **no Aspire AppHost, no Docker container, no Postgres**. (CI's adjacent Redis stop step belongs to the broader `check-test` job, not to this gate.) | `catalog.ts:55`; `packages/fresh/deno.json`; `.github/workflows/ci.yml:255-266` |

| 2026-08-15T06:11:17Z | **Leased `fresh-browser` gate PASSED on the first attempt — lease consumed.** Coordinator grant recorded `2026-08-15T06:07:21Z`. Dispatched the exact approved command verbatim on the preserved thread `01a003f0-7821-7a10-a555-e619a9280479` (one sender at the worktree, detached so a session event cannot orphan it). Receipt `receipts/fresh-browser.json`: `outcome PASS`, `exitCode 0`, `argv ['deno','task','test:browser']`, `cwd .../packages/fresh`, `attempt 1`, `durationMs 33292`, child verdict **2 passed / 0 failed**. **Receipt head integrity verified by this lane: `gitHead` == `actualGitHead` == `4a3c40321ac1e58aa337e02afeaa95fbc553ce7f`**, the exact leased head — `run-gate.ts` resolves HEAD itself and fails a mismatch, so this is a real binding, not a self-declared field. Playwright install was **not needed**; the cached `~/.cache/ms-playwright/chromium-*` runtime was used, so nothing new was installed. Evidence commit `c792327c9` is evidence-only — no product source, and `deno.lock`, CLI lock and Fresh-UI lock all unchanged — pushed by explicit refspec; one structured PR comment posted. | receipt fields; `git show --stat c792327c9`; `git diff --name-only` boundary and lock checks; PR comment `2026-08-15T06:13:10Z` |
| 2026-08-15T06:1xZ | **Exact cleanup proof, independently re-measured.** Pre-dispatch baseline was **0** chromium/playwright processes, deliberately captured so any survivor would be provably attributable to this gate rather than argued from another lane's command strings. Post-gate re-measurement by this lane: **0** — no stray chromium, playwright, crashpad, or headless-shell process survives. `aspire ps` → no running AppHost. `docker ps -a` → empty; networks only `bridge`/`host`/`none`; **no volumes**. Nothing was killed and no foreign process or MCP server was touched. The gate needed no Aspire, Docker, or Postgres at any point, matching the footprint resolved before the lease request. PR #1657 remains `OPEN`, draft, `MERGEABLE`, exactly one `status:impl`. **Per the grant, Tier-A, evaluator, readiness, and the next leaf are all held pending a further coordinator grant** — none started. | `ps` actual-process match pre/post; `aspire ps`; `docker ps -a`; `docker network ls`; `docker volume ls`; `gh pr view 1657` |

| 2026-08-15T06:2xZ | **Hardened Tier-A for #1657 → `CHANGES_REQUESTED`** at head `c792327c99a54eb64f236d1676ee3a7c1d76efc2`; artifact `review-tier-a.md`, review commit `5fe600235` pushed, PR comment `#issuecomment-5300918179`. **Recomputed the catalog semantics independently** rather than trusting the leaf's own test: manifest 66 items, template catalog 66, `registryMeta.total` 66 — all three agree; zero missing, zero extra, zero duplicates; **ordered** name equality across all 66; zero `kind`/`layer`/`description` mismatches; all 8 collections ordered-equal by name and membership (46/15/10/5/8/1/13/7). The drift gate is genuine — symmetric manifest-only and catalog-only fixtures plus a field/metadata fixture, each `assertThrows` on the **named** offender and on `changed collections` / `changed registryMeta fields`. Re-executed: drift test 5/0, `quality:scan` `ok:true` 0 findings, `arch:check` exit 0. Browser receipt `gitHead == actualGitHead == 4a3c40321`, and `merge-base --is-ancestor 4a3c40321 c792327c9` true. Scope narrower than contract; `deno.lock` + CLI + Fresh-UI locks unchanged; 0 browser survivors vs 0 baseline; Aspire/Docker empty; review-threads PASS 0/0. **Blocking T-3:** `registry-doc-drift.test.ts` runs only via `fresh-ui-quality.yml`, whose `paths:` cover `packages/fresh-ui/**` but not the CLI design assets; `ci.yml` never references `fresh-ui`; the classifier sets `freshUi` only for `packages/fresh-ui/` paths; and `packages/fresh-ui` is not in the root workspace, so the root test task cannot cover it. A future CLI-template-only edit re-introduces the 50-of-66 drift with no CI signal — on the exact surface that drifted. #1358 carries that as a **close-gated** `gate:` box and the PR body carries `Closes #1358`, so CI close-gate would also fail it at ready flip. The remedy touches `fresh-ui-quality.yml` and `ci-classify-changes.ts`(+test), all **outside the frozen 4-file contract**, so it requires a coordinator amendment rather than unilateral implementer action. Non-blocking: N1 `registryMeta` total/version are enforced by the gate rather than computed; N2 the PR DoD still shows `fresh-browser` unchecked despite the PASS receipt. IMPL-EVAL not launched; no ready/merge/issue mutation; next leaf not begun. | independent manifest-vs-template recomputation; fixture bodies; `run-deno-test.ts`; `quality:scan`; `arch:check`; receipt fields; `merge-base`; `fresh-ui-quality.yml` paths; `ci-classify-changes.ts`; root `deno.json` workspace; `agentic:review-threads` |

| 2026-08-15T06:4xZ | **T-3 repair landed and fresh Tier-A re-review → `PASS_TO_IMPL_EVAL`** on head `a093314973b2039183ee408ef7501cd9e08ea0aa`; sign-off artifact appended to `review-tier-a.md`, commit `939e73113` pushed, PR comment `#issuecomment-5300965060`. Repair touched exactly the three amended contract files plus two run artifacts. **T-3 re-derived by execution, not by reading the new tests:** imported `classifyPath` and ran it — both `(design)` asset paths → `freshUi=true`, manifest → `true` (regression unbroken), and four unrelated paths → `false`, including `packages/cli/src/kernel/assets/database/seed.ts.template`, another `assets/` path outside `(design)`, which is the case proving unrelated CLI diffs were **not** broadened. Workflow carries the design path in **both** `pull_request` and `push` filters (count 2; YAML parses, 11 paths each). Re-executed: classifier tests **62/0**, drift test **5/0**, `quality:scan` `ok:true` 0 findings, `arch:check` exit 0. **Preservation verified:** `git diff --stat 4a3c40321..HEAD -- packages/` **empty** — the four product files are byte-identical to the gated head, so the consumed `fresh-browser` `PASS` receipt remains valid and no expensive gate was or needed to be rerun; all three locks unchanged; prior review section, receipt and `drift.md` untouched; `Closes #1358` intact; PR draft at one `status:impl`; `docker ps -a` empty with no chromium survivors. **N1 resolved** (worklog now states `registryMeta` total/version are static literals enforced by the gate rather than computed) — note my first grep for this missed it and I confirmed presence before asserting absence. **N2 resolved** (DoD `fresh-browser` box checked, citing the receipt). **New residual R-1, non-blocking:** the `(design)` glob is the first parenthesised path filter in this repo and is unproven empirically because `fresh-ui-quality` skips on the draft; the `paths:` filter is the outer gate, so a non-matching glob would mean the classifier never runs. GitHub treats parentheses as literal so it should match, but it should be confirmed at ready flip rather than assumed. IMPL-EVAL not launched; no ready/merge/issue mutation; no next leaf. | direct `classifyPath` execution; `run-deno-test.ts` ×2; `quality:scan`; `arch:check`; `git diff --stat` product/lock checks; workflow YAML parse; `gh pr view/checks 1657`; `docker ps -a` |

| 2026-08-15T07:0xZ | **IMPL-EVAL cycle 1 → `FAIL_FIX`; my Tier-A PASS was wrong and is withdrawn.** Fresh native Claude `claude-opus-5` / medium session `04897102-bcd6-4918-8b72-dc0151035883`, PID `202494`, bridge `session_01GbqPgckdxHEZzXzNu7DKNp`, owner-route amendment recorded. Evaluated head `939e7311317365db7681de5e3c7c56a73412424e` = verdict commit `a46b83831`'s parent; commit is artifact-only (`evaluate.md` + bookkeeping). **Blocking E-1:** the leaf repaired the source template but never regenerated `packages/cli/src/kernel/assets/embedded.generated.ts`. Verified by me after the verdict: that file is absent from the whole product diff, still carries `total: 50`, contains **0** occurrences of `citation-chip`, and `deno task check:assets-barrel` exits **1**. `TemplateRegistry` reads only `EMBEDDED_TEMPLATE_CONTENT` with a no-op `hydrate()` and no disk fallback, and that registry is what `netscript init` uses — so a project scaffolded from this branch still renders "All 50 items" and still hides the AI collection. **#1358's user-visible defect is unfixed on the consumer path.** Secondary **E-2:** `assets-barrel` is absent from the leaf's `provingGates` and was never run by any lane. **My miss:** I verified template↔manifest semantics exhaustively but never asked whether the template is what ships; the sibling #1654 leaf regenerated the barrel in every asset-template slice and I recorded that at the time, so the file's absence from a two-file product diff should have been my first check. Tier-A `PASS_TO_IMPL_EVAL` withdrawn (correction appended at `ca8773f66`, not edited in); correct verdict is `CHANGES_REQUESTED`, subsumed by the formal `FAIL_FIX`. T-3/N1/N2/R-1 remain accurate and the evaluator independently agreed on them. Evaluator retired; no leaf session remains; `aspire ps` empty, `docker ps -a` empty; product tree untouched by the evaluator. Residuals returned, not taken: **R-1** (evaluator judged the ready-flip proof I proposed does not actually prove the glob), **C-1** (every #1358 acceptance box incl. the close-gated one still unchecked), **N-3** (`registryCollections` exported but consumed by no generated route). | `evaluate.md`; `git diff --name-only` for `embedded.generated.ts`; `grep total:/citation-chip` on the barrel; `check:assets-barrel` raw exit; `git rev-parse a46b83831^`; `claude stop`; `docker ps -a` |

| 2026-08-15T08:0xZ | **T-3 revert cleanup landed; fresh cleanup Tier-A → `CHANGES_REQUESTED` on PR-body accuracy only.** Cleanup head `a891c65203301ec96467f11d9fe3dcb77a09d5c8` (`695dd7b00 chore(ci): remove redundant Fresh UI expansion` + proofs). **Proofs I re-executed:** three-path diff vs `origin/main` **empty** (all three blobs byte-equal to main); this leaf's own delta vs base `da574111a` is **exactly** the 3 core #1358 files; classifier `needsDeno=true` for **both** the manifest and the CLI design template (`freshUi` now correctly `false` on the template); root-discovery drift test **1 passed / 0 failed**; `check:assets-barrel` exit **0**, tree clean; barrel `total: 66`; locks unchanged; Docker/Aspire empty. Distinguished main-drift from leaf changes — `deno.json`, `agent-docs.generated.ts`, `publish-assets.generated.ts` show `changed-by-leaf=0`. Fresh opposite-family Tier-A (session `b4e0f2a9-ead2-4e25-a157-b562852db914`, PID `363768`, bridge `session_0126UWXkosw4JB5soLwAfLjV`, Opus 5 medium) confirmed all five scoped questions **YES** on artifacts and code, then returned **`CHANGES_REQUESTED`** on the **PR body** alone, verdict commit `21403902b` (artifact-only). Its three blocking findings verified by me against the live body: **T-1** L17 `- [x] S3 Close the T-3 … CI ownership gap — a09331497` still reports reverted work as delivered; **T-2** L30 presents the reverted classifier suite (`62 passed`) as current validation; **T-3** L31+L58 assert `fresh-browser` PASS and a checked DoD box **without saying which gate the receipt covers** — on a PR titled for the design gallery that reads as gallery browser proof, the exact claim the journals now correct. Non-blocking: **T-4** the amendment note lacks a reverted marker; **N-1** both `check-test` and `fresh-ui-quality` are draft-guarded so the gate does not run in CI while #1657 is draft (pre-existing repo-wide policy, resolves at ready flip); **N-2** the manifest→template→barrel chain is gated by **two** gates (drift test + `assets-barrel`), not the single "drift gate" #1358's box names. No code defect found. Reviewer retired; product tree untouched by review. **Held: the remediation is a PR-body correction that was not pre-authorized, and the grant said stop after Tier-A.** | `git diff origin/main..HEAD` over the 3 paths; `git diff da574111a..HEAD`; direct `classifyPath` execution; root `deno test --filter`; `check:assets-barrel`; `gh pr view 1657 --json body` line checks; `review-tier-a.md` |

| 2026-08-15T08:2xZ | **#1657 terminal for this lane — body corrections applied and independently rechecked `PASS`.** Five body-only corrections landed on the live PR with **no commit, no source, artifact, lock, or gate change** (head stayed `21403902b` through the edits): **T-1** S3 now reads landed-then-reverted-as-redundant citing `695dd7b00` with the G-1 reason; **T-2** the reverted classifier-suite bullet (`62 passed`) is gone, replaced by four proofs current at this head; **T-3** both the Validation line and the DoD box now name the receipt as the **form-navigation regression under `packages/fresh`** that **never rendered the generated design gallery**, and name #1358's real consumer proof (decoded 66-item barrel + symmetric drift gate); **T-4** the drift/debt amendment line records its own reversal; **T-5** the `Phase:`, `Do not merge until…`, and DoD lines now state formal Tier-A and IMPL-EVAL cycle 2 are complete/`PASS`, with the DoD **split** — checked for the formal gates, unchecked for cleanup recheck + readiness. **Sequencing note:** T-5 arrived while the author's turn was still in flight; it was staged rather than sent, because a second send at a live worktree forks a rival — dispatched on the same thread once the turn landed, one sender throughout. A **fresh opposite-family recheck** (session `96d469bb-709e-4a44-ab34-c75bf849e0c9`, PID `417409`, bridge `session_01NbxH4k3reZ5dPJaADA9qCj`, Opus 5 medium) verified all five against the repository rather than the prior narrative, **swept the whole body** for further stale claims and found none, and returned **`PASS`** at `b71c1ee72` (artifact-only, parent `21403902b`). Invariants confirmed by me: `OPEN`, draft, exactly one `status:impl`, `Closes #1358` present, **zero** #1358 acceptance boxes ticked, exactly **1** DoD box open by design, Docker/Aspire empty, all sessions retired. **Held for coordinator readiness disposition.** | live `gh pr view 1657 --json body` anchor checks; `git diff --name-only`; `review-tier-a.md` recheck section; `gh issue view 1358`; `docker ps -a` |

| 2026-08-15T08:27:20Z | **#1657 SHIPPED — reconciled.** Squash-merged from exact head `b71c1ee723813dd384a6490f342360f9a434a89e` as `6917c656eebdfda1ac65d509f6a5f55c93f38774`. Independently verified: PR `MERGED`, `mergeCommit` matches, `status:shipped` and **no** `impl-eval:skip` on the label set; #1358 `CLOSED`/`COMPLETED` with **7 checked / 0 unchecked** acceptance boxes and exactly `status:shipped`. `origin/main` has since advanced to `284dda90a` as other lanes landed. Wave 1 is complete for this lane: #1358 shipped, #1350 held. | `gh pr view 1657`; `gh issue view 1358` box counts; `git ls-remote origin main` |
| 2026-08-15T08:3xZ | **Frozen-queue inspection — DAG blocks preserved, one eligible leaf found.** 17 fixes leaves; waves 0–1 now terminal except the held #1350. **Wave 2 is entirely blocked:** `prisma-mysql-honest-example` (#1112) by edge `issue:1293 → issue:1112` (`requires`) with **#1293 OPEN** (`status:triage`); `ui-add-page-island-repair` (#1357) by edge `issue:1355 → issue:1357` (`requires`) with **#1355 OPEN** (`status:triage`). **#1350** remains blocked solely by `issue:1348 → issue:1350` (`rfc-prerequisite`) with **#1348 OPEN** (epic, `status:plan`). **Wave 3 carries two leaves with zero incoming DAG edges** — `ai-mcp-pool-isolation` (#1448) and `sdk-cache-surface-and-telemetry` (#1598/#1619/#1620/#1623/#1637); all six issues are OPEN in milestone `0.0.7`, and **none carries `epic:sdk-client-contrib`**, so #1348's prerequisite does not extend to them (checked rather than assumed). Waves are dispatch units and DAG edges run across them — the same basis on which #1358 was advanced while wave 0 was still open — so a wave-3 leaf is eligible. Advancing exactly one; the SDK cache group stays queued within the 2-leaf WIP bound. Older #1643/#1243 stale `status:` labels are being normalized centrally by the coordinator; recorded, not raced. | `milestone-leaf-plan.json`; `milestone-dependency-dag.json` edge scan; `gh issue view 1348/1293/1355/1448/1598/1619/1620/1623/1637` |

| 2026-08-15T10:32:49Z | **Wave 3 dispatched — `ai-mcp-pool-isolation` (#1448).** Created `fix/ai-mcp-pool-isolation` + worktree `/home/codex/repos/netscript-007-leaf-ai-mcp-pool` from current `origin/main` `284dda90a17a13a7e5e8e9834e5411b58887131b`, no upstream, clean, no branch/worktree/PR collision. Launched one attached Codex slice through `agentic:launch-codex-slice` (dry-run validated first, `--expect-base 284dda90a` enforced): thread `01a0048d-61b0-76a2-8117-5f8ce0466495`, requested **and observed** `openai` · `gpt-5.6-sol` · **medium**, route verdict `matched`, exactly one sender at that worktree. Effort medium because failure-isolation plus error-propagation across a pool/connector/registration boundary carries real mid-slice decision risk. Contract frozen at three `packages/ai/src/mcp/**` files, archetype `2-integration`, gates `check`/`test`/`publish-dry-run`/`arch-check` with JSR applicable. The brief carries this lane's accumulated lessons: stop-and-record-drift at the contract boundary rather than widening it (three leaves have already hit it); `quality:scan` + `arch:check` on top of the wrappers; suppression-to-green is review-blocking; **regenerate the embedded barrel if any asset template is touched** (the #1657 E-1 lesson, with an instruction to verify rather than assume it does not apply); no expensive gate without a fresh lease; and no self-certification. WIP is 1 implementation leaf / 0 evaluators inside the 2/1 bound. | `leaf-contracts.json` `ai-mcp-pool-isolation`; `git worktree add`; `codex-thread-ids.md`; `agentic:launch-codex-slice --dry-run` then send |

| 2026-08-15T1x:xxZ | **#1661 S0 reviewed; scope blocker upheld and ruled under delegated authority.** Head `1d4533462a088ad902ac7dd71be88764463fcd5d` verified equal across local/remote/PR, clean, **artifact-only** (empty product delta) — the leaf stopped before implementation, the fourth in this lane to hold the contract boundary. Ruled against the **live issue and the code**, not the report: mapped all 9 acceptance criteria to the frozen 3-file surface and found 1/3/8/9 unreachable and 4 only partly reachable. **Amendment: exactly 5 files** added; denials recorded explicitly (nothing outside `packages/ai/**`, no new `deno.json` export entry, no consumer-side EIS-Chat work). **Public contract ruled** — sync + I/O-free snapshot keyed by `serverId` carrying state and last error, reusing `McpConnectionState`, additive on a JSR surface under `isolatedDeclarations`; cancellable close via a `signal` options bag; and **`pool.stop()` must settle per server** because `pool.ts:149`'s `Promise.all` is the same all-or-nothing defect as startup and leaves criterion 4 unmet. **Archetype reconciled**: the Archetype-2 override stands for gate selection but does not waive Archetype-4/JSR obligations on the now-public surface. Ruling committed leaf-side at `e2faaab15` and pushed. Serial queue preserved — the `sdk-cache-surface-and-telemetry` leaf stays queued until #1661 reaches its next supervised stop. | `gh issue view 1448` acceptance list; `drift.md`/`research.md`; `packages/ai/mcp.ts`, `ports/mcp-transport.ts`, `pool.ts:149` inspection; `packages/ai/deno.json` exports |

| 2026-08-15T1x:xxZ | **#1661 slices 1–2 landed; slice-3 stop upheld and re-ruled (amendment 2).** Head `b25ddb2d5`; four commits — plan relock, RED `70f8dc799`, pool isolation `9c07f5951`, drift record. Verified: product delta **inside the authorized surface** (`mcp.ts`, `pool.ts`, `ports/mcp-transport.ts`, `tests/mcp_test.ts`), nothing outside the ten-file contract, `packages/ai/deno.json` exports **untouched**, `deno.lock` unchanged, Docker empty. The emerging snapshot shape matches Ruling 2 — `pool.snapshot.statuses.<serverId>` carrying `serverId`/`state`/`lastError` plus `pool.snapshot.readyClients`, accessed **synchronously**. Slice-3 stop verified independently and upheld: both published transports are composition wrappers over `BaseMcpTransport` forwarding `listTools`/`callTool` options but declaring `stop()` without options, both re-exported from `./mcp`. **However the stop under-scoped itself** — `grep -rn 'implements McpTransportPort'` finds **six** implementors, and `packages/fresh/src/runtime/ai/mcp-app-call-handler_test.ts:15` `FakeMcpTransport` sits in a **denied package** with `stop()` and no `readResource`; granting only the two files asked for would have left a cross-package break until CI. **Amendment 2** (`6db182503`): surface → 10 files (two concrete transports, delegation only); `stop(options?)` widening is assignable so it breaks nothing; `readResource` **optional on the port**, required+cancellable on base and both published transports; and the leaf's evasion concern answered by a **behavioral** RED bar — prove in-flight `readResource`/`stop` settle on abort through a published transport path. Author resumed on the same thread with a cross-package `packages/fresh` check required before finishing. | `git log/diff` in the leaf; `grep -rn 'implements McpTransportPort'`; `stdio-transport.ts:46,107` / `streamable-http-transport.ts:47,111`; `mcp.ts:45,49`; Fresh double `:15,:69` |

| 2026-08-15T1x:xxZ | **#1661 implementation complete; Tier-A `PASS_TO_IMPL_EVAL`.** Slices 3–5 landed (7 commits: cancellation RED ×3, operation/registration cancellation fixes, degraded-operation docs) at head `3a4bc66c4832baf8f209e47cc08c3a336e2ff100`. **Contract held:** delta is exactly the ten twice-amended files with **nothing outside**, `packages/ai/deno.json` exports untouched, `deno.lock` unchanged, `packages/fresh` untouched. **Rulings verified in source, not from the report:** snapshot is a **synchronous getter** (`pool.ts:108`) returning per-`serverId` `{serverId, state, lastError?}` reusing `McpConnectionState` plus `readyClients`; `readResource` is **optional** on `McpTransportPort` (`ports:229`) and required on `McpClientConnection` (`ports:169`) with implementations on the base and both published transports. **Amendment 2 paid off exactly as intended — `packages/fresh` type-checks green (197 files, 0 failed batches)**, proving the cross-package break was avoided; had `readResource` been required on the port, that check would be red. **Ruling 6's behavioral bar holds**: cancellation is proven through published transports (`readResource` abort `:513`, `stop` abort `:547`, in-flight fetch abort `:579`, late-close-after-abort `:638`, independent per-server stop `:367` — the old `Promise.all` at `pool.ts:149` is gone), not by a method existing. **Gates re-executed by me:** focused MCP suite **20/0**, `packages/ai` check green, `packages/fresh` check green, `quality:scan` 0 findings, `arch:check` exit 0, `doc:lint` **0 errors / 0 private-type refs / 0 missing JSDoc** across 13 entrypoints incl. `./mcp.ts`, `publish --dry-run` Success, `docker ps -a` empty. All nine live acceptance criteria mapped to evidence. Sign-off `e3c74d7aa`, PR comment `#issuecomment-5301585728`. **Non-blocking N-1:** #1661 still reads `status:plan` while implementation-complete — a consequence of this lane's standing leaves-do-not-relabel instruction, not leaf error; reported since relabeling is coordinator-only. **N-2:** leaf drift attribution corrected. **Awaiting coordinator grant for the fresh opposite-family IMPL-EVAL**; `sdk-cache-surface-and-telemetry` still queued per serial policy. | independent gate reruns; `git diff --name-only` contract check; `ports/mcp-transport.ts:141,151,169,229`; `pool.ts:108`; test titles at `:341,367,457,489,513,547,579,638`; `review-tier-a.md` |

| 2026-08-15T1x:xxZ | **#1661 IMPL-EVAL cycle 1 → `FAIL_FIX`; my Tier-A PASS withdrawn.** Canonical-route evaluator (native Claude **`claude-fable-5` · medium** · Remote Control — `lane-policy.md:46` for Codex work, deliberately not the Opus override an earlier leaf carried), session `cb917802-ee26-4b89-86b9-0eee33c7de1b`, PID `520689`, bridge `session_01Kwmr8XjoznnQsHUnkmfcnV`, identity journaled **before** mutation per the grant. Verdict commit `8d6b4726c` at evaluated head `e3c74d7aaf3b7734b5a44a5be248c01f004c21e5`, **artifact-only** (only `evaluate.md` + `context-pack.md`) and **immutably pushed** — remote == local; contract intact (`deno.json` exports, `deno.lock`, `packages/fresh` all untouched); `docker ps -a` empty. **Blocking F-1, verified by me in source:** `register-tools.ts:38-41` closes the registered handler over the `registerMcpTools` `options`, so the **registration** signal becomes the **per-call** signal for every tool for the registry's lifetime; `README.md:194-195` documents `AbortSignal.timeout(1_500)` as *the* failure-isolated pattern, so following the docs makes every tool call after 1.5 s reject with `TimeoutError`; and `mcp_test.ts:300` asserts the handler **rejects**, encoding the defect as desired — which is exactly why every gate was green and a green-gate review could not catch it. The evaluator proved it with a read-only runtime repro (`call-before-deadline: ok` → `call-after-deadline: ERR TimeoutError`). **This is my third miss on this lane with one root cause** — E-1 checked the template not the shipped artifact, G-1 inferred a negative from a substring, F-1 checked that a signal is forwarded not what its **scope** means at runtime. All three checked shape, not behavior. Rule added: **for any cancellation/lifetime/scope contract, run it — a plumbed signal is not a correctly scoped signal, and green tests are no defence when the test encodes the defect.** Tier-A `PASS` withdrawn at `1bdb09e13`; corrected verdict `CHANGES_REQUESTED`, subsumed by the formal `FAIL_FIX`. Everything else in that review stands and the evaluator independently agreed (contract integrity, Ruling 2 sync snapshot, Ruling 5 optional-on-port with `packages/fresh` green, Ruling 6 published-transport bar). **F-1's remedy is inside the already-authorized ten-file surface — no new amendment required.** Five non-blocking observations recorded (O-1 `Reflect` residue, O-2 connector-level list/call coverage, O-3 unlogged specifier change, O-4 aggregate-state semantics undocumented, O-5 pre-existing). Evaluator retired; `sdk-cache-surface-and-telemetry` stays queued — the lifecycle transition is **not** terminal. | `evaluate.md`; `register-tools.ts:38-41`; `README.md:194-195`; `mcp_test.ts:300`; `git diff --name-only e3c74d7aa..HEAD`; `ls-remote`; `docker ps -a` |

| 2026-08-15T1x:xxZ | **F-1 repaired; Tier-A re-review `PASS` at `e4944309361fe18efea20be8a3df364bb8754d82`.** Two commits on the preserved author thread — RED `59eca0647 test(ai): reproduce registration signal lifetime leak`, GREEN `e49443093 fix(ai): decouple mcp registration and call lifetimes`. **This time I executed the cancellation contract instead of reading it** — a standalone repro against the real `registerMcpTools`/`createToolRegistry` reproducing the README's startup-deadline pattern returned `call-before-deadline: ok`, `startup signal aborted? true`, **`call-after-deadline: ok`** (was `ERR TimeoutError` at `e3c74d7aa`), `signal attached to call? false` → **F-1 RESOLVED**. The `aborted? true` line matters: the deadline genuinely fired, so the pass is not an artefact of never reaching the failure condition. **Fix is one line** — `options` dropped from the registered call handler — with `listTools(options)` on discovery **unchanged**, so registration-time cancellation was preserved rather than silently dropped (the regression I explicitly warned against), and the discovery-abort test at `:284` is retained. **The test that asserted the defect is gone**, replaced by `registered calls outlive the registration discovery signal` asserting success plus `callSignal === undefined`. **Docs/code contradiction resolved**: `README:182` registers with no deadline, `:211` documents the signal as bounding discovery, and the startup deadline moved to `pool.connect({ signal: startup })`. Scope: delta is exactly the three authorized files, nothing outside; locks, `deno.json` exports and `packages/fresh` untouched. Gates re-run by me: focused suite **20/0**, `packages/ai` check green, **`packages/fresh` cross-package check green (197/0)** so Ruling 5 survives, `quality:scan` 0 findings, `arch:check` exit 0, `doc:lint` 0 errors, `publish --dry-run` Success, `docker ps -a` empty. **O-3 closed** by a drift entry; O-1/O-2/O-4/O-5 correctly not taken. Sign-off `df0534416`, PR comment `#issuecomment-5301690839`. Requesting fresh formal IMPL-EVAL cycle 2; `sdk-cache-surface-and-telemetry` stays queued until #1661 is terminal. | own runtime repro; `git diff 1bdb09e13..HEAD`; `README:182,194,211`; `mcp_test.ts` test-name diff; independent gate reruns |

| 2026-08-15T1x:xxZ | **#1661 IMPL-EVAL cycle 2 → `PASS` (final). Leaf is terminal for this lane.** Canonical-route evaluator (native Claude `claude-fable-5` · medium · Remote Control), session `eb7149da-1689-44af-970e-ddd6e78022fa`, PID `608782`, bridge `session_01CaAEKsH35CP2QgfNUVdXK1` — identity journaled **pre-mutation** with the leaf tree verified clean at the evaluated head, so "before mutation" is a checked fact not a timing assumption. Verdict commit `4766b258f`, parent = evaluated head `df05344166adaeb2b8e2f2f6ec741e1032d29045`, **artifact-only** (`evaluate.md` +131) and **immutably pushed** (remote == local); contract untouched; `docker ps -a` empty. **It verified F-1 behaviorally, as briefed** — its own read-only repro (`repro-c2.ts`) through the **published** transport, not a diff read: the startup deadline fires, later registered calls succeed, no registration signal reaches `callTool`, and discovery cancellation is intact. It also confirmed the defect-encoding test is gone, replaced by a success-after-abort regression that was independently red at `59eca0647`, with the discovery-abort test retained; README and code agree so criterion 9 is now true; and the twice-amended ten-file contract, Rulings 2/5/6, lock/export/`packages/fresh` hygiene and every cheap gate re-verify green. **No new findings, none blocking.** Cycle-1's `FAIL_FIX` is preserved in the same artifact as the record of what was wrong. Evaluator retired; no leaf session remains. **Stops here for coordinator readiness disposition** — the evaluator explicitly did not take it, and flagged that before `status:ready-merge` the acceptance-evidence mirror / close-gate must cover the nine #1448 boxes and the two DoD boxes, with **no box ticked and no keyword changed** by any lane so far. **N-1 stands:** the PR still reads `status:plan` while implementation is complete — a consequence of this lane's leaves-do-not-relabel rule; relabel is coordinator-only. `sdk-cache-surface-and-telemetry` remains **queued** until the lifecycle transition is terminal. | `evaluate.md` cycle-2 block; `git rev-parse 4766b258f^`; `git show --stat`; `ls-remote`; `docker ps -a`; `claude stop eb7149da` |

| 2026-08-15T1x:xxZ | **#1661 lifecycle reconciled against live state — one stated fact did not hold.** Verified: PR **non-draft** at exact head `4766b258f0d61108e4240720365b9ab078f6a111`, **0 unchecked** PR boxes, #1448 **9 checked / 0 unchecked**, `Closes #1448` present, review threads **0/0**, and `close-gate` **pass**, `quality` **pass**, `code-quality` **pass** at the exact head. **Correction:** the reconciliation states the PR label is `status:ready-merge`; it is **`status:impl-eval`** — confirmed twice, exactly one `status:` label. Issue #1448 is `status:impl` as stated. `check-test` is **pending**, so `mergeStateStatus` is **`BLOCKED`**, not clean. Recorded the label gap in `drift.md` with its two concrete consequences: `status:ready-merge` is the named merge precondition and gates the acceptance-evidence mirror, and because `ci.yml` does not listen to `labeled`, applying it should be followed by **re-running the `close-gate` job rather than pushing** — a push would move the head and invalidate the cycle-2 verdict bound to `df05344166`/`4766b258f`. Monitoring `check-test` to terminal; **the merge decision is the coordinator's and is not taken here**. `sdk-cache-surface-and-telemetry` stays **queued** — released only after merge *and* terminal shipped lifecycle on both PR and issue. | `gh pr view 1661 --json labels,isDraft,mergeStateStatus,body`; `gh pr checks 1661`; `gh issue view 1448`; `agentic:review-threads` |

| 2026-08-15T1x:xxZ | **#1661 `check-test` RED — a real cross-package regression; merge halted.** Classified before digging: `agentic:pr-checks` reports **`current-fail`** (`currentFailures=1`), not superseded. Downloaded the structured artifact rather than reading logs: **4151 passed / 1 failed / 14 ignored**, sole failure `root-level scaffold runtime imports resolve in both package-source modes` at `workspace-mutator_test.ts:261` — *expected @netscript/ai to compute the @tanstack/ai-mcp runtime specifier*. **Root cause is O-3**, which cycle 1 dispositioned as bookkeeping: slice 5 replaced the connector's computed constants (`['@tanstack', '/ai-mcp'].join('')`, present at base `284dda90a`) with literal dynamic imports, and `workspace-mutator_test.ts:306-320` scans the connector's **source text** requiring **both** computed specifiers so optional MCP stays out of the static JSR graph. **Two supervisory failures recorded:** I accepted the non-blocking framing of O-3 despite the evaluator noting the change was "not named in either ruling" — which should have prompted *why is it asserted elsewhere?*; and my Tier-A gate set was scoped to the packages the delta **touched** (`packages/ai`, `packages/fresh`), while the assertion lives in **`packages/cli`**, which the delta does not touch but which asserts on `packages/ai`'s source text. Rule added: when a change alters a package's source text that another package may assert on, package-scoped gates are structurally insufficient — run the repo-wide suite or gate the asserting package explicitly. Bounded RED→GREEN repair dispatched to the same author thread restoring both computed constants in `tanstack-connector.ts` (in-contract), **barring any weakening of the CLI test**, and widening gates to include the `packages/cli` check. Post-IMPL-EVAL product mutation → fresh Tier-A **and** a proportionate fresh formal evaluation of the delta required before readiness. Other live state verified: PR non-draft at `4766b258f`, 0 unchecked boxes both sides, threads 0/0, `close-gate`/`quality`/`code-quality` **pass**, label still `status:impl-eval`, `MERGEABLE`/`BLOCKED`. **Merge decision remains the coordinator's; next fixes leaf stays queued.** | `agentic:pr-checks --pretty`; `gh run download` artifact `test.report.json`; `workspace-mutator_test.ts:261,306-320`; `git show 284dda90a:…/tanstack-connector.ts` |

| 2026-08-15T1x:xxZ | **Repair-delta formal evaluation `PASS`; PR #1661 body reconciled (metadata only).** Evaluator `8a0ff845-1d0a-43d6-ae3c-03b4158f7943` (canonical `claude-fable-5` · medium, bridge `session_013K3BZ2ydVkYzXt6vgcxTJX`) returned **`PASS`** at evaluated head `de89440119ba45822f0bdc8350838088a6f04140`; verdict commit `f74695bc4` — parent = evaluated head, **artifact-only**, immutably pushed, PR comment `5301873258`. Its rationale matched my Tier-A independently: computed invariant restored at every site, CLI test **unweakened and green**, repo-wide gate now **4152/0**, publish dry-run green, F-1 lifetime separation and MCP suite intact, O-3 drift truthful. Evaluator retired. **The verdict push moved the PR head** `de8944011` → `f74695bc4`, superseding the earlier exact-head CI and triggering a fresh run — merge readiness must be assessed at `f74695bc4`. **PR body updated in place, metadata only**, with all four replacements asserted to match exactly once and the live body re-read afterwards: Summary no longer claims cycle 2 was the final gate and now records the O-3 regression → repair `45aca4adc` → Tier-A `de8944011` → repair-delta `PASS` `f74695bc4`; Slices gained the two repair entries; Validation gained repo-wide **4152/0/19** (vs CI's failing 4151/1), the previously failing CLI test 19/0, the `packages/cli` check 883 files, and the exact-head CI status; Harness now records cycle 1 `FAIL_FIX` → cycle 2 `PASS` → repair-delta `PASS` with no lane self-certifying. **Invariants proven preserved**: `Closes #1448` intact, **0 unchecked boxes**, and the `## Definition of Done` and `## Scope` sections **byte-identical** — acceptance truth untouched. No merge, tick, relabel or draft change; label remains `status:augment-review` (coordinator moved it from `status:impl-eval`). | evaluator `evaluate.md`; `git rev-parse f74695bc4^`; `gh pr edit --body-file` with assert-on-miss + live re-read; section diffs |

## Design

- Public surface: none in the topic-control branch; product surfaces are exclusively leaf-owned.
- Vocabulary: topic, leaf, implementation WIP, evaluator WIP, expensive-gate lease, coordinator
  handoff.
- Ports: Git/GitHub and the checked-in agentic runtime only.
- Constants: immutable base `01e0960494c95ce56eb35892c211a095eb13e6ed`; WIP `2/1/1`.
- Commit slices: topic bootstrap/identity; launch identity capture; supervision/handoff evidence.
- Deferred scope: all post-Wave-0 leaves and all coordinator merge/release actions.
- Contributor path: `leaf-registry.md` is the compact operational index; each leaf's own run dir is
  the detailed source.

## Expensive-gate lease

No lease is held locally. Both briefs require a coordinator grant before `scaffold.runtime`,
Aspire, or Docker work begins. The grouped scaffold leaf has first topic priority when the global
lease becomes available because its three-issue acceptance shares that one verdict.

## Resolved 2026-08-14 — legacy-port-pin-sweep contract blocker

The 2026-08-13 blocker (manifest ports are not mechanically removable, and the fail-loud CLI remedy
needed an out-of-contract regression test file) was dispositioned upstream before the reset. The
leaf then implemented the bounded remedy — `3d32e9ee2 fix(cli): require explicit auth stream URL`
plus the authorized `auth-plugin-command_test.ts` coverage — recorded its Tier-A review
(`af3dca0f5 docs(harness): record legacy Tier-A review`), and committed a receipt set covering
check, test, lint, fmt, doc-lint, quality-gate, arch-check, jsr-audit, and publish-dry-run. The
manifest and official-copy port fields stay coordinator-classified compatibility metadata; they were
not removed. Product diff is confined to `plugins/auth/auth-plugin-command.ts` and its test. The
leaf is clean at `e6ba15ec6414c0a42b1f9870791131162ea71c36` and blocked only on the order-2
IMPL-EVAL. Those receipts are the implementer's own evidence; they are inputs to the IMPL-EVAL, not
a substitute for its verdict, and this topic run has not independently re-executed them.

## Resolved 2026-08-14 — scaffold-generated-output-correctness contract blocker

The 2026-08-13 blocker (the frozen surface omitted the provider-selection and seed-generation
generator seams) was resolved by the coordinator amendment recorded in the leaf at
`14d8b38b4 chore(harness): record authorized scaffold seams`. The leaf is correctly artifact-only —
plan, research, drift, and the red-first receipt, with **no product code** — pending the order-5
PLAN-EVAL cycle 1. Only an unqualified `PASS` permits the attached implementation thread to resume.
The shared `scaffold.runtime` verdict remains lease-gated and has not run.

## 2026-08-15 — #1661 terminal merge reconciled; `sdk-cache-surface-and-telemetry` released

**Merge tuple (independently verified, not taken on report).** PR #1661 squash-merged
`2026-08-15T10:54:05Z` as `baf1cdf67a4e931af17b4772ddf6101f36152184`, subject
`fix(ai/mcp): make pool startup failure-isolated and propagate cancellation (#1661)`. That commit is
`origin/main` and `git merge-base --is-ancestor` confirms it on `main`. Merged from exact head
`f74695bc4` — the same head the repair-delta IMPL-EVAL evaluated, so no verdict is bound to a
superseded head. #1448 auto-closed at `10:54:06Z` `CLOSED`/`COMPLETED`. PR and issue each carry a
sole `status:shipped`. Terminal CI at the merged head: `pr-checks PASS`, `checks=31`,
`currentFailures=0`; `review-threads PASS` 0/0.

**Correction to my own prior report.** My in-flight CI watcher snapshot showed
`status=status:ready-merge` on the PR and `status:impl` on the issue, and I was about to report those
as a lifecycle-label gap. Direct re-query shows both are `status:shipped`. The watcher sampled the
merge transaction mid-flight; the stale values were never the settled state. Separately, the
lifecycle-label gap I *did* correctly report on 2026-08-14 for #1643/#1243 is now closed — both are
`status:shipped` on re-verification. No outstanding label debt remains in this topic.

**Runtime hygiene at release time.** `origin/main` == `baf1cdf67`; zero Docker containers running;
no orphaned leaf resources attributable to this topic.

**Next serial leaf released — `sdk-cache-surface-and-telemetry` (#1637, #1619, #1620, #1598, #1623).**
Eligibility re-verified rather than assumed: zero incoming DAG edges into all five issues, all five
`OPEN` in milestone `0.0.7`. No prior run-dir, thread, branch, or worktree existed for this leaf, so
"preserve all existing authors" had nothing to preserve — this is a first launch, not a resume, and
no rival was created.

| Field | Value |
| --- | --- |
| Thread | `01a00516-2033-7ed3-936a-a616cee47447` (launched 2026-08-15T13:02:11Z) |
| Rollout | `/home/codex/.codex/sessions/2026/08/15/rollout-2026-08-15T13-02-11-01a00516-2033-7ed3-936a-a616cee47447.jsonl` |
| Worktree | `/home/codex/repos/netscript-007-leaf-sdk-cache` |
| Branch | `fix/sdk-cache-surface-and-telemetry` (no upstream by design) |
| Base | `main@baf1cdf67` — the #1661 merge commit |
| Route requested / observed | openai · `gpt-5.6-sol` · medium — **matched** |
| Pre-launch git safety | `head=baf1cdf67 upstream=NONE dirty=0` |
| Brief | 11687 bytes, contract-valid (`use harness`, `## SKILL`), staged `/home/codex/sdk-cache-brief.md` |

**Phase discipline.** Research/plan-only through its first gate. PLAN-EVAL is warranted rather than
`PLAN-EVAL: N/A` under the 2026-08-08 owner decision: #1619 proposes overturning a fail-loud contract
that a passing test currently pins (`cache-telemetry_test.ts:237`), #1620 chooses between a
type-level bound that breaks published `QueryParams` and a runtime bound that does not, and #1637 may
require a public per-action cache opt-out. Those are contract decisions on published surface, not
mechanical fixes.

**Two prior-failure rules were written into the brief as explicit obligations**, because both classes
have already cost this topic a cycle:

- #1637 is a *failure-isolation* contract — the same class as #1661's F-1. The brief requires a
  behavioral RED test that fails at the current head for the reason the issue names (a real
  oversized-value `KvCacheStore.set()` rejection), and states explicitly that a stubbed throw proves
  the catch exists but not that the real limit path is isolated.
- The cross-package rule from O-3: a change to `packages/sdk` source text or public surface can break
  a package that *asserts on* it rather than one that imports it. The brief requires the asserting
  packages to be enumerated by executed search, and the gate set to be repo-root or to name every
  asserting package — scoping gates to the touched packages is explicitly declared insufficient.

**Scope pre-emption.** `packages/sdk/src/ports/query-options.ts` is outside the four declared file
surfaces, and both #1637's opt-out and #1620's type-level option would need it. The brief instructs a
scope-boundary report and a stop for a ruling rather than either self-widening the surface or
silently picking the weaker option to stay inside the box — the pattern that worked on #1661's S0.

**Holds still in force.** No expensive Aspire/Docker/`e2e:cli` gate without a fresh coordinator
lease; no evaluator launched by the leaf; PR stays draft; issues stay coordinator-relabelled.
WIP after this release: 1 implementation leaf, 0 evaluators.

## 2026-08-15 — #1665 PLAN-EVAL launched (coordinator-granted, Tier-A PASS)

Coordinator granted PLAN-EVAL on immutable exact source head `ee1b44c6d` after the Tier-A PASS
checkpoint `318bd087c`. Exactly one fresh evaluator launched; no implementation dispatched.

| Field | Value |
| --- | --- |
| Job id | `0287ccbe` |
| Session id | `0287ccbe-2740-45ee-b378-33d1c1c59429` |
| OS PID | `803215` |
| Bridge session id | `session_01GaNTjv6oY6MaxnKHH1ZfrB` (resolvable form, from `~/.claude/sessions/803215.json`) |
| Remote Control URL | `https://claude.ai/code/session_01GaNTjv6oY6MaxnKHH1ZfrB` |
| `cwd` | `/home/codex/repos/netscript-007-leaf-sdk-cache` |
| Source head at launch | `ee1b44c6d401a9edb9c8690870ea2d9151f8f504`, worktree clean |
| Requested route | native Claude · `claude-fable-5` · effort `medium` · Remote Control — canonical `formal_plan_evaluation` for a Codex-authored plan |
| Observed route | `respawnFlags`: `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1665 PLAN-EVAL" --effort medium --model claude-fable-5` |
| Route verdict | **matched** |
| Backend / CLI | `daemon` · `2.1.233` |

Note the jobs record also carries `bridgeSessionId` in the `cse_01GaNTjv6oY6MaxnKHH1ZfrB` form, which
does **not** resolve as a URL; the resolvable `session_…` form comes from the per-PID session file.
Both are recorded so the identity cannot be confused later.

**Attachment proven, not assumed.** The first `type: user` record in
`~/.claude/projects/-home-codex-repos-netscript-007-leaf-sdk-cache/0287ccbe-….jsonl` is 8233 chars
and begins `use harness` — the 8299-byte brief landed rather than being swallowed by a preceding
variadic flag, which is the failure mode that leaves a background session silently idle. Job state
was `working` at launch+5s.

**Generator ≠ evaluator holds three ways.** The Codex author (`01a00516-…`, `gpt-5.6-sol`) wrote the
plan; the topic orchestrator (Opus 5) performed Tier-A in its own session; this Fable 5 session is a
third, fresh, opposite-family session. The brief instructs it to re-derive T-1..T-4 independently and
explicitly not to adopt the Tier-A findings as established fact.

The brief requires: identity recorded before mutation; an executed proof that the branch carries no
product mutation; independent re-derivation of T-1..T-4, the exact five-path scope, D1–D5
feasibility, and validation honesty; `plan-eval.md` committed and pushed by explicit refspec; and a
structured PR verdict comment. Verdict vocabulary is `PASS` / `FAIL_PLAN`. It is prohibited from
implementing, merging, relabelling, running Aspire/Docker/e2e, launching another agent, or steering
the Codex author thread.

WIP during this gate: 1 implementation leaf (idle), 1 evaluator. No expensive lease held.

## 2026-08-15 — #1665 PLAN-EVAL terminal PASS

| Field | Value |
| --- | --- |
| Verdict | **PASS** (`plan-eval.md`, "the plan is buildable inside the authorized four+five surface") |
| Evaluated source head | `ee1b44c6d401a9edb9c8690870ea2d9151f8f504` — the immutable granted head; the evaluator's own `git rev-parse HEAD` in its identity block equals it |
| Artifact commit | `cd5193b66175b981f32e8ca5abd8b41f913068c7`, delta is **exactly one file**, `plan-eval.md` |
| Pushed | local == remote == PR head `cd5193b66`; PR still draft, sole `status:plan` |
| Product mutation | none — `git diff --name-only baf1cdf67..cd5193b66` outside `.llm/runs/` is empty |
| PR comment | posted 2026-08-15T11:47:35Z, structured, naming evaluated head, base, route, and artifact commit |
| Evaluator identity | recorded before mutation: PID `803215`, job `0287ccbe`, bridge `session_01GaNTjv6oY6MaxnKHH1ZfrB`, route `claude-fable-5`/`medium`/`--remote-control` **matched** |

The evaluator independently re-derived T-1..T-4 and **confirmed all four repaired**, censusing the
call sites itself rather than adopting the Tier-A table. It also confirmed the phase invariant by
executed command (8 changed paths, all under `.llm/runs/`).

**Correction to this topic's own Tier-A.** The evaluator's census reports "11 calls + def" for
`normalizeCacheNamespace`. My Tier-A prose said "12 sites" while its own evidence table listed 11.
Recounted: 11 is correct (`cache-query.ts:85,305,329,361,389`, `cache-provider.ts:125,141,159,169,176`,
`composite-query.ts:42`). The T-1 finding, its citations, and the repair are unaffected — only the
count label was wrong. `tier-a-1665.md` is corrected with an explicit correction note rather than a
silent edit. The separate "12 entrypoints" references are the SDK doc-lint entrypoint set and are
correct.

**Four non-blocking advisories carried forward to implementation.** Two are genuinely new and neither
the plan nor this topic's Tier-A had them:

1. The D3 admitted-namespace registry is module-global and shared across every test file in one
   `deno test` process — the 256-fill test must wrap its private reset in `try/finally` so a mid-test
   failure cannot leak `overflow` into sibling test files.
2. The `@netscript/kv` singleton is process-global, so the D1 KV-limit test must call
   `resetKv()`/`closeKv()` (`shared.ts:187,208`) in teardown or root `deno task test` ordering can
   inherit an `:memory:` KV. This is a real cross-test contamination risk in the exact singleton this
   topic exercised when it verified the RED premise, and it was missed here.
3. The single-line docs block exceeds prose wrap width; `deno fmt` does not reflow fenced blocks and
   no markdownlint config exists, so it holds — but a later formatter pass must not re-wrap it.
4. Keep the internal reset/admission/prologue helpers off `cache/mod.ts` so `surface:diff` stays
   patch-level.

Implementation has **not** been dispatched. The coordinator retains that grant. IMPL-EVAL remains
mandatory and separate. WIP: 1 implementation leaf (idle, plan complete), 0 evaluators.

## 2026-08-15 — #1665 IMPL-EVAL already in flight; no rival launched

Before launching the IMPL-EVAL this session intended, a pre-launch sweep of running Claude jobs found
one **already active** for this leaf. It was not launched from this turn. Rather than start a second
evaluator — which would have created exactly the rival the lane forbids — it was verified and adopted.

| Field | Value |
| --- | --- |
| Job id | `1fbb1c07` |
| Session id | `1fbb1c07-3b05-4d90-ab9c-c827c5aca2d5` |
| OS PID | `126694` (`kind=bg`, CLI `2.1.233`) |
| Bridge session id | `session_01JePyQuiERLe8GeWWKQp5wL` (resolvable form, from `~/.claude/sessions/126694.json`) |
| Remote Control URL | `https://claude.ai/code/session_01JePyQuiERLe8GeWWKQp5wL` |
| `cwd` | `/home/codex/repos/netscript-007-leaf-sdk-cache` |
| Created / last update | `2026-08-15T15:10:18Z` / `15:10:42Z` — active, `tokens=1141` at observation |
| Requested route | native Claude · `claude-fable-5` · medium · Remote Control (`formal_impl_evaluation`) |
| Observed route | `respawnFlags`: `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1665 IMPL-EVAL" --effort medium --model claude-fable-5` |
| Route verdict | **matched** |

Note the jobs record carries `pid: null` and the `cse_01JePyQuiERLe8GeWWKQp5wL` bridge form; the live
PID and the resolvable `session_…` form come from the per-PID session file. `pid: null` here is a
jobs-record artifact, not evidence of an orphaned session — the process is real and `updatedAt`
advanced to the same second as the observation.

**Head binding verified from its own transcript, not assumed.** Its first `type: user` record (7868
chars) binds it to immutable source head `9a26c107afa75bf1f38b78fe96c6df533b156c36` and base
`baf1cdf67`, and instructs it to re-derive every claim independently — "Do not adopt Tier-A findings,
the slice reports, or this brief's evidence as established fact… If you disagree with the supervisor,
say so; that is the point of this gate." That is the correct lane framing, so the gate is sound and
duplicating it would only have destroyed the generator≠evaluator property by splitting attention.

Generator ≠ evaluator holds three ways: Codex `01a00516-…` (`gpt-5.6-sol`) implemented; this topic
orchestrator (Opus 5) performed Tier-A on S1/S2/S3 in its own session; this Fable 5 session is a
third, fresh, opposite-family session.

Monitoring to terminal. No second evaluator launched, no readiness or label change, PR remains draft
at sole `status:plan`.

## 2026-08-15 — #1665 IMPL-EVAL terminal PASS; implementation complete, readiness handed to coordinator

| Field | Value |
| --- | --- |
| Verdict | **PASS** — "all five issue acceptances met at runtime at `9a26c107a`; scope boundary respected"; blocking list **empty** |
| Evaluated source head | `9a26c107afa75bf1f38b78fe96c6df533b156c36`; the evaluator's own `git rev-parse HEAD` in its identity block equals it |
| Artifact commit | `0fed4d7ffb8c655a00846fbf545805bd2e184fb0` — **artifact-only** (`impl-eval.md`); product tree unchanged from `9a26c107a` |
| PR comment | `[PHASE: IMPL-EVAL] [VERDICT: PASS]` posted 2026-08-15T15:21:02Z |
| Route | `claude-fable-5` · medium · Remote Control — matched |

**Verdict-to-merge-head binding.** The verdict is bound to `9a26c107a` while the PR head is now
`0fed4d7ff`. That delta is the evaluator's own artifact commit and contains no product, test, or docs
change (`git diff --name-only 9a26c107a..0fed4d7ff` outside `.llm/runs/` is empty), so the verdict
remains valid at the current merge head. Any further push would break that binding and require a
fresh verdict.

**It re-derived rather than ratified, and improved on this topic's Tier-A in one place.** On the
`surface:diff` finding it did not stop at matching counts: it diffed the **sorted MAJOR sets** at base
and head and found them *identical* — a stronger no-regression proof than the count equality this
topic recorded. It also independently **could not reproduce the implementer's 524**, obtaining 517
twice, which corroborates the discrepancy recorded here rather than leaving it open. `F-DOCT-5`
confirmed pre-existing at 13/13. The `typed-queue` flake was **not hit** in its single root run
(`4203/0/19`), consistent with non-determinism rather than a regression. Carried FAILs are reported
as red, never as green.

## Merge-readiness tuple — exact, coordinator-owned

| Condition | State |
| --- | --- |
| Implementation | complete S1–S3; Tier-A PASS on each slice; IMPL-EVAL PASS |
| PR head | `0fed4d7ff`, local == remote == PR, clean |
| Mergeable | `MERGEABLE` / `CLEAN` |
| Review threads | `PASS` — 0 threads, 0 unanswered |
| **Draft** | **still draft** — blocks merge |
| **Label** | **`status:plan`** — not `status:ready-merge`; blocks merge and the acceptance-evidence mirror |
| **Acceptance boxes** | **PR 5 unchecked**; issues #1598 (4), #1619 (3), #1620 (3), #1623 (3) unchecked; #1637 0 unchecked — 13 issue boxes outstanding |
| **CI** | `pr-checks PASS`, `checks=21`, `currentFailures=0` — **but this is a vacuous green** |

**The CI green must not be read as validation.** At head `0fed4d7ff` nearly every substantive lane
reports `conclusion=skipped` — `check-test`, `quality`, `surface-diff`, `code-quality-repo`,
`deps-report`, `authorize` — with only `classify docs-site changes` actually succeeding. Zero
failures because almost nothing executed, which is the draft/`ci:skip-*` posture, not evidence the
change passed CI. Real lanes run when the PR flips out of draft; the merge decision should wait for
that run, not for the current `currentFailures=0`.

Local evidence is the substantive proof today: root `deno task test` `4203/0/19`, root check re-run
**uncached** over 2925 files with zero diagnostics, `publish --dry-run` Success, `arch:check` FAIL=0,
`quality:scan` ok, doc-lint unchanged at the six pinned diagnostics.

Draft state, labels, box ticking, and merge remain the coordinator's. This topic made no readiness or
label change. Next fixes leaf stays queued until #1665 merge and shipped lifecycle are terminal.

## 2026-08-15 — #1665 IMPL-EVAL terminal PASS; merge-readiness review

| Field | Value |
| --- | --- |
| Verdict | **PASS** — "all five issue acceptances met at runtime"; blocking list **empty** |
| Evaluated source head | `9a26c107afa75bf1f38b78fe96c6df533b156c36`; the evaluator's own `git rev-parse HEAD` in its identity block equals it |
| Artifact commit | `0fed4d7ffb8c655a00846fbf545805bd2e184fb0`, delta is **exactly one file**, `impl-eval.md` |
| Product tree | `git diff 9a26c107a..0fed4d7ff -- packages/ plugins/ docs/ tools/ deno.json deno.lock` is **empty**, so the verdict still binds to the current PR head's product tree |
| Evaluator identity | PID `126694`, job `1fbb1c07`, session `1fbb1c07-3b05-4d90-ab9c-c827c5aca2d5`, bridge `session_01JePyQuiERLe8GeWWKQp5wL`, cwd = leaf worktree |
| Route | requested/observed `claude-fable-5` · `medium` · `--remote-control` — **matched** (from `respawnFlags`) |
| Attachment | first `type: user` record 7868 chars beginning `use harness` |

Generator ≠ evaluator held four ways: Codex `01a00516-…` (`gpt-5.6-sol`) implemented; this
orchestrator (Opus 5) ran all three Tier-As; PLAN-EVAL was a third session; this is a fourth.

**The evaluator improved on this topic's own evidence in two places.**

1. **`surface:diff` no-regression.** I compared *counts* (517 at head, 517 at base). The evaluator
   diffed the **sorted MAJOR sets** at base and head and found them **identical** — a strictly
   stronger proof, since equal counts could in principle mask an added/removed pair. It also named
   the stale artifact: `baselines/public-surfaces.json`.
2. **The 524-vs-517 discrepancy is resolved.** The evaluator obtained 517 twice and recorded the
   implementer's 524 as **"Not reproduced"**, most likely measured mid-slice against different local
   state. Either number is a stale-baseline FAIL, never a pass.

It also reported the `typed-queue` flake honestly as **"Not hit — single run, not re-run"**
(`4203/0/19`, exit 0), rather than implying repeated confirmation.

## Merge-readiness review — NOT ready; three coordinator actions outstanding

CI on head `0fed4d7ff` reads green, and that reading is misleading: **2 pass, 19 skipping, zero
failures — because the PR is still a draft.** Everything that would actually verify this change is
skipped: `check-test`, `quality`, `code-quality`, `code-quality-repo`, `surface-diff`, and
`close-gate`. Only `build` and `classify docs-site changes` ran. The `ci:skip-e2e` /
`ci:skip-scaffold` labels do not explain those skips — the draft state does. **This PR has not been
validated by CI at all.** The real verification is local: root `deno task test` `4203/0/19` (twice by
this topic, once by the evaluator), root check uncached over 2925 files, and the focused SDK gates.

Outstanding, all coordinator-only:

1. **Flip out of draft** — this is what actually starts the core CI lanes on `0fed4d7ff`.
2. **Tick the five acceptance boxes.** All five are now evidenced: PLAN-EVAL PASS (`cd5193b66`);
   real-KV RED→GREEN (RED independently reproduced by this topic in a detached pre-fix worktree,
   GREEN at S2/S3); no public surface widened (helpers absent from `src/mod.ts` and
   `src/cache/mod.ts`, confirmed by the evaluator); gate bar met with the two pre-existing reds
   named as pre-existing; IMPL-EVAL PASS (`0fed4d7ff`).
3. **Advance `status:plan`** to the correct lifecycle label. It is stale — the leaf is past plan,
   impl, and impl-eval.

Note for whoever performs step 1: flipping to non-draft will run CI at `0fed4d7ff`, whose product
tree is identical to the evaluated head, so the IMPL-EVAL verdict remains bound to what CI will test.
Ticking boxes or relabelling does not re-trigger CI.

Both carried red gates remain red and must not be described otherwise: `surface:diff` (stale
`baselines/public-surfaces.json`, identical MAJOR sets at base and head) and JSR `F-DOCT-5`
(13 children at base and head). The six pinned doc-lint diagnostics are unchanged.

Still recommended and still not filed by this session: a tracked issue for the `packages/queue`
`typed-queue_test.ts` DLQ timing flake.

## 2026-08-15 — #1665 delta IMPL-EVAL terminal PASS; readiness CI running

| Field | Value |
| --- | --- |
| Verdict | **PASS**, blocking items **none**; two non-blocking advisories |
| Evaluation head | `7549d9fc052e604212f12e617b05085a061f9e0b` (delta `0fed4d7ff..7549d9fc0`) |
| Artifact commit | `72d57229f28e3010c43d76fbecd3b3082680804f`, artifact-only |
| Evaluator | job `08eb7184`, session `08eb7184-7a14-4976-8421-1e4d5b13163a`, PID `128297`, bridge `session_01Jc8aRcLQFVyVWKogq6SaFC` |
| Route | requested/observed `claude-fable-5` · `medium` · `--remote-control` — **matched** |
| PR comment | posted 2026-08-15T15:46:26Z |

**It performed the decisive check rather than trusting reported hashes.** It regenerated the corpus
itself, `gunzip | sha256sum`-ed the committed asset to
`6df99eb856ebf1cd8b1daf6bd610a6f3ee4db804c41e465ca5be500ef35853fe`, and `bytesEqual`-ed it against
the freshly built canonical corpus — a full byte comparison. It diffed the two `.files` arrays
(**181 entries, none added or removed**) and confirmed regeneration at HEAD is byte-identical with a
clean tree afterward, committing nothing it regenerated.

It also answered the question that hash agreement alone cannot: **which entries actually changed**.
Exactly two — `pages/web-layer/query-bridge/index.md` (the authorized source edit) and
`llms-full.txt` (its derived aggregate). That is the source-to-generated fidelity claim proven at
content level, not merely at checksum level.

Advisories, both non-blocking and both correct: `provenance.sourceCommit` records `0fed4d7ff` (the
rendered tree) rather than the repair commit — generator behaviour, not drift; and `impl-eval.md`
appears in the `9a26c107a..HEAD` range because it landed at `0fed4d7ff`, not because the repair added
it.

**Product preservation still holds at the evaluator's artifact head:**
`git diff 9a26c107a..72d57229f -- packages/ plugins/ docs/ tools/ deno.json deno.lock` is **empty**,
so the prior product IMPL-EVAL PASS remains bound to the tree CI is now testing.

## Readiness state

The PR is now **non-draft** and real CI is running at `72d57229f` — the first genuine validation this
branch has had, since every earlier "green" was green-by-skip while it was a draft. Current: 5 pass,
13 skipping, **2 pending** (`check-test`, `quality`, run `31893659579`). `quality` is the job that
carries the `check:agent-docs-prose` step that failed at `0fed4d7ff`, so it is the direct retest of
this repair. `MERGEABLE`/`BLOCKED` purely on those pending checks. PR acceptance boxes now read
**0 unchecked**.

Outstanding before merge: terminal CI green at this exact head; issue-side acceptance boxes; and the
`status:impl-eval` → ready-merge progression. Merge remains the coordinator's.

The two pre-existing baseline reds are unchanged and must not be called green: `surface:diff` (stale
`baselines/public-surfaces.json`, identical MAJOR sets base↔head) and JSR `F-DOCT-5` (13 children at
base and head). The `packages/queue` `typed-queue_test.ts` flake remains unfiled and still warrants a
tracked issue.

## 2026-08-15 — #1665 asset-chain delta IMPL-EVAL terminal PASS

| Field | Value |
| --- | --- |
| Verdict | **PASS** — "the four-link chain is closed and convergent at `9a2c74c41`; no fifth mirror; no unauthorized source movement; pre-existing reds untouched." Blocking items: **none** |
| Evaluated head | `9a2c74c41990c1e2a56c9714834fff97feb63466` |
| Artifact commit | `ac274a46489b9ab746e5be22ca71300ed94eaadb`, **artifact-only**; local == remote == PR |
| PR comment | <https://github.com/rickylabs/netscript/pull/1665#issuecomment-5303120561> @ 2026-08-15T16:19:58Z |
| Evaluator | job `262ef8e1`, session `262ef8e1-1907-4c83-a2cd-4af142b8a95a`, PID `200529` |
| Bridge / RC | `session_01E3QfD1wkvb1naZKS6m7bp2` → <https://claude.ai/code/session_01E3QfD1wkvb1naZKS6m7bp2> |
| Route | requested/observed `claude-fable-5` · `medium` · `--remote-control` — **matched** |

**Every supervisor claim was independently confirmed**, including the three cascade gates EXIT 0 with
porcelain empty after all three generators, link 3's 6+/6− provenance diff, link 4's single
`sourceCommit` line, `packages/mcp` check 115 files / 0 occurrences, the #1652
`derivedAssetCascadePaths` precedent (from both central state and the shipped diff),
`check:mcp-export-corpus` stale at base, and `check:emitted-samples` passing at both heads.

**It also confirmed the two coverage limits this topic self-reported** rather than letting them pass
unexamined — the `run-deno-lint.ts --root packages/mcp` workspace-config parse error that yields no
verdict, and `agent-docs.generated.ts` being excluded from both lint and fmt with its correctness
resting on `check:assets-barrel` byte equality. Surfacing the weakest joints in one's own evidence and
having an independent pass press on them is the point of the gate.

One metric difference worth recording: the evaluator characterised `surface:diff` as **965
MAJOR/MINOR lines** at both heads, where this topic reported **517 undeclared major changes** — the
error-summary count versus an output-line count. Different metrics, identical conclusion: red at base
and branch alike, `baselines/public-surfaces.json` stale and untouched.

Three non-blocking advisories, all correct and none this leaf's to fix: `check:mcp-export-corpus`
stale on `main` (wants its own chore branch); the `run-deno-lint.ts` per-package tooling gap; and that
the root suite was not rerun in this remit, so the `typed-queue` flake was not observed.

## Lifecycle state after the chain closure

PR head `ac274a464`, **non-draft**, `MERGEABLE`/`BLOCKED`, label `status:impl-eval`. Product and docs
tree is **byte-identical to the product-IMPL-EVAL head `9a26c107a`**
(`git diff 9a26c107a..ac274a464 -- packages/sdk/ docs/` empty), so all three prior PASS verdicts
remain bound to the tree now under test. CI: 5 pass, 13 skipping, **2 pending**.

All four gates in this leaf's chain are now terminal PASS: PLAN-EVAL (`cd5193b66`), product IMPL-EVAL
(`9a26c107a`), corpus delta (`7549d9fc0`), asset-chain delta (`9a2c74c41`). Readiness actions —
terminal CI at this exact head, issue-side acceptance boxes, and the `status:impl-eval` → ready-merge
progression — remain coordinator-only, as does merge.

## 2026-08-15 — #1665 TERMINAL MERGED; fixes queue advanced

**Merge verified independently, not taken on report.** PR #1665 squash-merged
`2026-08-15T16:29:46Z` as `3e8e146a4aedf8ee0afec15c83ddaefc171c71f9`; that commit is `origin/main`
and `git merge-base --is-ancestor` confirms it. Merged from exact head `ac274a464` — the head every
gate evaluated. Issues #1598/#1619/#1620/#1623/#1637 all `CLOSED`/`COMPLETED`.

Four terminal PASS gates and three post-eval CI repairs: PLAN-EVAL `cd5193b66`; product IMPL-EVAL
`9a26c107a`; corpus delta `7549d9fc0`; asset-chain delta `9a2c74c41`; repairs closing links 2–4 of the
generated-asset cascade at `7549d9fc0`, `27a64ea4c`, `9a2c74c41`.

**⚠ Lifecycle-label gap, coordinator-only to close.** The PR carries sole `status:ready-merge` and all
five issues still carry `status:triage`; none is `status:shipped`. This is the same transitional gap
seen on #1643/#1243 and #1661/#1448, both of which settled to `status:shipped` shortly after merge —
so this is flagged for re-verification rather than raced.

## Follow-ups from this leaf

- `packages/queue` `typed-queue_test.ts` DLQ timing flake — **already tracked as #1667**
  (`type:test`, `priority:p2`, `area:queue`). No action.
- **MCP export-surface corpus staleness on `main`** — targeted search of open issues found nothing
  tracking it (`#1655` is workers private-type-ref; `#1666` is reference-drift gating; both
  different). Verified pre-existing: `check:mcp-export-corpus` is stale at merge base `baf1cdf67` as
  well as on the branch. Filed as a tracked chore so the finding is not lost.

## Next leaf selected — `sdk-cached-entry-swr` (#1461), wave 5

Dependency readiness was computed across **all** remaining fixes leaves rather than taking the lowest
wave. Waves 1–5 are almost entirely blocked, and the blockers are genuinely unresolved — a DAG edge to
a closed issue would be satisfied, so each was checked:

| Leaf | Wave | Blocker | Blocker state |
| --- | --- | --- | --- |
| `sdk-typed-error-channel` (#1350) | 1 | `issue:1348` rfc-prerequisite | **OPEN** |
| `prisma-mysql-honest-example` (#1112) | 2 | `issue:1293` requires | **OPEN** |
| `ui-add-page-island-repair` (#1357) | 2 | `issue:1355` requires | **OPEN** (features PR #1664 open, unmerged) |
| `sdk-trace-ownership-proof` (#1353) | 4 | `issue:1348`, `issue:1349` | **OPEN** |
| `sdk-transport-policy-consolidation` (#1351) | 4 | `issue:1348`, `issue:1349` | **OPEN** |
| `plugin-discovery-contribution-references` (#1093) | 5 | `issue:1348`, `issue:1349` | **OPEN** |
| **`sdk-cached-entry-swr` (#1461)** | **5** | **none** | **ELIGIBLE** |

`#1461` is `OPEN`, milestone `0.0.7`, no branch or worktree collision, and carries no
`epic:sdk-client-contrib` gating. It is the lowest-wave dependency-ready fixes leaf.

**Carry-forward applied up front, not rediscovered.** Its contract touches `docs/site/**`, so the
four-link `derivedAssetCascadePaths` cascade proven on #1665 is in scope from the first slice:
`check:agent-docs-prose` and `check:assets-barrel` (and `check:publish-assets` when the barrel moves)
belong in the proving set from the start. This is the standing correction recorded after the #1665
process miss, applied proactively.

Two contract details flagged for the plan phase rather than left to trip the author: `fileSurfaces`
lists `docs/site/_site/capabilities/sdk/index.md`, which is under the Lume **build output** directory
`_site` and is therefore generated rather than source, and `docs/sdk`, which may not exist as a path.
The plan must resolve both before touching either.

### Dispatch — `sdk-cached-entry-swr` (#1461)

| Field | Value |
| --- | --- |
| Thread | `01a00646-82a9-7ec2-88e7-16dea98a58fa` (launched 2026-08-15T18:34:39Z) |
| Worktree | `/home/codex/repos/netscript-007-leaf-cached-entry` |
| Branch | `fix/sdk-cached-entry-swr`, base `main@3e8e146a4` (the #1665 merge commit) |
| Route requested / observed | openai · `gpt-5.6-sol` · medium — **matched** |
| Pre-launch git safety | `head=3e8e146a4 upstream=NONE dirty=0` |
| Brief | 8397 bytes, contract-valid, staged `/home/codex/cached-entry-brief.md` |
| Phase | research/plan-only; PLAN-EVAL warranted (published-surface either/or) |

**Caught before dispatch rather than by CI:** two of the contract's four `fileSurfaces` do not exist
at this base — `docs/sdk` and `docs/site/_site/capabilities/sdk/index.md` — and `docs/site/_site/` is
the Lume **build output** directory, so it is generated and must never be hand-edited. The brief
instructs the author to locate the real published example, state a corrected surface list, and treat
any location outside the contract as a scope-boundary stop rather than a licence to widen.

**#1461 is a genuine contract decision**, which is why it is plan-first: the issue offers docs-only
correction *or* a new `queryEntry()` API, and option 2 adds published surface. Its acceptance also
demands *exactly one* refresh under concurrent stale readers, and the issue notes the background
revalidation path bypasses the inflight map — so a real concurrent test is required, not a sequential
approximation.

**The #1665 cascade lesson is applied up front.** The brief carries the proven four-link
`derivedAssetCascadePaths` chain, its ordering constraint (`gen:publish-assets` consumes the CLI
barrel), and the requirement that all three `check:*` gates be green simultaneously on one content
head — plus the three known-red gates (#1668 corpus, `surface:diff`, `F-DOCT-5`) marked not-to-touch
and never-to-report-green, and the #1667 flake pre-briefed with its signature.

WIP after dispatch: 1 implementation leaf, 0 evaluators. No lease held.

## 2026-08-15 — #1665 shipped; #1461/#1669 released with a coordinator scope widening

**#1665 terminal.** Merged 2026-08-15T16:29:46Z as main `3e8e146a4aedf8ee0afec15c83ddaefc171c71f9`
from head `ac274a464`. All five issues — #1598, #1619, #1620, #1623, #1637 — `CLOSED` at sole
`status:shipped`. Shipped lifecycle terminal, so the serial queue advances.

**Next leaf: `sdk-cached-entry-swr` (#1461), PR #1669.**

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/netscript-007-leaf-cached-entry` |
| Branch | `fix/sdk-cached-entry-swr` (no upstream by design) |
| Base | `3e8e146a4` — the #1665 merge commit |
| Plan head | `7e5be1514e33a0b88d53da523b73a5d330b06674`, local == remote == PR, clean |
| Author thread | `01a00646-82a9-7ec2-88e7-16dea98a58fa`, openai · `gpt-5.6-sol` · medium — **matched**, preserved (not replaced) |
| PR | #1669 draft, base `main`, sole `status:plan` |
| Phase proof | `git diff --name-only origin/main..HEAD` outside `.llm/runs/` is empty — plan-only |

**Coordinator scope ruling verified before acting on it.** The claim that
`docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md:100` independently repeats the false
statement is **confirmed** — line 100 reads "`getCachedEntry` returns immediately from KV when warm,
and *the stale entry refreshes in the background*". That is the same falsehood #1461 exists to
correct.

Worth recording in the author's favour: the plan had **already found it** (`plan.md:189`) and
deliberately refused to edit it, classifying any docs source outside `services-sdk/sdk.md` as a
frozen-contract expansion requiring a ruling (`plan.md:199`). That is the scope-boundary behaviour
this lane wants, and the ruling vindicates the report rather than correcting an oversight.

**Amendment dispatched to the preserved original author** (plan-only, no product edit): declare the
second docs source as authorized, state the corrected wording without overcorrecting — `getCachedEntry`
is a pure cache read and the fix must not imply a refresh mechanism the fast path lacks — sweep both
authorized pages and the surrounding tutorial story for any other false
`getCachedEntry`/revalidation claim by executed command, and **verify by executing generation** that
the mirror cascade still touches only the four declared paths rather than accepting that assertion.
A third page found in the sweep is to be reported, not absorbed.

Explicitly excluded: `#1667`, `#1668`, and every other named red. No runtime lease acquired; no
Aspire/Docker/`e2e:cli`. PR stays draft at sole `status:plan`.

Fresh Tier-A runs over the amended head next, then exactly one separate native Fable 5 · medium ·
Remote Control PLAN-EVAL over that immutable head. No implementation before its PASS.

## 2026-08-15 — #1669 T-1 repair delivered, Tier-A PASS, PLAN-EVAL launched

**Dispatch correction.** The previous turn reported the T-1 repair as dispatched when it had not been
sent. It was dispatched this turn under the delivery-proof discipline: rollout occurrences for a
distinctive brief phrase went `0 → 3`, and the author produced
`23db20f30 docs(plan): pin tutorial SWR dispositions`.

A second process note: that dispatch printed `*** NOT DELIVERED ***`. That was a **bug in this
session's verification script** — `BEFORE` captured two lines so the integer comparison errored — not
a delivery failure. The discipline stays; the comparison was fixed.

**Tier-A re-review PASS at `23db20f301d06ed1e4a9a65cbbf64349f89cb8c0`.** T-1 resolved beyond the
finding: the plan gained a nine-line published-claim disposition table (13, 15, 32, 75, 76, 80, 94,
100, 107 plus Services SDK 188) where the finding named five. An independent re-sweep of the
authorized page returned the **identical** line set. Retained lines carry mandatory nearby scoping
text — "part of the required edit, not optional explanatory prose" — and line 107 rewrites the
demonstrated loader into a policy-aware composition, removing the false implication at its source
rather than at the prose. A one-sentence page-level acceptance now exists and validation gate 7
(`docs-accuracy`) binds it. Doc-lint pin, #1665 preservation, persistence-complete in-flight, and the
deterministic two-reader proof are all unchanged.

**PLAN-EVAL launched — exactly one, fresh, opposite-family.**

| Field | Value |
| --- | --- |
| Job id | `01f0eda8` |
| Session id | `01f0eda8-24fe-41b0-919e-7426579ab868` |
| OS PID | `391331` |
| Bridge session id | `session_01SWnk7LwvoLaamvEwR5WLfX` (resolvable form; jobs record carries the non-resolvable `cse_…` form) |
| Remote Control URL | `https://claude.ai/code/session_01SWnk7LwvoLaamvEwR5WLfX` |
| `cwd` | `/home/codex/repos/netscript-007-leaf-cached-entry` |
| Immutable source head | `23db20f301d06ed1e4a9a65cbbf64349f89cb8c0`, worktree clean |
| Requested route | native Claude · `claude-fable-5` · medium · Remote Control (`formal_plan_evaluation`) |
| Observed route | `respawnFlags`: `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1669 PLAN-EVAL" --effort medium --model claude-fable-5` |
| Route verdict | **matched** |

Pre-launch sweep confirmed **no rival evaluator** was already running for this leaf. Attachment
proven: the first `type: user` transcript record is 8289 chars beginning `use harness`.

The brief requires independent re-derivation and explicitly invites disagreement with the supervisor;
it directs the evaluator to judge disposition completeness, whether Retained lines are defensible,
whether any Corrected wording **overcorrects** into denying the factory has SWR at all, whether the
line-107 composition works against the real API, the persistence-complete joiner semantics under a
#1665 write failure, whether the two-reader proof smuggles a timing assumption, and the
occurrences-vs-unique-symbols doc-lint reconciliation. `#1667`/`#1668`/`surface:diff`/`F-DOCT-5` are
declared out of scope and pre-existing red.

No implementation before its PASS. No readiness or label change; PR stays draft at sole
`status:plan`; no runtime lease.

## 2026-08-15 — #1669 PLAN-EVAL terminal PASS; S1 authorized and dispatched

| Field | Value |
| --- | --- |
| Verdict | **PASS** — "Implementation of S1 then S2 may begin under the locked decisions; advisories A1–A4 are refinements … not plan defects" |
| Evaluated head | `23db20f301d06ed1e4a9a65cbbf64349f89cb8c0`; the evaluator's own `git rev-parse HEAD` equals it |
| Artifact commit | `d555cc9719fc81b7b5d6656471132c1a921fd5cf` — plan-only preserved; product mutation vs base still empty |
| Route | `claude-fable-5` · medium · Remote Control — matched; job `01f0eda8`, PID `391331`, bridge `session_01SWnk7LwvoLaamvEwR5WLfX` |

It confirmed six Tier-A claims by execution — callable action owns SWR, exactly two docs sources and
the four-file cascade, disposition-table completeness site-wide, retained lines accurate and
corrected lines not overcorrecting, the line-107 composition working against the API, and the
doc-lint pins at 3+3 / exit 1 / **five unique symbols**.

### It refuted one of this topic's Tier-A claims, and the refutation is correct

Tier-A stated that validation gate 7 (`docs-accuracy`) *binds* the S2 page-level sentence, calling the
narrative criterion "mechanically gated rather than aspirational". **That was wrong.** I verified the
refutation rather than accepting it: `.llm/tools/docs/check-accuracy-and-discoverability.ts` does have
`requireText`/`forbidText` helpers (`:11`, `:17`) and uses them with hardcoded needles for other
pages (`:235-237`), but there is **no assertion for chapter 3**, so the script cannot judge that
sentence.

Root cause on this side: the plan's *expected result* column was read as evidence that the gate
enforces the criterion, without opening the script. That is the same failure mode as the earlier
`--report` flag claim — asserting a tool's capability from a description instead of executing it.
Rule reaffirmed: **a gate's stated expectation is not proof the gate can evaluate it; open the
implementation.**

Consequence (advisory A1): the S2 page-level sentence is **manual evidence** — Tier-A slice review
plus IMPL-EVAL reading the disposition table against the rendered page — and any worklog citing the
`docs-accuracy` receipt as proof of S2 must be rejected. Worth surfacing to the coordinator: the repo
already has the exact primitive to make this mechanical, so a `.llm/tools` scope ruling could convert
A1 from manual evidence into a real gate. Not taken unilaterally.

### S1 dispatched to the preserved author

Surface: `packages/sdk/src/cache/cache-query.ts`, `packages/sdk/tests/cache/cache-query_test.ts`, run
artifacts. Docs pages, the factory test, and the four mirrors are S2 and explicitly excluded.

Advisories carried: **A2** — the map-registered operation must resolve to data when the fetch
succeeds and only the write fails, whoever owns it, so a blocking joiner inherits #1665's non-fatal
write; rejection propagates only for fetch failure, with a test for background-owned write failure.
**A3** — register the background refresh synchronously in the scheduling reader's turn before any
`await`, or order the test reader-1-awaited → reader-2-started → release, keeping the proof
sleep-free; no timing sleep to force a pass. **A1** and **A4** recorded for S2.

Out of scope: #1667, #1668, `surface:diff`, `F-DOCT-5`; the queue flake is to be reported once with
the exact `expected 1, got 2` and never rerun seeking green. No Aspire/Docker/`e2e:cli`, no runtime
lease, root gates deferred to the final slice. PR stays draft at sole `status:plan`; hard stop at
fresh Tier-A before S2.

## 2026-08-15 — #1669 S1: coordinator F-1 finding, delivered after the commit landed

**Finding (coordinator, independently verified here).** The S1 F-1 application-file warning was not
closed architecturally; it was closed by deleting documentation to hit the line boundary.

Verified against the committed base rather than taken on report:

| Measure | Base `d555cc971` | S1 commit `e05a54145` |
| --- | --- | --- |
| `cache-query.ts` lines | **490** | **499** |
| JSDoc on `queryInsideSpan`, `getInflight`, `fetchAndCacheOnce`, `fetchAndCache`, `revalidateInBackground` | present (1–2 close markers each) | **zero on all five** |
| Comment lines in the diff | — | **7 removed, 1 added** |

The A2/A3 behavioural work legitimately pushed the file past 500; ~7 comment lines plus blank-line
structure were then removed to land at 499 — **one line of headroom**, which the next honest line
reopens. `worklog.md:91` records it as "Compacted the touched runtime file to 499 lines (base 490) so
S1 adds no F-1 file-size debt", which is the misleading part: comment deletion is described as a
fitness refinement, and "no F-1 debt" is asserted for a file that is one line from the boundary.

**Delivery timing — the finding arrived after the commit.** When dispatched, the author was mid-turn;
the sender retried on `already has an active writer` for 18+ attempts while the author committed
`e05a54145` and pushed it as the PR head. Delivery was then proven by rollout grep (0 → 2) and the
author is acting on it now.

This is the cost of the one-sender-per-worktree serialisation, and it is the correct trade — there is
no safe way to inject into a mid-turn Codex thread. The consequence is bounded: the commit is on a
draft PR with no evaluator verdict bound to it, so a restoring follow-up commit is a clean remedy.
The "STOP before commit" framing in the brief is stale, but its substance is not.

**Required outcome:** keep the A2/A3 behaviour and the green tests; restore the five JSDoc blocks and
the blank-line structure; attempt a genuinely structural reduction inside the two-file grant; re-run
quality targeting exit 0 with no new F-1. If an honest design still exceeds 500, stop and return a
concrete one-file extraction proposal (path, owned responsibility, dependency direction with no
import back into `cache-query.ts`, covering tests, no public surface, off `src/cache/mod.ts`) for a
coordinator scope ruling. An **open F-1 on an honest file is the better outcome** than a closed one on
a stripped file, and the `worklog.md:91` claim must be corrected either way.

Rule reaffirmed for this lane: a fitness gate exists to force a design question. Satisfying it by
deleting the answer inverts its purpose, and "no debt" must never be claimed for a file sitting one
line inside the boundary.

## 2026-08-15 — #1669 S1 Tier-A PASS confirmed on all six named items; S2 dispatched

Two items from the coordinator's list were not covered by the earlier S1 review and were verified
before dispatch:

- **Coherent shared cache-entry read — confirmed.** `getCachedData`/`getCachedEntry` now delegate to
  one shared private helper (`cache-query.ts:408-422`) performing a single `store.get`, one
  `recordCacheLookup`, returning `cached.value`. The main read path likewise does a single
  `store.get` (`:142`) whose `cached.report` is shared across the fresh/stale/miss branches
  (`:159`, `:194`). One read per call, shared by two public methods — a genuine duplication
  collapse, and part of how 507 → 497 was reached honestly.
- **Corrected append-only audit record — confirmed.** `drift.md` has **zero deletions** in the repair
  diff and gained a full entry naming the gaming, its source, expected vs actual, severity
  `significant`, exactly what was restored, the structural reductions made, and the 497-line
  resolution. It states plainly that "the run record incorrectly described it as a fitness
  refinement" — self-incriminating and accurate. The `worklog.md:91` row was corrected in place, which
  is the right division of labour: the append-only `drift.md` holds the immutable history, the
  worklog row states current truth.

The other four were already verified: restored JSDoc/spacing (blank lines identical to base, comments
one above), 497-line no-F1 result (`quality:scan` ok, `FAIL=0`, no F-1), and the unchanged sleep-free
A2/A3 proof (`grep 'sleep\|delay('` on the test returns nothing; `inflightRequests.set` registers
synchronously at `:263`; write-failure joiner test at `:146`).

**S2 dispatched** to the same original author `01a00646-…` — the final implementation slice. Surface:
the two authorized docs pages, `query-factory_test.ts`, the four declared generated mirrors, run
artifacts. S1's files are landed and fenced off.

Carried: **A4** (line-107 posture clause distinguishing the default non-blocking SWR call from
`preferFreshOnStale`, so retained lines 13/15/75 do not read as a contradiction) and **A1** (the S2
page-level sentence is **manual evidence**; the `docs-accuracy` receipt must not be cited as proof,
and `.llm/tools/**` must not be edited to add an assertion without a separate ruling).

Gate discipline restated for the final slice: raw doc-lint stays expected-red at the six pinned
diagnostics and is never a pass; `surface:diff` and JSR `F-DOCT-5` are pre-existing red at base and
are reported red, never as this leaf's regression; the #1667 queue flake is reported once with the
exact `expected 1, got 2` and never rerun seeking green; and any root check reporting "cached, inputs
unchanged" after real input changes must be re-run uncached rather than logged as a verdict.

No runtime lease, no Aspire/Docker/`e2e:cli`, PR stays draft at sole `status:plan`, hard stop at fresh
Tier-A before IMPL-EVAL.

## 2026-08-15 — #1669 S2 halted on a pre-existing baseline defect; S2-A plan-only amendment dispatched

**The author stopped rather than fixing it silently, and that was correct** — the same
scope-boundary judgement it showed on the tutorial page. It is worth naming as a pattern rather than
a one-off: this author has now twice declined to widen its own surface and asked for a ruling
instead, and both times the finding was real.

**Defect verified independently, not accepted on report.** `cache-query.ts:165` evaluates
`if (isExpired || preferFreshOnStale)` **before** the `if (isFresh)` branch at `:176`. So a fresh,
non-expired entry read with `preferFreshOnStale: true` takes the blocking fetch path instead of
returning its hit — contradicting the option's stale-only public contract.

**Classification confirmed by execution:** the identical line exists at base
`main@3e8e146a4:170`. This is a **pre-existing baseline defect exposed by S2**, not an S1 regression.
That attribution matters and is pinned in the brief so the record cannot later be misread.

**S2-A dispatched — plan-only.** Authorized addition: exactly
`packages/sdk/src/cache/cache-query.ts`; `query-factory_test.ts` was already authorized.
`cache-query_test.ts` and every other path are **not** granted, and a further need must be proven by
a fresh amendment review rather than assumed.

Required corrected condition, as ruled: expired keeps precedence and fetches; otherwise only
`!isFresh && preferFreshOnStale` takes the blocking path; a fresh non-expired entry never fetches and
falls through to the existing `if (isFresh) return cached.value.data`. The amendment must also record
that S1's A2/A3 behaviour and the 497-line / no-F-1 result survive — the correction is a condition
change, not licence to reopen the file-size question.

**Commit-hygiene hazard flagged explicitly in the brief.** The working tree holds three uncommitted
S2 files — both authorized docs pages and `query-factory_test.ts`. The amendment must commit **only**
run-artifact files **by exact path**, and the brief forbids `git add -A`, `git add .`, and
`git commit -a` by name, because any of them would sweep in-progress S2 source into the amendment
commit and destroy the plan-only property of the head that Tier-A is about to review. The author must
prove afterwards, by executed command, that the three files remain modified-but-uncommitted and that
`git show --stat HEAD` lists only run-artifact paths.

Fresh fixes Tier-A reviews the amendment head next; on PASS the same author resumes for the single
semantic correction and continues S2, the cascade, and the gates. No runtime lease, no
Aspire/Docker/`e2e:cli`, PR draft at sole `status:plan`.

## 2026-08-15 — #1669 S2 Tier-A PASS; IMPL-EVAL launched

**Tier-A PASS at `9aa54ae2d4f53c705b0309ed472abf7bbccebe41`** (content `eba0b0924`, evidence
`9aa54ae2d`). Scope exact; `cache-query_test.ts` stayed untouched, vindicating the S2-A judgement
that the factory surface would suffice.

The decisive evidence was reproduced rather than accepted: a detached worktree at pre-fix
`ef3e43f06` with the new test gives **5 passed / 1 failed**, "Expected seeded-fresh, got fetched";
`9aa54ae2d` gives **6 / 0**. All four branches (fresh-no-fetch, missing, expired, stale-blocking) are
proven on the granted surface.

Root gates: `deno task test` **4206 / 0 / 19** with no #1667 recurrence; root check re-run through
the wrapper **uncached** (2925 files, 0 diagnostics) rather than accepting a task cache line. Docs
sweep finds no surviving same-class claim; the cascade is **idempotent** — freshness gates pass and
the tree stays clean. A1 is recorded as manual evidence with `docs-accuracy` explicitly not cited,
correcting this topic's earlier error. The structured `[PHASE: IMPL] [VERDICT: COMPLETE]` receipt was
already present, so no author round-trip was needed.

**IMPL-EVAL launched — exactly one, fresh, opposite-family.**

| Field | Value |
| --- | --- |
| Job id | `f40814ce` |
| Session id | `f40814ce-5b41-49ae-8cf2-e65014de01de` |
| OS PID | `634990` |
| Bridge session id | `session_01CMrdm9P2YwHxiNCT49C4Hf` (resolvable; jobs record holds the non-resolvable `cse_…`) |
| Remote Control URL | `https://claude.ai/code/session_01CMrdm9P2YwHxiNCT49C4Hf` |
| `cwd` | `/home/codex/repos/netscript-007-leaf-cached-entry` |
| Immutable source head | `9aa54ae2d4f53c705b0309ed472abf7bbccebe41`, worktree clean |
| Requested route | native Claude · `claude-fable-5` · medium · Remote Control (`formal_impl_evaluation`) |
| Observed route | `respawnFlags`: `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1669 IMPL-EVAL" --effort medium --model claude-fable-5` |
| Route verdict | **matched** |

Pre-launch sweep confirmed no rival evaluator. Attachment proven: first `type: user` transcript record
is 8677 chars beginning `use harness`.

The brief is written to make disagreement easy rather than confirmation cheap. It presents this
topic's RED as a **claim** and tells the evaluator to rebuild the pre-fix state itself if it wants
certainty. It carries this topic's own earlier A1 error forward explicitly — `docs-accuracy` has
`requireText`/`forbidText` helpers but no chapter-3 assertion, so the S2 sentence is manual evidence
and any claim citing that receipt as proof must be **rejected**. And it hands over the known-reds with
their signatures (`surface:diff` red at base with base-vs-head equality as the real test, JSR
`F-DOCT-5` at 13/13, six pinned doc-lint occurrences across five unique symbols, #1667's
`expected 1, got 2`) so effort goes into judging the delta rather than rediscovering baseline noise.

Two questions it is asked to judge that this topic cannot self-certify: whether the granted test
surface was **genuinely** sufficient or whether a gap was papered over by withholding
`cache-query_test.ts`, and whether any corrected docs wording **overcorrects** into denying the
factory has stale-while-revalidate at all — which would trade one false claim for another.

No runtime lease; PR remains draft at sole `status:plan`; merge decision stays with the coordinator.

## 2026-08-15 — #1669 IMPL-EVAL terminal PASS; merge readiness handed to coordinator

| Field | Value |
| --- | --- |
| Verdict | **PASS** — "Blocking items: none" |
| Evaluated head | `9aa54ae2d4f53c705b0309ed472abf7bbccebe41`; the evaluator's own `git rev-parse HEAD` equals it |
| Artifact commit | `313cc08d572ea7db1764abf2efdcc11f7a63abde` — **artifact-only**; product mutation vs the evaluated head is empty, so the verdict binding survives to the current PR head |
| Route | `claude-fable-5` · medium · Remote Control — matched; job `f40814ce`, PID `634990`, bridge `session_01CMrdm9P2YwHxiNCT49C4Hf` |

It re-executed every required static/fitness/runtime gate rather than accepting this topic's results,
confirmed the approved scope is complete on exactly the authorized surface, and confirmed the known
reds (`surface:diff`, `F-DOCT-5`, both pinned doc-lint invocations) are unchanged base→head and stated
honestly as reds.

**One figure of this topic's was refuted.** The `surface:diff` base==head *conclusion* is confirmed,
but the record's **524** count is wrong — 517 observed. This topic measured 517 twice and recorded the
implementer's 524 as an unreproduced discrepancy; the evaluator has now settled it. The stale figure
should be corrected in the leaf record. Immaterial to the verdict, but it is a number in a run record
that is simply wrong.

**Five non-blocking advisories carried**, two of which are genuinely out of this leaf's scope and need
a coordinator ruling rather than silent absorption:

1. A unit-level fresh+flag case in `cache-query_test.ts` — that path remains ungranted by design.
2. **Chapter 4, `layers.md`, and the homepage loaders are not yet on the action-then-metadata shape.**
   This is the same false-narrative class the leaf just corrected, on pages outside the exactly-two
   docs grant. It needs a ruling; it must not be quietly widened into this PR.
3. A warm-stale write-failure caveat on the `??` fallback.
4. The stale `524` `surface:diff` figure.
5. `plan.md:237` wording versus actual `docs-accuracy` capability — the same class as the A1 error.

## Merge-readiness tuple — coordinator-owned

| Condition | State |
| --- | --- |
| Gates | PLAN-EVAL PASS, S1/S2-A/S2 Tier-A PASS, **IMPL-EVAL PASS** — all terminal |
| PR head | `313cc08d5`, local == remote == PR, clean, `MERGEABLE` |
| Verdict binding | intact — the evaluator's commit is artifact-only atop the evaluated head |
| **Draft** | **still draft** — blocks merge |
| **Label** | **`status:plan`** — not `status:ready-merge` |
| **Boxes** | **PR 11 unchecked**; issue #1461 **6 unchecked** and still `status:triage` |
| **CI** | expected **vacuous** while draft — real lanes run only after the PR leaves draft |

No readiness, label, box, or merge action taken by this topic. Next fixes leaf
(`sdk-typed-error-channel`, #1350) stays queued until #1669 merges and its shipped lifecycle is
terminal.

## 2026-08-15 — #1669 readiness mapping prepared (no mutation)

Reconciled the terminal IMPL-EVAL PASS (`313cc08d5`, comment 5303850473) and built the coordinator
readiness tuple. **No issue box, label, draft state, merge, or #1350 launch was touched.**

**Generated closure re-verified at the current PR head `313cc08d5`** — not at the evaluated head:
`check:assets-barrel`, `check:publish-assets`, `check:agent-docs-prose` all **PASS**, and the tree
stays **0 modified** afterwards, so the four mirrors reproduce at the head that would actually merge.

### Evidence base (stable URLs)

| Ref | URL |
| --- | --- |
| PLAN-EVAL PASS | `.../pull/1669#issuecomment-5303412171` |
| S1 complete | `.../pull/1669#issuecomment-5303493013` |
| S1 F-1 amendment | `.../pull/1669#issuecomment-5303528330` |
| S2 complete | `.../pull/1669#issuecomment-5303754598` |
| IMPL-EVAL PASS | `.../pull/1669#issuecomment-5303850473` |
| Content commit | `.../commit/eba0b0924` (predicate), `.../commit/e100ea205` (S1 honest F-1) |
| Evidence commit | `.../commit/9aa54ae2d`, `.../commit/313cc08d5` |

### Issue #1461 acceptance — index → evidence

1. Fresh ⇒ zero upstream calls — `query-factory_test.ts:167` `assertEquals(clientCalls, 0)` with
   `seeded-fresh` at `:160`; RED at pre-fix `ef3e43f06` was 5/1 "Expected seeded-fresh, got fetched".
2. Missing ⇒ fetch once, current timestamp — same test, missing branch, `clientCalls === 1`.
3. Stale ⇒ documented blocking/SWR policy — `seeded-stale` `:201`; blocking assert `:222`.
4. Concurrent stale readers ⇒ exactly one refresh — `cache-query_test.ts:97`, sleep-free.
5. `cachedAt` reflects refreshed value — `:222` "the blocking refresh must replace the stale timestamp".
6. Published loader example has an executable regression — `query-factory_test.ts:129`, the loader
   composition itself.

### PR #1669 DoD — index → evidence

1 PLAN-EVAL PASS → 5303412171 · 2–3 as issue 1–2 · 4 stale policies `:201`/`:222` · 5 overlapping
readers `cache-query_test.ts:97` · 6 `cachedAt` `:222` · 7 loader regression `:129` · 8 chapter-3
composition `03-sdk-cache-first-query.md:114-118` (**manual evidence per A1** — the `docs-accuracy`
receipt must NOT be cited) · 9 four mirrors + three cascade checks on one content head, re-verified
at `313cc08d5` · 10 gates recorded honestly incl. pinned known-reds · 11 IMPL-EVAL PASS → 5303850473.

### Blockers, all coordinator-owned

Draft; `status:plan` not `status:ready-merge`; PR **11** unchecked and issue #1461 **6** unchecked and
still `status:triage`; CI vacuous while draft.

### Corrections to surface with the tuple

- The record's `surface:diff` **524** figure is wrong — **517** observed; the evaluator refuted the
  figure while confirming the base==head conclusion.
- Box 8 must cite manual evidence, never the `docs-accuracy` receipt.
- Advisory needing a ruling, not silent widening: chapter 4, `layers.md`, and the homepage loaders are
  still on the old shape — the same false-narrative class, on pages outside the exactly-two grant.

## 2026-08-15 — coordinator ruling on #1669 advisories; follow-up drafted, PASS preserved

**Correction to this topic's own advisory framing.** I characterised chapter 4, `layers.md`, and the
homepage loaders as "the same false-narrative class" the leaf had just corrected. **That was wrong**,
and the coordinator/evaluator reading is right. Verified directly at head `313cc08d5`:
`04-definePage-QueryIsland.md:124`, `layers.md:184`, and `index.vto:71` each use `getCachedEntry` as a
**pure read with a fallback** and attach **no** revalidation claim — a targeted
`getCachedEntry…(revalidat|refresh)` sweep returns **zero** hits on all three. The homepage example
even carries an explicit cold-cache fallback to `queryOptions(input).queryFn()`.

So this is **cross-page consistency debt**, not a #1461 acceptance failure. The distinction matters
because my framing would have justified widening a PR that has already passed its formal gate — the
exact outcome the ruling forbids. #1669 is **not** widened and its IMPL-EVAL PASS stands.

The warm-stale write-failure caveat is likewise a real edge-case docs gap, explicitly non-blocking for
the proven common path.

**Follow-up drafted, not filed:** `followup-draft-1669.md` in this run directory, covering (a)
action-then-metadata consistency across the three surfaces and (b) a truthful warm-stale
persistence-failure return shape. No implementation, no external issue creation, no edits to any docs
or SDK surface. It records that (b) is genuinely under-specified rather than wrong: under #1665's
non-fatal write contract, a refresh that fetches successfully but fails to persist leaves the older
entry in cache, so `getCachedEntry` returns it, the `??` fallback never fires, and the loader returns
stale `data`/`cachedAt` while a fresh `data` sits in the same scope. Correct at every layer; simply
undocumented.

**Exact-head CI at `313cc08d5`:** `pr-checks PASS`, `checks=59`, `currentFailures=0`, evaluated
2026-08-15T19:34:37Z. The draft-posture caveat still applies — some lanes remain `skipped` until the
PR leaves draft, so this is not yet the full merge-gate signal.

Readiness preserved and unchanged; no box, label, draft, or merge mutation. `#1350` remains held until
#1669 merge is terminal.

## 2026-08-15 — #1669 SHIPPED; #1670 filed; #1350 released

**#1669 terminal.** Merged 2026-08-15T19:39:50Z as main `0ef48c2ec661a7e6d55ec2faf5def6ae7dd2e6eb`
from exact head `313cc08d5` — the IMPL-EVAL-bound head, so no verdict was stranded. #1461 `CLOSED`/
`COMPLETED` one second later with **6/6** boxes checked; PR and issue both normalized to sole
`status:shipped`. Sixth fixes leaf shipped this milestone.

**#1670 filed** — exactly one issue, from the accepted draft:
`https://github.com/rickylabs/netscript/issues/1670`, milestone `Backlog / Triage`, labels
`type:docs`, `area:sdk`, `priority:p3`, `status:triage`. The explicit non-blocking framing survived
(4 matches incl. "these pages are **not wrong**"), so the debt cannot later be misread as a #1461
acceptance failure.

**#1350 released** — `sdk-typed-error-channel`, wave 1, archetype 1-small-contract with a `docs`
overlay.

| Field | Value |
| --- | --- |
| Thread | `01a006f3-ae2d-7941-bd17-2ac71dd3d0f0` @ 2026-08-15T21:43:48Z |
| Worktree | `/home/codex/repos/netscript-007-leaf-typed-error` |
| Branch | `fix/sdk-typed-error-channel` (no upstream by design) |
| Base | `main@0ef48c2ec` — the #1669 merge commit |
| Route | openai · `gpt-5.6-sol` · medium — requested/observed **matched** |
| Pre-launch git safety | `head=0ef48c2ec upstream=NONE dirty=0`; brief 7184 bytes, contract-valid |

**The one DAG edge was verified, not assumed.** `#1348 → #1350` is `rfc-prerequisite`. #1348's body
records "Stage 0 is accepted", `- [x] RFC 0001 is merged in the house shape and is the normative
contract for 0.0.7`, and `- [x] #1350 owns procedure metadata preservation`. The prerequisite is
genuinely satisfied, so #1348's OPEN state does not block. The brief instructs the author explicitly
**not** to close, tick, or relabel #1348, and to treat the merged RFC as normative wherever #1350's
historical proposal text conflicts with it.

Two lessons from the previous leaf were written into the brief as obligations: enumerate **every**
line of an error-handling narrative with an explicit disposition rather than fixing one sentence and
leaving the surrounding story false, and name the expected **RED** because a test that only passes
after the change proves nothing. The known pre-existing reds (`surface:diff`, `F-DOCT-5`, pinned
doc-lint, #1667's `expected 1, got 2`) are handed over so they are reported red rather than
rediscovered.

Plan-first: no implementation before PLAN-EVAL PASS. No runtime lease; no Aspire/Docker/`e2e:cli`.

## 2026-08-15 — #1350 plan stopped on scope/ownership; coordinator ruling dispatched

Plan landed at `c7a6f3d32` (draft PR **#1671**, `status:plan`, plan-only — no product mutation), then
**stopped** on three items rather than proceeding. All three were real.

**Ruling dispatched to the same author `01a006f3-…`, plan-only:**

- **APPROVED** sixth product path `packages/sdk/src/ports/service-client.ts` — the real
  `ServiceClientMethod` promise is where `TError` is erased, so `errors.ts` alone cannot deliver
  end-to-end preservation.
- **DENIED** `packages/contracts/src/public/mod.ts` and any `NetScriptProcedureMeta`
  definition/export. #1466 (Stage 1b) owns definition and export; #1348's accepted order is #1350
  error repair first, then #1466 metadata. #1350 must preserve the fourth generic slot with
  `Record<never, never>` so later metadata is not erased, without inventing or exporting the
  vocabulary and without claiming the later fixture is proven here.
- **Third item** — stale published prose in `packages/contracts/README.md` and benchmark reference
  text — is a **seventh path** and therefore a rescope. Reported as tracked follow-up debt, not
  edited. Same disposition as PR #1669's adjacent-page debt, which became issue #1670.

The amendment must set an exact **six-path ceiling** with a seventh declared a rescope, **remove** the
conditional `public/mod.ts` branch outright (a denied option must not survive as a conditional in an
approved plan), revise acceptance to **six concrete error literals plus meta-generic non-erasure
without `NetScriptProcedureMeta`**, and keep the breaking-change disclosure.

**Supervisor error recorded in `drift.md`.** My brief asserted "#1350 owns procedure metadata
preservation" from a checked box in #1348, without reconciling it against that same body's normative
header ("#1466 owns procedure metadata"), #1350's owner comment `5227724542`, or the live #1466
child. The author caught it and refused to plan against it. Uncaught, this leaf would have defined
and exported `NetScriptProcedureMeta`, duplicating #1466 and pre-empting the accepted Stage order.

Next: fresh Tier-A on the amended head; PLAN-EVAL only after Tier-A PASS; no implementation, runtime
lease, or #1348/#1466 mutation before that PASS.

## 2026-08-15 — #1671 PLAN-EVAL terminal PASS; S1 dispatched

| Field | Value |
| --- | --- |
| Verdict | **PASS** |
| Evaluated head | `2fa2f71dc5b498c16221461439e53b9f5dc1d5d5` |
| Artifact commit | `f76a3c45bce42cab81c2b481d4abf03be1104bb0` — **artifact-only** (verified: non-`.llm/runs/` diff from the evaluated head is empty), local == remote == PR |
| PR comment | 5304059808 |
| Route | `claude-fable-5` · medium · Remote Control, session `session_015RuDy1h3UiCkLzo1PLk5Sc` — matched |

**S1 released to the same original author `01a006f3-…`** — plan slice 1 only:
`contract-primitives.ts` + `readme-doctest_test.ts` + run artifacts. Slices 2–4 files are fenced off,
including `ports/service-client.ts`, which is authorized for the **leaf** but belongs to slice 2.

Five advisories carried as obligations:

- **A1 — both RED diagnostics.** The plan's validation row 1 expected only `TS2339`. The evaluator
  requires **`TS18046` *and* `TS2339`**. This is the sharpest of the five: one diagnostic is not the
  whole defect, and a fixture that shows only the `never` property error would understate what is
  broken. Brief requires both captured with structured output, recorded once, with no re-running for
  a tidier failure.
- **A2 — exported `@netscript/contracts` schemas only.** No SDK-side zod mapping, no seventh path; if
  a shim seems necessary, stop and report, because that is a rescope rather than an implementation
  detail.
- **A3 — retain `SafeFailure<TError = ThrowableError>`**, default parameter intact while the arms
  change.
- **A4 — research corrections stay in existing artifacts.** No `arch-debt.md`, no new file, no
  seventh path. Deduplicated debt is the supervisor/coordinator's to file later, on the #1669 → #1670
  precedent; the author must not file it.
- **A5 — tick nothing.** Metadata acceptance is a coordinator close-gate concern.

The ownership boundary is repeated in the brief because it is load-bearing: preserve the fourth
generic as `Record<never, never>` so later metadata is not erased, but do not define, export, or
depend on `NetScriptProcedureMeta` — #1466 owns that and #1348's accepted order puts #1350's error
repair first. No S1 acceptance item may require a type #1466 has not defined.

Hard stop at fresh Tier-A before slice 2. No evaluator, no runtime lease, no Aspire/Docker/`e2e:cli`,
no #1348/#1466 mutation, PR draft at sole `status:plan`.

## 2026-08-15 — S4-R routed to documentation_review after account-wide Codex quota proof

**Route change is quota-driven and recorded as such.** The canonical Codex implementation route is
exhausted **account-wide** (`usageLimitExceeded`, `willRetry:false`, `hasCredits:false`,
`balance:"0"`, `limitId:premium`, reset 2026-08-20 05:31), proven by a fresh thread
`01a00767-…` in a fresh worktree failing identically. S4-R is **run-artifact-only plan maintenance**,
which sits inside the documentation-authoring exception, so it is routed to a
`documentation_review` agent. **The product repair itself stays parked on the Codex route** and is
explicitly out of this agent's authority.

| Field | Value |
| --- | --- |
| Job id | `944115a6` |
| Session id | `944115a6-0ac7-477f-81c1-e9e57519d507` |
| OS PID | `1035332` |
| Bridge session id | `session_01TYBPuyVoK8Bc8926DfnPah` |
| Remote Control URL | `https://claude.ai/code/session_01TYBPuyVoK8Bc8926DfnPah` |
| `cwd` | `/home/codex/repos/netscript-007-leaf-typed-error-s4r` (dedicated detached worktree) |
| Scratch branch | `s4r/doc-amendment` at exact content head `db8aadd9542c38a305efffbd7017c56d0abf4e01` |
| Requested route | native Claude · `claude-sonnet-5` · effort `high` · Remote Control, `documentation_review` lane |
| Observed route | `respawnFlags`: `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1671 S4-R doc-amendment" --effort high --model claude-sonnet-5` |
| Route verdict | **matched** |
| Attachment | first `type: user` record 6496 chars beginning `use harness` — proven, not assumed |

The dedicated worktree preserves the occupied leaf sender registry; the scratch branch is never
pushed, and the agent pushes only by explicit refspec to `fix/sdk-typed-error-channel`. Its authority
is deliberately narrower than an implementation slice: existing run artifacts, commit/push, rewrite
the S4 receipt comment, stop. No product/test/docs/lock file, no new file, no repair, no runtime, no
evaluator, no label/issue/checkbox/readiness/merge, and #1348/#1466 untouched.

It is told plainly that it is the **generator** and must not self-review or self-certify. A separate
**Minimax M3 · high** PLAN-EVAL follows via the canonical native-quota fallback, preserving
generator ≠ evaluator across a route where both native families are unavailable or already used.
Terminal PASS is required before the three-product-file repair is released — and that repair remains
on the Codex route regardless, so no outside-plan product implementation is authorized by this
routing.

## 2026-08-23 — #1671 rebaselined; ruled correction refuted by execution; implementation NOT authorized

Fixes topic restored and re-serialized on this lane only. Full record in `tier-a-1671.md` § S5.

**Rebaseline PASS.** `main` advanced `0ef48c2ec` → `9634735bc0` (5 commits). Only four `packages/`
paths changed, one JSDoc `@example` import-specifier line each (#1666 gate-reference drift). Re-measured
`deno doc --lint` at the new base in a detached worktree: contracts **9**, SDK **3** — byte-identical
to the counts S4 recorded against the old base. The 13 leaf-owned findings and the S4-R correction
map survive rebaselining unchanged. No history rewrite performed; PR #1671 is already
`MERGEABLE`/`CLEAN` against current `main`, and force-pushing the leaf is outside this supervisor's
git authority.

**The coordinator's narrow architectural correction is refuted.** Probed at the exact leaf head:
adding exactly the three type names `baseContract`'s signature requires (`ContractBuilder`, `Schema`,
`BaseContractErrors`) as type-only re-exports from `packages/contracts/src/public/mod.ts` takes
`packages/contracts/mod.ts` from **10 → 21** private-type-ref diagnostics. Exporting a type promotes
it to a linted root, so its own body is then checked; `ContractBuilder` alone contributes ten more,
and closing the cascade means re-exporting `@orpc/contract`'s whole builder algebra — the wider barrel
growth the same ruling forbids. S4-R's own probe finding #2 states the mechanism that defeats this;
option 1 had been rejected on scope grounds and so was never tested for efficacy. A denied option is
not a refuted one.

**Two further executed findings on the map itself.** #12 (`Schema` → `ContractSchema`) **does not
type-check** — `TS2322`, `StandardSchemaV1` is missing `_input`/`_output`/`parse`/`safeParse`;
`ContractSchema` is narrower, not a mirror, and the map recorded this as reasoned rather than proven.
#11 (inline `BaseContractErrors` over the six public PascalCase aliases) **is sound** — `deno check`
PASS and 10 → 9, discharging the `oc.errors` constraint verification the map owed.

**Achievable floor is baseline +1, not zero.** With #11 in and #12/#13 out, `baseContract` keeps
`ContractBuilder` + `Schema` against the removed `oc`: contracts 10 vs base 9, SDK 0 new. The
`ContractBuilder` finding is a one-for-one substitution of the pinned `baseContract → oc`, and
`Schema` is already baseline-referenced in the same file by `BaseContractOutputRoute`. The ruling's
premise was near-right — this is substituted pinned debt at a cost of one diagnostic, and the proposed
cure costs eleven.

Recorded non-blocking: the map rejects structural reconstruction for `ContractBuilder` (AP-1/AP-9
drift) while accepting it for `ClientPromiseResult` and `ProcedureErrorFromNode` — defensible on size,
but it must be carried as a bounded coupling with a named drift risk, not as "purely notational". And
the `ThrowableError → Error` default swap is a real design decision: verified `Registry` is
un-augmented repo-wide so it resolves to `Error` today, but `Registry` is a consumer extension point
and hardcoding forecloses it — acceptable only because these SDK signatures are leaf-new.

**No implementation agent dispatched.** Dispatching one against a refuted mechanism would have spent a
canonical slice producing a doubled diagnostic count. Three options returned to the coordinator;
this topic recommends withdrawing the exposure ruling, landing #11 + the ten SDK corrections under the
existing three-file ceiling, and filing a follow-up for the residual on the #1669 → #1670 precedent.

Withheld gates (`contracts-jsr-audit`, `sdk-jsr-audit`, `netscript-jsr-specifiers`, export guards)
remain `NOT_RUN` — they are downstream of a repair that is not yet authorized. No IMPL-EVAL requested;
no evaluator, no runtime lease, no label/issue/checkbox/readiness/merge action, no `#1348`/`#1466`
mutation, no product file touched. Probe worktrees removed; leaf and PR unmodified at `bd97a7c03a`.

## 2026-08-23 — docs-lane advisory audited: Pages gate proven green; reference-row debt routed to coordinator

Read-only advisory received from the docs topic supervisor on #1671. Audited, not accepted. Full
record in `tier-a-1671.md` § Cross-lane advisory.

**Finding 1 upheld and now proven.** `.github/workflows/pages.yml:143-145` gained a blocking
`docs:exports-drift` step in `2dd1a75ef` (#1666), which post-dates this leaf's merge-base — so it has
never run against #1671, which does edit two `docs/site/` pages. The advisory reasoned it would pass;
this topic **executed** it instead, applying the six leaf paths onto a detached worktree at
`9634735bc0`: `Exports & Symbols drift check: PASS`, **exit 0**. Mechanism is more specific than
stated — `sdk` runs `entrypoints-only` (symbol rows unchecked entirely) while `contracts` runs
`complete` and no exported symbol name changed; both halves must hold and both do. By-product: the six
leaf paths **apply cleanly onto current `main`**, independently corroborating the § S5 rebaseline.

**Finding 2 upheld as debt, framing corrected, declined as scope.** The divergence is real and nothing
catches it. But all three flagged rows in `docs/site/reference/sdk/index.md` are **factually accurate**
at the leaf head — both `SafeFailure` arms remain tuple-and-object intersections, so "Tuple/object
result returned by `safe`" still holds. This is cross-page emphasis debt, not two contradictory
contracts. Recorded plainly: this topic made the **opposite** error on #1669, calling accurate adjacent
pages a false-narrative class and being corrected by the coordinator and evaluator. Additional reason
not to fold it in: those row descriptions are **verbatim the package's own JSDoc** (`errors.ts:68-70`,
`:75-77`), so editing rows without editing JSDoc would *create* drift — making the suggested "~3 rows"
a seventh **and** eighth path. Declined under `plan.md:146`'s exact six-path ceiling and routed to the
coordinator on the #1669 → #1670 precedent.

**Finding 3 already covered; this lane's scope is wider.** All three named references are in the § S5
measurement, and the advisory's "zero on current main" matches the § S5 SDK baseline of 3 exactly. The
withheld gate covers **10** new SDK diagnostics, not 3 — adding `ThrowableError` (×4),
`ClientPromiseResult` (×2) and `ProcedureErrorFromNode`.

No change to the § S5 verdict: implementation remains unauthorized pending a fresh ruling on the
refuted exposure mechanism. No merge, readiness flip, label, checkbox, or product/docs mutation.

## 2026-08-23 — ruled correction fails a second, independent gate (docs-lane hypothesis, executed)

The docs supervisor, accepting the cross-lane audit and correcting its own record at `39c0c1bac`,
raised one forward-looking point this topic had not measured: a ruling that changes what
`@netscript/contracts` publishes lands on `docs:exports-drift` with contracts in **`complete`** mode.
Correct, and now executed rather than predicted.

Probe at `9634735bc0` + the leaf's six paths + exactly the three ruled type-only re-exports, nothing
else: **FAIL, exit 1**, three `Symbol Drift Error [contracts]` entries — `index.md` OMITS exported
symbol `BaseContractErrors` / `ContractBuilder` / `Schema`. The identical probe without the
re-exports is PASS/exit 0, so the failures are attributable to the ruled correction alone.

The ruled mechanism therefore has **three** independent failure modes: doc-lint 10 → 21; a
**merge-blocking** `docs:exports-drift` red at `pages.yml:143-145`; and a repair for the second that
is worse than the second — clearing it means documenting `ContractBuilder` and `Schema` as rows in
`docs/site/reference/contracts/index.md`, a seventh path that commits NetScript's published reference
surface to carrying **oRPC's builder class and standard-schema alias as NetScript's own symbols**.
That is a doctrine decision about what the package claims to publish, not a lint fix — the same
"wider barrel growth" the ruling forbids, reached from the opposite direction.

This strengthens rather than supplements the § S5 recommendation: the exposure route is not merely
costlier than the residue, it is **not landable** without that doctrine decision. Recommendation (2)
stands and is now the only option clearing both gates.

Also carried: `sdk` runs `entrypoints-only`, so its reference-page symbol rows are never checked.
Advisory findings 1 and 2 are one fact from two sides — the gate proving #1671 green is green
*because* it does not inspect the rows finding 2 concerns. That is why finding 2 is real debt and
simultaneously not a gate risk.

Docs lane confirms EXHAUSTED/PARKED at allocation [1551], withdrew its finding-2 recommendation, and
takes no scope. No merge, readiness flip, label, checkbox, or product/docs mutation from this lane.

## 2026-08-23 — #1671 finding restated: the gates are correct, not obstructive

Docs lane returned a written position on its own surface (`docs/site/reference/contracts/index.md`)
plus a sharper reading of the three failure modes. This topic checked the load-bearing claim rather
than adopting it: the page's opening prose states "This page is written against the package's public
surface reported by `deno doc`", and the gate declares
`mode=complete; reason="…complete published-symbol inventory"` with `documented-non-export-groups=0`
— a strict two-way inventory. So adding `ContractBuilder`/`Schema` rows would assert, in NetScript's
consumer-facing surface statement, that NetScript owns and stabilises oRPC's builder class and its
standard-schema alias. Claim holds; position adopted.

**Reframing adopted, and it corrects this topic's own presentation.** I had been stacking the three
failure modes as accumulating cost — "the exposure route is more expensive than the residue." The
correct statement is that `docs:exports-drift` is not obstructing the route, it is doing its job:
refusing to let an unowned type enter the published surface silently. A gate clearable only by
asserting ownership of someone else's type is saying the change is wrong, not that the gate needs an
exemption. **Failure mode 3 is the finding; modes 1 and 2 are symptoms** — two independent detectors
reporting one fact, that the ruled correction moves a dependency's internals across NetScript's
published boundary.

So the coordinator's choice is not "one residual diagnostic versus a costlier fix". It is: accept a
bounded, already-substituted private-type reference, or decide that NetScript publishes oRPC's builder
algebra. Only the first is in scope for a fix leaf.

Docs lane concurs on recommendation (2) for an independent reason — it changes no exported symbol name
in either package, so it clears `docs:exports-drift` without anyone deciding what NetScript claims to
publish, leaving that doctrine question open for a deliberate ruling instead of settling it as a side
effect. Both lanes reach the same recommendation by different routes; neither is owed the outcome.

Standing arrangement confirmed both ways: nothing live changes either package's published surface; if
an exposure variant is revived, this topic notifies the docs lane before any readiness attempt and
re-runs the contracts-`complete`-mode expectation. Docs stays EXHAUSTED/PARKED at [1551].

#1671 unchanged: parked at `bd97a7c03a`, no implementation authorized, no merge, readiness flip,
label, checkbox, or product/docs mutation.

## 2026-08-23 — #1671 S5 dispatched to the canonical author; #1690 filed

**Coordinator ruling executed.** External `ContractBuilder`/`Schema` barrel exposure withdrawn on the
measured 10 → 21 result. Bounded probe of the instantiated generic return annotation run first:
**acceptance target MET** (contracts doc-lint 9 = base 9, `baseContract`'s only private reference the
already-pinned `oc`, zero new private references, zero barrel growth, exact six-code union preserved
and proven non-vacuously against a failing control). Option 2 therefore **not** taken. Full record in
`tier-a-1671.md` § S5 bounded probe.

**S5 dispatched.** The one-sender-per-worktree guard fired on a fresh launch
(`duplicate_sender_risk`) — correctly, because the original author `01a006f3-ae2d-7941-bd17-2ac71dd3d0f0`
still owns `/home/codex/repos/netscript-007-leaf-typed-error`. Resumed that thread rather than
starting a second sender, so route identity is inherited and unchanged (`openai` · `gpt-5.6-sol` ·
medium). Dry-run validated first: `git-safety` clean at `bd97a7c03`, `upstream=NONE`, `dirty=0`,
brief 10 654 bytes. Launch was **not** timeout-wrapped.

| Field | Value |
| --- | --- |
| Thread | `01a006f3-ae2d-7941-bd17-2ac71dd3d0f0` (resumed) |
| Brief | `briefs/1671-s5/implement.md` — verified diff inlined, because the author's worktree is on the leaf branch and cannot read the orchestration run dir |
| Product ceiling | three files + one test file; a fifth product path is a rescope |
| Denied and restated | barrel growth, metadata vocabulary, lint allowances, `docs/site/reference/sdk/index.md`, `#1348`/`#1466` |

The brief carries the two traps this topic already hit, so the author does not re-walk them: the
error-map literal must name the public type `ContractObjectSchema<X, X>` rather than
`typeof <PascalCaseAlias>` (the alias form drops `.shape` and fails `crud.ts` with 5 × `TS2345`, which
`contracts/mod.ts` alone does not catch), and `ContractSchema` is not substitutable for oRPC's
`Schema` (`TS2322`). It also carries the `surface:diff` caveat as an obligation: `deno doc` drops the
instantiation argument, so the `baseContract` major disappears (532 → 531) — a **tooling false
negative**, and the breaking-change disclosure stays at full strength.

**#1690 filed** — `docs(reference/sdk): align error-handling emphasis between the reference page and
package JSDoc`, `Backlog / Triage`, `type:docs` `area:sdk` `priority:p3` `status:triage`. The separate
exact follow-up the coordinator directed, on the #1670 precedent. It records that the three rows are
**accurate**, that the gap is ungated because `sdk` runs `entrypoints-only`, and that a fix is
rows-**plus**-JSDoc rather than three rows — so it cannot later be misread as a #1350 acceptance
failure or as licence to widen #1671.

Next: exact-head receipt review after the author's explicit push, then the withheld
JSR/specifier/export gates, then a fresh opposite-family IMPL-EVAL. No merge, no readiness.

## 2026-08-23 — #1671 S5 Tier-A PASS at `2d806b245`; S6 corpus precondition FAILS; IMPL-EVAL withheld

Author S5 landed clean and explicitly pushed: local == remote == PR `2d806b245632dc16adaf04d740ade96395a82f73`,
draft, sole `status:impl`. Phase comment `2026-08-23T07:58:01Z` binds both the head and the content head
`622218ac38…` — reconciled. Full record in `tier-a-1671.md` § S5.

**Tier-A PASS.** Seven paths, zero fifth product paths, `public/mod.ts` untouched, no docs, no
reference page. Zero suppressions, zero unsafe casts, zero metadata vocabulary; `ContractBuilder` has
zero remaining references in `packages/contracts/src`. The contracts diff matches the Tier-A-verified
patch byte-for-byte. Independently measured, not accepted from the receipt: contracts doc-lint **9 =
base 9**, sdk **3 = base 3**, `baseContract`'s only private reference the pinned `oc`; suites **78/0**;
lint 0/0; fmt 0/0; `check:netscript-jsr-specifiers` PASS (2361 scanned, 0 failures); `deno publish
--dry-run` PASS on both packages; `docs:exports-drift` PASS; `@netscript/service` exact-pinned.

Two honesty notes recorded rather than smoothed. `docs:exports-drift` **cannot run inside the leaf
worktree** — the task arrived with #1666, which post-dates the leaf's base — so its bare exit 1 there is
a missing task, not a red; it was run on `main@9634735bc0` + the leaf's six paths, where it passes. And
there is **no runnable `contracts-jsr-audit`/`sdk-jsr-audit` gate**: `jsr-audit` is a skill, so its
executable surface is publish-dry-run + `deno doc --lint` + specifier guard + pin hygiene, all four
executed and green. This lane does not claim to have run two gates that do not exist.

**S6 precondition executed and FAILED.** Determinism **PASS** (two clean regenerations, byte-identical
sha256). Exactly-one-path **PASS**. "Delta reflects only approved signature changes with no new
exports" **FAIL**.

The decisive fact: `check:mcp-export-corpus` is **already RED at `main@9634735bc0`** — exit 1, identical
message, no leaf involved. The corpus is a gzip/base64 blob, so it was decoded to JSON and compared on
symbol identity:

| Attribution | Changed signatures | New exports |
| --- | --- | --- |
| Leaf-attributable | **5** (the approved ones) | **0** |
| Baseline-only | — | **9** |
| What an S6 commit would carry | 5 | **9** |

The nine belong to `@netscript/ai` (eight MCP symbols across `./mcp` and `./ports`) and
`@netscript/prisma-adapter-mysql`. An S6 would make #1671 the silent carrier for two other packages'
un-regenerated export surface — precisely what "no new exports" exists to prevent. The ruling's
conditional was "if and only if that proof passes"; it does not, so **S6 was not dispatched and the
canonical author was not resumed again**. Reporting the failed conditional is compliance with that
ruling, not an owner pause.

**IMPL-EVAL withheld, deliberately.** If a corpus change is later authorized the head moves, and a
verdict bound to `2d806b245` would be stranded on a stale head — the failure this lane has a standing
rule against. The leaf is IMPL-EVAL-ready the moment the corpus question is settled.

Recommendation: regenerate the corpus in a **standalone non-leaf change** touching only the generated
path, since the staleness is repo-wide and owned by other packages. #1671 then needs no S6 and its head
stays `2d806b245`.

No merge, readiness, label, checkbox, metadata, or `#1348`/`#1466` mutation; no runtime lease.

## 2026-08-23 — prerequisite corpus leaf created and pushed; PR #1691 open

Coordinator ruling after the failed S6 proof: do not make #1671 carry unrelated generated exports;
execute a serial prerequisite inside the fixes lane. Executed, no owner pause.

**Clean leaf from exact main.** Worktree `/home/codex/repos/netscript-007-leaf-corpus`, branch
`chore/mcp-export-corpus-regen` created from `9634735bc0`, no branch/worktree/PR collision. Dedicated
to exactly one path: `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`.

**Determinism proven.** Two independent regenerations from a clean tree produced byte-identical output,
sha256 `098ee8c412626edcc2e4a05eefe0f5554055a6d0a0c23a3d12f85f534ab60a5d` both runs. `git status` shows
exactly one mutated path. No source or API change.

**Delta measured by decoding, not by file diff** — the corpus is gzip/base64, so the raw diff is opaque:

| | Count |
| --- | --- |
| Added exports | **9** — `@netscript/ai` ×8 (`McpReadResourceResult`, `McpResourceContent`, `McpServerStatus`, `McpTransportPoolSnapshot`, each across `./mcp` and `./ports`), `@netscript/prisma-adapter-mysql` ×1 (`PrismaMySqlTransactionOptions`) |
| Changed signatures | **11** — `@netscript/ai` ×8, `@netscript/prisma-adapter-mysql` ×2, `@netscript/sdk` ×1 |
| Removed | **0** |
| `schemaVersion` / `frameworkVersion` / `surfaces` | unchanged |

**Correction to the brief, recorded rather than smoothed.** The ruling described the delta as "exactly
the nine already-existing exports". It is nine exports **plus eleven changed signatures**, and one of
those is `@netscript/sdk` `CacheQuery` (gains `startInflight()`, `readCachedEntry()`). That superficially
looks like it could be #1671's, and provably is not: #1671's diff has **zero** `CacheQuery` matches, and
this branch contains no #1671 content — it is pure `main`. All eleven are additive or narrowing and all
reflect source already merged.

**Receipts:** `check:mcp-export-corpus` **PASS exit 0** (`symbolCount 7611`, content sha256
`458428529a12cfb1…`) where it was exit 1 before; `deno check packages/mcp` **0** occurrences;
`packages/mcp` suites **136 / 0**.

Recorded honestly: the `packages/mcp` **fmt/lint batch exits 1 with 0 findings**, and does so identically
on the **pristine tree before this change** — verified by reverting the file and re-running. Pre-existing
tooling failure over a ~300 KB single-line generated file, not a formatting difference, not introduced
here. Per AGENTS.md, package-quality fmt gates must exclude generated output; this batch does not.

**Pushed** `ce3c21a1498d1a3b6ef74a245c98be66095f812a` by explicit refspec. **PR #1691** opened, ready
(not draft), narrowly described with the decoded delta and the determinism proof, labels `type:chore`
`area:tooling` `priority:p1` sole `status:impl`, milestone `0.0.7`. No closing keyword — it does not
resolve #1671, which it only references.

Docs lane notified under its standing published-surface offer, explicitly informational and not a scope
request; silence will not be treated as review. CI is the gate.

Next: merge #1691 when checks are green and it is eligible, then update main, rebase #1671, confirm its
four source/test paths plus run artifacts only, rerun the withheld gates and fresh Tier-A at the new
head, and request one fresh opposite-family IMPL-EVAL.

## 2026-08-23 — docs lane reviewed #1691: no objection; surfaces an ungateable reference-page gap

The docs supervisor took the eyeball on #1691 because the export surface is its own, recorded at
`8a8628c2d`. **No objection, and an explicit "do not widen it."**

**Attribution corroborated independently.** It confirmed the `@netscript/sdk` `CacheQuery` entry is not
#1671's from evidence it already held: `packages/sdk/src/cache/cache-query.ts` moved in the
`baf1cdf67..9634735bc` range via #1665 (`3e8e146a4`) and #1669 (`0ef48c2ec`), and #1671 touches no cache
file. Two independent routes to the same conclusion, so the "nine exports **plus** eleven changed
signatures, not exactly nine" correction stands.

**Its finding, verified by this topic rather than accepted.** The nine corpus export entries are **five
distinct symbols**, and all five are absent from their reference pages at `main@9634735bc0`:
`McpReadResourceResult`, `McpResourceContent`, `McpServerStatus`, `McpTransportPoolSnapshot` (0
occurrences in `docs/site/reference/ai/index.md`) and `PrismaMySqlTransactionOptions` (0 in
`docs/site/reference/prisma-adapter-mysql/index.md`). Both pages exist.

Checked here directly: `check-exports-drift.ts` polices **8** packages — `config`, `contracts`,
`fresh-ui`, `plugin`, `queue`, `sdk`, `service`, `telemetry` — and `@netscript/ai` and
`@netscript/prisma-adapter-mysql` appear **zero** times in it. So `docs:exports-drift` **cannot** flag
this drift — not now, not ever. #1666 built a real gate over roughly a quarter of the surface; this is
the first concrete instance of what the uncovered pages do silently.

**Denominator corrected to 36, not 37** (docs lane precision, verified here). `docs/site/reference/`
holds 37 entries: **36 package directories**, every one carrying an `index.md`, **plus** the top-level
`docs/site/reference/index.md` landing page. The landing page is not a package surface and is not
something `AUTHORITATIVE_MAPPING` could gate, so it does not belong in the denominator. The figure for
the ruling is **8 of 36 package reference pages policed, 28 uncovered**. The uncovered count is 28
either way; only the denominator moves — but 8/37 and 8/36 imply different things about whether the
landing page is in scope, so it is fixed before it reaches a ruling.

**Not absorbed, and deliberately so.** This is pre-existing main drift that #1691 made *visible*, not
drift #1691 introduced. Folding it in would be the same scope error this topic refused on #1671's
reference rows — a one-file generated regeneration turning into a docs-surface expansion, destroying the
single property that makes #1691 reviewable. **#1691 stays at one file.**

Neither lane filed anything: the milestone is frozen. Surfaced to the coordinator as a **post-0.0.7
candidate** — extend `AUTHORITATIVE_MAPPING`, or deliberately record which of the 28 uncovered pages are
out of scope and why. Coordinator's call.

Also cleared by that lane: the `reference/sdk/index.md` `CacheQuery` row is a one-line class description
with no method list, so `startInflight()`/`readCachedEntry()` do not make it false, and `sdk` is
`entrypoints-only` regardless.

**#1691 CI so far:** `close-gate`, `code-quality`, `quality`, `build`, both `classify` jobs **pass**;
`check-test` pending; one `scaffold CI lane visibility` instance `CANCELLED` by concurrency supersession
with two `SKIPPED` siblings. `mergeable: MERGEABLE`, `mergeStateStatus: BLOCKED` pending the outstanding
check.

## 2026-08-23 — #1691 merged; #1671 closed by my own error and replaced by #1692; S6 dispatched

**#1691 merged.** All checks green (8 SUCCESS, 0 failed, `mergeStateStatus: CLEAN`), squash-merged at
`2026-08-23T08:18:02Z` as main `61bfd858d20f3bf61e7ee45b5646537af567f247`. Verified afterwards:
`check:mcp-export-corpus` is **PASS exit 0 on new main**, sha256 `458428529a12cfb1…`, where it was exit 1
before. Prerequisite discharged.

**#1671 was closed unmerged — my error, stated plainly.** Merging #1691 closed it as a side effect
because the #1691 body I wrote contained the literal token `close #1671` inside the sentence
*disclaiming* a closing keyword: "This PR does **not** close #1671 and carries no closing keyword."
GitHub's parser matches the token and does not read negation. `merged: false`, `closed_at`
`2026-08-23T08:18:03Z` — one second after the merge.

**Lesson, worth promoting:** never write the literal `close #N` / `fixes #N` / `resolves #N` token in a PR
body **even to deny it**. Write "does not carry a closing keyword for #N". AGENTS.md already warns that
the *absence* of a keyword strands issues; this is the mirror failure — an accidental keyword closes a PR
that was mid-flight.

**Rebase.** Leaf rebased `--onto 61bfd858d` from `0ef48c2ec`; all ten commits replayed, **zero
conflicts**. New head `9cdba6321ea3f2d5af20f269b6bd81393dbd84d3`. Content identity proven: the leaf's own
diff over `packages/` and `docs/` is **byte-identical** before and after
(`0ef48c2ec..2d806b245` vs `61bfd858d..9cdba6321`). Force-push was lease-protected against the exact
prior head; recorded plainly because it is a history rewrite on a pushed branch.

**#1692 opened** as the replacement — same branch, same canonical author thread, base `61bfd858d`, head
`9cdba6321`, draft, `Closes #1350`, labels `type:fix` `area:sdk` `priority:p1` sole `status:impl`,
milestone `0.0.7`. Reopening #1671 was refused by GitHub because its head had been rewritten. #1671
annotated as superseded; its stale S5 comment repaired in place to flag the orphaned SHAs, point at
#1692, and separate what is still true from what is not.

**Gates re-executed at `9cdba6321`:** contracts doc-lint **9 = base 9**, sdk **3 = base 3**,
`baseContract`'s only private ref the pinned `oc`; suites **78/0**; `deno check` clean on
`contracts/mod.ts`, `contracts/crud.ts`, `sdk/mod.ts`; `check:netscript-jsr-specifiers` PASS (2361
scanned, 0 failures); `deno publish --dry-run` **0 errors, exit 0** on both packages.

**The S6 precondition now PASSES.** `check:mcp-export-corpus` is red again at the new head — and this
time it is legitimately the leaf's. With #1691's unrelated drift removed from the equation, the decoded
delta is:

| Criterion | Result |
| --- | --- |
| Determinism | **PASS** — byte-identical across two clean runs, sha256 `f7bbc8925481e868…` |
| Paths mutated | **1** |
| Added / removed exports | **0 / 0** |
| Changed signatures | **5**, all `@netscript/sdk`: `SafeFailure`, `SafeResult`, `ServiceClientMethod`, `isDefinedError`, `safe` |
| `schemaVersion` / `frameworkVersion` / `surfaces` | unchanged |

That is exactly the coordinator's original criterion — "only the already-approved public signature
changes with no new exports" — which failed before only because of the nine foreign exports. Its
if-and-only-if precondition is met, so **S6 dispatched** to the same canonical author thread
`01a006f3-…`: one derived-artifact path plus run artifacts, nothing else, comment on **#1692**, with the
expected numbers stated so the author reproduces rather than re-derives and stops if they differ.

Next: exact-head receipt review, fresh Tier-A at the S6 head, then one fresh opposite-family IMPL-EVAL.
No merge, no readiness.

## 2026-08-23 — S6 reviewed, gates discharged, IMPL-EVAL dispatched at `bcc9f393d`

**S6 landed and pushed.** local == remote == PR #1692 head
`bcc9f393d993cd5468015c883c8b0dc6a5b6dc62`, clean, draft, sole `status:impl`. Two commits:
`b427e0354 chore(mcp): refresh SDK export signatures` and `bcc9f393d docs(harness): record S6 export
corpus receipt`.

**Author was checked, not assumed idle.** When the corpus file sat dirty, `agentic:codex-status`
reported the thread **`working`** ("Testing git diff numstat and status", then "Verifying patch
application with diff") — the brief's own instruction to reproduce the delta proof before committing.
No recovery was performed and no second sender was started; polling was replaced by
`.llm/tools/harness/watch-run.ts` on the leaf run dir.

**Scope — exact.** S6 touches 4 paths: **one** product path (the generated corpus) and three existing
run artifacts. Full leaf surface vs new main is 7 paths: four source/test, one derived artifact, two
`docs/site/services-sdk/` pages from S3. `public/mod.ts` untouched, no `docs/site/reference/` page,
zero suppressions or unsafe casts.

**Corpus verified by identity.** The author's committed artifact is **byte-identical** to the one
Tier-A generated independently — sha256 `f7bbc8925481e868…` on both sides. Decoded delta on the
committed object: **0 added exports, 0 removed, 5 changed signatures**, all `@netscript/sdk`
(`SafeFailure`, `SafeResult`, `ServiceClientMethod`, `isDefinedError`, `safe`), metadata unchanged.
The coordinator's original criterion, met at the commit.

**Withheld gate set fully discharged at this head** — nothing remains `NOT_RUN`:
`check:mcp-export-corpus` **PASS exit 0** (was exit 1); contracts doc-lint **9 = base 9**; sdk **3 =
base 3**; `baseContract`'s only private ref the pinned `oc`; `docs:exports-drift` **PASS exit 0**;
`check:netscript-jsr-specifiers` PASS (2361 scanned, 0 failures); `deno check` 0 errors across
`contracts/mod.ts`, `contracts/crud.ts`, `sdk/mod.ts`; contracts+sdk suites **78/0**; mcp suites
**136/0**; both `deno publish --dry-run` exit 0; lint 0/0; fmt 0 findings, **0 failed batches**.

`docs:exports-drift` now runs **natively in the leaf** and is an executed receipt at the exact head.
Before the rebase the task did not exist there (it arrived with #1666, post-dating the old base), so it
had to be run on `main` + the leaf's paths. The docs lane flagged exactly this transition; it is
re-confirmed rather than carried over.

**Tier-A PASS** recorded at `eb57b416e`.

**IMPL-EVAL dispatched.** Route per `lane-policy.md` line 46 — Codex work evaluates on **native
opposite-family Fable 5 · medium**.

| Field | Value |
| --- | --- |
| Session | `12a40996-93dc-4889-a848-670dd3669366`, PID `687913` |
| Worktree | `/home/codex/repos/netscript-007-eval-1692` — **detached, evaluator-only**, at the exact head |
| Route requested | `claude-fable-5` · medium · Remote Control |
| Route **observed** | argv `--model claude-fable-5 --effort medium --remote-control --permission-mode bypassPermissions` — **matched** |
| Brief | 5742 bytes, sha256 `4fcff4c8f1a88804…`, **verified present in argv** (not swallowed by a variadic flag) |

Route was proven from `/proc/687913/cmdline`, **not** from the session registry, which reports
`model: null` / `effort: null` — registry population lag, and precisely why argv is the authority here.
`bridgeSessionId` is still null, so Remote Control has not attached yet; that affects mobile visibility,
not the evaluation.

Generator separation holds: generator is Codex thread `01a006f3-…`, not resumed; the evaluator has its
own worktree and never enters the author's.

**Route correction carried forward:** the author's observed effort is **high**, not the `medium` this
topic reported at S5 dispatch.

Next: evaluator verdict, then report exact head/verdict to the coordinator. No merge, no readiness.

## 2026-08-23 — #1692 SHIPPED; #1350 closed COMPLETED; fixes topic parked

**Terminal.** PR #1692 merged `2026-08-23T09:58:53Z` as squash commit
`c73d361eea14a7f40702638638e492f2ca961a59` from source head
`686bae07b2bc66353b2eec9dd56baa0779a63a20`. Verified independently: `origin/main` is now
`c73d361ee`, one commit above `61bfd858d` (#1691). 21 check runs terminal, zero failures, close-gate
PASS, zero open review threads, mirror idempotent.

**`Closes #1350` worked.** #1350 is `CLOSED` / `COMPLETED` with **7 of 7** acceptance boxes checked.
Worth recording against this run's own history: the closing keyword behaved correctly here precisely
because the body carries exactly one — the same mechanism that, written *negated* into #1691's body,
closed #1671 unmerged. One token, two opposite outcomes, decided entirely by placement.

**Reconciled to shipped.** `#1350` and `#1692` both moved `status:ready-merge` → **`status:shipped`**,
each now carrying exactly one `status:` label. #1350 retains `type:fix`, `priority:p1`, `area:sdk`,
`area:contracts`, `area:docs`, `epic:sdk-client-contrib`; #1692 retains `type:fix`, `priority:p1`,
`area:sdk`, `breaking`, `impl-eval:skip`.

## What this leaf delivered

`baseContract` keeps its exact six-literal error union through `safe()` and `isDefinedError()`, via a
TypeScript **instantiation expression** (`ReturnType<typeof oc.errors<…>>`) that preserves the codes
while naming no oRPC builder type. Both packages ended at **exact doc-lint baseline parity** —
contracts 9 = 9, sdk 3 = 3 — with `baseContract`'s only private-type reference the pre-existing pinned
`oc`. `packages/contracts/src/public/mod.ts` was never touched.

## What this lane got wrong, kept for the next run

1. **A negated closing keyword still closes.** `close #1671` inside a sentence disclaiming it cost a
   live PR. Never write the literal token near an issue number, even to deny it.
2. **Two grep-precision near-misses in consecutive slices** — `\|` alternation passed to `grep -E`,
   and a fixed-string search defeated by `**not**` bold *inside* the phrase. Both would have filed a
   false finding against a correct author. A zero count is a question, not an answer.
3. **A denied option is not a refuted one.** The barrel-exposure route had been rejected on scope and
   was never tested for efficacy; measuring it showed 10 → 21 diagnostics. Test the mechanism before
   spending a ruling on it.
4. **Verify per-entrypoint, not per-package.** "#11 is sound" was checked against `contracts/mod.ts`
   alone; `crud.ts` failed with 5 × `TS2345`.
5. **A tool that stops reporting a break has not removed it.** `surface:diff` went 532 → 531 because
   `deno doc` drops the instantiation argument — a false negative, recorded as one.

## Prerequisite and follow-ups

- **#1691** — the pre-existing export-corpus staleness, split out rather than absorbed, merged as
  `61bfd858d`. Absorbing it would have made this leaf the silent carrier for 9 foreign exports.
- **#1690** — reference/sdk emphasis debt, explicitly non-blocking, rows verified accurate.
- **#1693** — `ThrowableError → Error` decision record plus the previously unbacked bench-prose debt.

## Parked

Fixes topic parked. This lane removed **no** worktree and **no** branch, per instruction.

**Correction to this entry as first written.** It claimed the two leaf worktrees and the branch
"remain, both clean". Checked immediately afterwards, and that was already false:
`/home/codex/repos/netscript-007-leaf-typed-error` and `/home/codex/repos/netscript-007-eval-1692`
no longer exist, and `refs/heads/fix/sdk-typed-error-channel` is gone from the remote — the squash
merge deleted the branch and the worktrees were pruned by the coordinator's own cleanup, between the
merge and this checkpoint. The claim is corrected rather than left standing: this lane did not remove
them, and they are not there.

Surviving worktrees are the four topic orchestrators, `netscript-547-lffix`, `netscript-main` (now at
the merge commit `c73d361ee`), and two unrelated RFC trees. No runtime lease held; `docker ps` reports
zero containers from this lane.

## 2026-08-30 — Lane split: grouped wave-A leaf dispatched concurrently with #1711 evaluator

Coordinator correction: the #1711 IMPL-EVAL cycle-2 evaluator is independent and must not idle the
fixes implementation queue. Aspire is not a global barrier.

**Lane 1 — #1711, protected, monitor only.** PR stays draft / `status:impl`, head
`067193acff68254b4bd4c6e5d7824f80a9db2b26`. IMPL-EVAL cycle 2 running as job `3ba2ef08`
(Claude Fable 5 · medium) in `/home/codex/repos/netscript-007-eval-1711-impl2`. On PASS, report the
exact head for coordinator merge immediately. On a second consecutive terminal failure, release the
evaluator, keep the author available, and surface to coordinator/owner — never a third cycle.

**Lane 2 — grouped re-intake wave-A leaf `agent-init-guidance-and-cross-host-skills`.** Issues
**#1674 (p0)**, **#1672 (p1)**, **#1675 (p1)**, milestone 0.0.7, all three landing in the single
`netscript agent init` generated surface while keeping three distinct acceptance sets.

- Branch `fix/agent-init-guidance-and-cross-host-skills`, worktree
  `/home/codex/repos/netscript-007-leaf-agent-init`, base `5bb112dd35f94fc8435672e2cabff1f9a447aa0b`
  (`origin/main`).
- Route: Codex **GPT-5.6-SOL · high**, provider `openai`, launched through
  `launch-codex-slice.ts` with `--expect-base` and push-safety enforced (upstream unset so no bare
  push can reach `origin/main`).
- Run dir `.llm/runs/fix-agent-init-guidance-and-cross-host-skills--0.0.7/`.

Two things carried forward into the brief from the #1112 leaf's cost:

1. **The generated cascade is named up front.** CLI asset/template edits require
   `check:assets-barrel`; a docs-corpus or public-surface change extends to `check:agent-docs-prose`,
   `check:mcp-export-corpus`, and `check:publish-assets`. The sibling leaf lost two review cycles to
   that omission, so the plan must list every applicable gate before implementation.
2. **A close-gate problem the author must surface rather than decide.** Acceptance boxes across all
   three issues require a *measured unfamiliar-agent smoke* (non-zero `deno doc`, non-zero `ui:add`
   or MCP `find_guidance`, non-zero skill invocation), each with an "or an explicit recorded
   rejection" clause. An implementation leaf cannot produce a behavioural wave measurement. The
   author must identify those boxes in `plan.md` and propose a disposition — `[post-merge]` marker or
   recorded rejection — as a supervisor decision, not tick them. The PR opens draft and **without**
   closing keywords until that is resolved.

`e2e:cli`, Aspire, and Docker gates are not authorized for lane 2 without an explicit request.

**#1673** (plugin doctor validates the registry against itself) remains next, serially, after this
grouped leaf. No public canary is justified by docs/internals alone.

## 2026-08-30 — #1711 merged; lane 2 (#1729) integrating current main

**#1711 shipped.** Merged to `main@3561bb64820602e065bf6df0afeed82b39062e42`; issue **#1112 closed**.
Final leaf head `07e12efacf3cd23672395507cbf77ecf620cd454`. Evidence chain, all durable on real
branches: IMPL-EVAL cycle 2 `PASS_IMPL` (`f5fd84254…` on `eval/impl-eval-1711-cycle-2`) and the
bounded main-integration delta receipt `MECHANICAL_PASS` (`2df8d9962…` on `eval/delta-receipt-1711`).
Close-gate SUCCESS with 5/5 issue boxes mirrored.

**Cost record for this leaf, so the next one is cheaper.** Two terminal `FAIL_PLAN` cycles, one
supervisor Tier-A that passed a defective design, one premature readiness flip, and two incomplete
sweeps. The two structural lessons now carried into every fixes brief:

1. **Generated cascades are part of the gate set.** A doc-corpus or public-surface edit obliges
   `check:agent-docs-prose`, `check:assets-barrel`, `check:mcp-export-corpus`, and
   `check:publish-assets`. Missing them cost #1711 two review rounds and a coordinator correction.
2. **Ask whether a design is necessary, not merely whether it works.** The Tier-A that passed the
   non-literal dynamic import verified the form functioned and never probed the alternative that
   dominated it.

**Lane 2 — #1729** (`fix(cli): improve agent init guidance and cross-host skills`, grouped
#1674 p0 + #1672 + #1675). Author checkpoint landed at `83d24ba57d4e2b6f1d3905ebe508cdc3016a3b0b`
with well-formed gate evidence, `embedded.generated.ts` regenerated rather than a template-only fix,
per-issue separated assertions, and no self-certification. Labels applied
(`type:fix`, `area:cli`, `area:agentic`, `priority:p0`, `status:impl`) plus milestone `0.0.7`.

**Behavioural close-gate decision — resolved by the supervisor.** The author's recommendation is
adopted: #1672 acceptance 4, #1674 acceptance 4, and #1675 acceptance 5 each require a *measured
unfamiliar-agent* signal that cannot exist before merge, so all three are now marked `[post-merge]`
on the issue bodies. One follow-up wave measures `deno doc` usage, `ui:add`/`find_guidance` usage, and
skill invocation together against the merged artifact. This unblocks closing keywords — per
netscript-pr, a structurally impossible pre-merge check is exactly what `[post-merge]` is for, and
dropping the keyword to dodge it is the wrong move.

Dispatched: merge `origin/main@8b1e42f725919457c64781d5973fd419017fab13` (through #1711 and #1728),
regenerate every shared derivative from that exact base, re-run product gates and the fresh-scaffold
consumer proof on the merged tree, and add the three closing keywords. Merge, not rebase, so the gate
receipts keep their commit correspondence.

Next after this: supervisor Tier-A, then a **fresh opposite-family IMPL-EVAL**; on PASS, ready it and
report merge coordinates. **#1673** (plugin doctor validates the registry against itself) is dispatched
immediately once #1729 clears — serial within the fixes queue.

## 2026-08-30 — #1729 shipped; #1673 dispatched

**#1729 merged** as `main@13878a80a50c55b9662099fed64555f2310ae4a3`. Issues **#1672, #1674, #1675 all
CLOSED**, relabeled `status:shipped`; PR relabeled `status:shipped`. Final head
`608f68b076bfb724d111bdaf075fd4111703d937`.

Evidence chain, all durable on real branches:

- IMPL-EVAL cycle 1 `PASS_IMPL` — `907cce4147d999f1ea0f145ca02731307cf680d4` on
  `eval/impl-eval-1729-cycle-1`
- ADVISORY-1 repair `DELTA_PASS` — `c1b15bbd978647fca6d91e3883b58a8890893cb3` on
  `eval/delta-review-1729`, from a third session independent of both the cycle-1 evaluator and the
  author

Close-gate green at the exact head with 4/5 boxes mirrored per issue and the `[post-merge]` box
excluded by the gate itself, exactly as the disposition intended.

### `[post-merge]` obligation is tracked, not forgotten

A tracking comment is posted on each of #1672/#1674/#1675 naming the merge commit, quoting the
close-gate's own exclusion notice, and stating that one follow-up wave measures all three signals
together — `deno doc` usage, `ui:add`/`find_guidance` usage, skill invocation — after which the box is
ticked from that record or an explicit reasoned rejection is written. The issues' own wording governs:
silence is a harness failure, not an agent failure. Without this the `[post-merge]` marker would
degrade into a way to close an issue on an unmet criterion.

### Supervisor errors on this leaf

1. **Acceptance evidence repeated an overstatement.** The #1674 box-2 entry was written from the
   guidance text rather than from the file the guidance points at, so it asserted the same false claim
   ADVISORY-1 identified. Rule: evidence quoting a pointer must be verified against what the pointer
   resolves to.
2. **Cross-session dispatch is not a reliable transport.** A `SendMessage` to the cycle-1 evaluator was
   held for the recipient user's approval and never delivered; a wait-loop on its artifact branch
   would have hung indefinitely. Rule: for evaluator work this session depends on, spawn a session
   this session owns.
3. **Double `status:` label.** Readying the PR left `status:impl-eval` (added by phase-eval automation)
   alongside `status:ready-merge`. Always re-read the label set after a readiness flip.

### Queue

**#1673** dispatched now — `plugin doctor` validates the generated registry against itself, so registry
drift reports healthy while the durable layer never loads. Route: Codex **GPT-5.6-SOL · high**. The
brief makes the regression test the deliverable: author a saga after `generate plugins`, do not
regenerate, assert `doctor` goes red — and record the red-before output against unmodified `main`
before touching product code. That discipline is the whole point here, since this issue exists because
a green signal was trusted over reality.

### #1673 dispatch confirmed

Thread `01a04fd2-563e-7250-9173-f6befd6db8f2`, `gpt-5.6-sol` · high, cwd
`/home/codex/repos/netscript-007-leaf-plugin-doctor`, state `working`. Branch
`fix/plugin-doctor-registry-drift` off `main@13878a80a50c55b9662099fed64555f2310ae4a3`; upstream
unset and `--expect-base` matched, so no bare push can reach `main`. Attachment verified from
`codex-status` rather than inferred from the launcher's exit code — an earlier resume on this queue
returned exit 0 while the underlying dispatch had failed with a thread-store conflict.

Queue state: **#1711 shipped** (`main@3561bb648`), **#1729 shipped** (`main@13878a80a`), **#1673 in
implementation**, **#1737** open as the ADVISORY-2 follow-up, and one `[post-merge]` measurement wave
owed against #1672/#1674/#1675.

## 2026-08-30 — NAS migration reconciliation; #1673 relaunched on a fresh worktree

Fresh fixes topic supervisor after the NAS host migration. Old worktree paths
(`/home/codex/repos/netscript-007-*`), the old sender registry, and every pre-migration Codex thread
are historical. Nothing was resumed or recreated from them. Git and live GitHub were treated as the
only authorities; the checked-in context pack was read as history, not as state.

### Reconciliation against live truth

| Claim under test | Live result |
| --- | --- |
| Topic branch `orchestrator/release-0.0.7-fixes` | `dfbd6dbf9` — local == remote, clean |
| `origin/main` | `13878a80a` — identical to the #1729 merge commit |
| PR #1729 | **MERGED** 2026-08-29T23:17:54Z at `13878a80a`, head `608f68b07` |
| #1672 / #1674 / #1675 | all **CLOSED**, `status:shipped` |

So the #1729 obligations — current-main integration, generated derivatives, exact-head Tier-A, the
separate IMPL-EVAL, and truthful CI on the non-draft head — are **already discharged and merged**.
The dispatch instruction naming them was written before the last pre-migration checkpoint; carrying
it out would have re-run work that is on `main`. Recorded here rather than silently skipped.

**Not reconciled — two label facts this lane may not fix.** Relabeling is coordinator-owned, so both
are reported, not touched:

1. PR #1729 currently carries `status:augment-review`, not the `status:shipped` this lane's previous
   checkpoint recorded. An advisory augment pass appears to have relabeled it after merge. The three
   issues are correctly `status:shipped`, so the merge lifecycle itself is intact.
2. #1673 is still `status:triage` although it has been in implementation since 2026-08-29, and PR
   #1739 carries **no labels at all** — no `type:`, `area:`, `priority:`, or `status:`, and no
   milestone. Per `netscript-pr` the taxonomy is non-negotiable; this is a gap in central state, not
   in the leaf's work.

### #1673 — the leaf was further along than the ledger recorded

PR **#1739** exists and was never written into this ledger: draft, base `main`, head `c947b8fa4`,
body carries `Closes #1673`. Two commits: `d37b278b6` (locked plan, six-path ceiling, gate table,
`PLAN-EVAL: N/A` justified) and `c947b8fa4` (the red-before regression alone). The red-before proof
verified at the previous checkpoint stands; product code has not been touched.

Remaining: **S3** (manifest-backed bidirectional comparison + production wiring) and **S4** (gate
receipts and evaluator handoff).

### Relaunch

The pre-migration author thread cannot be resumed — its worktree does not exist on this host and it
is absent from the live daemon. A **new** Codex thread was launched through
`agentic:launch-codex-slice` into a **new** NAS worktree cut at exactly `c947b8fa4` with no upstream,
so no bare push can reach `main`. Route Codex `gpt-5.6-sol` · high, requested and observed identical.
Attachment was confirmed from `agentic:codex-status` rather than inferred from the launcher's exit
code — an earlier dispatch on this queue returned exit 0 while the underlying send had failed with a
thread-store conflict. Operational identity (path, thread, rollout, resume command, daemon proof) is
held locally and deliberately kept out of this published artifact.

**The gate-set note that three killed monitors failed to deliver is now in the brief itself.** The
plan marks `check:mcp-export-corpus` and `check:publish-assets` N/A *by reasoning*; the brief requires
both to be **run against the final tree and recorded either way, including as a measured negative**,
plus a one-line statement of why `check:assets-barrel` does not apply. #1112 is the precedent: that
cascade was missed by the plan, by supervisor Tier-A, and by a formal IMPL-EVAL, and CI caught it at a
cost of two review cycles. Putting the requirement in the dispatch removes the dependency on a
long-lived supervisor wait, which this host has not been able to hold.

Also carried into the brief: the six-path ceiling with a seventh path as an explicit rescope-and-stop;
the ban on merge, readiness flip, relabel, issue edits, and self-certification; no `e2e:cli`/Aspire/
Docker/browser; unchanged `deno.lock` proved by raw `git diff --exit-code`; and the #1729 lesson that
**evidence quoting a pointer must be verified against what the pointer resolves to**.

### Queue after #1673

Accepted fixes issues still OPEN: #979, #1093, #1249, #1351, #1353, #1357, #1365 (p0), #1368, #1370,
#1462, #1481, #1543, #1544, #1609, #1610, #1616, #1677, #1695 — plus #1737 (the #1729 ADVISORY-2
follow-up) and the owed `[post-merge]` measurement wave against #1672/#1674/#1675. Serial ordering
holds inside fixes: nothing is dispatched until #1673 is terminal.

**#1736 stays internals-owned.** The authoritative cluster state assigns the readonly-hydration repair
(#1734) to the internals lane, and PR #1736 is that work. This lane does not touch it.

## 2026-08-30 — restart recovery; PR #1739 taxonomy repaired; #1673 S5 relaunched

Fresh fixes topic controller after a host restart. Git and live GitHub were treated as the only
authorities; the checked-in context pack was read as history, not as state.

### Reconciliation against live truth

| Claim under test | Live result |
| --- | --- |
| Topic branch `orchestrator/release-0.0.7-fixes` | `f20c2581` — local == remote, clean |
| Product branch `fix/plugin-doctor-registry-drift` | `02da4e1c` — local == remote == PR #1739 head, clean |
| `origin/main` | `13878a80a` — unmoved since the #1729 merge |
| PR #1739 | OPEN, draft, base `main`, body carries `Closes #1673` |
| Review threads on #1739 | `review-threads PASS threads=0 unanswered=0` — nothing unanswered was stranded |
| #1673 | OPEN, milestone `0.0.7`, `status:triage` (stale — coordinator-owned, reported not touched) |

The topic checkpoint `f20c2581` and the product head `02da4e1c` are **not** divergent versions of the
same work: `f20c2581` is this lane's supervision ledger on the orchestrator branch, `02da4e1c` is the
leaf's S4 head on the product branch. Both are current; no reconciliation commit was needed. All
evaluator and Tier-A artifacts were preserved — nothing under `.llm/runs/` was rewritten or deleted.

### PR #1739 taxonomy repaired

The PR carried **no labels and no milestone**. Applied `type:fix`, `area:cli`, `priority:p1`,
`status:impl`, milestone `0.0.7` — mirroring issue #1673 and the leaf's actual phase, with exactly one
`status:` label per `netscript-pr`.

`gh pr edit` cannot do this here: it resolves labels through a GraphQL query that needs `read:org`,
which this token lacks (`repo` only). The REST endpoints work —
`POST /issues/1739/labels` and `PATCH /issues/1739` with `milestone=27`. Recorded so the next lane
does not read the GraphQL scope error as a permissions failure on the label itself.

Still **not** touched, because relabeling issues is coordinator-owned: #1673 is `status:triage`
although it has been in implementation since 2026-08-29, and PR #1729 carries `status:augment-review`
rather than `status:shipped`. Both are reported to the coordinator, not repaired here.

### #1673 S5 relaunched on a new thread

The S3/S4 author thread did not survive the restart, so per the mandate a **new** Codex thread was
launched at exactly `02da4e1c` into the existing leaf worktree, branch upstream still unset so no bare
push can reach `main`. Route Codex `gpt-5.6-sol` · high, requested and observed identical, attachment
confirmed from `agentic:codex-status` rather than inferred from the launcher's exit code.

Scope is the two HELD Tier-A findings and nothing else: **T-1** the line-level fmt attribution on
`installed-runtime-registry-generator.ts`, and **T-2** the `worklog.md` sentence the S3 diff
contradicts. The brief carries the accepted-work credit list so the author does not regenerate
evidence this supervisor already re-derived independently.

### Two launch-path facts worth carrying forward

1. **The duplicate-sender guard is not a liveness signal.** `launch-codex-slice.ts` computes
   `sessionActive: Boolean(existing.sessionId)`, so a durable sender record that names any thread
   blocks every future launch at that worktree and tells the operator to resume it — without ever
   consulting the daemon. Here it named a thread the restart had destroyed. Liveness was therefore
   proven separately, from the daemon's own session list (the thread was absent while its same-batch
   siblings were present and idle) and from the owner PID, before the record was released through the
   adapter's `release()` with its own lease token. Releasing on elapsed time, or by deleting the file,
   would have been the unsafe version of the same action.
2. **`/home/codex` no longer exists.** The launcher still defaults brief staging to
   `/home/codex/<slug>-brief.md` and fails at the stage step. An explicit `--dest` under `/home/agent`
   is the fix; recreating the symlink would paper over a stale default.

### No runtime lease requested for this leaf, deliberately

#1673's ceiling is six CLI files and its brief bars `e2e:cli`, Aspire, Docker, and browser gates, so
the singleton host runtime lease is not a prerequisite for its readiness. Independently, the Aspire
lane has established that this NAS container cannot execute `scaffold.runtime` at all — no .NET SDK,
Docker client 27.5.1 against Aspire 13.5's 28.0 minimum, and containers in a remote dind sandbox whose
published ports are not on `localhost`. A lease taken here would produce an environment red, not a
verdict. If a future fixes leaf needs a runtime verdict, it routes to CI rather than to this host.

### Next

S5 repair → fresh supervisor Tier-A over the delta at the exact new head → mandatory **fresh separate
opposite-family IMPL-EVAL** in a session this lane owns. PR stays draft; no readiness flip, relabel,
issue edit, box tick, or merge from this lane. Serial ordering holds: nothing else in the fixes queue
is dispatched until #1673 is terminal.

## 2026-08-30 — #1673 Tier-A PASS, IMPL-EVAL dispatched; #1462 selected and researched

### #1673 is through Tier-A

The S5 repair landed at `c1e21c1b` and the supervisor sign-off at `61b8bf52`. Both HELD findings are
resolved and were re-derived independently rather than accepted:

- **T-1.** The over-width `@std/path` line is wrapped and its finding is gone. The four remaining
  format findings were re-attributed by running the same scoped format against a pristine base archive
  and comparing **source lines**: three base-owned on identical lines, one leaf-owned because the
  regression-test file does not exist at base. The generator's 9 → 18 shift is exactly +9 — the cost of
  expanding one import line into ten — which is an independent consistency check on the attribution
  rather than a restatement of it.
- **T-2.** The corrected sentence was checked against the file, not the claim: the original S2 case
  name is present **verbatim** at head beside the four added cases, sharing `createDoctorHarness`.

Exact-head gates, all independently re-run at `c1e21c1b`: focused suite exit `0` (5/0); scoped type
check exit `0`, zero diagnostics; scoped lint under the root rule set exit `0`, zero findings;
`deno.lock` byte-unchanged; delta is exactly two files, both authorized; no identity leakage into
committed artifacts; `review-threads PASS threads=0 unanswered=0`.

**One fact recorded so it is not mistaken for a hidden risk.** The root `deno.json` excludes
`packages/cli/` from *both* `fmt` and `lint`. The leaf's scoped runs deliberately removed that
exclusion — disclosed in its own gate table — so they are stricter than CI, and the residual
leaf-owned format finding in the regression test cannot fail CI. Correcting it still mattered, because
T-1 was about the honesty of the attribution, not about a merge blocker.

IMPL-EVAL cycle 1 is dispatched at evaluated head `61b8bf52` on the canonical `formal_impl_evaluation`
route — native Claude `claude-fable-5` · medium · Remote Control, requested and observed identical — in
a dedicated worktree on `eval/impl-eval-1673-cycle-1`, so the leaf branch stays pristine while the
verdict is written on its own branch. Full identity, route, and Remote Control proof are in
`tier-a-1673.md`, recorded before the evaluator mutated anything.

### Two central-state gaps reported to the coordinator, not touched

1. **#1673 / PR #1739 is absent from `milestone-cluster-state.json` entirely.** Every other fixes leaf
   has an entry; this one has none, so the cluster state cannot see the lane's active work. Central
   state is coordinator-owned, so this is reported rather than written.
2. The `lane: fixes` tag on the two Aspire 13.5 leaves (`aspire-13-5-s4-generator-revalidation` /
   PR #1738, `aspire-13-5-s5-literal-ports` / PR #1740, issues #979, #1365, #1370, #1717) places
   work in this lane's name that lives in the Aspire worktrees under its own supervisor. This lane did
   not touch them. It is the same trap as #1736/internals: **lane ownership is settled by the
   controller that actually holds the worktree, not by the tag.** Recorded because those four issues
   would otherwise look like unclaimed fixes-queue candidates — #1365 is a p0.

### Next fixes leaf selected — #1462, researched but deliberately not dispatched

The coordinator's fixes `queueState` names #1673 and then only `later_fixes_serially`, so no specific
next issue is ordered and selection falls to this lane. No sibling lane claims it: docs holds
#1746/#1748, internals #1732, features #1466 then #1387/#1730.

**#1462** (`priority:p1`, `type:fix`, `area:sdk`+`area:fresh`): importing `defineServices` from the SDK
root auto-registers the server KV cache provider, so browser code silently takes the server cache path
and pulls `@netscript/kv` toward the client bundle.

Verified against **this tree** rather than accepted from the issue text — the issue reports
`@netscript/sdk@0.0.5` and the package is now `0.0.6`, so the defect had to be re-proved as live:

```
hasCacheProvider() from packages/sdk/mod.ts          -> true
hasCacheProvider() from packages/sdk/src/query/mod.ts -> false
```

Exact chain confirmed in current source: `mod.ts:46` re-exports `./src/cache/mod.ts`, whose line 22 is
a top-level `setCacheProvider(cacheQuery)`; `defineServices` is exported from the root at `mod.ts:49`.
The `packages/sdk/deno.json` exports map has **no `./presets` subpath**, so `defineServices` is
reachable only through the leaking root — which is precisely why a consumer cannot avoid the side
effect.

The sharpest finding is a contradiction inside the file itself: `mod.ts` line 24 documents "Use
`@netscript/sdk/cache` only from server-side code", and line 46 re-exports that module from the root.
The documented boundary is the one the code breaks.

**Not dispatched.** Serial ordering holds inside this lane and one evaluator runs at a time
cluster-wide, so #1462 waits until #1673 is terminal. The research above is the advance work; the brief
is staged and dispatch is one command once the verdict lands. This will be a WSL Codex daemon-attached
slice, not a Claude workflow — it is framework source under `packages/sdk/`, and it moves the published
export surface, so the #1112 generated-derivative cascade (`check:mcp-export-corpus`,
`check:publish-assets`, JSR audit, publish dry-run) is mandatory in its gate set from the start rather
than argued N/A by reasoning.

## 2026-08-30 — coordinator F1 ruling; environment authority update; a delivery that silently failed

### Coordinator ruling on F1 — recorded as received, not reinterpreted

The F1 repair is a **narrow, generic, optional, manifest-advertised generator inspection protocol** —
explicitly *not* manifest excludes, and *not* AI selection logic copied into the CLI. A manifest
advertises `inspectionProtocol: 1`; the CLI invokes **the same external generator** through the
injected `ProcessPort` in a read-only inspect mode and uses its reported selection as the expected
set; the CLI validates schema/version, declared registry paths, duplicates, and source files; a
**declared** protocol that fails is **fail-closed with no silent fallback**; an absent protocol keeps
legacy behaviour.

The seam already exists — `installed-runtime-registry-generator.ts:412` invokes the generator through
`dependencies.process.exec` — so this extends current machinery rather than inventing a transport.

Three requirements are non-negotiable: inspection and compile share the **same pure selector**; **no
writes in inspect mode**, proven rather than asserted; and a **real AI `skill-loader` healthy
regression**. Workers/profile adoption (evaluator finding F4) is explicitly follow-up scope. The
focused PLAN-EVAL stays, because the process contract is genuinely architectural.

Ceiling: **five added paths only**, resolved against the tree —
`plugins/ai/scaffold.runtime.json`, `plugins/ai/src/cli/ai-registry-compiler.ts`,
`plugins/ai/src/cli/generate-runtime-registries.ts`, `plugins/ai/src/cli/ai-registry-compiler.test.ts`,
and `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator_test.ts`.
Existing adapter/evidence/doctor/test paths may be amended within the prior six-path ceiling; anything
else is rescope-and-stop.

This **supersedes** the open-design instruction this lane had already sent, which asked the author to
weigh three directions and propose its own ceiling. The superseding is stated explicitly in the
steering message so the author does not act on both.

### A steering delivery that failed while its wrapper exited 0

The ruling was **not** delivered on the first attempt. `agentic:codex-resume` returned exit 0 while
the underlying send was rejected:

```
thread-store conflict: thread 01a051d0-… already has an active writer
Error: thread/resume failed (code -32600)
```

Confirmed by grep: neither `inspectionProtocol` nor `same pure selector` appears in the target
rollout. This is the **second** sighting of this trap in this lane — the pre-migration worklog already
recorded a resume returning exit 0 over a failed dispatch — but now with the cause identified:

**Resuming a Codex thread that is mid-turn fails with a thread-store active-writer conflict, and the
wrapper exits 0 regardless.** Steering is deliverable only when the thread is not `working`. Delivery
is proven only by grepping the target rollout for a phrase unique to the message — never by an exit
code and never by a `--pretty` success line.

The lane is waiting on the author's current turn to end, then delivers and re-proves from the rollout.
No rival send was made into the owned worktree.

### Environment authority update — the runtime position is withdrawn

`netscript-dind` is fully operational after the restart: `/etc/hosts` resolves it, the project `mise`
config sets `DOCKER_HOST=tcp://netscript-dind:2375`, and Docker **server** 27.5.1 responds. Aspire
doctor's below-28 result is a **warning only**, not a failure and not a dispatch blocker. PID 1 is
`tini` with 0 zombies.

**This lane had no gate to re-run.** The instruction to re-run anything previously waived or scored
red for zombies was checked against both the topic run dir and the leaf run dir: no gate here was ever
waived or classified on zombie or inotify grounds, so there is no stale verdict to replace. Recorded
as a checked negative rather than passed over in silence.

**What it does change is #1673's verification plan.** This lane's earlier position — that #1673 needed
no runtime lease and that the host could not produce a runtime verdict anyway — is now half wrong and
is withdrawn. It was correct for the original six-CLI-file ceiling. It is not correct after the
coordinator expanded the ceiling into `plugins/ai`: `scaffold.runtime` is the one real end-to-end
proof that F1 is fixed rather than merely unit-tested, because the e2e plugin-suite builder defaults
`aiMcp = true` and `behavior.plugin-doctor-missing-module` requires doctor healthy first. That is
precisely the gate IMPL-EVAL predicted would go red at the pre-fix head.

`scaffold.runtime` is therefore added to the leaf's plan as a **required, supervisor-coordinated**
gate. The author does not run it: the host runtime lease is a cluster-wide singleton, so this lane
obtains and sequences it once the implementation is ready, then cleans up exactly what it owns
(`agentic:leak-check`, then `agentic:teardown --apply`, `--owned-root` for anything started outside
the worktree).

The shared `fs.inotify.max_user_instances` ceiling (128) is the only remaining host quota blocker and
is shared across every lane. An Aspire abort with exit 134 / `IOException: configured user limit … on
inotify instances` is a **quota collision to retry against** — it is not evidence about the change
under test and must never be recorded as a product red.

### Coordinator ruling delivered at 11:25Z — proven from the rollout, not from an exit code

Delivered on the same thread once it went `idle` (`turn complete`). Verified by grepping the target
rollout for four phrases unique to the message — `inspectionProtocol`, `same pure selector`,
`Workers/profile adoption`, `24-path ceiling must be cut` — each present, with no active-writer
conflict in the sender output. The thread is now `working` on the amendment.

The wait was the correct call: the previous attempt failed *because* the thread was mid-turn, and a
second sender into an owned worktree is exactly what this lane's rules forbid.

### The author had already converged on the ruling's design

Its S6 plan at `349d5915`, written before the ruling arrived, independently chose direction (a), an
optional manifest-advertised report protocol v1, fail-closed with no silent fallback, AC2 unchanged
with no issue edit, and PLAN-EVAL blocking S7 — and rejected (b) and (c) on the same grounds the
ruling gives. Far less work was discarded than the superseded brief implied. Only a naming alignment
was needed: the coordinator's `inspectionProtocol: 1` replaces the author's
`sourceSelectionReport.protocolVersion`.

### The real gap was scope, and it is now cut to the authorized set

The plan proposed a **24-path** ceiling; the coordinator authorized **11** — the prior six, the
generator test, and the four `plugins/ai` paths. Removed: `plugins/workers/*` (4),
`plugins/sagas/*` (4), `plugins/triggers/*` (3).

**Cutting those is safe rather than a compromise, and the author was told why.** The protocol is
*optional* and an absent protocol retains legacy behaviour, so only `plugins/ai` advertises it in this
leaf; sagas, triggers, and workers keep the manifest walk, which is correct for them today — and is
exactly why the five original semantic cases passed. F4 is knowingly deferred as follow-up.

Two paths were flagged rather than silently allowed:

- `runtime-registry-source-report.ts` — a **new** CLI file, not among the five authorized additions.
  The author must fold it into an authorized path (path 2 already owns the `ProcessPort` invocation)
  or stop and request approval in `drift.md`. Creating it on its own authority is not permitted.
- `installed-runtime-registry-integration_test.ts` — allowed on **this supervisor's reading** of
  "existing test paths may be amended", and it is where `skill-loader` exclusion is already asserted
  (lines 276 and 319), making it the natural home for the required healthy regression. The author
  records in `drift.md` that this rests on a supervisor interpretation, so PLAN-EVAL or the
  coordinator can correct it cheaply if the reading is wrong.

Recording the interpretation as an interpretation is the point: an unmarked reading of someone else's
ruling is indistinguishable from an authorization, which is the failure class this leaf exists to fix.

## 2026-08-30 — environment authority update 2; this lane's gate narratives corrected

The environment changed **again** between the two authority updates, so the record I wrote hours ago
is now stale in two specific places. Superseding it here rather than editing it, and naming exactly
what is wrong so nobody quotes the old numbers.

### Re-proven locally, in-container, at this checkpoint

| Fact | Verified value |
| --- | --- |
| `netscript-dind` | `10.4.12.19` via `/etc/hosts`; container id `a833c3a529e2` |
| `DOCKER_HOST` | `tcp://netscript-dind:2375` (project `mise`) |
| Docker client / server | **28.5.2 / 28.5.2** |
| `docker ps -a` | 0 containers — sandbox at zero |
| `fs.inotify.max_user_instances` | **1024** (`max_user_watches` 762026) |

The dind container was **recreated** between update 1 and update 2 — the container id changed from
`a8e78d139681` to `a833c3a529e2` — which is why both the IP and the Docker version moved. Worth
naming, because otherwise the two updates read as contradicting each other rather than describing two
different container instances.

Owner authority also reports D-37 and the `watchFs` quota blocker resolved, a fresh lifecycle rerun at
**13/13 PASS** including `codex-follow` streaming, and `watch-run` reaching its expected heartbeat
exit 2 with no allocation failure.

### Two narratives this lane wrote earlier are now wrong

1. **"Aspire doctor's below-28 result is a warning only."** Moot. Docker is **28.5.2**, above Aspire
   13.5's 28.0 minimum, so there is no below-28 result to excuse. Do not carry the warning framing
   forward.
2. **"The shared `fs.inotify.max_user_instances` ceiling (128) is the only remaining host quota
   blocker."** Resolved — it is **1024**. An Aspire abort with exit 134 /
   `IOException: configured user limit … on inotify instances` is no longer an expected condition, so
   it must not be pre-excused in a plan's risk register. If it occurs now it is a real finding to
   investigate, not a quota collision to retry against.

**There is no known environment blocker for Phase-B runtime.** The earlier claim that this host could
not produce a runtime verdict is fully withdrawn — that was true of a different container instance.

### Consequence for #1673

`scaffold.runtime` stays a **required, supervisor-coordinated** gate for the F1 repair, and it is now
straightforwardly runnable rather than lease-and-hope. Unchanged: the host runtime lease is a
cluster-wide singleton and stays **serialized**; this lane obtains and sequences it once S7 lands, the
author never runs it; and the sandbox is returned to **Aspire/Docker zero** by exact owned cleanup
(`agentic:leak-check`, then `agentic:teardown --apply` on proven resources, `--owned-root` for
anything started outside the worktree). `e2e:cli` is still absent from
`.llm/tools/gates/catalog.ts`, so the durable receipt remains the runner's `--report` JSON.

The steering already delivered to the author contains the superseded inotify risk-register
instruction. A correction is queued and goes out on the same thread as soon as its current turn ends —
not as a rival send, and not by editing what was already delivered.

## 2026-08-30 — shipping order accepted; phase truth normalized; PLAN-EVAL staged

Owner shipping order: drive #1739 from the current remote head through the already-approved generic
inspect boundary, exact-head gates, a separate IMPL-EVAL, close-gate, and ready handoff. **F1 is
accepted and is not to be re-audited.** PLAN-EVAL stays focused and bounded. On terminal #1739, begin
#1462 in this lane's own serial queue without waiting on another orchestrator.

### Phase truth normalized

| Object | Was | Now | Why |
| --- | --- | --- | --- |
| Issue #1673 | `status:triage` | `status:plan` | It has been past triage since 2026-08-29; triage was stale by two phases |
| PR #1739 | `status:impl` | `status:plan` | The F1 repair returned the leaf to a re-locked plan awaiting PLAN-EVAL |

Exactly one `status:` label on each, milestone `0.0.7` on both. **Closing keyword verified present** —
PR #1739's body carries `Closes #1673`, confirmed by a case-insensitive body match rather than by
eye. Head identity is clean: local == `origin` == PR `headRefOid` == `349d5915`.

Earlier this lane reported the stale issue label to the coordinator rather than fixing it, on the
standing rule that relabeling is coordinator-owned. The owner has now directed this lane to normalize
phase truth, so it is normalized; the change and its rationale are recorded here so the transfer of
that authority is auditable rather than looking like a lane taking relabeling on its own.

### A supervisor-side failure that cost the author a turn

The author's turn died at 09:30:32Z without committing: last rollout event was a progress message, no
completion event, agent absent from the daemon. Investigation found **my own `codex-resume` client
still alive** afterwards, holding the thread-store writer for `01a051d0`.

Two lessons, both now in the lane's steering rules:

1. **A resume client owns the turn and can outlive it.** The earlier lesson — that a foreground
   `timeout` on the *launcher* kills the turn — generalizes to `codex-resume`. A lingering client also
   blocks the next send with the active-writer conflict.
2. **`codex-status` `state` alone is not a turn boundary.** It flickers to `idle` between operations
   inside a turn; a watcher polling only `state` produced a false boundary at 11:29Z. The reliable
   predicate is `state != "working"` **and** `lastActivity` containing `turn complete` (or the agent
   gone), confirmed over two consecutive polls.

When cleaning up, a second `codex-resume` tree was present at worktree `007-aspire-s8` on thread
`01a051e6` — **the Aspire lane's**, not this one's. It was identified by parent PID and left
untouched. Only the client parented to this session's PID was stopped, through `TaskStop` rather than
a raw kill.

Nothing was lost: the thread retains its context, and the author's pinned mechanics were quoted back
verbatim on recovery —

> only a present `inspectionProtocol` key activates inspection; version `1` uses
> `--inspect --inspection-protocol 1 --manifest-json <json>`, omits both `--manifest` and
> `--allow-write`, and accepts one strict JSON document on stdout. Invalid advertised declarations,
> process failures, and invalid reports all remain generator-inspection errors.

That is the coordinator's contract expressed correctly, fail-closed included. The one caution passed
back: omitting `--allow-write` expresses "no writes in inspect" but does not *prove* it, and the
ruling requires proof.

### PLAN-EVAL staged, deliberately narrow

Route is the canonical `formal_plan_evaluation` for Codex work — native opposite-family **Fable 5 ·
medium**. The brief opens by telling the evaluator that **F1 and the design response are settled and
must not be re-audited**, and that it is judging one thing: whether the re-locked plan faithfully and
implementably expresses the ruling, and whether its evidence obligations are real. If it thinks the
ruling itself is wrong it says so in one marked paragraph and evaluates the plan anyway.

It is also asked to **rule on the supervisor's interpretation** that
`installed-runtime-registry-integration_test.ts` falls under "existing test paths may be amended" —
that reading is this supervisor's, was recorded as such, and a plan evaluator is exactly the right
place to confirm or reject it.

Dispatch is one command once the amended plan commit lands; a watcher is armed on that head.

### Close-gate baseline run early, and it found a readiness blocker already in the PR body

Ran `.llm/tools/validation/check-close-gate.ts --repo rickylabs/netscript --pr 1739` at head
`349d5915` rather than waiting for readiness, on the principle that a gate which will run later is
cheaper to read now. It needs `GH_TOKEN`/`GITHUB_TOKEN` in the environment — `gh auth token` supplies
it; without it the tool aborts before evaluating anything.

Verdict `FAIL`, as expected mid-work. Two results are already useful:

**Confirmed correct.** The closing reference resolves — `closing issues: #1673`,
`closing reference: #1673 source: body keyword`. The keyword obligation is genuinely satisfied, not
merely present as text. The five #1673 acceptance boxes are correctly unticked; this lane mirrors
evidence and never ticks issue boxes, which stay coordinator-owned.

**A blocker found early.** PR #1739's Definition-of-Done still carries line 93:

> Workers report selection covers profiles, includes, conditional includes, plugin directories,

That box is a leftover from the pre-ruling 24-path plan. **Workers is now deferred follow-up scope**,
so as written the close-gate would demand evidence for work this leaf is forbidden to do, and an
unticked DoD box blocks readiness. Left unnoticed it would have surfaced at the readiness step, after
S7 and the IMPL-EVAL — the most expensive possible moment to discover a scope contradiction.

Queued for the author in the same amendment: drop or explicitly defer that box, and align the whole
DoD list to the re-locked 11-path ceiling so every box is something this leaf can actually evidence.
Nothing gets ticked yet — the gate's own rule is that a box is ticked only once its claim is true and
evidenced.

### Pipeline staged so the remaining stages do not each need a stop

- **PLAN-EVAL brief** — focused and bounded, F1 explicitly off-limits, Fable 5 · medium.
- **Exact-head gate runner** (`gates-1673.sh`) — head identity, ceiling containment against the
  authorized 11 (flagging the interpretation-allowed integration test distinctly), `deno.lock`,
  focused + related + AI-plugin suites, scoped check/lint/fmt, the `check:mcp-export-corpus` /
  `check:publish-assets` cascade, publish dry-run, `doc:lint`, `quality:gate`. `scaffold.runtime` is
  deliberately excluded — it is supervisor-coordinated under the singleton lease, never author-run.
- **PR-body DoD correction** — queued for the next same-thread delivery.

### Author liveness — verified, and an earlier alarm corrected

The turn looked dead: 76 seconds of rollout silence, agent absent from `codex-status`, and `plan.md`
showing as **deleted** in the worktree. It was not dead — the rollout has since grown three times
(8,275,580 → 8,339,136 → 8,354,008 → 8,379,158 bytes) and `plan.md` is back to modified. The deletion
was the midpoint of a large rewrite, and the silence was one long tool call.

The lesson is about the *detector*, not the incident: mtime staleness alone produces false deaths just
as `state` alone produces false turn-boundaries. The watcher now distinguishes them properly — it
reports ALIVE on rollout growth, exits on a head move, and only declares death after four consecutive
minutes with no growth.

## 2026-08-30 — amended plan terminal at `13402d3f`; focused PLAN-EVAL dispatched

### The amendment is a faithful expression of the ruling

Verified path-by-path rather than counted: the plan's eleven authorized paths are an **exact match**
to the coordinator's authorization — the prior six CLI paths, `installed-runtime-registry-generator_test.ts`,
and the four `plugins/ai` paths — with no drift in either direction.

Both items this lane flagged rather than silently allowed came back resolved as directed:

- **`runtime-registry-source-report.ts` is not created.** "Parsing and validation stay in path 2", so
  no unauthorized new CLI file was invented on the author's own authority.
- **The integration test is retained with the interpretation recorded in `drift.md`**, explicitly
  labelled as resting on the supervisor's reading so PLAN-EVAL or the coordinator can overturn it
  before S7 at low cost.

`plugins/workers/*`, `plugins/sagas/*`, and `plugins/triggers/*` are removed. F4 is deferred with a
reasoned argument rather than a bare deferral: a workers manifest can later advertise
`inspectionProtocol: 1` and feed its existing selector into the same target/path/source report without
the host learning workers policy — so the protocol needs no redesign for the deferred work. Non-scope
explicitly bars issue and acceptance-text mutation, noting AC2 already distinguishes definitions from
factories.

**The stale workers DoD box is gone.** The close-gate had found it in the PR body at line 93; the
author removed it during the same amendment, so the queued correction was never needed. Re-checked
against the live PR body, not assumed.

Terminal state confirmed before dispatch: local == `origin` == PR #1739 `headRefOid` == `13402d3f`,
tree clean, author gone from the daemon. Dispatching against an unpushed head would have handed the
evaluator a commit it could not fetch.

### PLAN-EVAL cycle 1 — identity and route recorded before the evaluator mutates anything

| Field | Value |
| --- | --- |
| Gate | PLAN-EVAL cycle 1, PR #1739 (#1673) |
| **Plan commit evaluated** | `13402d3fbfba1c166fcf5c636a1b2ef59eb0b543` — local == `origin` == PR `headRefOid` |
| Previous plan revision | `349d5915` (pre-ruling, 24-path ceiling) — supplied as a diff baseline |
| Immutable base | `13878a80a50c55b9662099fed64555f2310ae4a3` |
| Requested route | **canonical** `formal_plan_evaluation` — native Claude `claude-fable-5` · effort `medium` · `--remote-control` |
| Observed route | `respawnFlags: ["--effort","medium","--permission-mode","bypassPermissions","--remote-control","--model","claude-fable-5"]` — **matched** |
| Background id | `044800a7` |
| Claude session id | `044800a7-8261-470f-b1c8-4eda951bd45b` |
| PID | `280089` |
| cwd | `/home/agent/projects/netscript/worktrees/007-planeval-1673` (dedicated worktree; sole session there) |
| Verdict branch | `eval/plan-eval-1673-cycle-1`, cut at the plan commit, upstream NONE |
| Registry `bridgeSessionId` | `session_01CdWJ3a27GKvn879RALeB2o` (non-empty, sessions-registry form) |
| Remote Control URL | `https://claude.ai/code/session_01CdWJ3a27GKvn879RALeB2o` |
| Independence | fresh session; separate from the Codex author `01a051d0` and from this supervisor; opposite-family to the `gpt-5.6-sol` implementer |
| Verdict | _pending — immutable pushed verdict required_ |

**The brief is deliberately narrow, per the shipping order.** It opens by stating that F1 and the
design response are settled and must not be re-audited, and that the evaluator judges one thing:
whether the re-locked plan faithfully and implementably expresses the ruling, and whether its evidence
obligations are real. If it believes the ruling itself is wrong it says so in one marked paragraph and
evaluates the plan anyway. It is told the two mechanical facts this supervisor already verified — the
exact 11-path match and the correctly-absent report file — so the cycle is not spent re-deriving them.

It is also asked to **rule on the supervisor's interpretation** of
`installed-runtime-registry-integration_test.ts` under "existing test paths may be amended". That
reading is this supervisor's, was recorded as such by the author, and a plan evaluator is the right
place to confirm or reject it.

## 2026-08-30 — PLAN-EVAL `PASS_PLAN` at `13402d3f`; S7 dispatched with binding amendments

Verdict commit `7db40ca0`, pushed on `eval/plan-eval-1673-cycle-1`. Immutable pushed verdict
satisfied. Route was the canonical Fable 5 · medium, and the evaluator stayed inside the narrow
mandate — it did not re-audit F1.

Passed: contract fidelity, the eleven-path ceiling, the correctly-absent report file, the no-writes
proof design across three seams, the healthy-regression shape, genericity, and doctrine layering into
`plugins/ai`. Seven binding items follow, all executing inside the plan's own provisions with no S6
re-lock.

### PE-2 (major) — a hole inside the guard built to prevent F1

The plan's shared-selector obligation proved that **compile** did not diverge from the shared
selector. **Nothing proved inspect did not.** An implementer could post-filter or re-order inside the
report serializer and every listed assertion would still pass — the F1 divergence shape reappearing
inside its own countermeasure.

Binding fix: assert the inspect report's `registries[i].sourceFiles` **deep-equals**
`compileAiRegistry(files, target).files` per declared target, membership *and* order. To make that
assertable without a subprocess, the report builder becomes a plain function
(`inspectAiRegistries(files, targets)` in path 10) that `generate-runtime-registries.ts` merely
serialises — `main()` currently hard-codes `LocalProjectFiles` + `console.log`, so equivalence cannot
be asserted through `main` alone. Lands in S8.

This is the sharpest finding of the gate: the requirement was correct, and its evidence obligation was
one-sided in exactly the direction that matters.

### PE-5 (major, ruled) — this supervisor's interpretation was overturned, and correctly

The reading that `installed-runtime-registry-integration_test.ts` fell under "existing test paths may
be amended" was ruled **textually admissible but unnecessary**: an interpretation is warranted only
when no enumerated path can host the obligation, and path 6 can. `doctor-plugin-registry-drift_test.ts`
already drives the real `doctorPlugin` with `DenoFileSystem` + `DenoProcess` over a temp project and
already runs real installed generation first; the obligation is "assert **doctor** stays healthy",
which the integration test never touches and would have to cross features to reach.

So S7 and the layer-3 byte snapshot relocate into path 6, the integration test is not amended, and the
ceiling is now **exactly the enumerated eleven** with no flagged interpretation and no coordinator
adjudication outstanding — a strictly better position than the one this lane created.

**The lesson is this supervisor's to carry:** when a ruling appears to require a path outside its own
authorization, the first move is to check whether an authorized path can carry the obligation better —
not to reach for an admissible reading. Recording the interpretation *as* an interpretation is what
made it cheap to overturn; that part worked exactly as intended.

### Minor binding items, routed to slices

| Item | Substance | Slice |
| --- | --- | --- |
| PE-9 | Path 2 crosses the 500-line F-1 cap (478 now). It is `level: WARN`, `arch:check` fails only on `fail` totals, and `doctor-plugin-use-case.ts` already carries the same WARN — state it so IMPL-EVAL does not read it as unrecorded drift | S7 artifacts |
| PE-11 | Leaf `supervisor.md:27` still says PLAN-EVAL is `N/A`; this pass disproves it | S7 artifacts |
| PE-10 | The renamed error title does **not** "cannot be mistaken for the legacy path" — the wrapper catches every dry-run failure including legacy ones. Neutral title or drop the claim | S9 |
| PE-8 | `check:mcp-export-corpus` is **not** in `.llm/tools/gates/catalog.ts`, so it cannot be recorded "through repo gate" — record a reproducible raw command plus exit code | S10 |
| Sweep-1 | Keep `EmptyPluginRegistryError` for zero-selected-sources-across-all-targets under generator authority | S9 |

IMPL-EVAL will treat PE-2 and PE-5 as `FAIL_FIX` conditions if absent.

### S7 dispatched

Delivered on the same author thread once it was free, proven from the target rollout
(`inspectAiRegistries`, `relocated to path 6`) with no active-writer conflict. The brief carries every
binding item with its slice, restates the unchanged boundaries, and repeats that `scaffold.runtime` is
required but supervisor-coordinated and must never be author-run.

Exact-head gates run from `gates-1673.sh` once the implementation slices land.

## 2026-08-30 — S7 landed at `e24e7ce1`; red-before verified independently

Pushed; local == remote. Every PLAN-EVAL binding item assigned to S7 was checked against the artifact
rather than taken from the commit message:

| Binding item | Verified |
| --- | --- |
| **PE-5** relocation | The new case lives in **path 6** (`doctor-plugin-registry-drift_test.ts`); `installed-runtime-registry-integration_test.ts` appears **zero** times in the commit's file list, so it was not amended. The ceiling is now exactly the enumerated eleven with no interpretation outstanding. |
| **PE-11** stale line | `supervisor.md` now reads "PLAN-EVAL cycle 1 returned harness `PASS` / PR `APPROVED` at plan commit `13402d3f`" — the `N/A` claim is gone. |
| **PE-9** F-1 WARN | `plan.md:316` states the expected doctrine `WARN` on path 2 with the reasoning: the coordinator forbids the split parser file, `arch:check` fails only on `fail` totals, and the existing doctor use case already carries the same WARN. |
| Environment correction | `plan.md:302` records Docker 28.5.2 / inotify 1024 and explicitly states there is **no** below-28 warning and **no** expected inotify collision — the pre-excuse this lane withdrew is absent. |

### The red-before is real, and red for the right reason

Re-derived by running the focused suite at the S7 head, not read from the author's receipt:

```
exit 1 · passed 5 · failed 1
failing case: "plugin doctor stays healthy when AI generation excludes the skill-loader factory" (line 149)
RemoteError: Plugin doctor failed: workspace
```

That is **F1 reproduced as a test**: doctor reporting failure on a correctly generated AI project
carrying the `skill-loader` factory. The five pre-existing cases still pass, so the new case did not
disturb them. This is exactly what PE-4 predicted — the assertion can only go green once the
generator's selection becomes the expected set, which is the product change itself.

The discipline that mattered on this leaf from the start now holds twice: the original S2 red-before
for the missing-entry direction, and this one for the false-failure direction. Both were verified by
the supervisor from a re-run rather than from a receipt.

S8 next, carrying the PE-2 binding amendment: the inspect-report ≡ compile-`files` equivalence
assertion per declared target, with the report builder extracted to a plain
`inspectAiRegistries(files, targets)` so the equivalence is assertable without a subprocess.

## 2026-08-30 — S8 landed at `8dcb578f`; PE-2 satisfied, verified from the code

Pushed; local == remote. Files touched are exactly authorized paths 8–11
(`plugins/ai/scaffold.runtime.json`, `ai-registry-compiler.ts`, `ai-registry-compiler.test.ts`,
`generate-runtime-registries.ts`) plus run artifacts. No seventh path, no CLI-side change yet.

### PE-2 — the binding amendment is genuinely implemented, not nominally

Checked in the source rather than from the slice comment:

- **Protocol advertised.** `scaffold.runtime.json` now carries
  `runtimeRegistryGenerator: { command, args, inspectionProtocol: 1 }` — the coordinator's key name,
  optional and additive.
- **Plain report builder in path 10.** `export async function inspectAiRegistries(` at
  `ai-registry-compiler.ts:118`, returning the document object, so the equivalence is assertable
  without a subprocess — which was the whole point of the amendment.
- **The equivalence assertion exists, per declared target.** In `ai-registry-compiler.test.ts`, for
  each target: `const compiled = await compileAiRegistry(compileFiles, target);` then
  `assertEquals(report.registries[index].sourceFiles, compiled.files)`. `assertEquals` on arrays
  compares membership **and** order, which is what PE-2 required.
- **No-writes assertion at layer 1.** `assertEquals(inspectFiles.written, writesBeforeInspect)` —
  a snapshot around the inspect call, not an inference from a missing flag.
- Protocol version and declared registry paths are asserted alongside.

So the loophole PE-2 identified — an implementer post-filtering or re-ordering inside the serializer
while every listed assertion still passed — is now closed by construction.

### The intermediate test state is exactly right

| Suite | Result at `8dcb578f` |
| --- | --- |
| `plugins/ai/src/cli/ai-registry-compiler.test.ts` | exit 0 · **9 passed / 0 failed** |
| `packages/cli/.../doctor-plugin-registry-drift_test.ts` | exit 1 · **5 passed / 1 failed** |

The doctor case is *still red*, and that is correct: the AI side now reports its selection, but the
**host** has not yet been changed to consume the report as the expected set. The failure is still the
S7 healthy-regression case.

This is worth stating because it is the cleanest possible evidence that the eventual green will be
**product-caused**: publishing the report alone does not turn the test green, so the green — when it
comes — can only come from the host consuming it. The same standard this leaf applied to its own
red-before now applies to its fix.

Next slice is the host side, carrying the remaining minors: PE-10's neutral inspection error title and
Sweep-1's retained `EmptyPluginRegistryError` (S9), then PE-8's raw-command receipt for
`check:mcp-export-corpus` (S10).

## 2026-08-30 — host slice in flight; singleton runtime lease formally requested

### Lease request — `scaffold.runtime` for #1673, addressed to the coordinator

This lane does **not** self-grant. Requesting the singleton expensive-gate lease, with the state that
makes it grantable recorded so the decision needs no re-derivation:

| Field | Value |
| --- | --- |
| Requesting lane / leaf | fixes · #1673 · PR #1739 · `fix/plugin-doctor-registry-drift` |
| Gate | `scaffold.runtime` (plan gate 16 — REQUIRED, supervisor-coordinated, author-must-not-run) |
| Slot state | `expensiveGates` shows **0 active/held**; `limits.globalExpensiveGates` is 1, so the slot is free |
| Lease owner | `codex-root-0.0.7` — grant authority, not this lane |
| Environment | DinD client/server **28.5.2**, `netscript-dind` 10.4.12.19, `fs.inotify.max_user_instances` **1024**, `docker ps -a` and `aspire ps` both **zero** |
| Scope requested | one isolated `scaffold.runtime` verdict at the exact implementation head, Aspire/Docker cleanup mandatory, sandbox returned to zero |
| Cleanup commitment | `agentic:leak-check` first, then `agentic:teardown --apply` scoped to proven resources, `--owned-root` for anything started outside the worktree; durable receipt is the runner `--report` JSON, since `e2e:cli` is not in `.llm/tools/gates/catalog.ts` |

**Why this gate is not ceremonial here.** IMPL-EVAL cycle 1 predicted CI's `scaffold.runtime` would go
red at the pre-fix head: the e2e plugin-suite builder defaults `aiMcp = true`
(`plugin-suite-builder.ts:16`) and `behavior.plugin-doctor-missing-module` requires doctor healthy
first. That makes this suite the one end-to-end proof that F1 is genuinely fixed rather than
unit-tested. The lane proceeds with every non-runtime gate meanwhile, so the request blocks nothing.

### Two central-state observations, reported not touched

1. **Stale active evaluator leases in this lane.** `evaluatorLeases` still lists
   `reset-gate-05-scaffold-generated-output-correctness-plan-eval-cycle-1` (`blocked`) and
   `prisma-mysql-honest-example-plan-eval-cycle-2` (`running`) as active, though both leaves merged
   long ago. With `limits.activeEvaluatorsPerLane: 1` the recorded state implies this lane is at
   capacity while it actually has **zero** evaluators running. This lane's real practice — one
   evaluator at a time — is unchanged; the ledger is what drifted.
2. **#1673 / PR #1739 remains absent from `milestone-cluster-state.json`**, so none of this leaf's
   evaluators, gates, or heads appear in central state at all. Previously reported; repeated here
   because the lease request above will also have no home in the ledger until the leaf is registered.

### Host slice in flight

The author is modifying exactly the authorized CLI paths — `generate-installed-plugin-registries.ts`,
`installed-runtime-registry-generator.ts`, `installed-runtime-registry-generator_test.ts`,
`runtime-registry-drift.ts`, `doctor-plugin-use-case.ts`, and `doctor-plugin-registry-drift_test.ts`.
All six are inside the eleven; nothing outside has been touched.

## 2026-08-30 — gate runner validated, and a defect found in this lane's own tooling

Dry-ran `gates-1673.sh` while the host slice was still uncommitted, to catch bugs in it before the
moment it matters. The runner itself is sound — head identity, ceiling containment, lock check,
suites, scoped check/lint/fmt, cascade, publish dry-run, `doc:lint`, and `quality:gate` all executed
correctly.

**But it produced a full green report from a dirty tree without objecting.** `dirty : 6` was printed
and every gate ran anyway. That is the same defect class as #1673: a green that reality does not back,
because a green from an uncommitted tree is indistinguishable from a green at the head. It would have
been an easy way to record work-in-progress results as exact-head evidence.

Fixed: the runner now **refuses** on a dirty tree, prints the offending paths, and exits 9. An
`ALLOW_DIRTY=1` escape exists for previews, and the refusal text states that such output must never be
recorded as gate evidence. Verified the guard fires.

Writing the guard rather than just remembering to check is the point — this leaf's whole subject is
that a check which can silently pass on the wrong input eventually will.

### Preview results — explicitly NOT evidence, recorded only as a progress signal

From the pre-guard dirty-tree run at `8dcb578f` **plus the author's uncommitted host changes**:

| Check | Preview result |
| --- | --- |
| Focused regression suite | exit 0 · **6 passed / 0 failed** — including the S7 healthy case |
| Related doctor/generator suites | exit 0 · 54 passed / 0 failed |
| AI plugin CLI suites | exit 0 · 12 passed / 0 failed |
| Ceiling containment | no path outside the authorized eleven |
| `deno.lock` | unchanged |
| `check:mcp-export-corpus` / `check:publish-assets` | exit 0, both measured negatives |
| `deno publish --dry-run` (cli) | Success |
| `doc:lint` (cli) | 0 errors across three entrypoints |
| `quality:gate` | two pre-existing `export default` WARNs in `cli.ts` and `official-sample-configuration.ts`, both outside the ceiling |
| Scoped fmt | one finding — `public-command-dependencies.ts`, the known base-owned line-1 import |

The signal that matters: the S7 healthy-regression case, red at `e24e7ce1` and still red at `8dcb578f`,
**goes green once the host consumes the inspect report**. That is the product-caused green this leaf
required, arriving from the host change exactly as predicted — but it is only a preview until it is
re-derived at a committed head, which is what the new guard now enforces.

## 2026-08-30 — S9 host slice at `4e1fed64`; exact-head gates green; Tier-A findings

Phase labels normalized to the actual phase: PR #1739 and issue #1673 both moved `status:plan` →
`status:impl`, exactly one `status:` each.

### Exact-head gates at `4e1fed64` — clean tree, all green

Run through the repaired `gates-1673.sh`, which now refuses a dirty tree. `dirty : 0`, and
local == `origin` == PR `headRefOid` == `4e1fed64`.

| Gate | Result |
| --- | --- |
| Ceiling containment | no path outside the authorized eleven |
| `deno.lock` | byte-unchanged vs `origin/main` |
| Focused regression suite | exit 0 · **6 passed / 0 failed** |
| Related doctor/generator suites | exit 0 · 54 passed / 0 failed |
| AI plugin CLI suites | exit 0 · 12 passed / 0 failed |
| Scoped type check (10 ceiling `.ts`) | exit 0 |
| Scoped lint (root rules, `packages/cli` exclusion removed) | exit 0 · 10 files · 0 findings |
| Scoped fmt | 1 finding — attributed below |
| `check:mcp-export-corpus` / `check:publish-assets` | exit 0, both measured negatives |
| `deno publish --dry-run` (cli) | Success |
| `doc:lint` (cli) | 0 errors across three entrypoints |
| `quality:gate` | exit 0 |

### The green is product-caused, and this leaf can prove it with two points rather than a hybrid tree

| Head | State | Focused suite |
| --- | --- | --- |
| `e24e7ce1` | regression only, no product change | exit 1 · 5 passed / **1 failed** |
| `8dcb578f` | AI side reports its selection; **host unchanged** | exit 1 · 5 passed / **1 failed** |
| `4e1fed64` | host consumes the inspect report | exit 0 · **6 passed / 0 failed** |

Publishing the report changed nothing. The green appears only when the host consumes it. That is a
cleaner demonstration than the base-archive hybrid used earlier in this leaf, because both points are
real committed heads rather than a constructed tree.

### Scoped fmt finding — base-owned, proven at line level

`public-command-dependencies.ts` **was** modified by this leaf, so the finding could not be dismissed
as base-owned on file identity alone. Attributed at line granularity, per the T-1 lesson:

- Head finding is at **line 1** — the `import {` from `@netscript/plugin/sdk` that `deno fmt` wants
  collapsed to one line.
- A pristine `git archive` of `origin/main` for the same file produces the **identical finding at the
  identical line 1**.
- The leaf's only change to that file is at **line 317**,
  `inspectRuntimeRegistries: generatePluginRegistries,` — nowhere near the finding.

Base-owned, established by comparing at the granularity of the claim.

### PE-9's predicted WARN is present, exactly as forecast

`WARN A8/AP-1/F-1: file is 673 lines (cap 500) — split into smaller single-reason files
(src/public/features/generate/plugins/installed-runtime-registry-generator.ts)`.

Path 2 went 478 → 673 lines because the coordinator forbade the split parser file. It is a `WARN`,
`arch:check` fails only on `fail` totals, `quality:gate` exited 0, and the author recorded the
expectation at `plan.md:316` before it happened. So it is a predicted, recorded consequence rather
than unrecorded drift — which is precisely what PE-9 asked for.

### Contract review — read in the source, not from the slice comment

- **Fail-closed is structural.** `inspectionProtocolDeclared` is `Object.hasOwn(generator,
  'inspectionProtocol')` — *presence*-based. A manifest declaring `inspectionProtocol: 2` or `"1"`
  therefore still takes the inspect path and then **fails validation**, rather than quietly reverting
  to the walk. `fail()` is a `never`-returning throw, and both `catch` blocks route into it: a
  non-JSON stdout fails, and a filesystem error on a reported source fails with an explicit comment
  that this preserves fail-closed rather than leaking a filesystem-shaped error through the doctor
  surface.
- **Legacy behaviour is genuinely untouched.** The branch at line 94 selects the walk whenever the
  protocol is absent, and the non-dry command result shape is unchanged.
- **Bounded claims.** Dry-run entries now carry `sourceAuthority: 'generator' | 'manifest'`, so
  healthy output can state which authority produced the evidence rather than implying one.
- **PE-2 satisfied** — plain `inspectAiRegistries` builder plus per-target deep-equality against
  `compileAiRegistry(...).files`, membership and order.
- **PE-5 satisfied** — regression in path 6; `installed-runtime-registry-integration_test.ts`
  untouched by this leaf.
- **PE-10 satisfied** — neutral title `'Runtime registry inspection'`.
- **Sweep-1 satisfied** — `EmptyPluginRegistryError` retained, and it now guards both paths.

### Tier-A sign-off is deliberately deferred to the final head

S10 is still in flight and carries **PE-8** — recording `check:mcp-export-corpus` as a reproducible
raw command, since it is not in `.llm/tools/gates/catalog.ts`. Signing off now would attest a head
that is about to be superseded, and **IMPL-EVAL is cycle 2 of 2** — spending the last cycle on a stale
head would be an expensive, self-inflicted error. Sign-off and dispatch both wait for S10, which is
minutes away, not a stop.
