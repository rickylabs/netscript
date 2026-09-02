# IMPL-EVAL: OpenHands formal-eval verdict-artifact durability (#1888 / PR #1894)

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-openhands-eval-artifact-durability--1888` |
| Target         | #1888 via PR #1894 (open, draft, milestone `0.0.7`) |
| Evaluated head | `eebbbd01e` (PR head, confirmed via `gh api repos/rickylabs/netscript/pulls/1894`) |
| Base           | `main` @ `7d18ef104` |
| Archetype      | N/A — GitHub Actions infrastructure, no package/plugin surface |
| Scope overlays | none |
| Evaluator      | Separate opposite-family session (Claude Code · `z-ai/glm-5.3-flash` via OpenRouter), 2026-09-01 |
| Implementation commit | `0a1544858` (+ merge `eebbbd01e`); generator ≠ evaluator session |

All exits below are real captured exits (`out=$(cmd 2>&1); rc=$?`), never pipelines. Evaluator
scratch lives in `.llm/tmp/impl-eval-1888/` (untracked, not committed). `rtk` unavailable on this
host per run memory; direct git/Deno used.

## Acceptance Verification (brief items 1–5)

### 1. Defect A fixed; head-immutability invariant intact — PASS

- **Gate preserved, not removed.** `commit-artifacts` still requires
  `steps.request.outputs.eval_phase == ''` (openhands-agent.yml:1118), so the only
  `git push ... "HEAD:${CHECKOUT_REF}"` sites (lines 1178/1180) are unreachable for formal evals.
  The workflow contains exactly two push sites (grep: lines 1178/1180 and 1281); the second is the
  preserve step pushing `"${record_commit}:refs/heads/${artifact_ref}"` with
  `artifact_ref=openhands-eval-artifacts/pr-${ISSUE_NUMBER}/run-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`
  (line 1233, 1281) — never the evaluated branch.
- **Behavioral proof.** The preserve step body (yml lines 1207–1289) was extracted verbatim
  (byte-diff clean) with exactly two disclosed mutations — push URL → local bare remote, `python`
  → `python3` — and executed in a scratch repo (`.llm/tmp/impl-eval-1888/preserve-sim/build-sim.sh`,
  exit 0, 15/15 assertions):
  - evaluated branch HEAD unchanged locally and `refs/heads/pr-head` unchanged on the remote;
  - push created only `refs/heads/openhands-eval-artifacts/pr-1888/run-33533773165-1`;
  - artifact commit parent = `EVAL_HEAD`; `git diff --name-only EVAL_HEAD artifact_commit` = exactly
    the verdict path; blob content matches the evaluator's file;
  - record commit (child) carries verdict + trace metadata recording the artifact commit — D1–D3
    confirmed end-to-end.
- **Provable status-comment claims.** `formalArtifactReady` (yml ~1464) requires
  `EVAL_ARTIFACT_PUSHED === 'true'` plus non-empty path/commit/URI; `pushed=true` is emitted only
  after a successful push under `set -euo pipefail` (continue-on-error makes any failure → empty
  outputs). On failure the comment prints `Verdict artifact: unavailable; no tracked verdict path is
  claimed.` and the raw formal summary is withheld (yml ~1558–1568), so an untrusted summary cannot
  name an uncommitted tracked path. On success the comment names `EVAL_ARTIFACT_PATH` anchored at
  the immutable blob URI `…/blob/<artifact_commit>/<path>` — the exact path committed, verified by
  simulation.
- **Metadata from reality, not assumption.** `verdict_artifact_path/commit/uri` in the machine
  marker are `formalArtifactReady ? env.EVAL_ARTIFACT_* : null` (yml ~1551–1553); the trace
  `metadata.json` fields are written by the preserve step from its own computed values
  (yml ~1255–1265). Simulation asserted both equal the actually-pushed commit.

### 2. Defect B fails closed in both directions — PASS

- **Shipped shell parser, exercised verbatim** (yml lines 966–992 extracted byte-faithfully,
  diff rc=0; 13-case matrix in `.llm/tmp/impl-eval-1888/shell-verdict/`, harness exit 0):
  - zero tokens → `NONE/absent/none`; one valid → `parsed`;
  - **reproducer** `OPENHANDS_VERDICT: PASS` + `OPENHANDS_VERDICT: PENDING` →
    `NONE/ambiguous/summary-ambiguous` (was `PASS/parsed` at base);
  - two valid tokens → ambiguous; valid token + stray marker
    (`OPENHANDS_VERDICT: maybe-something`) → ambiguous (stray marker cannot be smuggled past
    `marker_count`);
  - malformed-but-present (`OPENHANDS_VERDICT: maybe-something`, bare `OPENHANDS_VERDICT:`) →
    `unparseable`;
  - fenced marker only → absent; `<PASS|FAIL_FIX>` template only → absent; fenced FAIL_FIX + valid
    PASS → parsed PASS; template + valid PASS → parsed PASS — fence-stripping and `<...>`
    exclusions intact (D5).
- **JS parser mirrors it.** `verdictOf` (yml 1401–1421) implements the same
  markerCount/matches cardinality partition (`valid_count ≤ marker_count` always holds because a
  valid line contains its own marker, so the four branches are exhaustive) and is behaviorally
  executed by the test suite.
- **Formal gating consumes both.** Finalize verdict for formal evals is
  `summaryInspection.state === 'parsed' && formalArtifactReady ? summaryVerdict : 'NONE'`
  (yml ~1464–1470); comment fallback cannot rescue a formal summary (D4); the status transition is
  gated on `steps.finalize.outputs.verdict != 'NONE'` (yml 1673, 1687), and finalize sets
  `verdict`/`verdict_source` outputs at yml 1630–1631. Zero, ambiguous, unparseable, or
  unpreserved → `NONE` → no label/status transition.

### 3. The tests have teeth — PASS (proven by experiment, not assertion)

Both named tests were run against the **base** workflow in a scratch cwd (cwd-relative read of
`.github/workflows/openhands-agent.yml`; imports resolve file-relative):

| Test | Base `7d18ef104` | Head `eebbbd01e` |
| ---- | ---------------- | ---------------- |
| `generic OpenHands reports verdict marker cardinality and shape distinctly` | **RC=1** — fails at test line 388: base `verdictOf('OPENHANDS_VERDICT: PASS\nOPENHANDS_VERDICT: PENDING')` returns `{verdict:'PASS', state:'parsed'}`, expected `{verdict:null, state:'ambiguous'}` — exactly the defect-B reproducer | RC=0 |
| `read-only formal evaluator with pr-comment preserves a durable verdict off-head` | **RC=1** — fails at test line 454: no preserve step exists in base | RC=0 |

Revert sensitivity is therefore empirical. The preserve test also guards the invariant
structurally: `commitBlock` must contain `steps.request.outputs.eval_phase == ''` (removing the
gate — the tempting "fix" that breaks immutability — fails the test), the push refspec and
`openhands-eval-artifacts/…` ref pattern are asserted positively, and
`assert(!preserveBlock.includes('HEAD:${CHECKOUT_REF}'))` is a negative guard. Reproducer
combination coverage (read-only formal evaluator + default `pr-comment`): the test asserts the
`outputMode … || 'pr-comment'` default plus formal-only gating of commit vs preserve — the
contract-level proxy for run 33533773165, backed by the behavioral simulation above.

### 4. Local/remote verdict readers agree on the same immutable head — PASS (one low finding)

- Remote reader (`agentic-lib.ts:654`, `699–748`): single-line JSON marker
  (`JSON.stringify`, yml 1542–1554, matches the `(\{[^\r\n]*\})` regex); unknown additive fields
  ignored; `selectLatestCurrentHeadImplEval` requires `evaluatedHead === currentHead` and fails
  closed on malformed/ambiguous markers.
- Local reader (`openhands-status.ts:154–180`): parses `metadata.json` into
  `Record<string, unknown>` and passes added fields through unbroken.
- Parity fields written from the same env sources: `evaluated_head` (`EVAL_HEAD` in both), formal
  verdict (`marker.verdict` = fail-closed finalize verdict; `metadata.formal_verdict` =
  `AGENT_VERDICT` — equal on the success path since both parsers agree), and `verdict_source`
  (`TRACE_VERDICT_SOURCE` both). Divergence is possible only on the preservation-failure path —
  finding L-1.

### 5. Scope, lock hygiene, #1865 — PASS

- `git diff --name-only 7d18ef104..eebbbd01e` → exactly 9 files:
  `.github/workflows/openhands-agent.yml`, `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts`,
  and 7 run-dir artifacts. No `packages/**`, no `plugins/**`, no e2e files (does not reopen #1865),
  no reader-implementation changes (per plan's resolved deferral).
- `git diff --exit-code 7d18ef104..eebbbd01e -- deno.lock` → **rc=0** (byte-unchanged).
- Model allowlist/routing untouched (`allowedModels` context unchanged).

## Independent Gate Captures (evaluator's own runs)

| Gate | Command | Result |
| ---- | ------- | ------ |
| OpenHands tool suite | `run-deno-test.ts -- --allow-all .llm/tools/agentic/openhands/` | **RC=0, 16 passed / 0 failed** (reproduces supervisor's disclosed claim) |
| Type check | `run-deno-check.ts --file phase-eval-workflow_test.ts` | RC=0, 0 findings |
| Format check | `run-deno-fmt.ts --root .llm/tools/agentic/openhands --ext ts` | RC=0, 5 files, 0 findings |
| Shell syntax (preserve body, yml 1207–1289) | `bash -n` on verbatim extraction | RC=0 |
| Shell syntax (trace body, yml 937–1104) | `bash -n` on verbatim extraction | RC=0 |
| Lint | repo lint config excludes `.llm/**` | N/A (not claimed green by implementer; confirmed) |
| YAML hosted parser | PyYAML/actionlint unavailable on this host | NOT_RUN here; workflow-structure contract tests + GitHub CI hosted parse cover it (same limitation the implementer recorded) |

## Process Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Plan-Gate before implementation | PASS | `PLAN-EVAL: N/A` recorded in `plan.md` (owner-supplied defect locations + immutable reproducer; justified before implementation) |
| Design section in worklog | PASS | `worklog.md` § Design (surface, vocabulary, ports, constants, slices) |
| Commit slices match design | PASS | Single slice `0a1544858` matches the one-slice plan; merge `eebbbd01e` is main-sync only |
| Each slice has a passing gate | PASS | Worklog static-gate table + evaluator's independent reproductions above |
| No speculative seams | PASS | Diff adds one workflow step + parser states; no unused files; readers intentionally untouched per plan |
| Constants for finite vocabularies | PASS | Verdict states `absent|unparseable|ambiguous|parsed`; tokens unchanged (`PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN|NONE`) |

Fitness gates, AP matrix, arch-debt delta: **N/A** — no package/plugin surface; no doctrine debt
created or closed (plan.md "Arch-Debt Implications: None" verified — nothing under `packages/` or
`plugins/` changed). Close-gate and release-gate classes N/A: draft PR, no merge/ready action taken
by this evaluator.

## Findings

| Severity | Finding | Evidence | Disposition |
| -------- | ------- | -------- | ----------- |
| Low | **L-1 Local-metadata divergence on the preservation-failure path.** The preserve step updates `metadata.json` (incl. `formal_verdict` = raw `AGENT_VERDICT` and `verdict_artifact_*`) *before* the push (yml 1246–1270). If the push then fails, local/Actions-artifact metadata claims a formal verdict and a dead blob URI while the status comment truthfully reports `NONE` / `artifact-unavailable` and `preserve-eval=failure`. Gate surface fails closed; remote merge gating (`selectLatestCurrentHeadImplEval` → `verdict != NONE` transition gate) is unaffected. | yml 1246–1281 ordering; preserve-sim fail-path analysis | **Accept as residual risk; recommend follow-up** — record `verdict_artifact_pushed` (or null the artifact fields) on the failure path via a post-push update or `trap`. Not blocking: the authoritative surface is truthful and fail-closed. |
| Low | **L-2 Pre-existing wrapper-grammar strictness, unchanged by this fix.** `> **Verdict:** OPENHANDS_VERDICT: PASS` parses as `unparseable` (colon-inside-bold ordering not accepted by the wrapper regex) while `> OPENHANDS_VERDICT: PASS` parses. | Probe: base yml line 969 regex byte-identical; direct grep rc=1 on the wrapped form | Observation only — fails closed, cannot produce a false PASS, JS parser shares the identical grammar. |
| Low | **L-3 Teeth are contract-level for the shell half.** The suite executes `verdictOf` (JS) behaviorally but only string-asserts the shell cardinality logic; the negative `HEAD:${CHECKOUT_REF}` guard is exact-string and could be evaded by spacing variants. | Test file 419–435, 438–500 | Acceptable for this slice — evaluator's out-of-band verbatim simulation covered shell behavior (13-case matrix, 15-assertion preserve sim); noted as future hardening (e.g. execute the extracted fragment in-test). |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Revert-sensitivity of a regression test is provable, not arguable: run the named tests against the base blob in a scratch cwd (file-relative imports, cwd-relative fixture reads) | Test evidence standard | All harness IMPL-EVALs | High |
| Verbatim step-body extraction (sed slice + byte-diff + local bare remote as the only mutation) turns CI-string assertions into behavioral evidence for workflow shell | Evaluation technique | Workflow/infra slices | High |

## Verdict

All five acceptance items verified with captured-exit evidence; both defect reproducer shapes now
fail closed in both parsers and end-to-end into the status transition gate; the deliberate
`eval_phase` read-only invariant is intact and behaviorally confirmed (evaluator runs never move the
evaluated head — the only formal-eval push targets `openhands-eval-artifacts/pr-*/run-*` rooted at
`EVAL_HEAD`); both named tests were proven to fail against the base and pass at this head; scope,
`deno.lock` byte-hygiene, and #1865 non-reopening are clean. The three findings are Low with
non-blocking dispositions (one recommended follow-up).

VERDICT: PASS
