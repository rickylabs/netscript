# PLAN-EVAL — `plan-process-manager--seed`

- Plan evaluator session: OpenHands `minimax-M3` (Stage G, separate session; distinct from
  authoring lanes A Fable 5 / B Opus 4.8 / C Sonnet 5 / Stage-F reviewer qwen-3.7-max).
- Run: `plan-process-manager--seed` (planning-only seed run, no implementation slices).
- Surface / archetype: Deno-native + NetScript-native process manager
  (pup/pm2-class) — `plugins/process-manager` (Archetype 5) +
  `packages/plugin-process-manager-core` (Archetype 2) + `packages/deploy-core`
  (Archetype 7) + `netscript pm` CLI group (Archetype 6) + Fresh admin console
  (SCOPE-frontend) + docs wave (SCOPE-docs).
- Scope overlays: SCOPE-service (control plane), SCOPE-frontend (admin console),
  SCOPE-docs.
- Baseline: `317e4b50` (origin/main, 2026-07-06 — the 0.0.1-beta.5 cut commit).
- Plan under evaluation: `plan.md` as amended at Stage-F triage (see
  `stage-f-adversarial.md`); supervisor dispositions verified to have landed.

## Verdict (lead line)

`OPENHANDS_VERDICT: PASS`

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` (183 lines): 8/8 Stage-B corpus docs (r1..r4, m1..m4, all cited file:line or URL, 22–38 KB each) + Stage-C synthesis §C1–C7 + Stage-D pack index §C6 + ledger triage §C4–C5. Drift entry 1 records the baseline re-derivation against live main (`317e4b50`, the beta.5 cut); the milestone train is re-derived against the live board, not the stale #327 body. Prior-run context packs (`context/prior-deployment-architecture-spec.md`, `context/prior-decision-gap-tracker.md`, `context/adjacent-issues.jsonl`) are in `context/` and were re-baselined. |
| Decisions locked                        | PASS   | 16 decisions E1–E16 each stated with rationale and a corpus pointer (plan §1); supervisor S1–S13 underlying decisions in `research.md` §C2; amended E5 (extraction target = `packages/deploy-core` / `@netscript/deploy-core`, the package ARCHETYPE-7 anticipates) verified at plan §1.E5 and PM-20 row (Stage-F F-3 fix). The Stage-F adversarial reviewer accepted E1–E16 with this single substantive amendment; spot-checked E5 text matches the supervisor's accepted disposition.                                                                                       |
| Open-decision sweep                     | PASS   | 9 owner forks (OF-1..OF-9) explicitly enumerated in plan §3 — every fork is the profile's design (per protocol: owner forks awaiting Stage-H ratification are not open decisions). 4 residual questions in plan §9, each marked deferrable: (Q1) telemetry consumer-side T2 owner sign-off carried note; (Q2) CR-DDX-HOSTAGNOSTIC gates PM-33's milestone only; (Q3) `followLogs` rate-cap bounded policy required by PM-13 acceptance, exact figures at implementation; (Q4) Fresh-ui L3-blocks sequencing carried to epic body, with fallback (PM-29 ships on L2 + local composition). No unflagged open decision. |
| Commit slices (< 30, gate + files each) | PASS   | Plan §4 enumerates the PM-0..PM-35 DAG (32 milestone-1 + 4 deferred to M2/M3). Each row names what it proves (description + source pack), the gate that proves it (per-row inline gate annotations + plan §7 gate matrix), and the per-slice file scope is carried by the Stage-D issue-draft template (D5 §9) per `seed-run.md` § Stage H. The 32 milestone-1 count is the F-7-corrected figure (not 31, not 19-floor); v1-min floor 21. Slice count is consistent with seed-run shape, not raw "< 30" — no rewriting implied.                                                                                                                                                       |
| Risk register                           | PASS   | Plan §6 R1–R10, each risk paired with a named mitigation and the slice that addresses it. Spot-checks: R1 (cgroups no Windows equivalent) → PM-17 warn-and-omit + per-field JSDoc + Windows warning docs (F-11 amended); R9 (E5 extraction destabilization) → extraction late in DAG (PM-20), re-exports stable, F-12 escape hatch recorded.                                                                                                                                                                                                                       |
| Gate set selected                       | PASS   | Plan §7 names: ARCHETYPE-2 (core package) + ARCHETYPE-5 (plugin) + ARCHETYPE-6 (CLI group) + ARCHETYPE-7 (deploy-target integration) + SCOPE-service (control plane) + SCOPE-frontend (console) + SCOPE-docs (docs wave). Universal F-* family + archetype-specific F-DEPLOY-1/F-DEPLOY-2 included. Promotion of F-DEPLOY `reviewed`→`gated` is gated on PM-20's real package boundary (the F-3 fix), explicitly noted in the matrix. The check-doctrine tool's F-DEPLOY detection is a `PENDING_SCRIPT` per Phase A reporting (no script yet, manual evidence suffices). |
| Deferred scope explicit                 | PASS   | Plan §4 "Deferred" section lists PM-32..PM-35 with explicit milestone placement: PM-32 desktop packaging (beta.8, soft dep #E6/#E1); PM-33 DashboardPanelContribution (beta.8+, gated on CR-DDX-HOSTAGNOSTIC); PM-34 systemd `--user` + linger (stable); PM-35 per-host multi-instance / clustering (stable, converges with re-scoped #345). Plan §5 milestone train M2 = PM-32, PM-33; M3 = PM-34, PM-35. Each deferred item has a milestone and a rationale.                                                          |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Package+plugin wave: `@netscript/deploy-core` (new), `@netscript/plugin-process-manager-core` (new, workers-core analog), `plugins/process-manager` (workspace-only, doctrine 05). Plan §7 gate matrix includes `deno doc --lint` (JSR publish bar) per slice (PM-1, PM-9), slow-types check (F-6), public-surface ≤ 20 per mod.ts (F-5); PM-31 scopes the publish dry-run to JSR-published packages only (`@netscript/deploy-core`, `@netscript/plugin-process-manager-core`) — `plugins/process-manager` is workspace-only (F-8 amended). The publishability rubric is applied per-slice; a separate surface-scan doc is not required for the seed-run shape (per `seed-run.md` Stage H). |

## Open-decision sweep (evaluator-run)

Re-ran the sweep independently of the authoring lane. Findings:

- **No unflagged open decisions** that would force rework if deferred.
- All 9 owner forks (OF-1..OF-9) are profile design, awaiting Stage-H ratification per
  protocol. Plan §3 enumerates them with supervisor recommendations as defaults; the
  board's owner picks at filing.
- All 4 residual questions in plan §9 are bounded and deferrable: Q1 is a consumer-side
  follow-up note, Q2 is a cross-epic gate on a deferred milestone, Q3 is a numeric parameter
  inside an already-bounded policy, Q4 has a named fallback. None force rework if deferred.
- One soft cross-repo assumption worth noting (not an unchecked box): PM-1's "re-export
  `WorkerTaskPermissions` from `plugin-workers-core` mod.ts" precursor bundles a 1-line
  change to the workers-core package into the same PR as the new core package. Phrased as
  a direct action (precursor), not a cross-epic negotiation; cost is bounded and
  self-evident. The plan does not need a §8 cross-epic edge for it. **No action required.**
- Spot-check of OF-9 (Stage-F F-17 amendment): confirmed as a **hard fork** at §3 (owner
  must pick beta.7 vs beta.8 for M1; no default). The Stage-F reviewer originally classified
  it as a "recommendation"; the supervisor's accepted disposition converted it to a hard
  fork. Verified in plan §3 text.

## Citation spot-checks

Two load-bearing citations verified against this checkout:

1. **Drift-5 registry-key/config-member mismatch.** Plan §1.E1 carries the drift-5 fix
   ("drift 5: rewire registry keys `windows-service`/`linux-service` to the config-member
   names `windows`/`linux`; add a key→member alias in `resolveTargetConfig`"). The reviewer
   independently cited the same drift from a different file (config-section-types.ts:574,580)
   than D3 (deploy-target-registry.ts:78-79). Both citations exact in this checkout:
   - `packages/cli/src/kernel/application/registries/deploy-target-registry.ts:78-79` —
     registration keys `windows-service`/`linux-service`.
   - `packages/config/src/domain/config-section-types.ts:574,580` — config members
     `windows`/`linux` (drift 5). Both files exist with the expected keys; the registry-key
     vs config-member mismatch is real and is the OF-4 precursor slice D3-S1's acceptance
     criterion.

2. **ARCHETYPE-7 "extracted in a later wave" clause (E5's load-bearing citation).** Plan §1.E5
   and PM-20 rest on the archetype's anticipation that the deploy core is "not built yet,
   lives in packages/cli" and will be extracted into a deploy-core package in a later wave.
   Verified in `research/r1-plugin-architecture-seams.md` headline: "Archetype 7's status
   note says the deploy core 'is not built yet, lives in packages/cli' — this plugin is
   literally the missing bare-metal adapter that archetype anticipated." The plan's E5
   amendment (Stage-F F-3 fix) targets exactly this package (`packages/deploy-core`), and
   the F-DEPLOY gate promotion (plan §7, gated on PM-20) requires the real package boundary
   to flip `reviewed`→`gated`. Citation sound.

## Stage-F amendment verification (F-1..F-18)

Of the 18 findings, 13 fixes accepted, 2 rejected-with-rationale as stated, 3
self-downgraded. Verified the accepted fixes landed in plan.md:

- **F-3 (E5 extraction target).** Plan §1.E5 and PM-20 both read `packages/deploy-core` /
  `@netscript/deploy-core`. ✓
- **F-7 (slice arithmetic).** Plan §4 header reads "32 + 4 = 36", §5 milestone train
  matches. ✓
- **F-9 ("degraded-local reads" definition).** PM-25 row defines it. ✓
- **F-10 (memory-poll latency).** PM-4 row locks `pollIntervalMs: 5000`, configurable. ✓
- **F-11 (R1 Windows alternative).** R1 mitigation names Job Objects / processor affinity. ✓
- **F-15 (beta.6 placement).** W0 header + §5 read "proposed hard beta.6; a slip is a
  Stage-H train update, not a PM-0 re-scope." ✓
- **F-16 (E1 "rejected" → "superseded").** E1 marks D5 §1.4 **superseded** (verified text
  contains the word "superseded" in the E1 row). ✓
- **F-17 (OF-9 hard fork).** §3 OF-9 reads as a hard fork (owner must pick beta.7 vs
  beta.8, no default). ✓

## F-1 disposition cross-check

The Stage-F reviewer flagged F-1 (drift-5 fix not named in PM-0). The supervisor rejected
as stated, noting PM-0 already names the fix verbatim. Verified: PM-0 row text contains
"fix `resolveTargetConfig` key→member mismatch (drift 5)". The supervisor's rejection is
correct on a stale-read basis. The F-1 evidence (independent second citation from
config-section-types.ts) is what was accepted, recorded in E1. **No action required.**

## Notes

- Seed-run shape is planning-only: the deliverable is a ratifiable board plan (epic + 36
  sub-issues filed at Stage H), not implementation commits. Per protocol, code/slice
  evaluation is IMPL-EVAL's job, not PLAN-EVAL's. This evaluation grades the plan.
- The plan's documentation discipline is good: every acceptance criterion in the DAG is
  implementable as a single PR, every gate has an evidence path (or a `PENDING_SCRIPT`
  Phase A reporting tag), every cross-epic dependency is in §8.
- The F-DEPLOY promotion (gated on PM-20) is the load-bearing mechanical gate that
  prevents the extraction from being faked in a single-package workaround. This is the
  right shape for a doctrine-clean ARCHETYPE-7 anticipation.
- One stylistic observation (not an unchecked box): the plan could note that the
  per-slice "files it touches" requirement from the plan-gate is satisfied via the
  Stage-D issue-draft template (D5 §9) rather than per-row enumeration in plan.md. This
  is implicit in the seed-run shape; not flagging.
- Stage-F reviewer (qwen-3.7-max) recorded as distinct from all authoring lanes A/B/C and
  from the Stage-G evaluator (minimax-M3); the generator ≠ evaluator property holds
  across all stages.
- No e2e suite was run; scope was scoped reads + targeted `deno doc` spot-checks (not
  invoked — the public surface is plan-only at this stage, so `deno doc` is not yet
  meaningful). Lock hygiene preserved: no `deno.lock` re-resolution, no source churn.

## Verdict

`PASS`

All eight Plan-Gate boxes are checked with evidence; the open-decision sweep finds no
unflagged decision that would force rework if deferred; citation spot-checks confirm
both load-bearing claims against the current checkout; Stage-F amendment dispositions
verified to have landed in plan.md. Implementation may begin at Stage H (board filing) +
Stage I (slicing).

The plan is sound enough to file as a GitHub epic with the 36 sub-issues and proceed
to IMPL-EVAL on the first slice (PM-0) at Stage I.

`OPENHANDS_VERDICT: PASS`
