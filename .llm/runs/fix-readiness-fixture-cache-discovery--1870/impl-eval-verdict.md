PASS_IMPL

# IMPL-EVAL — PR #1871 / issue #1870 · readiness fixture vs Auto-cache dual RESP arms

## Head and identity

| Field | Value |
| --- | --- |
| Head judged | `7b5a31a807be4f9b2bb9a15acb7f22aa16d93c9d` (`7b5a31a80`) — verified equal to PR #1871 `head.sha` |
| Merge base vs `origin/main` | `d2b33a09b` (branch base); `origin/main` has since advanced to `1e53e731a` |
| Route requested | `formal_impl_evaluation` open-model route per `.llm/harness/workflow/lane-policy.md`: `z-ai/glm-5.3-flash` · effort `max` |
| Identity observed | Model `z-ai/glm-5.3-flash` (session environment); effort `max` (`CLAUDE_EFFORT=max` in session env). **Requested and observed match** |
| Session | `3eaf1e2a-824c-4c73-a5b7-15263968c283` — independent of the GPT-5.6 Sol implementation/supervisor sessions; no product code edited, nothing committed except this file |

## Findings table

| # | Question | Verdict | Evidence (commands I ran in this worktree) |
| --- | --- | --- | --- |
| B1 | Is the diagnosis true — does an Auto cache make `garnet_resp` emit twice? | **CONFIRMED** | I generated the output myself from the real config — `redis` Redis/Container (init default) + `garnet` `{ Enabled: true, Engine: 'Garnet', Mode: 'Auto' }` copied verbatim from `workspace-mutator.ts:628-632` — via `generateRegisterInfrastructure`, plus postgres Container. Independent line count: `redis_resp` attachments = **1**, `garnet_resp` attachments = **2**, classified by arm = `["container", "executable"]`. Mechanism re-read in source: `generate-register-infrastructure.ts:268-288` emits both `if (shouldUseContainerCache())` arms inline for `Mode: 'Auto'`; line 545 pushes the `withHealthCheck` line in both setups. Premise reproduced, not quoted. |
| B2 | Does the injection land in BOTH arms with correct bindings? | **CONFIRMED** | Ran `injectListenerFaultHealthChecks(realSource, DATABASE.POSTGRES)`. Arm scan of the injected output: test-only `builder.addHealthCheck('test_only_garnet_resp'` — **1 in container arm** (line 100), **1 in `} else {` arm** (line 118), **0 outside**; `await cache_1.withHealthCheck('test_only_garnet_resp')` total = 2, each immediately following its arm's own real `await cache_1.withHealthCheck("garnet_resp")` (line index +1), each bound to that arm's own `cache_1`. Real attachments remain 1 per arm. The previous-bug pattern (2 in first arm, 0 in second) is **absent**. SQLITE variant: 2 garnet test-only regs, 0 postgres (correct). Postgres key: 1 registration beside its single attachment. |
| B3 | Is the regression test discriminating, or vacuous? | **CONFIRMED discriminating** | Reconstructed the described prior iteration — `injectAtHealthAttachments` rewritten to `injected.replace(attachment.statement, statement + "\n" + block)` per attachment — and ran the **verbatim committed test** against it (scratch copies under `.llm/tmp/impl-eval-1870/`, run via a temporary repo-root symlink, since root `deno.json` excludes `.llm/tmp/`). Result: **4 passed / 1 failed, exit 1**, failing at `assertAutoBranchInjectionPlacement` (line 187): `Expected actual: "    caches.set("garnet", cache_1);" to contain: "builder.addHealthCheck('test_only_garnet_resp'"` — i.e. the executable arm got nothing. Probe detail: buggy impl puts both test-only blocks at lines 99 and 101 (both after the first real attachment, line 98, container arm); second real attachment at line 118 has none. The count assertion (`=== 2`) **passed** under the bug — proving a count-only test would be vacuous and the placement assertion is the load-bearing one. Control: the same committed test against the real injector = **5 passed / 0 failed, exit 0**. |
| B4 | Is RED genuine? | **CONFIRMED** | `git diff --name-only e7e4e4dc5^ e7e4e4dc5` = exactly one file, the test (`+26/-1`) — **zero product files**. Extracted the commit with `git archive e7e4e4dc5 | tar -x` and ran the focused suite inside the extracted tree: **4 passed / 1 failed, exit 1**, failing with the exact production error `generated register-infrastructure helper has no garnet health-check marker` thrown from the RED product module (`prepare-readiness-fixture.ts:63`), from the new test `listener fault splice accepts the E2E two-cache Auto generator output` — which builds its input from `generateRegisterInfrastructure` with the real two-cache config (`buildCacheBlock('redis')` + `garnet` `Mode: 'Auto'`) and asserts `garnet_resp` count = 2 before injecting. The RED reproduces the CI condition, not a synthetic single-cache project. |
| B5 | Is fail-closed preserved? | **CONFIRMED** | (a) Both `garnet_resp` lines removed → throws `generated register-infrastructure helper has no garnet health-check attachment`. (b) Cache-less generated source → same absent-message throw. (c) Cache-only source with `DATABASE.POSTGRES` (no postgres attachment) → throws the postgres absent-message. (d) Re-injecting an already-injected source → throws `test-only listener health checks were already registered`. (e) The old conflated string `has no garnet health-check marker` is **absent** from the product source. Note on wording: under the fix, "not unique" is deliberately **no longer an error** (N ≥ 1 accepted — that is the point of the change), so the distinguishable error pair is *absent* vs *already registered*, and the absent message now names the real condition (`no … attachment`) instead of the ambiguous `marker`. (f) Postgres takes the same generic path — no special case (read from source; `healthAttachments(source, POSTGRES_REAL_HEALTH_KEY)` drives the same `injectAtHealthAttachments`). |
| B6 | Is the emitted output still valid? | **CONFIRMED** | Wrote the injected result to a file, rewrote its two import specifiers to a local stub module, and (1) `deno check --no-config` it: **clean** (initial run surfaced one error — my stub's `ensureDatabasePassword` arity, not injected code; after stub fix, `Check` passed; the uninjected generated file passes identically as a control). (2) **Executed** the injected module in both arm modes with a recording builder: container arm → addHealthCheck keys `["postgres_listener","test_only_postgres_listener","redis_resp","garnet_resp","test_only_garnet_resp"]`; executable arm → identical set; **no duplicate keys in either run** — `if/else` means exactly one arm executes, so the same test-only key cannot double-register at runtime. garnet awaits per run: `garnet_resp`, `test_only_garnet_resp`. |
| B7 | Ceiling and lock. | **CONFIRMED** | `git diff origin/main...HEAD` (merge-base diff) = the two product/test paths + run-dir artifacts only; no `packages/cli/src/**` change. `deno.lock`: `git rev-parse origin/main:deno.lock HEAD:deno.lock e7e4e4dc5:deno.lock` = `ac2ee042566bc6b03502c40961c10d624416b061` for all three — **byte-identical blob to `origin/main`** (stronger than a range diff, since main has advanced). |

## Gate re-runs (independent, this session — not copied from the supervisor)

| Gate | Command | Observed result |
| --- | --- | --- |
| Focused suite | `run-deno-test.ts` on `prepare-readiness-fixture_test.ts --allow-all` | exit 0 — **5 passed / 0 failed** |
| E2E gates suite | `run-deno-test.ts` on `packages/cli/e2e/tests/application/gates --allow-all` | exit 0 — **108 passed / 0 failed**, 0 unique failures |
| E2E workspace check | `run-deno-check.ts --root packages/cli/e2e --ext ts` | exit 0 — **187 files, 2 batches, 0 diagnostics** |
| E2E workspace fmt | `run-deno-fmt.ts --root packages/cli/e2e --ext ts` | exit 0 — **187 selected/processed, 0 findings, 0 refusals** |
| Focused lint | `run-deno-lint.ts --root …/scaffold/runtime --ext ts` | exit 0 — **13 files, 0 findings, 0 refusals** |
| E2E workspace lint | `run-deno-lint.ts --root packages/cli/e2e --ext ts` | **REFUSAL, exit 2** — `Package 'zod' not found in catalog` from the detached `desktop-native` fixture. Pre-existence independently proven here: the PR delta touches neither `packages/cli/e2e/fixtures/desktop-native/deno.json` (last changed `cd7205293`, 2026-08-13, #1638) nor root `deno.json`; the supervisor additionally reproduced it on clean `main`. Recorded as REFUSAL, not PASS — matches the supervisor's report exactly. |
| Doctrine: `quality:scan` | `deno task quality:scan` | exit 0 — `ok:true`, findings `[]` (7 pre-existing allowances, issue #1276, none in delta) |
| Doctrine: `arch:check` | `deno task arch:check` | exit 0 — WARNs only in pre-existing example/plugin files, none in delta |
| Lock hygiene | `git rev-parse` blob comparison | PASS — see B7 |
| Tree state | `git status --short` | Only the pre-existing untracked `impl-eval-session.log` + this verdict file |

## Attempts that failed to break the change (negative results are evidence)

1. **Buggy reconstruction (B3)** — per-attachment `String.replace` injection: produced exactly the historical defect (both blocks in the container arm, executable arm untouched, lines 99/101 vs real attachments 98/118). The committed test caught it (exit 1, placement assertion), while the count assertions passed — confirming the test suite is not vacuous and would have caught the trap the PR describes.
2. **Cache-only two-cache source with `DATABASE.POSTGRES`** (no postgres database) — tried during probe construction; the injector refused with the postgres absent-message rather than silently skipping. Fail-closed held on an input shape neither the tests nor I originally fed it.
3. **Re-injection / duplicate test-only key** — refused with the already-registered message; the idempotence guard survives the multi-attachment rewrite.
4. **Runtime double-registration probe** — executed the full injected module in both arm modes looking for duplicate health keys within a run; none found (only one arm executes).
5. **Zero-attachment and cache-less inputs** — both refused; no silent pass-through path exists for missing markers.
6. **Lock/ceiling attack** — looked for hidden `packages/cli/src/**` or lock drift via both merge-base and direct blob comparison; none exists.

Not run, deliberately: `deno task e2e:cli` / `scaffold.runtime`. I hold no runtime lease, and `scaffold.runtime` cannot pass on `main` today — that is the defect this PR fixes. Absence of a runtime receipt is **not** a FAIL reason; hosted CI owns the runtime proof for the final DoD box.

## Blocking findings

None.

## Non-blocking observations

1. **`.llm/runs/…/context-pack.md` is stale** — it still says "Current phase: implement — RED" and lists completed RED/GREEN work under "In Progress"/"Next Steps". `worklog.md` is current and the PR body carries the final state, so resumability is not impaired. Suggest the owner refresh it before close.
2. **The RED commit's new test is count-only** (as RED must be — it asserts the premise). The placement assertion arrives only in GREEN. This is correct RED/GREEN hygiene, and B3 proves the GREEN suite would fail the historical single-arm bug; noted so nobody later "simplifies" `assertAutoBranchInjectionPlacement` away — doing so would re-open the vacuous-test trap.
3. **`origin/main` has advanced to `1e53e731a`** (workers job-policy). The merge will take main's side for the four workers/generated files that appeared in a two-dot diff; the three-dot delta of this PR is clean, and `deno.lock` is blob-identical to current main, so no rebase hazard is visible from here.
4. **B5 wording nuance** — "not unique" is no longer an error by design (N ≥ 1 accepted); the distinguishable error pair is *absent* vs *already registered*, with the ambiguous old `marker` message removed. This satisfies the issue's intent (stop conflating conditions) rather than its literal "two error messages" reading; flagging so the owner can confirm the interpretation before merge.
5. `rtk` is unavailable in this evaluation environment (consistent with the run's recorded drift entry); structured wrappers were used for all verdict evidence, raw commands for inspection only.

## Verdict

All seven questions CONFIRMED against evidence I produced myself: the diagnosis reproduces from real generator output; the injection lands in both Auto arms with per-arm bindings; the regression test provably fails the historical `String.replace` bug and passes the real implementation; RED is genuine and test-only; fail-closed behavior survives every shape I threw at it; the injected output type-checks and executes with no duplicate registrations; the ceiling and lock hold. All re-run gates match the supervisor's reported numbers, including the pre-existing lint REFUSAL.

PASS_IMPL
