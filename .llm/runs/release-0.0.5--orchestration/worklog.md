# Worklog — release-0.0.5--orchestration

## 2026-08-03 — Stage A: bootstrap + milestone read

- Read the three system artifacts (skill, milestone-run.md, canary-cadence.md) and the owner brief
  (`.llm/tmp/BRIEF-0.0.5.md`).
- **Launch precondition check (recorded per stage B discipline, run at stage A):** queried
  `https://jsr.io/@netscript/<pkg>/meta.json` for cli/service/contracts/sdk/mcp at 2026-08-03;
  all five report `latest: 0.0.4`. GREEN — direct registry read, not the relayed report.
- Milestone read: `gh issue list --repo rickylabs/netscript --milestone 0.0.5 --state open` →
  **44 open issues** (list in `plan.md`). Acceptance-level digest delegated to a read-only
  explore agent (bodies of all 44 + RFC #1123 fork structure); clustering decisions taken on
  acceptance text, not labels, per the skill's mislabel rule.
- #1151/#1152/#1101 checked directly: all CLOSED in 0.0.5. No coordination lane needed.
- Run dir created; `supervisor.md` written first per profile.

### Findings for #1163 (system-gap log, running)

1. **[exemplar-vs-profile]** The 0.0.4 exemplar run dir contains only `supervisor.md`,
   `cut-trace.md`, `slices/` — the profile mandates `plan.md`, `worklog.md`, `context-pack.md`,
   `drift.md` as "standard mandatory artifacts". The profile is stricter than the run it was
   derived from. Not a blocker (profile says it freezes contracts, not the exemplar tree), but the
   first-execution evidence should note the mandatory-artifact list has never itself been observed.
2. **[brief-vs-reality]** Brief lists #1151/#1152 as in-flight coordination and #1101 as inherited;
   all three were already closed at run start. Delta is in the brief, not the system artifacts.
3. **[stage-A gap]** `milestone-run.md` stage A requires "milestone read (every open issue, its
   acceptance boxes, its labels)" but names no format or artifact for the read's output beyond
   "opening record in worklog.md" — unclear whether a per-issue digest must be committed. This run
   records the digest summary in `plan.md` and treats that as satisfying stage A.
4. **[singleton tension]** The skill's anti-micro-PR rule ("fifteen issues must not become fifteen
   PRs") gives no guidance for a milestone where many issues are genuinely independent singletons.
   0.0.5 clusters 37 issues into 23 PRs (0.0.4: 42 → 11) — the higher ratio is driven by the epic
   #1169 body pre-slicing its own issues and by RFC #1123's gating graph forbidding wider OMB
   clusters. The skill could state whether an epic's own slice structure overrides the clustering
   heuristics (this run assumes yes: the filed board wins, per RFC #1123's authority banner).
5. **[concurrency width]** "Waves are small" names no number; the 0.0.4 cap of 3 was a
   circumstance (shared machine), not a rule. This run uses ≤3 local Codex supervisors + 1 remote
   agy lane. Whether agy counts against wave width is undefined in the artifacts.

## 2026-08-03 — Stage B: wave plan committed

- Acceptance digest returned (all 44 bodies + RFC #1123 structure). Key structural facts consumed:
  epic #1169 pre-slices its issues (S2–S8 mapping, #1174+#1142 explicitly one slice); RFC #1123
  gating (S1→S5/S7, S2→S4/S6, S8→S10 hard); #1173/#1085 overlap on the same exit-0 refusal path;
  #1166 explicitly invalidates #1149 box 4 until its fix lands; mislabels #1112/#1110/#1108/#1102.
- `plan.md` written: 23 PRs, 6 waves, canary declared at every wave boundary (owner-undecided
  question raised, not resolved by habit). 3 observational hand-closes, 3 epics/tracking,
  #1139 gated out.
- Plan reported to owner before any dispatch (PLAN-EVAL substitution proposal, drift D1).

## 2026-08-03 — Owner decisions on the plan report

1. **Canary density:** "6 if strictly needed otherwise 3-4" → plan revised to **4 declared
   points** (boundaries of waves 1, 3, 5, 6); wave-2/4 boundaries canary-free unless promoted by
   a recorded decision. `plan.md` updated.
2. **Failed canary:** blocks **only the cut**, never the next dispatch ("issues are fixed on the
   next canaries"). Cadence open question 2 now has a run decision with owner provenance.
3. **PLAN-EVAL:** owner routed it to **Codex · GPT-5.6 Sol · xhigh** — the canonical
   `review_claude` lane (opposite-family; subscription transport, so the evaluator-transport
   closed-model prohibition is not implicated). Drift D1 updated.

## 2026-08-03 — PLAN-EVAL dispatch (pre-dispatch gates recorded)

Precondition record (what was queried, when, result — per stage B contract):

- `agentic:runtime doctor --json` @ 19:30:42Z → all capabilities `available`; codex/claude/
  antigravity routes `ready`; no conflicts.
- `agentic:codex-status` → managed daemon running (codex 0.144.6), 1 anchored app-server process;
  5 rollout files today, newest 2 written ~7 min before dispatch — other sessions live on the
  shared machine; a single evaluator launch judged not a heavy run.
- `agentic:routing-state` → **no persisted quota-fallback transitions** (no provider degraded);
  `review_claude` canonical route confirmed as `codex/openai/gpt-5.6-sol effort=xhigh` — matches
  the owner's instruction verbatim. Transport: OpenAI subscription via managed app-server (not
  OpenRouter) — paid-transport check satisfied for this dispatch.

Dispatch: run artifacts committed (`79a28e612`), eval brief committed (`c5a803b23`), evaluator
worktree `/home/codex/repos/ns-005-planeval` @ `eval/0.0.5-wave-plan`. Launch via
`agentic:launch-codex-slice` (dry-run green: brief valid, staged 3376 bytes, git-safety clean),
then live launch backgrounded. Thread id in `slices/plan-eval/codex-thread-ids.md`. Wave-1
dispatch holds until the PLAN-EVAL verdict is read (full artifact, never a truncated log).

## 2026-08-03 — PLAN-EVAL v1: FAIL — plan v2 written

Verdict read in full from `plan-eval.md` (330 lines, committed `b8b7475b1` on the eval branch;
turn ~14 min, thread `019fc91c-9985-7950-b849-74c4dbb8f2cd`). All six dimensions FAIL. Response,
finding by finding:

- **COV-1** accepted: v1 header said 23 PRs/37 issues over a 22-row/36-issue table; #1175 had no
  disposition. → totals corrected; #1175 **moved to 0.0.6** with reason (its own
  release-activity constraint + epic slicing places S8 post-release).
- **CLU-1..6** accepted: #1166+#1004+#1148, #1130+#1131, #1108+#1110, #1173+#1085, #1168+#1024,
  #1106+#1109, #1115+#1119 all split — each pair shared a lane or directory, not acceptance.
  #1174+#1142 pairing confirmed sound by the evaluator.
- **SEQ-1** accepted — the decisive miss: epic #1169's binding slice order lives in a **comment**
  (S1 first → S2/S4 → S3 → S5 → S6), which the body-only digest never read. Lane rebuilt
  S1-first across waves 1–5.
- **CAN-1** accepted: v1 carried both the six-point draft annotations and the four-point section
  (incomplete edit). v2 has one schedule: canary.1/2/3/4 at boundaries of waves 1/3/5/7.
- **CAN-2** accepted: membership wording now names the corrected merge-aware derivation #1166
  lands, not "first-parent".
- **HON-1** accepted in substance: #1140 moved to 0.0.6 (post-ship observation cannot exist in
  the milestone that ships the surface); #1090 stays, scoped to inherited-0.0.4 observations.
- **HON-2/HON-3** accepted: #1166 and #1168 reclassified as **PR + evidence hand-close** — PRs
  carry `Refs`, boxes tick only on recorded evidence (canary.1's merge-commit case; a real fired
  retry), else they move with reason.
- **GATE-1** accepted: owner brief copied into the run dir (`owner-brief.md`) — `.llm/tmp/` is
  untracked, so the evaluator worktree could not see it.
- **GATE-2** partially accepted: `research.md` + `context-pack.md` written; plan v2 adds the
  open-decision sweep, risk register, and per-cluster proving gates; `phase-registry.md`
  recorded as not-applicable in `supervisor.md`. See finding 8 below for the doctrine question.
- **GATE-3** accepted as a staleness defect: the preconditions **had** run before the eval
  dispatch but the committed text still said "not yet run". v2 text fixed; fresh checks will be
  recorded before every wave dispatch regardless.
- **GATE-4** accepted: `supervisor.md` PLAN-EVAL section now records the owner-routed
  `review_claude` lane, matching drift D1.

### Findings for #1163 (continued)

6. **[epic-order-in-comments]** Binding sequencing (epic #1169's slice order) lived in an issue
   comment, invisible to a body-level milestone read. Neither the skill nor the profile says the
   milestone read must include epic comments/slicing records. It must — or epics must carry their
   slice order in the body.
7. **[cadence-doc-self-stale]** `canary-cadence.md` itself specifies membership "computed from
   first-parent merge history" — the exact derivation #1166 proves incomplete for merge-commit
   topologies. When #1166 lands, the cadence doc's wording is stale; flagged rather than edited
   mid-run (the doc is the system under observation).
8. **[plan-gate-inheritance]** `milestone-run.md` inherits "general harness mechanics" from
   `run-loop.md` without saying whether run-loop's full Plan-Gate (research.md, risk register,
   open-decision sweep, per-slice gates/files) applies to a **wave plan**. PLAN-EVAL read it as
   applying in full; the profile is silent. The profile should state which Plan-Gate boxes bind a
   milestone run — this run satisfied the evaluator's reading.
9. **[eval-worktree-visibility]** The profile's evaluator protocol never states that PLAN-EVAL
   inputs must be **committed** (untracked scratch like `.llm/tmp/` is invisible in an evaluator
   worktree). Cost one GATE blocker; now doctrine-by-precedent: everything the evaluator must
   see lives in the committed run dir.

## 2026-08-03 — PLAN-EVAL v2 resubmission

Plan v2 + supporting artifacts committed on `orchestrator/0.0.5`, merged into the eval worktree,
and the same evaluator thread resumed (backgrounded, no shell timeout) with a re-evaluation
request scoped to the v2 diff. Wave-1 dispatch still holds for the v2 verdict.

## 2026-08-03 — PLAN-EVAL round 2: FAIL (4/6 PASS) — owner escalation

Verdict read in full (`plan-eval.md` § Round 2, commit `f3cac1600`). Coverage, sequencing, and
canary placement **PASS**; cluster integrity **PASS-WITH-FINDINGS** (R2-CLU-1 minor: 31 PRs near
micro-PR fan-out — the same eval's round 1 forced the splits; tension recorded). Remaining FAILs
and response:

- **R2-HON-1 (blocker) — accepted, fixed:** #1004 reclassified `PR + evidence hand-close`
  (its last box needs a live partial-publish registry log); W6-B now carries `Refs #1004`;
  ledger corrected to 33 + 3.
- **R2-GATE-2 (major) — accepted, fixed:** #1004 had zero `status:` labels; `status:plan` added
  (orchestrator is the issue-maintenance lane; the evaluator correctly declined to mutate).
- **R2-GATE-3 (major) — accepted, fixed:** launch precondition strengthened in `supervisor.md`
  with the concrete 0.0.4 pair: canary runs 30837369299 (17:34Z, success) + 30843023308 (18:49Z,
  success), prereleases `v0.0.4-canary.1..4`, stable `v0.0.4` 19:01Z, pinned prod E2E run
  30844211837 (19:05Z, success).
- **R2-GATE-1 (blocker) — escalated, not self-resolved:** the evaluator reads run-loop's full
  Plan-Gate (Design checkpoint, files-per-slice, per-slice archetype/overlay + doctrine verdicts
  + debt disposition, current JSR/slow-type scan, <30 slices) as binding on the milestone wave
  plan. The milestone profile is silent on this (finding 8). Whether to author that surface at
  orchestrator level, push it into per-PR supervisor briefs at dispatch (recorded as an approved
  Plan-Gate exception), or treat the wave plan as exempt is an **owner decision** — and the
  evaluator's second-consecutive-FAIL escalation rule requires owner sign-off before a third
  cycle regardless.

### Findings for #1163 (continued)

10. **[opposing-pressure]** Round 1 forced cluster splits (22 → 31 PRs); round 2 then flagged
    31 as exceeding the Plan-Gate's <30 and near micro-PR fan-out. The system gives an evaluator
    two rules that push a generator in opposite directions with no reconciliation rule at
    milestone scale. Needs an explicit statement of which bound wins for a wave plan (or that
    PR-count bounds don't apply to milestone dispatch schedules).
11. **[escalation-rule-provenance]** The evaluator asserts "second failed PLAN-EVAL cycle
    requires owner escalation" as harness verdict protocol. Honored (it is also the reasonable
    move), but the milestone profile does not state a cycle-count escalation rule — provenance
    should be confirmed and the rule written down wherever it actually lives.

## 2026-08-03 — Design checkpoint (stage B)

The design decisions the wave plan embodies, recorded per the Plan-Gate's Design requirement:

1. **Epic lanes follow their filed structure** — #1169's slicing comment and RFC #1123's gating
   graph are treated as binding over local clustering heuristics (GitHub wins).
2. **Evidence-gated closes are a disposition class** — #1166/#1168/#1004 PRs carry `Refs`;
   closure is a hand-close on recorded evidence or a reasoned move. No closing keyword may
   outrun its evidence.
3. **Canary points are content units at declared wave boundaries** (4 points, waves 1/3/5/7),
   membership from the corrected merge-aware derivation, identity from publish output (D3).
4. **Framework-touching PRs inherit the Archetype-2 gate column + quality:gate law**; per-PR
   file maps, archetype/overlay selection, and doctrine/debt disposition are produced in each
   per-PR supervisor brief at dispatch (committed under `slices/`), where the implementing
   context exists — pending owner ratification per R2-GATE-1 escalation.
5. **Docs lane serialized** (one agy PR per wave) with re-waving as the quota contingency.

## 2026-08-03 — Owner ratifies Plan-Gate exception (drift D5)

Owner selected "Exception + per-PR depth" from the escalation: the wave plan is ratified as a
dispatch schedule; run-loop Plan-Gate depth binds the **per-PR supervisor briefs** (each brief at
dispatch names files, archetype/overlays, doctrine verdict + debt disposition, and proving gates,
committed under `slices/`); the <30-slice bound does not apply to a milestone dispatch schedule.
Baseline `publish:dry-run` launched as the plan-level JSR/slow-type scan — result recorded below
when complete. Round-3 PLAN-EVAL confirmation next, then wave-1 dispatch.

**Baseline JSR/slow-type scan result (2026-08-03):** `rtk proxy deno task publish:dry-run` →
**`Success — Dry run complete`, exit 0** across the workspace publish surface. The 0.0.5 baseline
export surface packs clean; per-slice surface impact is assessed in each per-PR brief per the
ratified exception.

## 2026-08-03 — PLAN-EVAL round 3: PASS — and re-planning event R1

Round 3 (commit `e5de448e5`): honesty + gate compliance both PASS under the owner-recorded
exception; all six dimensions green. Binding consequence accepted: **per-PR briefs must carry the
promised depth or its absence is a dispatch/pre-merge gate failure.**

Immediately after: fresh baseline fetch revealed **three external merges** on main (#1176→#1168,
#1177→#1170, #1178→#1142+#1174) — a parallel lane executed epic #1169's S1→S2→S4 while the plan
was in evaluation. Recorded as re-planning event R1 in `cut-trace.md` with a clean retroactive
`agentic:pr-checks` audit (all `ok:true`, zero current-fails, 20:11Z). Milestone now 38 open.

### Findings for #1163 (continued)

12. **[merge-authority-boundary]** The profile assigns the orchestrator merge authority over the
    milestone, but a parallel lane merged three milestone PRs directly (correctly, per repo CI)
    within hours of run start. The system does not say whether orchestrator merge authority is
    exclusive, nor how external merges interact with the stage-D per-PR gate — this run handles
    them as recorded re-planning + retroactive audit.

## 2026-08-03 — Wave-1 dispatch (revised per R1) — pre-dispatch gates

- **Quota:** Codex weekly window 57% used (prolite; observed 19:46Z from the evaluator turn's
  rate-limit event); `agentic:routing-state` at 20:07Z: no persisted quota-fallback transitions.
  agy lane not used this wave.
- **Transport:** managed app-server daemon running (codex 0.144.6, 1 anchored process,
  `agentic:codex-status` 20:07Z); all lanes on OpenAI subscription via `launch-codex-slice`
  route validation (provider/model/effort verified per launch, mismatch blocks).
- **Shared machine:** evaluator thread idle since round-3 verdict; no foreign heavy runs
  observed in `codex-status` sessions beyond known rollouts.

Dispatching four attached Codex slices (briefs under `slices/`, worktrees off `fb75cf6fc`):
`proofs` (#1127 #1128 #1129, Sol·high), `canary-payload` (#1166 `Refs`, Sol·medium),
`mcp-receipts` (#1134, Sol·medium), `close-gate` (#1171 #1105, Sol·medium).

**Dispatch incident (finding 13 + live #1173 evidence):** all four first launches refused at
git-safety — `git worktree add -b <branch> origin/main` sets an upstream, and push-safety
requires NONE — **and every refusal exited 0**, caught only by the artifact check (no
`codex-thread-ids.md` written). This is a live reproduction of the #1173 defect class
(`no refusal exits 0`) in `launch-codex-slice.ts` itself; quoted into #1173's evidence when its
slice dispatches. Upstreams cleared (`git branch --unset-upstream` ×4), all four relaunched.

13. **[launcher-refusal-exit-0]** `launch-codex-slice` git-safety refusal exits 0 with a JSON
    `ok:false` line — a supervisor watching exit codes dispatches nothing and believes
    otherwise. Also: the launcher help documents no `--json`/exit-code contract for refusals;
    the orchestrator's defense was the thread-id artifact check, which should be named in the
    skill/profile as the mandatory post-dispatch verification.

## 2026-08-03 — Wave-1 first turns: the evaluator-composition rule is invisible to slices

The canary-payload slice's first turn ended idle-at-gate: it activated the general run-loop
Plan-Gate, attempted the local Qwen PLAN-EVAL (`agentic:provider-canary --live` →
`auth_required`, no OpenRouter credential in the slice environment), recorded the block honestly
in its run dir, and stopped — the 0.0.4 idle-at-red-gate pattern, executed by the book. Its
locked plan is sound (merge-aware range port, second-parent fixture RED-first, genuine-empty vs
suspicious-empty as distinct outcomes, `Refs #1166`, boxes 2–4 left to the orchestrator).
Orchestrator ruling recorded as drift D6; steer sent to the thread (proceed; PLAN-EVAL row =
"composed per milestone-run.md"). Expect the same wall from the other three slices; same steer.

14. **[slice-cannot-see-the-profile]** A per-PR slice activating `use harness` runs the
    run-loop Plan-Gate and cannot know it is inside a milestone run whose profile forbids
    per-PR local evaluators. The composition rule lives only at milestone level; nothing routes
    it into a slice session. Wave-1 briefs (mine) did not carry it — wave-2+ briefs will; the
    system should require milestone-slice briefs to state the evaluator-composition rule, or
    the harness skill should define a milestone-slice mode.
15. **[evaluator-lane-unprovisioned]** The canonical local formal-evaluator route (Claude Code +
    OpenRouter Qwen preset) is not launchable in this environment: `auth_required`, credential
    absent. Lane-policy binds a route that cannot currently run locally; any slice or run that
    genuinely needs formal PLAN-EVAL must use owner-provisioned credentials or the cloud lane.

## 2026-08-03 — R2: #1184 filed (owner) and scheduled into the canary.2 train

Owner filed #1184 (p1, published-artifact defect: sagas scaffold glue registers no KV adapter →
`KvConnectionError` kills the saga runner on a default scaffold; silent from outside). Scheduled
per owner instruction into **one existing canary train**: slice **W2-F**, dispatching with wave 2,
landing in canary.2's payload. Acceptance read: all four boxes are locally provable (the
`scaffold.runtime` suite proves the scaffold-start box), so it is **PR-closable**; canary.2's
pair supplies the published-artifact confirmation, quoted on the issue. No cross-cut with
in-flight wave-1 surfaces — not dispatched now. `status:triage` → `status:plan`; scheduling
decision commented on the issue. Brief written (`slices/sagas-kv-glue/implement.md`) — first of
the wave-2 generation carrying the D6 evaluator-composition rule up front. Wave 2 width: 4 Codex
(#1130, #1131, #1119, #1184) + 1 agy (#1106); #1184 holds the wave-2 expensive-gate slot.

## 2026-08-03 — Owner amends #1184: seven-point saga verification standard

Owner raised #1184's verification bar (new box: full lifecycle E2E in a locally scaffolded
project with OTEL evidence) and set a seven-point protocol — fresh default scaffold, genuinely
healthy resource (empty `healthReports` = nothing checked), full lifecycle incl. `sagaCompensate`,
`aspire otel traces/spans/logs` with correlation held (the #1066 collapse), RED captured before
GREEN, restart durability, artefact-not-exit-code. Rationale: #1064–#1066 closed on passing
engine tests while the real scaffold stayed broken. **Standard applies to all saga work in this
milestone**, recorded here as an owner-set rule. W2-F brief rewritten around the protocol;
effort re-tiered Sol·medium → **Sol·high** (verification protocol is the dominant work).
Classification unchanged: PR-closable on local protocol evidence; canary.2 pair adds the
published-artifact confirmation.

## 2026-08-03 — PR #1181 (close-gate slice) at the stage-D gate

Slice implemented both issues and self-marked ready (composed review fired). Gate state on first
terminal read: scaffold-static/runtime, desktop-native-linux, deps-report, classify, surface-diff,
agent all current-pass (`agentic:pr-checks`, head `c7248eb00`); review-threads PASS (0 threads);
**close-gate current-fail** — and legitimately: #1105's three issue boxes were unticked on GitHub
while the PR body claimed them (the acceptance-evidence mirror skipped; known label-before-ready
trap). Notably the failing run executed the PR's own new tool: the S0–S3 progress checklist was
correctly ignored (non-authoritative heading) — the #1105 enforcement's live self-application.

Gate check 5 (independent re-verification) before ticking: local test run 7/7 incl.
`fails unchecked PR DoD but ignores non-authoritative checklists` and the pre-edit/post-edit
stale-snapshot negative case; template diff shows `## Definition of Done` authoritative + Slices
progress-only + netscript-pr skill aligned. On that evidence: #1105 boxes ticked with evidence
comment; failed close-gate job rerun (30849924186); gh-watch re-armed.

Minor: first `gh-watch` invocation died on the `deno task -- --` separator ("Unknown argument:
--") yet the wrapper exited 0 — arg-contract inconsistency across the agentic suite (`pr-checks`
tolerates `--`, `gh-watch` does not); more #1173-adjacent evidence.

## 2026-08-03 — #1181 merge path, #1187 filed, #1180 ready

- **#1181 merge blocked by stale check-runs:** branch protection read attempt-1's failed
  close-gate check-run (91809338954) despite attempt-2 all-jobs-success (close-gate check-run
  91809990609, `filter=latest` jobs API). No `--admin` override on the run's first merge —
  full rerun (attempt 3) triggered to mint fresh check-runs; merge armed on its success.
- **#1187 filed + scheduled (wave 3, Sol·low-medium):** `agentic:pr-checks` misses supersede
  across rerun attempts — classified the stale attempt-1 failure as current-fail and the
  rerun-cancelled check-test as a current cancellation. First live rerun case for the tool,
  ~1h after landing. The 0.0.4 "defects filed from inside the run" pattern, recurring.
- **PR #1180 (canary-payload, `Refs #1166`) marked ready** — slice handoff clean: merge-aware
  derivation proven RED-first on a synthetic DAG, genuine-empty vs derivation-failure distinct,
  87-test adjacent regression green, publish mechanics untouched. Composed review fires on
  ready; stage-D gate follows.
- Interim workaround recorded: until #1187 lands, per-merge check reads use
  `actions/runs/{id}/jobs?filter=latest` as ground truth wherever pr-checks disagrees with a
  rerun's latest attempt.

## 2026-08-03 — #1181: branch protection itself reads the stale attempt

Attempt 3 (full rerun) succeeded and the merge was **still** refused: the PR rollup pinned the
required `check-test` context to the attempt-1 CANCELLED check-run — GitHub's rules engine
exhibits the same cross-attempt staleness as `pr-checks` (#1187 impact escalated with this
evidence). Resolution without `--admin`: empty rebuild commit `003b82d07` pushed via explicit
refspec → fresh head SHA, virgin check landscape; merge armed on the new contexts. Cost of the
defect class made concrete: two failed merge attempts + one full CI cycle + a repush, on the
first orchestrator merge of the run.

## 2026-08-03 — mcp-receipts slice: PLAN-EVAL claim verified genuine (integrity check PASS)

The receipts slice claimed a Qwen PLAN-EVAL PASS from the very route the canary slice had proven
`auth_required` — treated as a potential self-certification incident and verified before any
steer. Verdict: **genuine.** Evidence: hook events in the slice's `.llm/tmp/claude/hooks/` +
two real transcripts under `~/.config/netscript-agentic/runtime/claude-openrouter/projects/
-home-codex-repos-ns005-receipts/` (170KB session 8668cd08 @20:24 — the timeout; 436KB session
313adb99 @20:28 — the PASS), model `qwen/qwen3.7-max`, evaluator-typical tool calls (debt-register
greps). The slice exceeded requirement (D6 composition would have sufficed) but did it honestly.

**Finding 15 amended:** the local evaluator lane IS launchable via the `claude-openrouter`
runtime profile (own credential store). What failed for the canary slice was the
`agentic:provider-canary --live` probe reporting `auth_required` — the probe checks a different
credential surface than the profile launch uses. The finding is now: **probe and launch disagree
on lane availability** — a false-negative availability signal, #1173-adjacent.

Receipts state: slice 1 implemented (uncommitted at turn end), gates PASS (16/16 fixtures,
quality:gate), review ladder in progress (Fable primary rejected by CLI → Opus low fallback per
policy). Turn ended mid-run; resuming to complete slice 2 + handoff.

## 2026-08-03 — PR #1180 close-gate red: the "hand-closes #N" parser trap

Close-gate failed on #1180 listing #1166 as a closing issue with unticked boxes — despite the
body carrying `Refs #1166` and zero closing keywords in any commit. Root cause (proven by
elimination — no linked branch, no ConnectedEvent, every body revision `Refs`-only, then a
targeted reword flipping `closingIssuesReferences` from `[1166]` to `[]`): the prose sentence
"the milestone orchestrator **hand-closes #1166** on that evidence" — GitHub's keyword parser
treats the hyphenated "hand-closes" as `closes #1166`. Merging would have auto-closed #1166
with untickable boxes; the exact dishonest close the Refs discipline exists to prevent, planted
by the very sentence explaining that discipline.

16. **[hand-closes-parser-trap]** "hand-close(s) #N" is standing vocabulary in this system's
    artifacts (profile, plan, briefs). In a PR body it silently becomes a closing keyword.
    netscript-pr should ban keyword-adjacent issue references in prose ("completes #N by hand",
    "closed by hand (`#N`)" are safe forms); close-gate could flag body text whose
    closingIssuesReferences disagree with an explicit `Refs`-only declaration.

## 2026-08-03 — Wave-1 merges 4 and 5

- **#1181 merged (`3049ef027`)** after its own DoD enforcement made the orchestrator tick the
  final two (truthfully completed) body boxes — the shipped gate red-flagged its own PR body
  twice and both reds were legitimate. Full stage-D record: close-gate green after the
  fresh-SHA rebuild; 0 new ignores; required contexts green; claims independently re-verified
  (7/7 local tests + template diff); files audit clean; body complete.
- **#1180 merged (`c49bd1db2`)** closing nothing by design (`Refs #1166` preserved; the
  "hand-closes" parser trap defused first). Stage-D record: close-gate rerun success; pr-checks
  ok with 13 current-passes, 0 fails; 0 new ignores; only `.llm/tools/release/canary-label.ts`
  + test changed outside run artifacts; decisive derivation suite independently re-run by the
  orchestrator, 15/15; body completed truthfully.
- Wave-1 remaining before canary.1: `proofs` (#1127–#1129, turn still running) and
  `mcp-receipts` (#1183, resumed to finish slice 2).

## 2026-08-03 — R3: #1189 scheduled (W6-A, canary.4 train)

Owner filed #1189 from the wave-4 control run; explicitly not assumed into #1184's train.
Placement: **W6-A, Sol·high, canary.4 train**, after #1093 — separate PRs per the critical-code
split rule despite the shared plugin-core surface and shared third-party-parity theme (gap 2,
the `officialSource` reconciliation gate, is the sibling of #1093's hardcoded discovery). The
slice brief (`slices/plugin-linking-seam/implement.md`) carries: the owner's contract framing
(declare in plugin config, one core seam, no per-plugin logic anywhere), all three
source-referenced gaps, the eight acceptance boxes, the adapted seven-point protocol
(single-command install/start with zero appsettings edits, OTEL-proven cross-boundary call,
RED-first, install-order independence, uninstall cleanup), and the fixture third-party plugin
wired without touching CLI source as the non-negotiable seam proof. Wave-6 rebalanced (tail →
wave 7); #1189 holds W6's expensive-gate slot. `status:plan` set; decision commented on the
issue.

## 2026-08-04 — Wave-0 proof verdicts reviewed; F1(b) recorded; #1191 filed

Full-artifact review of all three proof verdicts (PR #1182):

- **P1 FAIL → F1(b), qualified.** The post-allocation seam WORKED (atomic identity-bound
  manifest, localhost-name URL); the coherent-owned-run bar failed on an unhealthy service —
  the generated SQLite command omits `--allow-ffi` (`libsql`) — and an unattributed HTTP 200
  was correctly refused as evidence. F1(b) = `aspire-cli` adapter primary; S7/#1133 re-scoped;
  S5/#1131 unchanged; revisit clause owner-owned. The proof applied "liveness is not progress"
  to itself.
- **P2 FAIL (honest mapping).** No-DB branch fully measured (3657B spec, dotted operationIds,
  keyword inventory, `{}` error views, no aggregate ceiling); DB branch blocked by the same
  defect. **Orchestrator ruling (recorded as drift D8):** S4/S6 proceed on the no-DB inventory
  — the gating law requires the verdict artifact to exist, and it does; the DB re-measurement
  rides #1191, and any contract contradiction is a recorded re-scope at the next boundary.
- **P3 PASS.**
- **#1191 filed (p1, W2 scaffold-defect class):** `--allow-ffi` omitted from generated
  SQLite/libsql service commands; acceptance includes RED-first scaffold proof, permission
  audit across the other DB templates, and the P2 DB-branch re-measurement. Scheduled wave 2
  (canary.2 train); #1119 slides W2→W3 to hold width at 4 Codex + agy.
- Decision record posted to RFC #1123 + epic #1126; seed RFC §9 already updated by the slice.
  #1127/#1128/#1129 boxes verified/ticked on evidence; PR #1182 marked ready; gate watcher armed.
