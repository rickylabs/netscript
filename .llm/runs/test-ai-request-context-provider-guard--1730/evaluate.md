# Evaluation: PR #1763 — #1730 provider-invisibility regression guard

**VERDICT: FAIL_FIX** — one test-only amendment; re-evaluation scope is narrow (see § Verdict).

Formal IMPL-EVAL, fresh native opposite-family session (Claude Fable 5 · medium, the
`formal_impl_evaluation` route for Codex-authored work per `lane-policy.md`). This session did not
author the leaf and fixed nothing; every perturbation below was reverted and the tree proven clean.

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-ai-request-context-provider-guard--1730` |
| Target | PR #1763 `test/ai-request-context-provider-guard`, Refs #1730 (partial) |
| Archetype | 4 — Public DSL / Builder (`packages/ai`, doctrine verdict **Keep**) |
| Scope overlays | none |
| Evaluator | Claude Fable 5 · medium · 2026-08-30 · job `1028dfc9` · `https://claude.ai/code/session_017jkgZAXR8ihj6cCeWsATk6` |
| Evaluator worktree | `/home/agent/projects/netscript/worktrees/ns1730-impleval` (own detached worktree; not the leaf's `007-leaf-1730`) |
| Route verdict | matched — Fable 5 · medium, native opposite family for a Codex implementation author |

## Immutable identity — verified, not inherited

| Check | Result | Evidence |
| --- | --- | --- |
| local `HEAD` | `1baabbd678646eee2907c8c24fdee71df277a744` | `git rev-parse HEAD` |
| `origin/test/ai-request-context-provider-guard` | equal | `git fetch origin` + `git rev-parse` |
| PR #1763 `headRefOid` | equal | `gh pr view 1763 --json headRefOid` |
| PR state | `OPEN`, draft, base `main`, labels `status:impl area:ai-core type:test priority:p1` | `gh pr view` |
| `origin/main` | `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` | `git rev-parse origin/main` |
| Merge base | `3e5cbabf` (= `origin/main`; the branch merged `main` once at `2b4f7407`) | `git merge-base HEAD origin/main` |
| Tree | clean before and after every gate and mutation below | `git status --porcelain` → 0 lines |
| Commits over base | `fd5d0447` S1 → `925ee02b` S2 → `5845d533` S3 → `2b4f7407` merge → `1baabbd6` S4 | `git log --oneline 3e5cbabf..HEAD` |

### Scope over the merge base (brief item 4)

`git diff --stat 3e5cbabf HEAD` → **7 files**: six run artifacts under
`.llm/runs/test-ai-request-context-provider-guard--1730/` and
`packages/ai/tests/request_context_test.ts` (+80/−7). Zero product files. `git diff --exit-code
3e5cbabf HEAD -- deno.lock` → unchanged. No generated carrier, README, docs, or package config in
the delta. (The two-dot `origin/main..HEAD` view shows base motion only; the three-dot / merge-base
view is the correct measure and matches the PR's claim.)

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | `PASS` | `PLAN-EVAL: N/A` recorded in `plan.md` D6 and `worklog.md § PLAN-EVAL` before S2, with a mechanical-scope justification that the issue's own mutation table supports. Accepted. |
| Design section exists in worklog | `PASS` | `worklog.md § Design` (Public Surface / Vocabulary / Ports / Constants / Commit Slices) |
| Commit slices match design plan | `PASS` | S1–S4 land in plan order; each commit touches only the slice's declared files |
| Each slice has a passing gate | `PASS` | S1 base census; S2 focused wrapper + mutation-B red/green; S3 focused wrapper; S4 receipts — all re-derived below |
| Tier-A slice review on the commit trail | `FAIL` | `gh api …/pulls/1763/reviews` → `[]`; all four PR comments are the implementer's; no supervisor sign-off commit. S2 acceptance is asserted in `worklog.md` ("owner supplied independent Tier-A acceptance of S2 at intake") but is recorded nowhere durable. See finding F-5. |
| No speculative seams (unused files) | `PASS` | Delta adds two local test helpers (`retryThenToolThenTextProvider`, `loopProviderBoundPayload`), both used by the named guard; no shared test-support change |
| Constants used for finite vocabularies | `PASS` | `MODEL`, `SENTINEL`, `CONTEXT` remain the only literals; sentinel is high-entropy and appears only inside `CONTEXT` |
| `## SKILL` chapter in agent briefs | `N/A` (unverifiable) | No `implement.md` in the run dir; the implementer brief was owner-provided out of band. Low, informational (F-7). |

## Re-measurement — brief items 1–8

### 1. Mutation B must fail a named test — **confirmed**, and the guard was then probed

Applied at `packages/ai/src/agent/loop.ts:159`:
`system: \`${input.system ?? ''}${JSON.stringify(input.context ?? {})}\`,`

Focused wrapper (`run-deno-test.ts -- --allow-all packages/ai/tests/request_context_test.ts`):
`exitCode 1`, `passed 8 / failed 1`, failing test
**`agent loop: keeps context out of every provider-bound retry and continuation request`**
(`request_context_test.ts:355`), assertion text shows the sentinel inside `"system"`.
Reverted with `git checkout -- packages/ai/src/agent/loop.ts`; `git diff --exit-code 3e5cbabf --
packages/ai/src` → clean.

Then the guard was attacked with further loop-level mutations, each run against the **full**
`packages/ai/tests/` suite (147 tests) and reverted:

| Mutation | Provider-bound path | Result | Caught by |
| --- | --- | --- | --- |
| B (system) | `ChatClientRequest.system` | 146/147 — red | the named guard |
| B4 — append `{ role:'user', content: JSON.stringify(context) }` to `messages` | `ChatClientRequest.messages` | 146/147 — red | the named guard |
| B3 — `provider.createChatClient(\`${modelId}${JSON.stringify(context)}\`)` | `ChatModelProviderPort.createChatClient(modelId)` | 146/147 — red | **not** the guard: `agent loop: single text turn transitions idle -> running -> done` (an unrelated state-machine test that happens to assert the model id) |
| **B2 — `client.stream(request, { signal, modelOptions: { ctx: JSON.stringify(context) } })`** | `ChatClientCallOptions.modelOptions` (documented "Provider-native options for this turn"; the TanStack bridge merges it into `modelOptions` at highest priority, `tanstack-chat-client.ts:120-130`) | **147/147 — green** | **nothing** |

B2 is a provider-bound path the guard does not project. The recording client is declared
`async *stream(request)` and discards the second argument, and `loopProviderBoundPayload` projects
only the request object. The loop today passes `{ signal }` only, so — exactly as with B at the
merged head — this is not a live defect; it is the same class of promise-without-tripwire that
#1730 exists to close, on the same seam, one argument to the right. Finding F-1.

### 2. Retry and continuation coverage — **confirmed**

`retryThenToolThenTextProvider` records beneath `withRetryingChatClient({ maxAttempts: 2 })`;
attempt 1 throws `{ status: 429 }` before output, attempt 2 emits the tool call, attempt 3 is the
continuation. The test asserts `provider.requests.length === 3`, `requests[0].messages` deep-equals
`requests[1].messages` (retry replays the same turn), and `requests[2].messages.length >
requests[1].messages.length` (continuation). The negative assertion and the positive
`request.context === CONTEXT` identity check both run inside `for (const request of
provider.requests)` — every request, not `[0]`. Mutation B's failure payload above is the first
request, which proves the loop iterates from index 0; B4 fails likewise.

### 3. S3 — Anthropic rename — **honest, and the delegation target is real**

New name: `request context: Anthropic adapter omits context from direct wire serialization`
(`request_context_test.ts:175`). Comment: "This covers direct Anthropic adapter serialization
only. The TanStack seam test below owns bridge/modelOptions leakage because this adapter drops
model options it does not support."

- The test still captures the real HTTP request (URL, headers, body) of a direct adapter call with
  the `hello` non-vacuity guard, so "direct wire serialization" is exactly what it exercises.
- "below" is accurate: the seam test `request context: reaches TanStack metadata and none of the
  provider-bound keys` is at line 253.
- The delegated vector is genuinely owned: applying mutation A at
  `tanstack-chat-client.ts:180` (`modelOptions: { ...modelOptions, ...request.context }`) →
  145/147, failing exactly `reaches TanStack metadata and none of the provider-bound keys` and
  `never reaches the OpenAI-compatible provider wire request`. Reverted; tree clean.

### 4. Scope — **confirmed** (see Immutable identity)

### 5. Receipts — **all seven verified at the immutable head; the repair is real**

Read from the leaf worktree's ignored
`.llm/tmp/gate-receipts/test-ai-request-context-provider-guard--1730/receipts/` (`.gitignore:17`).

| Receipt | `argv` | attempt | `durationMs` | wall (`finishedAt − startedAt`) | `gitHead == actualGitHead == 1baabbd6` | outcome |
| --- | --- | ---: | ---: | ---: | --- | --- |
| `check-final.json` | `deno task check` | 1 | 119238 | 119239 | yes | PASS, 2937 files, 0 diagnostics |
| `test-final.json` | `deno task test packages/ai/tests/` | 1 | 3737 | 3737 | yes | PASS 147/147 |
| `lint-final.json` | `deno task lint` | 1 | 22199 | 22199 | yes | PASS |
| `fmt-check-final.json` | `deno task fmt:check` | 1 | 12144 | 12144 | yes | PASS |
| `quality-gate-final.json` | `deno task quality:gate` | 1 | 8839 | 8839 | yes | PASS (pre-existing repo warnings only) |
| `doc-lint-final.json` | `deno task doc:lint --root packages/ai --pretty` | 1 | 1035 | 1035 | yes | FAIL by contract (exit 1) — my own run takes 1.29 s, so 1035 ms is a real run |
| `publish-dry-run-final.json` | `deno task publish:dry-run` | **2** | **30719** | 30718 | yes | PASS; stderr 356 KB of the ephemeral-copy file listing including `packages/ai/**` |

Every `durationMs` equals its wall clock; no other receipt has the 150 ms replay shape. The repair
of `publish-dry-run` is confirmed (attempt 2, `startedAt 14:09:33.884Z → finishedAt
14:10:04.604Z`). Two accuracy defects on the durable trail remain — findings F-3 and F-4: the PR
body and the S4 comment still say "150 ms" and "package cwd", whereas the receipt is the **root**
workspace task (`.llm/tools/release/run-publish-dry-run.ts`, cwd = worktree root), not the plan's
row-8 `deno publish --dry-run --allow-dirty` in `packages/ai`. The root task is a superset, so the
evidence is stronger than claimed, but the claim is wrong.

### 6. `doc-lint` delta — **confirmed zero delta; plan names the base number**

Head and base outputs are byte-identical (`diff` of `deno task doc:lint --root packages/ai
--pretty` at `1baabbd6` vs a detached worktree at `3e5cbabf`): exit 1 both; `./agent.ts`
entrypoint `total: 20`, package sum of per-entrypoint totals **128** `privateTypeRef` / **0**
`missingJSDoc`. The brief's "20" is the `./agent.ts` entrypoint figure; the plan and worklog carry
the 128/0 package figure — both are the same unchanged state. `plan.md` row 9 names the base
(128 private refs, 0 missing JSDoc, expected exit 1) and never counts it as PASS.

### 7. JSR audit — **2 findings at head and base, identical**

`.llm/tools/fitness/audit-jsr-package.ts --root packages/ai --text`: exit 0 at both heads;
`WARN F-DOCT-5` (`src/ports` 13 > 12) and `WARN F-JSR-7` slow-types; `dry-run: OK`. No increase;
both base-inherited (the #1768 class for `packages/ai`). The leaf's `audit/jsr-ai-head.txt`
matches.

### 8. `deno.lock` — byte-unchanged vs base; no generated carrier moved (see scope).

## Static Gates (re-run by the evaluator at `1baabbd6`, own worktree)

| Gate | Command or check | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Narrow typecheck | `run-deno-check.ts --root packages/ai --ext ts,tsx` | `PASS` | 100 files, 0 diagnostics | |
| Slice typecheck | root `deno task check` (receipt) | `PASS` | receipt `check-final.json`, 2937 files | not re-run root-wide; scoped run above covers the only touched package |
| Format | `run-deno-fmt.ts --root packages/ai --ext ts,tsx` | `PASS` | 100 files, 0 findings | |
| Lint | `run-deno-lint.ts --root packages/ai --ext ts,tsx` | `PASS` | 100 files, 0 findings | |
| Doc lint | `deno task doc:lint --root packages/ai --pretty` | `FAIL` (contracted, base-red, zero delta) | identical to base | never a PASS input |
| Publish dry-run | `deno publish --dry-run --allow-dirty` in `packages/ai` | `PASS` | `Success Dry run complete`, 3.1 s | plus root receipt at 30.7 s |
| Quality gate | `deno task quality:gate` | `PASS` | exit 0, pre-existing warnings only | |
| Focused tests | `run-deno-test.ts -- --allow-all packages/ai/tests/request_context_test.ts` | `PASS` | 9/9, 1203 ms | |
| Full AI tests | `run-deno-test.ts -- --allow-all packages/ai/tests/` | `PASS` | 147/147, 5013 ms | |
| Link/path check | test imports (`../mod.ts`, `../src/ports/chat-client.ts`) | `PASS` | check + tests green | |

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
| --- | --- | --- | --- | --- |
| F-1 | File-size lint | `PASS` | `quality:gate` exit 0 | none new |
| F-2 | Helper-reinvention scan | `PASS` | wraps `withRetryingChatClient`; no re-implemented retry | none |
| F-3 | Layering check | `PASS` | test imports ports/adapters via published paths only | none |
| F-4 | Inheritance audit | `N/A` | no classes touched | |
| F-5 | Public surface audit | `PASS` | no export change (`git diff` shows tests only) | none |
| F-6 | JSR publishability | `PASS` | publish dry-run OK; JSR audit 2 → 2 | base-inherited warnings only |
| F-7 | Doc-score gate | `DEBT_ACCEPTED`-equivalent | doc-lint zero delta, base-red | pre-existing, not deepened |
| F-8 | Workspace `lib` override | `N/A` | no config touched | |
| F-9 | Permission declaration | `N/A` | | |
| F-10 | Test-shape audit | `PASS` | `request_context_test.ts` = 495 LOC (≤ 500) | **5 lines of headroom** — the F-1 fix must respect it |
| F-11 | Forbidden-folder lint | `PASS` | `quality:gate` | |
| F-12 | Naming-convention lint | `PASS` | `quality:gate` | |
| F-13 | Saga/runtime invariants | `N/A` | | |
| F-14 | Console-log lint | `PASS` | no console use added | |
| F-15 | Re-export-of-upstream lint | `N/A` | | |
| F-16 | Folder-cardinality lint | `DEBT_ACCEPTED`-equivalent | `F-DOCT-5 src/ports 13>12` at base and head | not deepened |
| F-17 | Abstract-derived co-location | `N/A` | | |
| F-18 | Sub-barrel lint | `N/A` | | |
| F-19 | Scoped source gate runners | `PASS` | structured wrappers used above | |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Mutation B red/green | named guard fails under B; 9/9 after revert | `PASS` | § Re-measurement 1 |
| Retry + continuation | 3 recorded attempts; assertion over all | `PASS` | § Re-measurement 2 |
| Guard sufficiency (call-options path) | mutation B2 should fail a named test | `FAIL` | 147/147 green under B2 — F-1 |
| Guard ownership (modelId path) | mutation B3 should fail the guard | `PASS` (incidental) | caught by an unrelated test — F-2 |
| Mutation A delegation | seam test detects bridge leak | `PASS` | 2 named failures — § Re-measurement 3 |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Public import consumers | no surface change | `N/A` | diff is tests + run artifacts only |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| --- | --- | --- | --- |
| AP-1 | `CLEAR` | 495 LOC, helpers local | F-10 headroom is 5 lines |
| AP-9 | `CLEAR` | two used local helpers, no shared abstraction | |
| AP-18 | `CLEAR` | semantic JSON projection, no whole-request snapshot | |
| AP-25 | `CLEAR` | no product change; failure injection is local/deterministic | |
| AP-2–8, 10–17, 19–24 | `N/A` | test-only leaf; no product, port, adapter, or composition change | |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | `arch-debt.md` has no `packages/ai` entry; none needed |
| Resolved entries | 0 | |
| Deepened violations | 0 | doc-lint 128/0 and JSR 2 findings identical at base and head |
| Unrecorded violations | 0 | |

## Findings

| ID | Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- | --- |
| F-1 | **medium** | The guard does not project the provider-bound `ChatClientCallOptions` argument of `client.stream()`. Mutation B2 (`{ signal, modelOptions: { ctx: JSON.stringify(input.context) } }`) leaves all 147 tests green. `modelOptions` is documented as provider-native and is merged into the TanStack `modelOptions` at highest priority. | § Re-measurement 1, table row B2 | **fix** (test-only, inside the product ceiling): have the recording client capture its second argument (`async *stream(request, options)`), and include the call options minus `signal` (at minimum `options?.modelOptions`) in the per-request provider-bound projection. Demonstrate B2 red in `worklog.md` exactly as B was, revert, prove green. Keep the file ≤ 500 LOC (495 now) — compact if needed. |
| F-2 | low | The `modelId` path (`provider.createChatClient(modelId)`) is provider-bound and is caught only incidentally by `agent loop: single text turn transitions idle -> running -> done`, not by the named guard. | mutation B3 | recommended, optional: record `modelId` in the recording provider and fold it into the projection while fixing F-1; otherwise note the incidental owner in the test comment. |
| F-3 | low | PR body "Validation" and the S4 comment cite `publish-dry-run` at **150 ms**; the receipt on disk is attempt 2 at 30,719 ms. The repair is recorded nowhere durable (not worklog, not PR). | receipt `attempt: 2`; PR body line "PASS, 150 ms" | record the re-cut (attempt 2, 30,719 ms, wall-clock match) in the next PR comment / worklog receipt audit. |
| F-4 | low | The publish receipt's `argv` is the root `deno task publish:dry-run` (whole-workspace ephemeral copy, cwd = worktree root), not the plan row-8 package-scoped `deno publish --dry-run --allow-dirty` in `packages/ai`, and the S4 comment says "package cwd". Coverage is a superset; the claim is inaccurate. | receipt `argv`/`cwd`; `deno.json:132` | state the actual argv in the receipt audit; optionally add the package-scoped run as the supplemental it was planned to be. |
| F-5 | medium (process) | No Tier-A slice review evidence on the commit trail: zero PR reviews, zero supervisor comments, no supervisor sign-off commit (`lane-policy.md` invariant 2 / A1). S2's "owner acceptance at intake" exists only as a worklog sentence. | `gh api …/pulls/1763/reviews` → `[]` | coordinator records Tier-A acceptance of S1–S4 on PR #1763 (comment or review) before any ready flip; no code change. |
| F-6 | low | `worklog.md § Static Gates` is frozen at `PENDING_RECEIPTS` (by design — the evidence commit precedes the receipts), so the receipt audit lives only in the partly stale S4 comment. | worklog vs receipts | the F-1 fix slice moves the content head anyway; record the receipt audit table in `worklog.md` in that slice, then re-cut receipts at the new head. |
| F-7 | low (informational) | No `implement.md`/agent brief with a `## SKILL` chapter in the run dir; protocol rule 13 is unverifiable. | run dir listing | none for this leaf; future briefs should be committed. |

## Rulings requested by the brief

1. **Does the leaf satisfy #1730's five acceptance points?**
   - (a) loop-level `providerBoundPayload`-style assertion over each `provider.requests[i]` minus
     `context` — **met** (`loopProviderBoundPayload`, all-request loop; B and B4 red).
   - (b) mutation B makes a named test red, demonstrated not asserted — **met** (re-demonstrated
     here and in `worklog.md § S2`).
   - (c) Anthropic test detects A or is renamed/documented — **met** by rename + comment; the
     delegated seam test really detects A.
   - (d) coverage on continuation and retry — **met** (3 attempts, assertion over all).
   - (e) required `packages/ai` gates green at the exact head — **met** (receipts + independent
     re-run; doc-lint is a zero-delta base-red, contracted as such).
   The five points as written are satisfied. The leaf still does not pass, for the reason in ruling 2.
2. **Is the guard sufficient?** **No.** The `ChatClientCallOptions.modelOptions` argument of
   `stream()` is a documented provider-bound path from the loop that the projection ignores
   (mutation B2 green). The issue's stated purpose is a tripwire on every provider-bound loop path;
   accepting a guard with a known un-projected provider-bound argument at the very seam under test
   would reproduce the #1696 S-1 false-done state one argument over. Test-only fix, F-1.
3. **Is the renamed Anthropic test honest?** **Yes.** Name and comment describe exactly what runs
   (direct adapter wire capture) and the disclaimed vector is owned by the seam test at line 253,
   verified by mutation A (2 named failures).
4. **Is a gitignored receipt set acceptable as durable merge evidence?** **Acceptable, with a
   condition.** The receipts are cut-time evidence at an immutable head; their durability comes
   from (i) the head being immutable and (ii) an independent evaluator re-deriving the same gates
   at that head — done here in a separate worktree with matching outcomes — and recording the field
   audit in a committed `evaluate.md`. Committing receipts would move the head after they were cut,
   which is precisely the defect this design avoids; that alternative is worse. The condition is
   that the durable trail (PR comment / worklog / evaluate.md) must state the receipt facts
   **accurately** — F-3 and F-4 show it currently does not for `publish-dry-run`. Since F-1 moves
   the content head, the set must be re-cut at the new head and re-audited.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| A provider-invisibility guard must project every argument that reaches the provider port, not only the request object | enumerate the port method's full parameter list (`stream(request, options)`, `createChatClient(modelId)`) when building a negative projection; a recording double that drops an argument hides a leak path | Archetype 2/4 loop/port seams | high |
| Receipt-repair facts belong on the durable trail the moment the receipt is re-cut | a replaced receipt with no comment/worklog note leaves the PR asserting the defective number | harness receipt protocol | high |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | `FAIL_FIX` |
| Rationale | All five #1730 acceptance points, scope, hygiene, and gates are met and were independently re-derived at `1baabbd6`. The plan remains valid. The implementation is incomplete on the issue's own purpose: a documented provider-bound loop path (`ChatClientCallOptions.modelOptions` on `client.stream()`) escapes the guard's projection (mutation B2 → 147/147 green). The fix is test-only and inside the product ceiling. |
| Blocking | F-1 (code, test-only). F-5 is a process gap the coordinator closes on the PR; it does not require code. |
| Re-evaluation scope | One amendment slice to `packages/ai/tests/request_context_test.ts` only: (1) projection includes the `stream()` call options minus `signal`; (2) `worklog.md` records mutation B2 red → revert → green with the named test; (3) LOC ≤ 500; (4) receipts re-cut at the new immutable head with an accurate audit (F-3/F-4/F-6). Re-eval re-runs: focused + full `packages/ai` tests, scoped check/lint/fmt, `quality:gate`, mutations B and B2 red/green, receipt field audit. Doc-lint / JSR / publish are expected unchanged and need only a delta check. Everything else in this evaluation carries forward. |

## Perturbations and cleanup

All mutations (B, B2, B3, B4, A) were applied by `sed`, run, and reverted with `git checkout --
<file>`; `git status --porcelain` was empty and `git diff --exit-code 3e5cbabf -- packages/ai/src`
clean after each. A detached base worktree at `3e5cbabf` was created under the job tmp dir for the
doc-lint/JSR base measurements and removed after this file was written. No PR, issue, label,
milestone, acceptance box, or `deno.lock` was touched.
