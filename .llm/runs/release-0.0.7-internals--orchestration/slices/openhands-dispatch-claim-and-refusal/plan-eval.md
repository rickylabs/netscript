# PLAN-EVAL — release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal

- Plan evaluator session: `7d544aec-22cc-4656-8483-6d957dbfbfda` · 2026-08-15
- Run: `release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal`
- Surface / archetype: OpenHands manual dispatch CLI + trusted comment policy + authorize workflow ·
  `6-cli-tooling`
- Scope overlays: none
- Issues: #1611 (p1), #1613 (p2) — both OPEN, milestone `0.0.7`, read live this session

## Identity, route, and independence

| Field | Value |
| --- | --- |
| Evaluator session ID | `7d544aec-22cc-4656-8483-6d957dbfbfda` |
| `bridgeSessionId` | `cse_01N9zhX5ZDUvvrBxcwoAYBCm` |
| PID | `360479` |
| cwd | `/home/codex/repos/netscript-007-openhands-dispatch` |
| Requested route | native Claude `claude-opus-5` · effort `medium` · `--remote-control` |
| Observed route | `claude-opus-5` · `medium` · `--remote-control` |
| Observed-route source | `~/.claude/jobs/7d544aec/state.json` → `respawnFlags` |
| Route verdict | matched |

**Independence.** The plan's author is Codex thread `01a00443-abab-7261-8905-74ed71467929`
(GPT-5.6 Sol, per `supervisor.md` and `codex-thread-ids.md`). The Tier-A reviewer is topic
supervisor `f7691917-0be2-4bcd-8839-43d3fc809c34` (PR comment `5301190104`). This session is
neither: a fresh native opposite-family Claude session started for this gate only, which authored
no part of the plan and performed no implementation.

## Target verification (re-resolved this session)

| Ref | Resolved value | Method |
| --- | --- | --- |
| Local `HEAD` | `cea999d18ea2c2d4a6208fc209ce744d9be1d194` | `git rev-parse HEAD` |
| Remote branch | `cea999d18ea2c2d4a6208fc209ce744d9be1d194` | `git ls-remote origin refs/heads/fix/openhands-dispatch-claim-and-refusal` |
| PR #1658 `headRefOid` | `cea999d18ea2c2d4a6208fc209ce744d9be1d194` | `gh pr view 1658 --json headRefOid` |
| Merge-base with `origin/main` | `7737d8903bb2925c3fcefbda362168fe297eebd4` | `git merge-base HEAD origin/main` |

All three heads are equal. **Evaluated SHA: `cea999d18ea2c2d4a6208fc209ce744d9be1d194`.** No refusal
condition triggered.

**Diff from base is run artifacts only — verified.** `git diff --name-only 7737d8903..HEAD` returns
exactly seven paths, all under
`.llm/runs/release-0.0.7-internals--orchestration/slices/openhands-dispatch-claim-and-refusal/`
(`codex-thread-ids.md`, `context-pack.md`, `drift.md`, `plan.md`, `research.md`, `supervisor.md`,
`worklog.md`). No product source is touched at this head; no premature-implementation finding.

**Binding contract read directly** at `feaf2da311ccc4b15c210d25fda5ff1699b60576`
(`leaf-contracts.json`, entry `openhands-dispatch-claim-and-refusal`, lines 1380-1409): issues
`[1611, 1613]`, lane `internals`, wave 1, archetype `6-cli-tooling`, overlays `[]`, the eight
`fileSurfaces`, `provingGates: [check, test, quality-job]`, `jsrAudit.applicable: false`. The plan's
envelope, archetype, gate map, and JSR disposition match the contract exactly.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` §Re-baseline re-derives against `main` @ `7737d8903` (2026-08-15). Currency re-verified: `origin/main` has advanced to `e090f894f` (`docs(positioning)… (#1652)`), and `git diff --stat 7737d8903..origin/main -- <the eight paths + openhands-phase-eval.yml>` is **empty** — no contract path drifted. F1-F5 spot-checked below, all accurate. |
| Decisions locked | PASS | `plan.md:60-74` — L1-L11, each with rationale. Covers formal selector, PR-only/live-head/no-`--head`, tuple-free non-formal, candidate definition, dedup marker, sanitization, marker non-candidacy, retry precedent, claim primitive, gate set. |
| Open-decision sweep | PASS | `plan.md:76-86`; independent sweep below found no decision that forces rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS | `plan.md:90-96` — 5 ordered slices, each naming what it proves, its gates, and its files. Ordering dependency independently confirmed (see row 5). |
| Risk register | PASS | `plan.md:118-128` — 9 risks, each with a mitigation naming a concrete mechanism or test. |
| Gate set selected | PASS | `plan.md:74,106-110` = contract `provingGates` exactly. Coverage independently executed (see Note N2). |
| Deferred scope explicit | PASS | `plan.md:130-141` — phase workflow, `--head`, routing, non-comment triggers, evidence blocks, and the whole Aspire/Docker/E2E/release/JSR class. |
| jsr-audit surface scan (pkg/plugin) | N/A | `research.md:122-124`. Verified: none of the eight paths is under `packages/**` or `plugins/**`; contract records `jsrAudit.applicable: false`. |

## Load-bearing findings spot-checked against the tree at `cea999d18`

| Claim | Verified |
| --- | --- |
| F1 — producer cannot emit a formal tuple | `agentic-lib.ts:514-521` `DispatchOptions` has no `phase`/`head`; `:528-537` `buildOpenHandsComment` emits only model/provider/effort/output/iterations. `dispatch-openhands.ts:58-72` `Options` has no phase/head; the comment is built at `:230-237` before any token resolution and with no PR read. Accurate. |
| F2 — missing fields bypass the claim | `openhands-comment-trigger.mjs:63` `if (!phase && !head) return decision;` returns authorized with no claim lookup; `:64-88` performs tuple/marker/claim only when both are present. Accurate. |
| F3 — refusals are silent by construction | `openhands-agent.yml:142` gates on `startsWith(github.event.comment.body, '@openhands-agent')` **and** trusted `author_association`, so `command-not-first-token` / `author-not-authorized` are unreachable; `:150` authorize has `contents: read` only; `:249-258` denials produce `core.notice` + a summary for two reasons and no reply. Accurate. |
| F4 — retry asymmetry | `openhands-agent.yml:197-209` single events read then `throw`. `openhands-phase-eval.yml:302-317` — `for (let attempt = 0; attempt < 5 …)` with `setTimeout(resolve, 1000)`, then `throw new Error(...)` on exhaustion. The cited precedent lines are exact. Accurate. |
| F5 — required regressions sit outside the old envelope | `phase-eval-workflow_test.ts:231` asserts `!workflow.includes('contains(github.event.comment.body')` and `:223-227` requires the `startsWith(...)` form — this test **actively rejects** the S4 broadening, so it must change. `catalog.ts:4-14` runs it plus `openhands-comment-trigger.test.ts` and `agentic-lib_test.ts` under `agentic-lifecycle-test`. Accurate. |

## Coordinator rows

### 1. Locked semantics fidelity — satisfied

The slices achieve the semantics rather than restating them, and the mechanism is checkable:

- Optional selector: `dispatch-openhands.ts` currently has no `phase` option (`:58-72`); S3 adds
  `--phase plan|impl` only. `ALLOWED_ARGUMENTS` in the trusted policy already contains `phase` and
  `head` (`openhands-comment-trigger.mjs:13-22`), so the wire grammar needs no widening — S3 is a
  pure producer-side addition.
- Live-head binding with no caller head: L3 keeps the resolved SHA inside the CLI-to-builder call.
  L2 additionally requires the live PR read before **formal dry-run** output, which is a real
  behaviour change (today `--dry-run` exits at `:242-274` before any token is resolved). The plan
  states this explicitly rather than leaving it to discovery.
- Non-formal leak-proofing is structural, not aspirational: `buildOpenHandsComment` builds its
  token list by presence test (`:529-536`), so an optional validated pair leaves non-formal output
  byte-identical, and the policy's `:63` non-formal bypass is untouched by any slice. S2 and S3 each
  carry an explicit both-target-kinds tuple-omission assertion.
- Sole production caller confirmed: `grep -rn buildOpenHandsComment` over `*.ts`/`*.mjs` returns one
  production call site (`dispatch-openhands.ts:230`) and three test call sites, all inside the eight.
  There is no second producer that would silently keep emitting tuple-free formal commands.

### 2. Refusal semantics — enforceable, not aspirational

- **"Exactly one"** is keyed on the **source comment ID** (L6), checked by listing existing comments
  for that marker before creating the reply. This is safe against the concurrency it must survive:
  `openhands-agent.yml:129-134` serializes on
  `openhands-${{ github.event_name }}-${{ issue.number … }}` with `cancel-in-progress: false`, so
  list-then-create cannot interleave across two runs in the same group, and a rerun of the same
  comment finds its own marker. Two *different* refused comments correctly get one reply each.
- **"Pre-spend"** is structural, not ordering-by-convention: the reply is created in the `authorize`
  job, and the paid job is `needs: authorize` with `if: needs.authorize.outputs.dispatch == 'true'`
  (`openhands-agent.yml:261-262`). A denial sets `dispatch=false`, so no ordering within the job can
  put spend before refusal.
- **"No command token"** (L7) plus controlled reason/recovery vocabulary is what keeps the reply out
  of its own candidate set; see row 3.

Note N4 below records the one thing the plan leaves unnamed here.

### 3. Recursion guard — treated as a tested correctness property

L8 is explicit that markers are classified as non-candidates **before** grammar/authorization
evaluation and that the tests call the **production predicate on the generated refusal body**. That
is the correct construction, and it is load-bearing rather than decorative: the refusal is posted by
the workflow's own credential, so its `authorAssociation` will be trusted and the existing
author-association screen at `openhands-comment-trigger.mjs:94-96` would **not** exclude it. Marker
exclusion plus L7's token-free body are the only two things that make the bot's own reply provably a
non-candidate, and the plan requires both and tests the conjunction.

The existing bot status comments are already non-candidates under a literal `@openhands-agent`
condition — `openhands-agent.yml:521-523` and `:1307-1308` emit `<!-- openhands-agent-summary -->`
with no `@` — so the status-marker exclusion is defence in depth rather than the only guard. That is
appropriate, not padding, because the policy-level exclusion is the tested invariant while the
workflow condition is a string.

### 4. Retry alignment — matches the precedent and converts the throw

L9 mirrors `openhands-phase-eval.yml:302-317` exactly (five attempts, one-second interval), and it
converts the manual path's `openhands-agent.yml:197-209` immediate `throw` into a controlled denial
that names the expected phase status and the exhausted lookup. That satisfies #1613 N3's second
acceptance box ("fails closed … and reports the reason per N2 rather than only throwing"), and it is
attributable because exhaustion becomes a `ReportableDenial` that flows through the row-2 reply path
rather than a red job with no PR-visible explanation.

### 5. Slice ordering safety — every intermediate state is spend-safe

The claim holds, and holds more strongly than the plan argues. Tested against actual slice contents:

- S1 changes only `.github/scripts/openhands-comment-trigger.mjs` and its test. In production the
  workflow loads that module from a checkout pinned to
  `ref: ${{ github.event.repository.default_branch }}` (`openhands-agent.yml:164-165`), and
  `issue_comment` workflow definitions themselves are always taken from the default branch. **No
  intermediate commit on this feature branch can alter live dispatch behaviour at all** — not S1's,
  not S4's. Spend-safety of intermediate states is therefore total, not merely arranged.
- The ordering is nonetheless *required*, for a reason the plan does not state: S4's workflow wiring
  and its rewritten `phase-eval-workflow_test.ts` assertions consume the refusal/marker API that S1
  introduces. S4 before S1 would not compile or assert against anything.
- At merge, all five slices land as one PR, so the policy and the broadened workflow go live
  together — the pairing the ordering is meant to guarantee is preserved by construction.

The plan's stated rationale is over-broad (see Note N1); the ordering decision it produces is
correct, and no slice reordering is required.

### 6. Permission boundary — minimal and sufficient

`issues: write` is the correct and narrowest scope for creating a comment on a PR conversation
(`pull-requests: write` is for review threads and PR creation, and is not needed to reply). The plan
grants that and nothing else (`plan.md:45,126`), leaving `contents: write` / `pull-requests: write`
where they already are — on the gated paid job (`openhands-agent.yml:266-268`). No slice widens
workflow permissions beyond refusal reporting. See Note N5 for the one implementation constraint
this row depends on.

### 7. Claim atomicity — preserved structurally, not reworked

L10 keeps `(generation, phase, head)` as the exactly-once spend boundary, and the envelope enforces
it: `.github/scripts/phase-eval-claim.mjs`, which owns `claimPhaseEvaluation` and `phaseEvalMarker`,
is **not** among the eight paths, so the claim primitive is structurally immutable in this leaf. The
authorize decision chain at `openhands-comment-trigger.mjs:69-88` (stale head → not current →
prior-marker → atomic claim → existing-trigger vs already-claimed) is untouched by any slice, and
S1's coverage row explicitly re-proves forced claim collision as zero-spend.

### 8. Per-path justification of the eight — no padding, nothing missing

Each path was tested for a required edit rather than accepted:

| Path | Required edit exists? |
| --- | --- |
| `openhands-comment-trigger.mjs` | Yes — `denied()` at `:131-133` returns `{dispatch, triggerLine, reason}` only; there is no refusal body, marker, or non-candidate classification to expose. |
| `openhands-comment-trigger.test.ts` | Yes — no coverage exists for marker exclusion, refusal-body non-candidacy, or sanitization. |
| `openhands-agent.yml` | Yes — `:142` filter, `:150` permissions, `:197-209` throw, `:249-258` notice-only denial. |
| `agentic-lib.ts` | Yes — `:514-521` / `:528-537` cannot emit the pair. |
| `agentic-lib_test.ts` | Yes — `:334-359` asserts the current tokens-only shape. |
| `dispatch-openhands.ts` | Yes — `:58-72`, `:100-167`, `:228-237` have no phase/head and no PR read. |
| `dispatch-openhands_test.ts` | Yes — does not exist; no CLI-level request-flow coverage today. |
| `phase-eval-workflow_test.ts` | Yes — `:231` actively forbids the S4 condition. |

**Nothing needed is missing from the eight.** Checked specifically: the only other `*.ts` file
referencing `openhands-agent` is `gh-pr_test.ts`, and its single reference is the unrelated
`<!-- openhands-agent-summary -->` marker (`:37`) — S4 cannot break it. `phase-eval-claim.mjs` needs
no edit (row 7). And `.llm/tools/gates/catalog.ts` needs no edit for the **new**
`dispatch-openhands_test.ts` to run — see Note N2, where I executed the discovery check.

## Open-decision sweep (evaluator-run)

**None that would force rework if deferred.**

Swept independently for the classes that usually hide here: producer/consumer contract shape
(closed by L1-L4 and the single-caller check), the spend boundary (closed by L10 plus the immutable
claim primitive), the recursion invariant (closed by L7-L8), retry semantics (closed by L9 against
an exact precedent), the gate map (closed by L11 = contract), and the permission delta (closed by
L6/L7 plus row 6). The residual choices the plan classifies as non-shaping — local helper names,
fixture layout — are genuinely non-shaping: none of them changes a slice boundary, a file in the
envelope, or an acceptance box.

## Verdict

`PASS`

Evaluated head: `cea999d18ea2c2d4a6208fc209ce744d9be1d194`. Implementation may begin at S1.

## Notes (non-blocking; carry to implementation and IMPL-EVAL)

These are checkable observations, not unchecked boxes. None changes the verdict.

- **N1 — the S1-before-S4 rationale is inaccurate as written, though the decision is right.**
  `plan.md:98-102` justifies the ordering by intermediate-commit spend safety. Because
  `issue_comment` workflows and the trusted policy checkout both resolve from the default branch
  (`openhands-agent.yml:164`), no intermediate commit on this branch can affect live dispatch in
  either order. The ordering is still required by the S4→S1 API dependency (row 5). Worth correcting
  in `worklog.md` at implementation time so the reasoning is not reused where it does not hold.

- **N2 — `test` is the only proving gate with real coverage of this leaf; `check` and `quality-job`
  are green independent of it.** Executed evidence: `deno task check` is
  `run-deno-check.ts --root packages --root plugins` (`deno.json`), `deno.json` `lint.exclude`
  contains `.llm/`, and `fmt.include` is `packages/**` + `plugins/**` — none of the eight paths is
  under those roots, and `ci:quality` depends on that same `check`. By contrast `deno task test` is
  a bare root `deno test --allow-all` whose only `exclude` is `.llm/tmp/`; I confirmed the walker
  does **not** skip dot-directories (isolated probe: tests under `.hidden/` were collected and run)
  and that it collects this leaf's surfaces in-repo —
  `deno test --no-check --filter ____none____ .github/scripts .llm/tools/agentic/openhands
  .llm/tools/agentic/lib` reports `192 filtered out`. Two consequences: the new
  `dispatch-openhands_test.ts` is auto-discovered and needs **no** `catalog.ts` edit (so no
  ninth path), and IMPL-EVAL should treat the `test` receipt as the load-bearing one rather than
  reading three green receipts as three independent proofs. The plan does not overclaim here —
  `plan.md:108-110` promises only receipts, and names the executed regressions under `test`.

- **N3 — keep bare verdict tokens out of the controlled refusal vocabulary.**
  `agentic-lib.ts:939` defines `HEURISTIC_TOKEN_RE = /\b(PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN|FAIL)\b(?!\s*\|)/`
  for watcher fallback verdict parsing. L7's reason/recovery constants should avoid those tokens so
  a refusal reply can never be mined as a verdict by a watcher poll.

- **N4 — name the reportable-denial set explicitly in the implementation.** #1613's N2 acceptance
  enumerates five reasons: `command-not-first-token`, `invalid-command-argument`,
  `unknown-command-argument`, `duplicate-command-argument`, `author-not-authorized`. `plan.md:43,69`
  says "reportable denials" without listing them. Not a planning defect — L5 plus the S1 coverage
  row ("literal malformed/unauthorized candidates reach policy") entails the set, and #1613 is the
  authority — but a narrower implementation set would miss the acceptance box, so the mapping should
  be asserted test-by-reason.

- **N5 — the declared permission grant should be the actual bound.** The authorize job's policy step
  runs with `github-token: ${{ secrets.PAT_TOKEN }}` (`openhands-agent.yml:174`), and a PAT is not
  constrained by the job's `permissions:` block. Broadening the `:142` condition to literal
  candidates also means this job now starts for **untrusted-author** comments (contract-mandated:
  `author-not-authorized` must be reported). Posting the refusal with `GITHUB_TOKEN` under the new
  `issues: write` grant — rather than with `PAT_TOKEN` — makes row 6's minimal grant the real
  ceiling instead of a declaration. Injection is already addressed by L7 (no raw command text is
  ever rendered), and the workflow and policy both come from the default branch, so an untrusted
  author cannot influence the code that runs.
