# Worklog — feat-milestone-orchestrator-artifacts--authoring

## S0 — bootstrap + outline

- Read, in brief order: #1120 (ratified D1–D3 + amendment + acceptance), the merged design doc
  (source of record), the 0.0.4 cut-trace, the shipped #1121/#1122 label surface
  (`.llm/tools/release/canary-label.ts`, `release:canary-label` task), `netscript-release` and
  `netscript-pr` skills, `seed-run.md` (run-shape precedent), lane-policy headings.
- Confirmed the cadence doc's path is already forward-referenced by the cut-trace as
  `workflow/canary-cadence.md`; profile path `workflow/milestone-run.md` is fixed by the design
  doc; neither file exists yet.
- Confirmed #1149 (canary surface exercise, 0.0.5) and #1160 (drift-check target-scoping defect,
  0.0.5) exist; #1119 (naming collision) exists — not fixed here, disambiguated only.
- Outline locked in `plan.md`.
- Draft PR #1161 opened (labels, milestone 0.0.5, `ci:skip-e2e`+`ci:skip-scaffold` for the
  docs-only diff); outline posted as the `[PHASE: PLAN]` comment.

## S1 — canary-cadence.md (`1774f6c95`)

- Trigger [observed], membership [observed] (#1086 falsification canonically homed here), D3
  identity + note contract wired to `release:canary-label`, drift gate with firing evidence
  (#1121) and did-not-run signature (five pre-allocated `not run` check records), #1160 as known
  limitation, #1119 disambiguated, open questions kept [asserted]/owner-undecided.

## S2 — milestone-run.md (`04efa4b0e`)

- Stage contracts A–G; `cut-trace.md` as signature artifact; 7-item pre-merge gate as
  check → firing evidence → did-not-run table; gate integrity rules (proof-of-firing, #1142
  latest-run-per-check-name, serialised expensive gates, honesty rule w/ #1092+#1146 precedents);
  cut-time checklist; evaluator protocol incl. scoped reviewer-substitution waiver. PLAN-EVAL of
  the wave plan marked [asserted] — 0.0.4 ran without one; not promoted.

## S3 — agent-milestone-orchestrator skill + mirror + validation

- Skill authored: role judgement only (clustering, waves, re-planning, delegation, merge
  authority, canary decision, honesty, supervision pitfalls); no gate lists, no routing, no label
  mechanism — all referenced.
- `deno task agentic:sync-claude` — SYNCED: 18 skills, 22 mirrored files. Ridealong: regenerated
  `aspire` and `netscript-release` mirrors that were stale on main (generated surface must track
  its source; +22/−6).
- `deno task agentic:check-claude` — all five checks OK.
- fmt: repo `deno.json` fmt scope is `packages/**`/`plugins/**` TS only — the authored Markdown is
  outside fmt jurisdiction; house 100-col style applied by hand.

## S4 — verification issue + acceptance evidence + status flip

- Filed #1163 (milestone 0.0.6, `type:test`, #1090 pattern) — owns the observational criterion
  "0.0.5 runs on this system", with four checkable criteria incl. upgrading/falsifying each
  `[asserted]` rule the run exercises.
- PR #1161 body finalised (all slices + DoD ticked); `## Acceptance evidence` posted mapping every
  #1120 acceptance box verbatim to evidence; `status:impl` → `status:impl-eval` in the same
  action.
- Non-duplication verified: `grep -n "OIDC\|publish:readiness\|release:preflight"` over the three
  artifacts hits only the cadence doc's ownership-disclaimer lines (12–13).
- Awaiting owner ratification (D1). Merge closes #1120; D2 then unblocks 0.0.5 delivery.

## Eval cycle 1 — Sol·xhigh adversarial pass (`review_claude`), verdict CHANGES_REQUESTED

Thread `019fc874-c9b4-7b43-8af7-8abc6d6dae8d`, isolated worktree at `aa11f0b33`; verdict of
record: PR comment + `sol-eval-1.md`. 9 critical / 6 major; all triaged **accepted** — none
declined. Fixes:

- **C1** cadence ownership bullets and the failed-canary parenthetical reduced to pure pointers —
  no `netscript-release` doctrine content restated.
- **C2** drift-gate section rewritten to the observable contract; check-name enumeration,
  allocation strategy, and algorithm detail removed (consult `canary-label.ts`).
- **C3** "notes accumulate into the stable note" corrected in both cadence and cut checklist: no
  mechanism exists; canary notes are cut source material read manually; marked [asserted].
- **C4** "ends every run with a drift check" corrected: non-dry runs end with the drift verdict;
  `--dry-run` stops pre-mutation with visible not-run records.
- **C5** "impossible by construction" overclaim replaced: canonical derivation is the
  `release-canary.yml` wiring passing the publish step's own output; the standalone CLI bounds
  but does not derive.
- **C6** stage-B quota/transport gates given a proof form: recorded check output in `worklog.md`
  before dispatch; absent record = did-not-run.
- **C7** pre-merge check 3 firing status stated honestly: exclusion observed; predicate-on-new-
  ignore not yet demonstrated.
- **C8** #1120 acceptance box 1 given a relocation note (run-from-it proof → #1163, #1090/#1121
  precedent); evidence mapping re-scoped accordingly.
- **C9** D2 mapping corrected: #1153/#1155 (milestone 0.0.5) merged 15:30/15:49Z pre-ratification;
  surfaced for the owner's D2 interpretation instead of "by construction".
- **M1/M2/M3** `[observed]` definition widened to the recorded 0.0.4 execution (trace + filed
  issues + ratified design record) and every flagged claim re-cited to its actual source; the
  repo-version trap re-attributed as a scoping finding, not a trace observation.
- **M4** #1142 mitigation split: defect observed, latest-run-per-check selection rule marked
  [asserted] until exercised.
- **M5** stage-C operability closed: tooling.md + agent-handoff.md wired into skill and profile;
  `codex-watch --mode turn` interception rule added.
- **M6** context-pack state corrected with an explicit do-not-repeat-S4 guard.

## Eval cycle 2 — verdict CHANGES_REQUESTED; second failure → escalation

Verdict: `sol-eval-2.md`. Sol confirms C1/C2/C4/C5/C6/C8/M3/M5/M6 resolved, no duplicate
paragraphs, mirror byte-identical. Follow-up slice dispositions:

- **C3 residue** — cadence reference-table row still said "verification of note accumulation";
  now "reads the canary notes manually". Fixed.
- **C10** — "release on the *existing* tag" implied a tag-existence check the tool does not
  perform; wording corrected (tag created by the canary cut; tool creates-or-updates the release;
  its guard is the published-version refusal). Fixed.
- **M7** — #1160 is CLOSED; the "known limitation" became a lineage note keeping the
  never-hand-patch doctrine. Fixed.
- **C7** — resolved by demonstration rather than argument: `gate-demos.md` § Demo 1 shows the
  check-3 predicate RED (exit 1) on a new ignore in publishable source, GREEN on excluded-path
  quotes, GREEN on a clean diff. Row updated to cite it.
- **M4** — resolved by demonstration on live data: `gate-demos.md` § Demo 2 applies both clauses
  of the #1142 rule to merged PR #1155's real rollup (post-merge FAILURE +28s, superseded
  CANCELLED) and recovers the true pre-merge SUCCESS. Row updated; [asserted] marker removed.
- **C9** — escalated: owner ruling required on D2's reading (see drift.md); the D2 evidence box
  in the PR body is now UNTICKED pending that ruling.
- **M1/M2** — escalated: definitional dispute over the `[observed]` source of record
  (cut-trace-only vs the ratified design record's own practice); supervisor position recorded in
  drift.md, owner to ratify or overrule.

## Eval cycle 3 — CHANGES_REQUESTED on two mechanical residues; substance resolved

Verdict: `sol-eval-3.md`. C3/C7/C9/M1/M2/M4/M7 resolved — C9 and M1/M2 under the owner rulings
recorded on #1120; Sol independently re-ran the check-3 demo (RED exit 1 / GREEN exit 0) and
re-fetched #1155's rollup, confirming both gate demonstrations against live data. Survivors,
both residues of the cycle-2 fixes, fixed in this slice:

- **C10** — dropped the false implication that the published-version guard means the tag exists;
  the note now states the tool does not check the tag and what GitHub would do if it were absent
  (create it at default-branch HEAD — the wrong commit).
- **M8** — the PR body's "every gate" acceptance row now cites the `gate-demos.md`
  demonstrations and #1160's fixed status instead of the pre-demo wording.
