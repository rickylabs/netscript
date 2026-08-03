# Escalation — RFC single deployment (issue #820) — PLAN-EVAL loop limit reached

Run `rfc-single-deployment--orchestrator` · 2026-07-17 · generator Fable 5 · high, session
`7f1fada7-805f-46cb-8ac4-5eb201bdc105`. Evaluator: Codex GPT-5.6 Sol · max — cycle 1 thread
`019f6fa1-b09a-7542-a582-8cd60055eaca` (`plan-eval-cycle1.md`), cycle 2 thread
`019f6fb5-8bf9-7ed0-9f8c-0568827a799a` (`plan-eval-cycle2.md`).

## State

Two `FAIL_PLAN` cycles — the harness loop limit. Per kickoff and `plan-gate.md`, the RFC was
**NOT posted to #820** and no board mutation of any kind occurred (evaluator-audited both
cycles). All stop-lines held.

## What is solid (evaluator-confirmed across both cycles)

- The POC forensics and gap analysis: launch-only supervision, the activation-convention reuse,
  the board-sequencing defect (Tier-4 at beta.11 before PM at beta.12), and the Deno-Desktop
  update-model reading are all confirmed correct with citations.
- The architectural direction: install manifest derived from the Aspire model, emitted through an
  Aspire-publish step, reusing `OsServicePort` — "directionally sound", not a bolt-on host.
- The PM-epic corrections: PM-1/PM-5 acceptance-sized additions; adoption contract split out as
  PM-A; PM-9's 18-route contract untouched; transport seam correctly narrowed; migration-barrier
  `maintenance` state called honest.

## What the evaluator holds unresolved (cycle-2 sweep — mostly owner-shaped)

1. **Beta.11 Windows update promise.** #456a keeps `Deno.autoUpdate()`, which stages but never
   applies on Windows. Either the launcher/updater substrate moves into #456a, Windows is
   excluded by fork, or another apply mechanism owns it. Related: #543 (PM-32) is window-only per
   its own text — the beta.13 move needs evidence or a fork; default is return it to beta.12 on
   #456a.
2. **Update exclusion/journal/confirm/shim hardening.** Launcher must wait (not "degrade") during
   a nonterminal journal; journal writes must be torn-write-safe (append-only/atomic-replace +
   dir fsync); confirmation needs a sustained-health grace rule; shim bootstrap failure needs a
   recovery path outside the release dir.
3. **Privilege separation + client auth (per-machine).** Updater capability must be distinct from
   the workload account (workload = read/execute on releases, write only to data); every
   interactive user's window needs an authorization story against the machine-wide control plane
   (PM-12 tokens are single-identity 0o600 today).
4. **Port taxonomy + uninstall policy.** Reconcile `InstallationPort` with the shipped
   `DeployTargetPort` (`install`→`up`, `uninstall`→`down`) and `OsServicePort`; define where
   `repair` lives; lock uninstall's data/secrets retention-vs-purge and interrupted-op recovery
   (ISSUE-167 precedent).
5. **PM prerequisite bar + containment.** Decide whether PM-7/PM-8/PM-14 (log rotation, ordered
   teardown, subprocess telemetry) join the SD-1 prerequisite set; PM-36 (Job Objects) cannot be
   both under SD-1's acceptance and land at stable — blocking beta.13 slice, or ratified
   containment limitation with G1 marked partially closed.
6. **Shared manifest ownership across milestones.** #456a's beta.11 schema needs a named owner +
   versioning/compat rules before deploy-core is extracted (PM-20, beta.12) and generalized
   (SD-2/SD-4, beta.13) — otherwise the single-runtime lane gets retrofitted.
7. **Aspire-model derivation boundary.** The resource graph gives resources/endpoints/deps; scope,
   identity, signing, barriers, snapshot targets, and provisioning need typed NetScript deploy
   config — the compiler-input contract must be locked or "derived from Aspire" stays an
   assertion.

Plus mechanical fixes listed in `plan-eval-cycle2.md` § Required fixes: debt reconciliation
(`DEPLOY-ARCHETYPE-7-CORE-SEED`, `DEPLOY-BAREMETAL-PUBLIC-WIRING`,
`cli-deploy-linux-integration-untested`, `runtime-app-wide-shutdown-orchestrator`), §E.2
dependency-direction disambiguation + SD-5/PM-36 scoping, archetype reselection (Archetype 3 for
SD-1/PM-A/SD-4 runtime behavior), and the full jsr-audit rubric (module docs/examples, consumer
gates) on every planned entrypoint.

## Owner decision requested

- **(a)** Authorize a **cycle-3 revision** (same run, same lanes): I fold the seven sweep items
  as locked designs or numbered forks per the evaluator's fix list, then re-eval. Most items have
  a clear technical resolution; the genuinely owner-shaped calls are the Windows-beta.11 promise
  (1), the PM-32 placement (1), the containment bar (5), and per-machine tenancy/auth posture
  (3, extends OF-F).
- **(b)** Rule on the sweep items directly (they subsume forks OF-A..G in `plan.md` §F), then I
  finalize and re-eval once.
- **(c)** Stop here; the run dir stands as the research/design record for a future run.

Nothing has been posted to #820; the charter's deliverables 5 (RFC comment + board drafts) remain
gated and unexecuted.
