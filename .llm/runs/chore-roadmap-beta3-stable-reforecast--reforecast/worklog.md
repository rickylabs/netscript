# Worklog — roadmap re-forecast

- 2026-07-04 — G0 bootstrap: worktree `.llm/tmp/wt-roadmap` on `chore/roadmap-beta3-stable-reforecast`
  @ baseline `1b42ba88`; epic #391 filed (`type:umbrella`, `epic:roadmap-reforecast`, `area:tooling`,
  `priority:p1`, milestone `0.0.1-stable`, Part of #301, cross-links #389); label
  `epic:roadmap-reforecast` created (added to labels.yml this branch). Run dir stood up. Draft PR #392.
- 2026-07-04 — G1 evidence: 3 Opus 4.8 sweeps complete (R1 48/48 open issues, R2 22 beta.2 PRs, R3
  epic+code). Findings in research.md. Reconcile note: R1's mis-milestoning + R3's code-verified
  stable-blocker ranking + R2's false-close/unregistered-lane findings all fed the forecast.
- 2026-07-04 — G2 synthesis: `roadmap-0.0.1.md` written — themes beta.3=AI-plugin-parity+acceptance,
  beta.4=AI-depth, beta.5=deploy+maturity, stable=leadership+prod-gates. ETAs + reasoning + 5 owner
  ratification questions.
- 2026-07-04 — G3 apply (reversible GitHub reconciliation):
  - Created milestone `0.0.1-beta.5` (#7).
  - Filed code-defect bugs #393 (compose target unregistered) + #394 (deploy e2e absent), both
    beta.3, Part of #391.
  - Milestone moves: #246/#248/#257/#269/#270→beta.4; #256→beta.4; #345/#346/#347/#348/#305/#306/
    #307/#303/#389/#327→beta.5; #295/#319/#320→Backlog; #309→stable.
  - Taxonomy fixes: #375, #376 labeled.
  - WSL loop-var landmine hit (inline `for n in …; do gh … $n` passed empty via wsl.exe arg
    handling; also `bash script.sh` lost gh PATH). Fixed by running the moves as `bash -l <script>`.
  - Verified distribution: beta.3=9 · beta.4=9 · beta.5=10 · stable=9 · Backlog=14.
  - Reconcile of pre-applied moves: agreed with #388/#387/#219→beta.3, #262/#290/#247→beta.4;
    OVERRODE #389→stable to #389→beta.5 (harness V3 is repo-maturity, not a stable-release gate);
    ADDED #269/#270→beta.4 and the Aspire-tracking→Backlog set.
- 2026-07-04 — G4 PLAN-EVAL + ratification fold:
  - PLAN-EVAL **APPROVED** (OpenHands minimax-M2, separate session; verdict comment on PR #392 —
    5/5 code claims confirmed against `v0.0.1-beta.2`, C1–C16 all clean).
  - Owner ratified R1–R4 post-PLAN-EVAL (PR #392 comment 2026-07-04): R1 bench #302 = post-stable
    fast-follow (not a hard gate) · R2 beta.5 stays distinct · R3 beta.3 = the eis-chat dogfood
    bar · R4 stable deploy gate = bare-metal systemd + `deno compile` (#394 bare-metal-first).
    Q5 (Prisma-Next #313) unanswered → assumed deferred, kept out of the critical path.
  - Folded into `roadmap-0.0.1.md`: status header, §1 maturity para, §2 themes + stable rescope
    (#302 out of gate set; deployability gate = bare-metal), beta.3 acceptance-bar block, #394
    bullet, beta.5 distinct-cut note, §3 stable ETA 3-4wk→2-3wk (end-to-end 10-13→9-12wk), §4
    reconcile table + distribution (stable=8/Backlog=15), §5 rewritten as ratification record,
    new §6 harness-V3 operating-model conformance (merged `eeaff336`; tiers, A1, stage labels,
    #387 close-gate, epic/closing-keyword conventions).
  - GitHub: PR #392 phase comment posted; #302 milestone move (stable → Backlog / Triage) and the
    #302/#394 ratification comments were DENIED by the fold session's permission classifier
    (grant covered the PR surface only) — recorded as directed/pending-apply for the owner or a
    granted session. Stage label `status:plan-eval` → `status:impl-eval` attempted with the phase
    comment.
  - Reconcile note: harness V3 merged to main (`eeaff336`) after the forecast was written — beta.5
    scope line for #389 updated to "epic close-out + adoption remain"; #313 verified already at
    Backlog (Q5 assumption holds); no other issue drift found since G3.
