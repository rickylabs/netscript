# PLAN-EVAL — plan-deploy-plugin--seed

- **Plan evaluator session:** OpenHands / `openrouter/qwen/qwen3.7-max` (open-model evaluator lane), PR #891, action run 29681236970
- **Run:** `plan-deploy-plugin--seed` (r5) — seed run, deliverable = board, not code
- **Surface / archetype:** composite **Archetype 7** delivered as A5 plugin + A2 core + A2 adapters (DP-1 §3)
- **Scope overlays:** none (framework/plugin design)
- **Hardening trail consumed:** Sol-xhigh adversarial r2 (16/16 accepted) → Kimi-K3 doc-story r3 (13/13 accepted) → DP-9 aspire composition r4 → Sol round-2 r5 (9/9 accepted, SG-1…SG-9 all integrated)
- **Context from drift.md:** D-2 explicitly notes this run's kickoff replaced the default stage pipeline with an owner-defined one; this session is the formal PLAN-EVAL of record, dispatched by owner directive via PR comment `@openhands-agent … use harness`.

OPENHANDS_VERDICT: PASS

## Checklist results

| Plan-Gate item (from `gates/plan-gate.md`) | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | ✅ PASS | `research.md` + six corpus files under `research/` (auth-composition-anatomy, board-parity-871-887, deploy-layer-inventory, doctrine-constraints, prior-run-distillation, provider-deploy-surfaces). Re-baseline: "`origin/main = 290c68ef` (2026-07-18). The prior run's board was drafts-only and never filed." |
| Decisions locked | ✅ PASS | `plan.md` §2: **LD-1…LD-12**, each with a rationale pointer to a specific `DP-*` section (family topology, dependency law, eight-op lifecycle, capability contracts, bindings, two-phase loader, wrap map, no service surface, named host extensions, refactor-then-extract, provider-optimized scaffolds, desktop exclusion). Spot-verified load-bearing: shipped `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts` already exports `DeployOperation = plan|emit|up|down|status|logs|rollback|secrets` — the "extraction, not invention" claim in research.md §1 conclusion #2 holds. |
| Open-decision sweep | ✅ PASS | `plan.md` §3: **OF-1…OF-8** (owner forks — each with recommendation + alternative + rationale pointer), followed by four explicit "safe to defer" decisions (cloud-run re-home timing W4; `init --deploy <provider>` sugar pure UX; deploy dashboard seam-priced per OF-4; secrets rotation overlap-window card). Each deferred item states why deferral is rework-safe. Evaluator re-sweep (below): **none**. |
| Commit slices (< 30, gate + files each) | ✅ PASS (seed-run interpretation) | `plan.md` §5: **29 `DPB-n`** child cards (under the 30 cap), ordered by dependency DAG, each with wave, priority, description, and dependencies. Per-card acceptance predicate / proving-gate text / files-touched are authored at stage-H board filing (per the seed-run convention explicitly stated in the final template paragraph "`Part of #EPIC` → scoping paragraph → `- [ ] gate:` acceptance → `Dependencies:` + `Delivery shape:`"). For a seed run whose deliverable is a board, this table is the slicing artifact. |
| Risk register | ✅ PASS | `plan.md` §6: 10 risks, each with severity (`high`/`med`/`low`) and mitigation. Notable: capability-vocabulary risk marked `~~high~~ resolved (r2)` via SF-6; Aspire surface churn risk addressed in r4 DP-9 §4; JSR surface growth mitigated by OF-2 subpath folding + export budgets; probe-failures risk mitigated by findings-first probes + W1–W4 value independence. |
| Gate set selected | ✅ PASS | `plan.md` §7: A5 gates for the plugin (+R-PLUGIN-PARITY), full A2 set for core and every adapter, A7 union + F-DEPLOY-1/2 flipped to `gated` at W1, plus `quality:scan`, `arch:check`, scoped check/lint/fmt wrappers, `deno doc --lint`, publish dry-run, jsr-audit per package, `scaffold.runtime` at W3, conformance suite matrix from W2. Referenced against `gates/archetype-gate-matrix.md`. |
| Deferred scope explicit | ✅ PASS | `plan.md` §9: explicit list — frontend contribution axis (parallel run); leaf backing packages (`kv-cloudflare`, `queue-sqs`, DO saga store); desktop packaging (#830); Netlify/Railway/Render/GKE (open registry, community path); Nitro emitter (OF-7 conditional); deploy dashboard service (OF-4); secrets rotation overlap-window; AWS event semantics (DPB-29). |
| jsr-audit surface scan (pkg/plugin waves) | ✅ PASS | `plan.md` §7 second paragraph: "no oRPC contract in core or plugin v1 ⇒ no `--allow-slow-types` exception anywhere in the family"; "adapters keep vendor CLIs at process boundaries so no vendor types can leak into public signatures (AP-14 guarded by F-15)"; "export budgets per subpath ≤ 20 (F-5)"; "string-constant templates for all emitted artifacts". |

## Open-decision sweep (evaluator-run)

I re-ran the sweep against the full r5 corpus (plan.md, rfc.md + Addendum A, DP-0…DP-9, the r2/r4 adversarial trails, the r3 doc-story trail, drift.md).

**Result: no open decisions found that would force rework if deferred.**

The SG-1…SG-9 round-2 blockers/majors (prebuilt applier matrix, no-save secret/state policy, single-compiler snapshot parity, environment identity normalization, capability-pipeline step re-homing, target×op table, Aspire compatibility wording, conditional step delivery, Radius predicate gates) are all recorded as **accepted** in `adversarial-sol-r4-triage.md` (9/9) and integrated in the r5 corpus (per drift D-8). Spot-checks:

- SG-1 (prebuilt applier matrix): plan.md DPB-8 cell mentions "the **applier matrix** for declared `--prebuilt` rows" ✓
- SG-3 (pipeline step re-homing): DPB-8 now says `adapter-neutral runCapabilityCheck`; the step registration moved to DPB-17 ✓
- SG-8 (Radius predicate gates): DPB-29 captures Radius graduation with machine-verifiable predicates and unverified-until-probed environment capabilities ✓

Three other potential open candidates I tested and discharged:

1. **"Is the 29-child board actually fileable as-is?"** — Yes. Each card has enough identity (wave, priority, description, dependencies) that stage-H body-authoring is mechanical. The template explicitly scopes bodies to the filing step.
2. **"Aspire pipeline-step delivery is now in DPB-17 but W3 plugin scaffold depends on W2 adapter extraction (DPB-8) — is that circular?"** — No. DPB-17 depends on DPB-5, DPB-8, DPB-15 (plan.md §5 line 106); all three precede it in the DAG.
3. **"Do the probe-gated W5 adapters need anything that's not in W1–W4?"** — No. DPB-23/26 probe cards are findings-first; the adapters land only behind passing probes (L-7); plan.md §6 "Probe failures strand W5 adapters" notes W1–W4 value is independent of W5.

## Verdict

**PASS**

The plan-gate checklist is satisfied in full. The corpus has been through three downstream adversarial/doc-story passes (Sol-xhigh 16/16, Kimi-K3 13/13, Sol-r4 9/9) with every finding integrated, producing a coherent locked-decision set (LD-1…LD-12), a dependency-ordered 29-child board (DPB-1…DPB-29), an explicit owner-fork arbitration table (OF-1…OF-8), a risk register with named mitigations, and an explicit deferred-scope list. Load-bearing repo claims (the shipped 8-op `DeployTargetPort`, the `DeployTargetRegistryPort`, the config deploy schema, the auth-plugin composition pattern this family mirrors) are spot-verified first-hand against the tree and match the corpus citations.

Implementation may begin after **owner ratification of OF-1…OF-8** and stage-H board filing — neither of which this evaluator pass performs.

## Notes

- **Seed-run interpretation (commit-slices item):** The plan-gate's "each names what it proves, the gate that proves it, and the files it touches" clause is literal for implementation-bound plans. For a seed run whose deliverable is a fileable board, the accepted convention (stated in `plan.md` §5) is that this metadata lives in the issue body authored at filing. The evaluator accepts the 29-card dependency-ordered table as the slicing artifact under this interpretation; if the implementer's PLAN-EVAL were to apply on a future code-bound run, the per-card gate/file enumeration would be re-checked against the filed issue bodies.
- **Load-bearing spot-verification performed:** `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts` (8 canonical ops confirmed), `packages/cli/src/kernel/domain/deploy/deploy-target-registry-port.ts` (registry port confirmed), `packages/config/src/domain/schemas/deploy-schema.ts` (config deploy schema present), `plugins/auth/` (auth composition pattern confirmed as the mirror template).
- **Hardening trail integrity:** `adversarial-sol-triage.md` (16/16), `doc-story-kimi-triage.md` (13/13), `adversarial-sol-r4-triage.md` (9/9) — all triages present, all findings accepted, all integrated in r5 per drift D-8.
- **No code was evaluated** (this is PLAN-EVAL, not IMPL-EVAL). No implementation slices exist yet.
