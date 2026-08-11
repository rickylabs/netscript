# Worklog — docs-rfc-runtime-versioned-automation--supervisor

## 2026-08-11 Bootstrap

- Run dir scaffolded; supervisor identity + owner overrides recorded (Fable 5 medium supervisor,
  Sol xhigh final PLAN-EVAL) — see supervisor.md, drift.md D-1/D-2.
- Baseline verified: branch `docs/rfc-runtime-versioned-automation` == `origin/main` @ `2256a67bf`.
- Read-only surfaces verified present: `/home/codex/repos/netscript-start-ref` (legacy),
  `/home/codex/repos/ns-1443-plugin-ai-orchestrator` (#1443/#1444).
- No established `docs/architecture/rfc/` location exists yet (grep over docs/ found no RFC/ADR
  tree); this run will create `docs/architecture/rfc/` and record that as a locked decision in
  plan.md.

## 2026-08-11 G3 — #1444 impact memo (early deliverable)

- Read-only inspection of `/home/codex/repos/ns-1443-plugin-ai-orchestrator`: PR #1444 body, D-10
  owner decision (control-plane/runtime split), uncommitted child-process loader
  (`configured-plugin-manifest-loader-child.ts`, `plugin-registry.ts` diff), workspace-mutator
  `plugin.ts` registration, barrel stub cleanup. Never wrote in that worktree.
- Wrote `1444-impact.md` (run dir): ratifies the D-10 split, keeps the child loader (clearEnv is
  load-bearing), 8 compatibility constraints C1–C8 (notably: manifests stay serializable data,
  additive-extensible schema, `deno.jsonc` loader gap, `generate runtime-schemas` stays
  control-plane-only, `workers|triggers/runtime/**` untouched).
- Posted to PR #1444: https://github.com/rickylabs/netscript/pull/1444#issuecomment-5248826402
- G1 legacy archaeology Codex slice launched: thread visible in `codex-thread-ids.md`
  (gpt-5.6-sol · medium, worktree = this RFC worktree, legacy repo read-only subject). First
  launch attempt failed (runner forwards only --launch-arg values; --brief/--worktree must be
  inside them) — relaunched successfully.

## 2026-08-11 G1 — legacy capability map landed (slice review PASS)

- Codex Sol·medium thread `019feef8-673d-7c53-98a4-db337494105b`, 6 turns (budget-exhausted at
  max-turns but report structurally complete: 15 sections, exec summary, 3 operator journeys,
  reachability audit, 5 weakest claims).
- Headline (reshapes the RFC): **the versioned runtime trees were DEAD even in legacy** — loader +
  watcher existed but no executable service imported `@netscript/runtime-config`; hot
  add/update/rollback never worked end-to-end. Real-but-orphaned data plane: KV task registry +
  7-runtime polyglot executor (per-message KV resolution = live-update capable) with NO operator
  registration path. Workers cockpit task pages wired (list/detail/run, no create); triggers
  cockpit dead vs delivered Hono service (contract/server mismatch). Permissions: absent → 
  `--allow-all`; non-Deno adapters inherit host env, no sandbox. Split-brain config across 5
  stores. Schemas = editor artifacts, 2 diverged authorities, no admission validation.
- Supervisor slice review: read full report; spot-checked the 2 most load-bearing claims —
  (a) no runtime-config consumers in legacy (grep confirms only type/contribution metadata),
  (b) `permission-flags.ts` returns `--allow-all` when permissions absent (verified verbatim).
  PASS. The owner's "capability" is best understood as an *aspiration with a working execution
  engine*, not a lost working feature.

## 2026-08-11 Owner mid-run directives + sandbox survey

- D-4 (complete redesign in scope), D-5 (no compat/migration layer), D-6 (parent hypotheses) —
  recorded in drift.md; plan.md + G2 brief updated accordingly.
- External isolation-tech survey extracted to `.llm/tmp/docs/sandbox-isolation-survey-2026-08.md`
  (Deno security docs primary; gVisor/Firecracker/WASM-WASI/V8-isolate comparison; managed
  sandbox market scan).

## 2026-08-11 G2 — current-state matrix landed (slice review PASS)

- Same Codex thread resumed with the G2 brief (fresh-launch attempts hit `duplicate_sender_risk`;
  registry-sanctioned resume used instead — recorded, not hidden). 10 turns, report complete:
  `evidence/current-state-matrix.md` (255 lines) + probes under `evidence/current-state-probes/`.
- All hypotheses H1–H6 **confirmed** with behavioral proofs: P1 publish/rollback works but
  concurrent topic promotion lost an update **20/20 trials** (read-merge-write pointer, no CAS);
  P2 watcher reloads and malformed JSON silently yields empty topics; P3 real CLI
  `generate runtime-schemas` exits 0 with **0 written** on baseline; P4 versioned `RuntimeTask`
  is rejected by the executor (`supports()` false — schema drift proven live); P5 deno+shell
  execute through `MultiRuntimeTaskExecutor`. Targeted suites: 22 passed / 0 failed.
- New current-state facts folded into the RFC: trigger v1 router genuinely backs
  introspection/event-reads/webhook/enable-disable (honest-pending pattern for the rest); false
  immutability (republish overwrites topic doc); loader pointer paths not root-confined; official
  samples emit dangling `$schema` refs.
- Supervisor slice review: full read + 2 verbatim spot-checks (`manage-runtime-overrides.ts`
  read-merge-write; `routers/v1.ts` enable/disable KV-backed). PASS.

## 2026-08-11 S4 — RFC authored

- `docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md`: two-plane architecture,
  runtime contribution families (#890 pattern extracted), immutable-revision store + CAS
  activation + audit, snapshot propagation (no fs-watch), execution boundary tiers T0–T3 over
  established isolation tech (survey extract in `.llm/tmp/docs/`), threat model TM1–TM8,
  observability/history, management API, cockpit downstream of #922 minimum cut
  (#923–#932 + #934, #933 adjacency), ownership decision O2+O4 with recorded fallback,
  cleanup inventory (D-5 clean break), staged RFCs P-1…P-4, roadmap A0–A8, E2E acceptance model,
  alternatives. Gates: `docs:links` green; `deno fmt` clean; PLAN-EVAL brief prepared.

## Design

Design checkpoint for this docs-only run (the deliverable is the RFC package; implementation
designs live inside the RFC and are re-checkpointed by their own future runs).

1. **Public surface** — `docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md`
   (status Proposed; establishes `docs/architecture/rfc/` as the RFC home); run-dir artifacts
   (`research.md`, `plan.md`, `evidence/*`, `1444-impact.md`, `plan-eval.md`); draft PR #1446
   (body + per-slice phase comments); PR #1444 comment 5248826402 (early impact memo).
2. **Domain vocabulary** — capability status tags (IMPLEMENTED/PARTIAL/ASPIRATIONAL/DEAD;
   PROVEN/IMPLEMENTED-UNPROVEN/ABSENT), operator journeys J1–J3, contribution families
   (`task@1`, `trigger@1`), activation epochs/sets, trust tiers T0–T3, threat items TM1–TM9,
   waves A0–A8, prerequisite RFCs P-1–P-4.
3. **Ports** — none created (docs run). The RFC *specifies* ports (store/boundary/reload/feed)
   for future implementation runs.
4. **Constants** — slice IDs S1–S5; evidence file names fixed in briefs; RFC section anchors
   cited by plan-eval.
5. **Commit slices** — S1–S5 as in plan.md §Commit slices, each with files + proving gate.
6. **Deferred scope** — implementation of the selected architecture (owner-gated); issue filing
   (owner-gated); §11 P-1..P-4 prerequisite RFCs; §15 classified deferrals.
7. **Contributor path** — a reader starts at the RFC abstract → §4 overview → the section for
   their concern; an implementer starts at §12's slice table, which names files + gates per
   slice; evidence traceability runs RFC claim → evidence file § → path:line.

## 2026-08-11 PLAN-EVAL cycle 1 — FAIL_PLAN, fix cycle applied

- Evaluator: fresh Codex Sol·xhigh thread `019fef2b-…03fc` in dedicated worktree
  `ns-rfc-plan-eval` (route matched; verified generator≠evaluator). Verdict FAIL_PLAN, 9
  findings (7 blockers + 1 high + checklist fails). Endorsed: D-10 preservation, clean-break
  direction, contribution model, #922 cut modeling.
- Fixes applied (all findings):
  F1 Design checkpoint added (above), context-pack.md created, PR body reconciled;
  F2/F3 ownership DECIDED and re-archetyped (contracts-only core / behavioral runtime core with
  store adapters per relocation-debt law / thin connector; no-connector fallback withdrawn with
  same-fidelity analysis);
  F4 activation-set manifest + monotonic epochs + fleet admission/ack/convergence + adapter
  conformance suite + honest KV narrowing;
  F5 T1 enforcement contract stated bluntly (non-Deno grants declarative+audited, NOT enforced;
  T2 for untrusted polyglot); J2/TM1/TM2/E2E-5 rewritten; per-runtime negative tests;
  F6 TM9 child-loader threat added (C8 honored); explicit v1 trust assumptions; redaction
  bounded; audit not tamper-proof vs DB admin;
  F7 evidence claims scoped to inspected commits; partial operator surfaces acknowledged; #1444
  described as open-draft dependency; polyglot matrix row downgraded to deno+shell proven;
  F8 cleanup inventory expanded (sagas emissions, workers local discovery path, generated
  trigger registry, KV enabled-state fold, Windows env keys, T0 boundary) + cron ownership
  resolved (task@1 has no schedule; scheduled trigger is the only operator cron surface);
  F9 roadmap re-sliced A0–A8 into PR-sized slices with files + gate classes and corrected edges.
- Gates re-run after fixes: `docs:links` green; `deno fmt --check` clean on RFC.

## 2026-08-11 PLAN-EVAL cycle 2 — FAIL_PLAN; corrected fix set applied; escalation point reached

- Cycle 2 verdict appended by the same Sol·xhigh evaluator thread at `382795e4a`: FAIL_PLAN.
  Root causes split in two: (a) three cycle-1 fixes had silently no-opped (drift D-7 — my patch
  strings missed the fmt-rewrapped text), so F2/F3/F6 were evaluated against the OLD text; (b)
  genuinely new findings: complete-desired-state snapshot semantics, cross-engine dispatch race
  (trigger@N+1 → worker@N), admission time-of-check gap, contract-owning slice missing, gate-set
  completeness (fitness/publish per slice; release class for scaffold-changing cleanup),
  file-level §10 inventory, PR-surface reconciliation (labels/DoD/claims).
- Full corrected fix set applied WITH per-edit verification (assert-on-miss + grep audit):
  §5.1 contracts bullet (no ports/state machine; management contract added); §5.2 ports/adapters
  in runtime core; epoch = complete active desired state w/ carry-forward, tombstones, idempotent
  reactivation; §5.3 steps 6–7: revision-pinned cross-engine dispatch + leased registration with
  rejoin validation; blunt T1 perimeter paragraph; TM1/TM2 corrected (no "jail" overclaim);
  TM8 narrowed + TM9 added w/ loader policy + A2a proving gate; §9 DECIDED/binding, fallback
  withdrawn at equal fidelity; O4 row corrected; §10 file-level disposition table (incl. plugin
  runtime-config-topic axis, trigger registry path, Windows emitters, T0 boundary); §12 re-sliced
  (A2b split into A2b/A2d; A6 into A6a/A6b/A6c w/ release class on A6b; ports moved to A1a; full
  gate letters; A7 edges incl. A2d); jsr-audit pre-scan recorded (slow-type risks named);
  E2E-2 expectedEpoch; E2E-5 per-runtime honesty pins; survey extract committed to
  `evidence/sandbox-isolation-survey.md` (was uncommitted `.llm/tmp`).
- Gates re-run: `docs:links` OK; `deno fmt --check` clean.
- **Protocol stop:** two FAIL_PLAN cycles consumed → escalate to owner per
  `evaluator/plan-protocol.md` (no automatic third cycle). Fix state is complete and pushed; the
  owner may authorize PLAN-EVAL cycle 3 or review directly.

## 2026-08-11 S6 — Competitive architecture study (owner directive D-8)

- Primary-source study of Temporal, Restate, Inngest, Trigger.dev, Hatchet, Windmill, Azure
  Durable Functions, AWS Step Functions, Kestra + n8n across the 12 owner-named dimensions →
  `evidence/competitive-architecture-study.md` (per-system cited profiles, 12×9 matrix,
  synthesis: 8 adopted patterns, 4 non-goals, 4 differentiators, benchmark gates BG-1..BG-5,
  limitations incl. point-in-time retrieval and no hands-on deployment).
- RFC integration: new §14.1 (adopt/non-goal/differentiator synthesis with §-mappings), §13.1
  executable benchmark gates (no empirical claims), §11 P-5 (weighted/canary activation, Step
  Functions alias precedent) + P-4 note (durable-saga versioning lessons), header evidence row.
- Wording corrections per D-8: §11 P-2 "Market survey done" → isolation-technology survey,
  explicitly scoped; sandbox survey file scoped to isolation with cross-ref to the study.
- Gates: `docs:links` OK; `deno fmt` clean.
