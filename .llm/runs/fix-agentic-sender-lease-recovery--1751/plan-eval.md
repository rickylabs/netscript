# PLAN-EVAL — fix-agentic-sender-lease-recovery--1751

- Plan evaluator session: OpenRouter `qwen/qwen3.8-flash` max, 2026-08-31 (coordinator-designated
  override; requested lane was native Fable 5 medium per `plan.md` D10 — recorded below as a
  transport note, not a plan defect)
- Evaluated head: `8e4bb719f05db7cc13e68197fee3d8a2782c56c4`; base `main` @
  `5197e70b716eafb82fbb12ddb9a910c248ddb86a`
- Run: `fix-agentic-sender-lease-recovery--1751` (issue #1751, PR #1802)
- Surface / archetype: `.llm/tools/agentic` internal runtime tooling — Operationally Archetype 6
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | FAIL   | Present and re-baselined (`research.md` Findings R1–R13), and every spot-checked finding is accurate against the tree — but R13's leaf status for #1774 is stale (see F3). |
| Decisions locked                        | FAIL   | D1–D10 are strong, but two load-bearing mechanisms are unlocked: the repair-command wiring path (F1) and probe-provenance for rollout/thread evidence (F2). |
| Open-decision sweep                     | FAIL   | The sweep says "No open decision would force rework if deferred." The union-vs-CLI-local wiring choice was not listed and would force exactly that (protocol: unflagged open decision = automatic unchecked box). |
| Commit slices (< 30, gate + files each) | FAIL   | 7 slices, ordered, each with a named gate and files — but Slice 4's file set is incomplete under the plan's own precedent path (F1). |
| Risk register                           | PASS   | Real, specific mitigations; add the F2 profile-home row when revising. |
| Gate set selected                       | PASS   | Gates genuinely exercise the new paths (see "Gate audit" below). |
| Deferred scope explicit                 | PASS   | `plan.md` Deferred Scope + Open-Decision Sweep deferrals are each justified with why evidence is unavailable. |
| jsr-audit surface scan (pkg/plugin)     | N/A    | Internal `.llm/tools/agentic` surface; no `packages/**`/`plugins/**` export changes (verified against manifest). |

## Attack narrative

### Priority 1 — the eviction path (the dangerous half)

I read the truth table and D2/D3/D6 adversarially. What holds up:

- **Fail-closed is design-enforced, not prose.** `stale` is reachable only through the two
  enumerated conjunction rows; the classifier is a pure function over typed evidence
  (`preserve | stale | indeterminate`) where every listed negative condition (alive PID sample,
  `working`/`stalled` rollout, identity mismatch, `systemError`, unreadable inventory, missing
  session identity, foreign record) routes away from `stale`. The mutation itself requires an
  exact `leaseToken` CAS — verified at `local-sender-ownership-adapter.ts:57-62` that
  `release()` throws on token mismatch — so a replaced record (new owner) cannot be evicted by a
  stale observation of the old one. Slice 3 pins foreign/unknown no-op as committed RED lifecycle
  tests. This is enforcement, not assertion.
- **PID reuse** produces a false-live → preserve (`plan.md` Risk Register); correct direction.
- **`stalled` is never terminal** — matches `codex-rollout-live.ts:203-207` where an incomplete
  quiet turn becomes `stalled`, and D3 preserves on it. The `resolveCodexRollout`
  swallow-errors-as-null behavior (`codex-rollout-live.ts:232-258`) is correctly demoted from
  evidence by the strict `unknown` adapter (research R6).
- **Residual TOCTOU (accepted, F4):** if an operator resumes the thread between the pre-CAS
  re-observation and the CAS removal, the token is unchanged, so CAS cannot see it and
  `thread/read`-at-time-of-remove is not re-queried. Given the command is explicit, single-target,
  operator-invoked, and D6/D7 persist the re-observed evidence in an `authorized` receipt before
  removal (post-hoc reconstructability), the residual window is acceptable — but the receipt must
  carry the three re-observed probe states, not just timestamps.

**What does not hold up (F2) — probe provenance under profile isolation.** The repo runs Codex
OpenRouter sessions under materialized isolated profile homes (`preset-canary.ts`
`profile.home = ${worktree}/.llm/tmp/codex-openrouter-profile`; `codex-resume.ts:143-146`
`export CODEX_HOME=...`). The sender record carries `worktree`, `ownerPid`, `leaseToken`, `state`,
`sessionId` — **no code-home/profile provenance** (`sender-ownership.ts:8-17`). Truth-table row 2
yields `stale` from "proven absent from a readable exact inventory" + "proven absent" thread. If
the repair probes a *default* sessions dir/app-server for a thread that actually lives under an
isolated profile, a readable-empty inventory yields `absent` and the default daemon yields
`not_loaded`/not-found — both counting as negative evidence for a thread the probe never saw.
Concretely: lease owner PID dead (its wrapper exited) + a still-live writer driving that thread
from its profile home (e.g., a follow-on `codex exec resume` — the very active-writer conflict
#1751 mode 1 is about) → locked D2/D3 could classify `stale` and authorize eviction. The Risk
Register covers "a permission/race error looks like a missing rollout" but not "the real rollout
lives in a different home." The plan must close this before implementation: either (a) lock the
rule that `absent`/`not_loaded` counts only when the inventory/daemon is tied to the record's
session provenance, and an unestablishable home is `indeterminate`; or (b) record the code-home at
activation and declare the schema/parser/test consequences. Note `not_loaded` ≠ `absent` is also
worth its own truth-table row treatment.

### Priority 2 — exit-code propagation claim

Verified accurate and **not** overstated. `codex-resume.ts:168` is
`Deno.exit(r.code === 0 ? 0 : 1)` — a non-zero child *already* propagates; research R9 scopes the
defect precisely to "exits 0 whenever the child exits 0 … does not inspect the known thread-store
rejection", and D8 forces exit 1 only "even when the child exits 0". This matches the independent
re-test reality (some rejections did propagate non-zero). R10 also verified:
`run-codex-slice.ts` treats `result.code !== 0` as failed/retryable, so the wrapper fix propagates
without runner changes. The test obligation is **specified, not mentioned**: D9, Validation row 6,
Slice 5, and the Fitness "Resume known-negative" row all require a test-owned subprocess spawning
the real wrapper behind a fake `bash`, asserting `Deno.Command.output().code === 1` plus the exact
rejection string, with the pipeline form (`cmd | tail`) explicitly forbidden in the Risk Register.

### Priority 3 — RED-before-GREEN discipline

Enforced per behavior: Slices 1/3/5 are committed-RED for the three behaviors (classification +
preserve-only launch, audited repair lifecycle, resume rejection), each paired with GREEN Slices
2/4/6; the worklog states "RED commits are intentionally failing and must be committed before
their paired GREEN commit," and every RED record must name the failing tests and real non-zero
wrapper result in the worklog. Tests and fix cannot land together. Satisfied.

### Priority 4 — scope discipline / manifest integrity

- **F1 (gap):** D5 says the repair "reuses the repo-native guarded repair surface," i.e. the
  `repair-codex-remote` precedent. That precedent is wired through `RuntimeCommand`
  (`runtime/contract.ts:124+` union, `RUNTIME_COMMANDS`, `LEGAL_COMMAND_MODES`), planned in
  `runtime/planner.ts:241` (`case 'repair-codex-remote'`), and pinned by
  `runtime/contract_test.ts:128`, which asserts a fixed fixture list is **exactly equal** to
  `[...RUNTIME_COMMANDS]`. Adding a `repair-sender-lease` kind on that path therefore requires
  editing `runtime/contract.ts`, `runtime/planner.ts`, and `runtime/contract_test.ts` — none of
  which appear in the Intended File Manifest or Slice 4's files, and the manifest says "No file
  outside this list is intended." The only manifest-clean alternative is a CLI-local parse in
  `agentic-runtime.ts` that bypasses the `RuntimeCommand` union — which diverges from the guarded
  repair precedent (planner action vocabulary, deferred-boundary coverage) the rest of the plan
  leans on. The fork is undecided; implementing it mid-Slice 4 guarantees either manifest breach
  or parser rework.
- **Verified clean:** I traced every consumer of the two-boolean observation
  (`ownerProcessAlive`/`sessionActive`) and of `decideSenderOwnership`:
  `sender-ownership.ts`, `sender-ownership_test.ts`, `launch-codex-slice.ts:376-393`,
  `codex-adapter.ts:12,33,139-145` (optional-ownership default), `adapters_test.ts:129` — all
  declared. `preset-canary.ts` and `runner-provider-profiles_test.ts` call `planCodexCommand`
  without `ownership` and need no edits. Research R2/R3/R4/R5 match the tree exactly, including
  the auto-`release()` of `stale` records at launch (`launch-codex-slice.ts:393`) and
  `sessionActive: Boolean(existing.sessionId)` (line 380).
- **F3 (stale status):** #1774 has **shipped** into the base: PR #1775 (`a3ddcbb59`, closed
  2026-08-30) is an ancestor of base `5197e70b7` and did touch both `deno.json` and
  `.llm/tools/agentic/README.md`. R13's "live in another worktree" is outdated. The conclusions
  survive — "no `deno.json` edit" is true because `agentic:runtime` already exists with
  `--allow-write --allow-env` (verified at `deno.json:75`), and the README reconciliation
  degrades to an ordinary edit against current main — but the manifest/Scope/Open-Decision
  wording ("reconcile after #1774", "conflicted") should state #1774 as landed so no implementer
  waits on a merge that already happened.

### Priority 5 — gate audit

The selected gates do exercise the new paths, not just adjacent suites: the Runtime-lifecycle gate
requires temp-root restart-stale apply (evict with receipt), a real live child/writer that must
survive, and foreign/unknown no-op; the Resume known-negative gate is the subprocess exit-code
proof; scoped check/test/lint/fmt + full agentic suite cover the wiring regressions (the
contract/planner equality test at `contract_test.ts:128` is precisely what catches F1's files);
`compatibility-wrappers_test.ts` exists as claimed. `deno task e2e:cli` as final merge-readiness is
conservative for a `.llm/tools`-only leaf but matches AGENTS.md's unconditional pre-merge rule —
fine to keep. Exit-code matrix (0/3/4/5 for runtime repair; 0/1/2 for resume) verified against
`agentic-runtime.ts:138-167` and `codex-resume.ts` usage exits.

## Findings by severity

- **HIGH — F1:** Repair-command wiring path undecided; the precedent path forces edits to
  `runtime/contract.ts`, `runtime/planner.ts`, and `runtime/contract_test.ts` (plus planner
  `ACTION_KINDS` vocabulary consideration), none declared in the manifest or Slice 4. An unflagged
  open decision that forces rework — automatic Plan-Gate failure per `evaluator/plan-protocol.md`.
- **HIGH — F2:** Truth-table rows can consume `absent`/`not_loaded` evidence from a probe whose
  CODEX_HOME/app-server provenance is not tied to the record's session. With profile-isolated
  OpenRouter homes real in this repo, this admits a false-positive `stale` while an
  isolated-profile thread is still driven — an eviction correctness hole in the plan's core
  safety claim, not covered by the Risk Register.
- **MINOR — F3:** R13/manifest describe #1774 as live; it shipped via #1775 (`a3ddcbb59`, touches
  `deno.json` + `README.md`) and is in the base. Conclusions ("no deno.json edit", final-slice
  README edit) remain correct but the wording must be re-anchored to landed state.
- **NOTE — F4:** Residual re-observation→CAS window (record token unchanged by a fresh writer) is
  acceptable for an operator-invoked, receipted command **provided** the `authorized` receipt
  persists the three re-observed probe states; add that requirement to D6/D7 explicitly.
- **NOTE — F5:** Requested evaluator identity was native Fable 5 medium (D10); coordinator
  explicitly routed this OpenRouter override session instead. Recorded per protocol; not a plan
  defect. (The plan-protocol text names a different OpenRouter preset than the one used —
  config/protocol lag, likely #1792 territory, out of this leaf.)

## Open-decision sweep (evaluator-run)

- **F1 wiring path** — not in the plan's sweep; would force rework mid-Slice 4. Must resolve now.
- **F2 probe provenance** — not in the plan's sweep; would force truth-table/adapter rework or an
  unsafe first cut. Must resolve now.
- No other open decision found that the plan does not already mark safe to defer.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **F1** — In `plan.md`/`worklog.md`, either (a) declare `runtime/contract.ts`,
   `runtime/planner.ts`, `runtime/contract_test.ts` (and any planner-boundary tests that enumerate
   `RUNTIME_COMMANDS`) in the Intended File Manifest and Slice 4, locking the union path that
   follows the `repair-codex-remote` precedent; or (b) explicitly lock a CLI-local parse that stays
   manifest-clean and state why bypassing the planner/guarded-repair vocabulary is acceptable.
   Update the Open-Decision Sweep either way.
2. **F2** — Add a provenance rule to D2/D3 (and the Risk Register): rollout `absent` and thread
   `absent`/`not_loaded` are admissible as stale evidence only when the inventory/daemon is bound
   to the record's session provenance (e.g., code-home/profile established at activation); an
   unestablishable or mismatched probe home is `indeterminate`. If the fix requires storing profile
   provenance on the record, declare the schema/parser consequences and tests.
3. **F3** — Re-anchor the #1774 notes: shipped via #1775 at `a3ddcbb59` in the base; README edit is
   an ordinary current-main edit; keep "no `deno.json` edit" (verified).
4. **F4** — Strengthen D6/D7 wording: the `authorized` receipt must persist the three re-observed
   probe states with timestamps so a contested eviction is reconstructable.

Fixes 3–4 are one-line edits; fixes 1–2 are the substantive ones. None of the locked safety
decisions D2/D3/D8/D9 need to be weakened — the core design (three-signal conjunction,
preserve-only launch, CAS-with-receipt, direct-subprocess exit test, RED discipline) passed
adversarial review.

## Notes

- All spot-checks were performed read-only against the evaluated head. No sender record, thread,
  rollout, daemon, or process was inspected or mutated, per the worklog's PLAN-EVAL instruction.
- The worktree carries a local-only uncommitted `models.ts` line to permit this evaluator's
  dispatch identity; it is a transport artifact, is not part of #1751/#1802, and is excluded from
  this verdict.

VERDICT: FAIL_PLAN
