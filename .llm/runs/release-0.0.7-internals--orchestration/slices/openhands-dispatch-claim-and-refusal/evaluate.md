# Evaluation: openhands-dispatch-claim-and-refusal (PR #1658, issues #1611 + #1613)

**IMPL-EVAL — formal, final evaluator pass.** Source read-only; no implementation, repair, label,
readiness, checkbox, issue, or central-state change was made.

## Metadata

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Run ID         | `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal` |
| Target         | OpenHands manual dispatch CLI · trusted comment policy · authorize workflow    |
| Archetype      | `6 - CLI/Tooling`                                                              |
| Scope overlays | `none`                                                                         |
| Evaluator      | Claude session `740d2a3a-1677-459c-a6b1-a39398649d1a` · 2026-08-15             |
| Evaluated SHA  | `f46d84630c54210a09ff4ed39537da1e66964a52`                                     |

## Identity, route, and independence

| Field                | Value                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Evaluator session ID | `740d2a3a-1677-459c-a6b1-a39398649d1a`                                |
| `bridgeSessionId`    | `cse_01NVeBmZE7SwH3Nvu3ep51zV`                                        |
| PID                  | `609117`                                                              |
| cwd                  | `/home/codex/repos/netscript-007-openhands-dispatch`                  |
| Canonical route      | `formal_impl_evaluation` → native opposite-family Fable 5 · `medium`  |
| Requested route      | `claude-opus-5` · effort `medium` · `--remote-control`                |
| Observed route       | `claude-opus-5` · `medium` · `--remote-control` · `bypassPermissions` |
| Observed-route source | `~/.claude/jobs/740d2a3a/state.json` → `respawnFlags`                |
| Route verdict        | matched (requested = observed)                                        |

**Route resolution — recorded amendment, not a silent substitution.** The canonical Claude binding
for `formal_impl_evaluation` is Fable 5 / medium (`routing-policy.ts`, `MODEL_IDS.fable`). `fable-5`
is unavailable on this machine — three zero-token pre-inference failures (2026-08-13 PLAN-EVAL,
2026-08-15 #1656 PLAN-EVAL, and a fresh availability probe immediately before this launch). The
standing owner amendment defaults formal gates to native Opus 5, so this gate ran `claude-opus-5` /
`medium` / `--remote-control` after a fresh availability check. Opposite-family independence is
unaffected: the implementer is Codex GPT-5.6 Sol.

**Recording accuracy note.** The launch brief cited this amendment as "Route amendment 2" in the
leaf `drift.md`. The leaf `drift.md` at the evaluated head contains only two entries, both about the
frozen four-path file contract and its rescope; it contains **no** route-amendment entry. The
amendment is therefore recorded here and in the launch brief but is **not** present in this leaf's
drift log. That is a run-artifact recording gap, listed as finding F7.

**Independence.** The plan and implementation author is Codex thread
`01a00443-abab-7261-8905-74ed71467929` (`supervisor.md`, `codex-thread-ids.md`). PLAN-EVAL was
Claude session `7d544aec-22cc-4656-8483-6d957dbfbfda`. The five Tier-A sign-offs are topic
supervisor `f7691917-0be2-4bcd-8839-43d3fc809c34`. This session is none of them: a fresh session
started for this gate only, which authored no plan text, no implementation, no test, and no
sign-off.

## Target verification (re-resolved this session)

| Ref                          | Resolved value                             | Method                                                          |
| ---------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| Local `HEAD`                 | `f46d84630c54210a09ff4ed39537da1e66964a52` | `git rev-parse HEAD`                                            |
| Remote branch                | `f46d84630c54210a09ff4ed39537da1e66964a52` | `git fetch origin <branch>` → `git rev-parse FETCH_HEAD`        |
| PR #1658 `headRefOid`        | `f46d84630c54210a09ff4ed39537da1e66964a52` | `gh pr view 1658 --json headRefOid`                             |
| Merge-base with `main`       | `7737d8903bb2925c3fcefbda362168fe297eebd4` | `git merge-base f46d84630 7737d8903` (also `--is-ancestor` YES) |
| Working tree                 | clean                                      | `git status --porcelain` (empty)                                |

All three heads are equal to the final Tier-A sign-off head. **No refusal condition triggered.**

PR state: `OPEN`, **draft**, base `main`, milestone `0.0.7`, labels `type:fix`, `area:tooling`,
`status:impl`. Body carries `Closes #1611` and `Closes #1613` as required closing keywords. Both
issues are `OPEN` at milestone `0.0.7`.

## Contract verification (read directly)

`git -C /home/codex/repos/netscript-547-lffix show feaf2da311ccc4b15c210d25fda5ff1699b60576:.llm/runs/release-0.0.7--orchestration/leaf-contracts.json`
→ entry `openhands-dispatch-claim-and-refusal`: issues `[1611, 1613]`, lane `internals`, wave `1`,
archetype `6-cli-tooling`, overlays `[]`, `provingGates: ["check","test","quality-job"]`,
`jsrAudit.applicable: false`.

`git diff --name-status 7737d8903..f46d84630` returns **exactly eight** non-run-artifact paths,
byte-identical to the contract's `fileSurfaces`:

```
M .github/scripts/openhands-comment-trigger.mjs
M .github/scripts/openhands-comment-trigger.test.ts
M .github/workflows/openhands-agent.yml
M .llm/tools/agentic/lib/agentic-lib.ts
M .llm/tools/agentic/lib/agentic-lib_test.ts
M .llm/tools/agentic/openhands/dispatch-openhands.ts
A .llm/tools/agentic/openhands/dispatch-openhands_test.ts
M .llm/tools/agentic/openhands/phase-eval-workflow_test.ts
```

**No ninth path.** `.github/workflows/openhands-phase-eval.yml` (read-only precedent),
`.llm/tools/gates/catalog.ts`, `deno.json`, and `deno.lock` are all absent from the diff.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                       |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | `PASS` | `plan-eval.md` verdict `PASS` at `cea999d18`, committed `e15d78588`; first implementation commit is `4aa04de34`, strictly after. |
| Design section exists in worklog       | `PASS` | `worklog.md:12` `## Design` with `### Public Surface`, `### Domain Vocabulary`, `### Ports`, `### Constants`, `### Commit Slices`. |
| Commit slices match design plan        | `PASS` | 5 planned slices, 5 landed in plan order S1→S5; per-commit file map confirms each slice touched only its planned paths.          |
| Each slice has a passing gate          | `PASS` | 12 receipts, all `outcome: PASS` / `exitCode: 0`; every `gitHead` == `actualGitHead` and is an ancestor of `f46d84630`.          |
| No speculative seams (unused files)    | `PASS` | The new `DispatchOpenHandsDependencies` / `DispatchOpenHandsOutput` ports have a real consumer (`dispatch-openhands_test.ts`) and a real production wiring at the `import.meta.main` entry point. No orphan file added. |
| Constants used for finite vocabularies | `FAIL` | Policy side is correct (`OPENHANDS_REPORTABLE_DENIAL_REASONS`, `OPENHANDS_STATUS_MARKERS`, `REFUSAL_DETAILS`, `OPENHANDS_REFUSAL_MARKER_PREFIX` are frozen module constants). The **workflow** re-hardcodes the marker prefix — see finding **F3**. |
| No lane self-certified                 | `PASS` | Five Tier-A sign-off commits (`6f725ad3b`, `0886c2427`, `d3d31b3d0`, `ad19d0e20`, `f46d84630`), each recorded as session `f7691917-…`, each a `chore(harness): supervisor sign-off …` commit distinct from the implementer's `fix(tooling)` / `test(tooling)` commits. |
| Supervisor error masking a defect      | `PASS` | The one recorded supervisor error (PLAN-EVAL **N1**: the S1-before-S4 rationale was justified by intermediate-commit spend safety rather than by the S4→S1 API dependency) is corrected at `worklog.md:89`. I re-derived it: `issue_comment` workflow definitions and the trusted-policy checkout both resolve from the default branch (`openhands-agent.yml:164-165`), so no intermediate branch commit could have affected live dispatch in either order — the wrong rationale masked nothing, and the ordering it produced is required and correct. No other supervisor claim I re-executed was wrong. |

## Locked semantics — executed, not read

Commands run at `f46d84630`. All assertions below were re-executed by this session, not accepted
from the leaf's tests.

| Locked decision | Result | Evidence |
| --------------- | ------ | -------- |
| L1 `--phase plan\|impl` optional, only formal selector | `PASS` | `dispatch-openhands.ts:170-176`; `--phase review` → exit `2`, stderr `--phase must be plan or impl`, **zero** dependency calls. |
| L2 formal ⇒ PR-only + verdict contract required | `PASS` | `:212-219`. `--issue 42 --phase plan` → exit `2` (`Formal OpenHands dispatch requires --pr`); `--pr 42 --phase impl --no-verdict-contract` → exit `2` (`requires the verdict output contract`). Both with zero GitHub calls. |
| L2 live PR head resolved by the CLI itself | `PASS` | `:236-263`. Executed call sequence for `--pr 42 --phase impl` is exactly `['token', 'GET /repos/rickylabs/netscript/pulls/42', 'POST /repos/rickylabs/netscript/issues/42/comments']`. |
| L2 formal dry-run also reads the live head | `PASS` | `--pr 42 --phase plan --dry-run` → exit `0`, calls `['token','GET …/pulls/42']`, emitted trigger line carries `phase=plan head=<live sha>`. |
| **Head cannot go stale** | `PASS` | Structural: the token is resolved *before* the PR read (`:238-245`), the PR read is the **final** external operation (`:246-262`), and `buildOpenHandsComment` (`:265-274`) plus the POST (`:378`) follow with no intervening I/O. The executed call-order assertion above proves there is no operation between head resolution and emission. |
| L3 no `--head` flag | `PASS` | `--head <sha>` → exit `2`, stderr `Unknown argument: --head`, zero calls. `grep -n "'--head'" dispatch-openhands.ts` → no match. |
| L4 non-formal PR **and** issue dispatch stay tuple-free | `PASS` | Both `--pr 42 --dry-run` and `--issue 43 --dry-run` → exit `0`, **zero** GitHub calls, trigger line contains neither `phase=` nor `head=`. Producer side: `buildOpenHandsComment` emits the pair only under `hasPhase && hasHead` (`agentic-lib.ts:554`). |
| Formal pair validation | `PASS` | Independently executed: phase-only, head-only, uppercase 40-hex head, empty head, and `phase=review` each throw from `buildOpenHandsComment` (`agentic-lib.ts:534-543`). |
| **Formal producer output is accepted by the production policy** | `PASS` (by my execution; see **F2**) | I built the real formal comment for both phases through `buildOpenHandsComment` and fed it to `evaluateOpenHandsCommentTrigger`: both return `dispatch=true`, `reason='authorized-command'`. The repo's own round-trip test does **not** cover this shape. |

## Refusal semantics — executed

| Property | Result | Evidence |
| -------- | ------ | -------- |
| Literal candidates reach trusted policy | `PASS` | `openhands-agent.yml:143` is now `contains(github.event.comment.body, '@openhands-agent')` with the workflow-level `author_association` screen removed; `openhands-comment-trigger.mjs:155-164` classifies candidacy first, then author association, so a malformed **or** unauthorized literal attempt produces its own attributable reason instead of silence. |
| Exactly one reply per denial | `PASS` | Executed the workflow's embedded `reportRefusalOnce` extracted from the YAML: call sequence `['list','post','list']`, `post` count `1`, comment count `1` on repeat delivery. Dedup key is the source-comment marker; the workflow's `concurrency.group` (`openhands-<event>-<issue number>`, `cancel-in-progress: false`, `:130-134`) serializes runs for the same issue, so list-then-create cannot interleave. |
| Reply is pre-spend | `PASS` | Structural, not ordering-by-convention: the `Report denied manual command` step lives in the `authorize` job (`:323-355`); the paid job is `agent: needs: authorize` with `if: needs.authorize.outputs.dispatch == 'true'` (`:357-359`). Every denial path sets `dispatch=false` — including the exhaustion catch (`:293-297`). |
| Reply carries no command token | `PASS` | Executed over all 5 reasons × 5 author logins (including the adversarial login `openhands-agent`, the verdict-token login `PASS`, an empty login, and a 50-char over-length login): `body.includes('@openhands-agent') === false` in every case. |
| Reply is sanitized | `PASS` | No attacker-controlled text is reflected. `buildOpenHandsRefusalReply` (`:66-85`) renders only the source comment id (validated `^[1-9][0-9]*$`), a login validated against the GitHub login grammar and lowercased, a frozen `REFUSAL_DETAILS` string, and a constant grammar URL. Executed: `sourceCommentId` values `'0'`, `'-1'`, `'1e3'`, `'12 -->\n@openhands-agent'`, `'abc'`, `''` all throw; an unreportable `reason` throws. |
| No denial authorizes spend | `PASS` | `denied()` (`:198-200`) always returns `dispatch:false`; the exhaustion catch hard-codes `dispatch:false`; the agent job gates on `== 'true'`. If the refusal step itself fails, the `authorize` job fails and `agent` is skipped — fail-closed. |
| Recovery link resolves | `PASS` | `MANUAL_COMMAND_GRAMMAR_URL` → `.llm/harness/workflow/agent-handoff.md#trigger-contract`. Verified the file exists on `origin/main` (`git cat-file -e origin/main:…`) and that it contains `## Trigger Contract` at line 16, which is the anchor `#trigger-contract`. |

## Recursion guard — proved by round-trip, not by inspection

`isOpenHandsCommentCandidate` (`:53-58`) excludes a body when it lacks the command token, carries a
status marker (`<!-- openhands-agent-summary -->`, `<!-- openhands-run:`), or carries the refusal
marker prefix — and it is called **first** in `parseOpenHandsCommentTrigger` (`:156-159`), before
grammar or author evaluation.

Executed round-trip over 25 generated refusal bodies (5 reportable reasons × 5 author logins):

- `isOpenHandsCommentCandidate(body) === false` — 25/25
- `evaluateOpenHandsCommentTrigger({body, authorAssociation:'OWNER'}).reason === 'not-command-candidate'` — 25/25
- `isReportableOpenHandsDenial(<that reason>) === false` — 25/25, so a refusal can never produce a refusal
- `extractVerdict([{body}]) === null` using the **production** extractor from `agentic-lib.ts` — 25/25, so a refusal can never be mined as a verdict by a watcher poll (stronger than the leaf's regex-copy assertion; see **F2b** below)

Defence in depth confirmed by construction: the adversarial login `openhands-agent` puts the literal
token into the body, and the body is still a non-candidate because the refusal marker excludes it.

The workflow-side exhaustion refusal (`buildGenerationLookupRefusal`, `openhands-agent.yml:198-211`)
is likewise marker-bearing and token-free, and the leaf's own workflow test executes
`isOpenHandsCommentCandidate` against it.

## N1–N5 disposition — verified independently

| Note | Leaf claim | My verdict | Evidence |
| ---- | ---------- | ---------- | -------- |
| N1 | Discharged | `PASS` | `worklog.md:89` now states the S4→S1 API dependency and explicitly records that feature-branch commit order cannot affect live dispatch, citing `openhands-agent.yml:164`. I re-derived the default-branch resolution from the workflow itself. The corrected rationale is right and the ordering it justifies is required. |
| N2 | Discharged | `PASS` | Re-executed from `deno.json`: `check` = `run-deno-check.ts --root packages --root plugins`; `lint`/`fmt:check` same roots; `lint.exclude` contains `.llm/`; `ci:quality` depends on `check`+`lint`+`fmt:check`+`deps:check`+…; `test` is a bare root `run-deno-test.ts -- --allow-all`. **None of the eight paths is under `packages/`/`plugins/`**, so root `test` is the only load-bearing gate — exactly as every gate table in `worklog.md` records. Corroborated by the receipts themselves: `check` took 5m46s at slice 1 and 70–100 ms at slices 2–5 (task input caching, i.e. it did not re-run). No ninth path and no `catalog.ts` entry: the new suite is root-auto-discovered. |
| N3 | Discharged | `PASS` with a caveat (**F2b**) | The controlled vocabulary carries no watcher verdict token, verified two ways: the leaf's own copy of the regex, and — independently — the **production** `extractVerdict` returning `null` for all 25 refusal bodies. Caveat: the leaf's test defines `WATCHER_HEURISTIC_TOKEN_RE` as a **literal copy** at `openhands-comment-trigger.test.ts:20-21` rather than importing the production `HEURISTIC_TOKEN_RE` (`agentic-lib.ts:957`, which is module-private). The two are currently identical, so the assertion is sound today. |
| N4 | Discharged | `PASS` | `OPENHANDS_REPORTABLE_DENIAL_REASONS` (`:10-16`) is exactly the five reasons #1613 N2 enumerates, in order, frozen. Executed per reason: each of `command-not-first-token`, `invalid-command-argument`, `unknown-command-argument`, `duplicate-command-argument`, `author-not-authorized` is produced by a distinct crafted comment and is reportable; `phase-already-claimed`, `not-command-candidate`, `incomplete-phase-claim`, `phase-claim-context-required`, `stale-phase-head`, `phase-not-current`, `phase-already-recorded`, and `phase-generation-lookup-exhausted` are all **non**-reportable. |
| N5 | Discharged | `PASS` | The refusal step posts with `github-token: ${{ secrets.GITHUB_TOKEN }}` (`:329`) under the `authorize` job's `permissions: contents: read` + `issues: write` (`:150-151`) — so the declared grant is the **actual** ceiling for the reply, not a declaration. `PAT_TOKEN` remains scoped to the policy/claim step (`:174`). The job adds no `pull-requests: write`; the leaf's workflow test asserts its absence within the `authorize` slice. |

## Retry alignment

| Check | Result | Evidence |
| ----- | ------ | -------- |
| 5 attempts at 1 second | `PASS` | `findPhaseGeneration` (`openhands-agent.yml:184-195`): `for (let attempt = 0; attempt < 5 && !generationEvent; attempt += 1) { … if (!generationEvent) await sleep(1000) }`. The leaf extracts and **executes** this function from the YAML: `attempts === [1,2,3,4,5]`, `sleeps === [1000,1000,1000,1000,1000]`. |
| Matches the read-only precedent | `PASS` | `openhands-phase-eval.yml:302-317` is structurally identical, including the trailing sleep on the fifth failed attempt. That file is **untouched** by this PR. |
| Exhaustion is attributable, not a bare `throw` | `PASS` | The lookup raises a tagged error (`code: 'phase-generation-lookup-exhausted'`, `expectedStatus`), the policy call site catches **only** that code (`:290-291`, re-throwing everything else), sets `dispatch:false`, and builds a marker-bearing refusal naming the expected phase status and the exhausted lookup — which then flows through the same one-reply reporter. The precedent's behaviour (`throw new Error(…)`) is deliberately **not** copied. |

## Scope, receipts, and hygiene

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Exactly the eight contracted paths, no ninth | `PASS` | Diff from base, above. Per-commit file map confirms the four `fix(tooling)` commits are the only source-touching commits; S5 is evidence-only. |
| `openhands-phase-eval.yml` untouched | `PASS` | Absent from `git diff --name-status 7737d8903..f46d84630`. |
| No `deno.lock` churn | `PASS` | `deno.lock` absent from the diff; working tree clean. |
| Every receipt attests a reachable commit | `PASS` | 12/12 receipts: `gitHead == actualGitHead`, `git merge-base --is-ancestor <gitHead> f46d84630` → REACHABLE for every one. Heads used: `4aa04de34` (S1), `28a8a9184` (S2), `d7fdbb1d9` (S3), `9b71e1bd2` (S4), `1390d3ead` (S5). |
| Final receipts cover the evaluated tree | `PASS` | `git diff --stat 1390d3ead f46d84630 -- <the eight paths>` is **empty** — the S5 receipt head and the evaluated head have a byte-identical implementation surface. Only run artifacts changed after `1390d3ead`. |
| No suppression added to green a gate | `PASS` | `git diff … | grep '^+'` over `.github/` and `.llm/tools/` finds **zero** additions matching `deno-lint-ignore`, `ts-ignore`, `ts-expect-error`, `no-check`, `sanitizeOps`, `sanitizeResources`, or `only: true`. |
| JSR audit | `N/A` | No path under `packages/**` or `plugins/**`; contract records `jsrAudit.applicable: false`. |

## Gates — independently re-run at the evaluated head

| Gate | Command | Result | Evidence |
| ---- | ------- | ------ | -------- |
| `check` | `deno task check` (contracted) | `PASS` | Receipts `slice-{1..5}/check.json`, all exit `0`. Coverage note: package/plugin selection does not include this leaf (N2). |
| `test` | `deno task test` — **re-run by this session at `f46d84630`** | `PASS` | Exit `0`; `{"passed":4147,"failed":0,"ignored":19,"totalResults":4166,"uniqueFailures":0}`, `durationMs: 486045`. Reproduces the leaf's `slice-5/test.json` receipt (exit `0`, 4,147/19/0 at `1390d3ead`) exactly at the evaluated head. |
| `test` (focused) | `deno test --allow-all` over the four affected suites — **run by this session** | `PASS` | `106 passed | 0 failed`, exit `0`. |
| `quality-job` | `deno task ci:quality` — **re-run by this session at `f46d84630`** | `PASS` | exit `0`. The `deps:check` `DEPS-NPM-CATALOG` lines are pre-existing warnings on `packages/service`, `packages/telemetry`, `plugins/workers` — unrelated to this leaf and non-failing. |
| Adversarial probe | 60+ assertions on refusal non-candidacy, verdict-mining, formal round-trip, sanitization, tuple-freedom — **written and run by this session** | `PASS` | `PROBE ALL OK`; formal round-trip returns `dispatch=true, reason='authorized-command'` for both phases. |
| Release-gate class | — | `N/A` | Not a cut or release-gating run. |
| Runtime / Aspire / browser / `e2e:cli` / `scaffold.runtime` | — | `NOT_RUN` | Out of scope by task boundary and archetype 6 (`optional`); no lease taken. **No OpenHands dispatch and no evaluator trigger was fired.** |

## Anti-Pattern Check

Only patterns the scope could affect are judged; the rest are `N/A` because no `packages/**` or
`plugins/**` surface is touched.

| AP | Status | Evidence |
| -- | ------ | -------- |
| AP-1 (monolith) | `CLEAR` | Largest single-file delta is `openhands-agent.yml` (+226/−?), and it is a workflow, not a module. `dispatch-openhands.ts` grew by extracting a testable `runDispatchOpenHands` port, which reduces the untestable `main()` to a 10-line entry point. |
| AP-18 (string-snapshot tests without semantic checks) | `CLEAR` | The workflow tests do not snapshot YAML: they **extract and execute** `reportRefusalOnce`, `findPhaseGeneration`, and `buildGenerationLookupRefusal` via `new Function`, then assert call sequences, attempt counts, and sleep intervals. The policy tests call production predicates on production-generated bodies. |
| Archetype-6 `Deno.exit` locality | `CLEAR` (improved) | Before: eight `Deno.exit` calls scattered through `main()`. After: `runDispatchOpenHands` returns exit codes and the single `Deno.exit` lives in the `import.meta.main` entry block (`:381-392`). |
| All other AP-1…AP-25 | `N/A` | No package/plugin architecture surface in the eight paths. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | No doctrine violation introduced; the change repairs an existing tooling protocol inside its current modules. |
| Resolved entries | 0 | — |
| Deepened violations | 0 | — |
| Unrecorded violations | 0 | — |

## DoD / close-gate / PR truth

**PR body Definition of Done, checked against reality at `f46d84630`:**

| Row | Body state | Reality | Verdict |
| --- | ---------- | ------- | ------- |
| 1 — optional `--phase`, PR-only formal, live head, no caller head | `[x]` | Executed and confirmed (Locked-semantics table) | accurate |
| 2 — phase-absent PR and issue dispatch tuple-free | `[x]` | Executed, zero GitHub calls, no tokens | accurate |
| 3 — formal dispatch acquires the claim pre-spend; duplicates refused | `[x]` | Claim chain (`:132-151`) untouched; forced-collision test passes; `phase-eval-claim.mjs` is structurally immutable (outside the eight) | accurate |
| 4 — exactly one sanitized, marker-bearing, token-free pre-spend reply | `[x]` | Executed (Refusal-semantics table) | accurate |
| 5 — status/refusal markers excluded from candidate recursion | `[x]` | Executed 25/25 round-trip through production predicates | accurate |
| 6 — 5×1s lookup, attributable fail-closed exhaustion | `[x]` | Executed extraction: 5 attempts, 5×1000 ms, tagged denial | accurate |
| 7 — all round-trip/collision/refusal/recursion/CLI/retry + three gates recorded | `[ ]` | **Understated.** `receipts/slice-5/{check,test,quality-job}.json` all PASS at `1390d3ead`; behavioural coverage landed S1–S4 | **stale** — see F5 |
| 8 — separate-session PLAN-EVAL and IMPL-EVAL satisfied | `[ ]` | **Accurate at the time the head was cut.** PLAN-EVAL PASS exists at `e15d78588`; IMPL-EVAL is this artifact and had not run | accurate as written; the coordinator owns the transition |

The leaf's own claim ("rows 1–7 truthfully evidence-ready, row 8 not satisfied because IMPL-EVAL has
not run", `worklog.md:437-440`) is **accurate**. Deliberately leaving row 7 unticked rather than
ticking it is the conservative direction and is documented as a coordinator hand-off, not an
omission. The one PR-body statement that is simply wrong is the `Branch head:` line (F5).

**Acceptance-evidence mapping.** `grep -c acceptance-evidence` over the live PR body and all 14 PR
comments returns `0` — **no `acceptance-evidence` block exists**, so `acceptanceCheckboxes` +
`parseAcceptanceEvidence` + `validateEvidenceMapping` have nothing to validate. That matches the
plan's explicit deferral (`plan.md:139`). `mirror-acceptance-evidence.ts --dry-run` was correctly
**not** used as evidence — its label guard would skip validation without `status:ready-merge`.

**Closing keywords / labels / milestone / draft state.** `Closes #1611` and `Closes #1613` are both
present in the body as proper closing keywords (not bare `#N`, not `Refs`). Milestone `0.0.7`.
Draft: yes. Exactly one `status:` label (`status:impl`). Missing `priority:` and `wave:` labels — see
F6.

**Close-gate (protocol rule 12).** Not yet satisfied and not yet due: both #1611 and #1613 have
**every** acceptance checkbox unchecked, both carry `status:triage`, and PR DoD rows 7–8 are
unticked. This is correct for a draft at `status:impl` — the leaf was explicitly forbidden from
mutating issues — but it **must** be completed before any `status:ready-merge` or merge. Recorded as
F6, coordinator-owned.

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| medium | **F1 — quoted-prose comments from trusted authors now receive an automated bot refusal.** Broadening `openhands-agent.yml:143` from `startsWith(...)` + trusted-author to `contains(github.event.comment.body, '@openhands-agent')` means any comment merely *quoting* the token reaches the policy, yields `command-not-first-token`, and that reason is **reportable** — so the bot replies. This is contract-mandated (#1613 N2 enumerates `command-not-first-token`), so it is not a contract breach, but it is a user-visible behaviour change no run artifact records. | Executed at head: the repo's own two pre-existing regression bodies — `openhands-comment-trigger.test.ts` `'fallback-running comment can quote command vocabulary without dispatch'` and `'final fallback provenance can quote the original command without dispatch'`, which encode a *real, intentional* supervisor-provenance pattern — both now return `reason='command-not-first-token'`, `isReportableOpenHandsDenial === true`, and would each draw a `@author, OpenHands did not start…` reply. Same for the OpenHands trigger template from `AGENTS.md` pasted into a comment. Both tests still assert only `dispatch === false`; neither asserts the reportability they now imply. | fix (coordinator decision): either accept knowingly and extend those two tests to assert the reply they now trigger, or narrow reportability so quotation is distinguishable from an attempted command. Not blocking — the written contract asks for exactly this. |
| low | **F2 — #1611 acceptance box 4's round-trip never exercises the formal shape.** The only producer→predicate round-trip (`openhands-comment-trigger.test.ts` `'agentic dispatcher output round-trips through the production predicate'`) builds a **non-formal** comment; it is pre-existing and unchanged by this PR. Formal acceptance is proven instead by a **hand-written** command string (`'automatic phase command shape remains accepted'`) — exactly the producer/grammar drift the box exists to prevent. | I executed the missing round-trip myself: `buildOpenHandsComment({… phase, head …})` → `evaluateOpenHandsCommentTrigger` returns `dispatch=true, reason='authorized-command'` for both `plan` and `impl`, including with the route-identity trailer. So the behaviour is correct; only the regression is absent. Drift is currently caught by the *conjunction* of `agentic-lib_test.ts` (asserts the literal `phase=` / `head=` tokens) and the hand-written policy test, not by a single round-trip. | fix — add the formal case to the existing round-trip test. One assertion. |
| low | **F2b — the watcher-token guard asserts against a copied regex, not the production constant.** `openhands-comment-trigger.test.ts:20-21` defines `WATCHER_HEURISTIC_TOKEN_RE` as a literal duplicate of `agentic-lib.ts:957` `HEURISTIC_TOKEN_RE`, which is module-private. If the production regex gains a token, the guard silently stops covering it. | The two are byte-identical today, so N3 holds. I additionally proved the stronger property by running the **production** `extractVerdict` over all 25 refusal bodies → `null` in every case. | fix (optional) — export `HEURISTIC_TOKEN_RE` and import it, or assert via `extractVerdict` as I did. |
| low | **F3 — the workflow re-hardcodes a safety-critical marker literal instead of the in-scope constant.** `openhands-agent.yml:202` builds `` `<!-- openhands-command-refusal:${id} -->` `` by hand, although `OPENHANDS_REFUSAL_MARKER_PREFIX` is exported by the module the very same step already dynamically imports (`:183-190`). The leaf's workflow test asserts only `assertStringIncludes(refusal.marker, '4242')` — it never asserts the prefix equals the policy constant. | `openhands-comment-trigger.mjs:7` vs `openhands-agent.yml:202`; `phase-eval-workflow_test.ts` marker assertion. Blast radius is low (the exhaustion refusal is also token-free, so it stays a non-candidate even if the prefix drifts), but dedup and recursion exclusion would silently decouple. | fix — add `OPENHANDS_REFUSAL_MARKER_PREFIX` to the destructured import and use it. |
| low | **F4 — a missing `head.sha` degrades to an unhandled rejection rather than a clean exit.** `dispatch-openhands.ts:262` does `head = typeof liveHead === 'string' ? liveHead : ''`; an empty string is `!== undefined`, so `buildOpenHandsComment` throws `head must be a 40-character lowercase hex SHA`, and nothing in `runDispatchOpenHands` or the `import.meta.main` block catches it. | Code path at `:262` → `agentic-lib.ts:540-542`. Fail-closed and **no post occurs**, so there is no spend or provenance risk — but the operator gets a stack trace instead of an exit code, and this branch has no test. | fix (optional) — return a usage/`4` exit code with a named message, and cover it. |
| low | **F5 — the PR body is stale at the evaluated head.** It states `Branch head: ab4b8185f545b4890f7fcbc0e00a114afecb4087` (the S4 sign-off), leaves `S5 Full durable gate evidence and handoff` unticked, and reports validation "through S4 at `9b71e1bd2`". The actual head is `f46d84630`; S5 landed at `704c067e8` with all three receipts PASS. | `gh pr view 1658 --json body` vs the commit map and `receipts/slice-5/*.json`. Understates progress, so it is the safe direction, and the unticked DoD row 7 is a documented deliberate hand-off — but the `Branch head:` line is factually wrong. Row 8 remains correctly unticked. | fix — coordinator refreshes the body (branch head, S5 tick, DoD row 7) at the readiness transition, not this evaluator. |
| low | **F6 — close-gate prerequisites are unmet (expected, coordinator-owned).** Every acceptance checkbox on **both** #1611 and #1613 is unchecked; both issues carry `status:triage`; the PR carries no `priority:` or `wave:` label. | `gh issue view 1611/1613 --json body,labels`; `gh pr view 1658 --json labels`. The leaf was explicitly forbidden from mutating issues, so this is not an implementation defect. | fix before `status:ready-merge` — tick both issues' acceptance boxes with linked evidence, move them off `status:triage`, and add the missing namespaced labels. Protocol rule 12 blocks merge otherwise. |
| low | **F7 — the route amendment is not recorded in this leaf's `drift.md`.** The launch brief cites "Route amendment 2" in the leaf drift log as the authority for running this gate on Opus 5 instead of Fable 5; the leaf `drift.md` at `f46d84630` contains only the two frozen-contract entries. | `drift.md` (39 lines, two entries, both file-contract). | fix — record the standing Fable-5-unavailable route amendment in the leaf `drift.md` (or point the brief at wherever it actually lives). Harness rule: drift is explicit. |

None of F1–F7 is a failing required gate, a missing contracted gate receipt, an unsound plan, or a
debt-bookkeeping problem.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Extract embedded workflow JS and **execute** it | `new Function` over a `slice()` of the YAML, then assert call sequences / attempt counts / sleep intervals instead of `assertStringIncludes` on the YAML text. This leaf's retry and dedup proofs are real behavioural tests of shipped workflow code. | any archetype shipping non-trivial `github-script` logic | high |
| Prove a bot reply is a non-candidate **by round-trip**, never by `startsWith` | Feed the production generator's output back through the production predicate, for every reason and every adversarial author value — including an author login equal to the command token. | any comment-triggered automation | high |
| Name the load-bearing gate when contracted gates do not cover the surface | Three green receipts are not three proofs. Recording "`check` is a required contract receipt whose package/plugin selection does not cover this leaf" in every gate table is what let this evaluation confirm coverage instead of counting receipts. | every leaf whose surface sits outside `packages/`/`plugins/` | high |
| A CLI that emits a provenance-bearing command must resolve the provenance itself | No `--head` flag; read the live PR as the last external operation before emission; assert the exact call **sequence** in tests so nothing can slip between resolution and emission. | archetype 6 dispatch/handoff tooling | high |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | `PASS` |
| Evaluated head | `f46d84630c54210a09ff4ed39537da1e66964a52` |
| Base | `7737d8903bb2925c3fcefbda362168fe297eebd4` |
| Rationale | The approved eight-path scope is complete with no ninth path; `openhands-phase-eval.yml` and `deno.lock` are untouched; all twelve gate receipts are PASS at commits reachable from the evaluated head, and the implementation surface at the final receipt head is byte-identical to the evaluated head. Every locked semantic — optional `--phase`, PR-only formal mode, required verdict contract, CLI-resolved live head with no `--head`, tuple-free non-formal PR **and** issue dispatch, exactly-one sanitized pre-spend refusal, marker exclusion from candidate recursion, 5×1s retry with attributable exhaustion, and the untouched `(generation, phase, head)` claim — was re-executed by this session rather than read and agreed, including a 60-assertion adversarial probe and a formal producer→policy round-trip the leaf's own suite does not contain. N1–N5 are genuinely discharged, N5 by making `GITHUB_TOKEN` under `contents: read` + `issues: write` the actual refusal ceiling. The Tier-A gate held: five sign-off commits, all the topic supervisor's, none the implementer's, and the one supervisor error PLAN-EVAL caught (N1) masked no defect. Findings F1–F7 are checkable and worth fixing, but none is a failing gate, a missing contracted receipt, an unsound plan, or a debt-bookkeeping failure. |

**Not done by this evaluator, by boundary:** no OpenHands dispatch, no evaluator trigger, no Aspire,
Docker, browser, `e2e:cli`, `scaffold.runtime`, or expensive-gate lease; no label applied, no
readiness flip, no `status:ready-merge`, no checkbox ticked, no merge, no publish, no issue or
central-state mutation, no second agent launched, no lock deletion, no `deno cache --reload`.

**Remaining before merge (coordinator-owned):** F6 close-gate completion on #1611/#1613, the F5 PR
body refresh, and a decision on F1.
