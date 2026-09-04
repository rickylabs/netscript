# PLAN-EVAL — chore-revamp-agent-model-routing--model-matrix

- Plan evaluator session: 2026-09-04 OpenCode; brief requested Muse Spark 1.3 max; observed runtime
  identity `openrouter/x-ai/grok-4.6`
- Run: `chore-revamp-agent-model-routing--model-matrix`
- Plan head: `5a3e144fe` only
- Surface / archetype: harness and agentic tooling / `6 - CLI / Tooling` (internal tooling, not a
  published Arch-6 package)
- Scope overlays: docs

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` exists; re-baselined to `origin/main` `@ a2d7f5f6f` (2026-09-04). Spot-check of finding 4: `opencode/opencode-run.ts:61-66` always calls `environmentWithOpenRouterApiKey`. Findings 1–3 and 6 also match `routing-policy.ts`, `config/models.ts`, and `contract.ts` `PROVIDER_KINDS`. |
| Decisions locked                        | FAIL   | Locked decision 4 (`plan.md` Cross-family is exhaustive) treats every generator×evaluator fallback pair as a construction error. That cannot encode the owner matrix. Locked decision 5 names per-tier round/repair/notify policy as data but never states the values.                               |
| Open-decision sweep                     | FAIL   | Evaluator sweep found rework-forcing gaps the plan did not flag, and one it resolved the wrong way (cartesian exclusion vs owner “compose with fallback”).                                                                                                                                           |
| Commit slices (< 30, gate + files each) | PASS   | S1–S5 in `plan.md`; each names files and proving gate.                                                                                                                                                                                                                                               |
| Risk register                           | PASS   | `plan.md` Risk register.                                                                                                                                                                                                                                                                             |
| Gate set selected                       | PASS   | `plan.md` Gate plan plus Archetype-gate applicability: package F-CLI/JSR/publish/consumer/release `N/A` with reason; wrappers, SSOT, parity, credential, and expense tests cover the internal surface. Docs overlay is S4 parity.                                                                    |
| Deferred scope explicit                 | PASS   | `plan.md` Non-goals.                                                                                                                                                                                                                                                                                 |
| jsr-audit surface scan (pkg/plugin)     | N/A    | Internal `.llm/tools/agentic/**` only; no `packages/**` or `plugins/**` export.                                                                                                                                                                                                                      |

## Open-decision sweep (evaluator-run)

These force S1/S2/S4 rework if deferred. The owner matrix at
`/home/agent/tmp/Harness Agents models matrix.md` is the source; `research.md` compressed it and
dropped load-bearing policy.

1. **Generator/evaluator pairing (wrongly locked).** Owner rule: never let the same family do impl
   and eval; _compose with fallback to avoid those situations_. Plan decision 4 and the sweep row
   “Can a fallback evaluator share family with any generator fallback? No; all cross-products are
   rejected.” make illegal, at construction, cells the owner declared on purpose, including:
   - feature/fix PLAN-EVAL fallback `Fable 5.1 low` × plan primary `Fable 5.1 low`
   - straightforward IMPL-EVAL primary `GLM 5.3 Flash` × implementer fallback `GLM 5.3 Flash`
   - complex/architecture PLAN-EVAL primary Muse Spark × plan fallback Muse Spark Cartesian
     exclusion cannot ship S1 against the ratified matrix.
2. **Family granularity is unlocked.** Current `MODEL_FAMILIES` is
   `anthropic | openai | google | open | other` (`runtime/routing-policy.ts`). Lumping
   Grok/Muse/GLM/Qwen/DeepSeek/MiniMax as `open` would also reject legal owner pairs. Vendor-level
   family per logical model must be locked in the catalog.
3. **Per-tier evaluation policy values are missing** from both the research table and the plan,
   despite decision 5 and research calling them machine contract. Owner cells:
   - straightforward PLAN-EVAL: no roundtrip; evaluator in-place fix unless complete rejection or
     human eval
   - feature PLAN-EVAL: max 2; on second, inflight repair unless complete rejection or human eval
   - complex PLAN-EVAL: max 3; on third, inflight repair unless complete rejection or human eval
   - architecture PLAN-EVAL: max 1; second failure escalates to human
   - straightforward/feature/complex IMPL-EVAL: max 5, notify after 3
   - architecture IMPL-EVAL: max 3, notify after 2 (only this line appears in the gate plan)
   - always re-steer the same evaluator each iteration
   - documentation writer uses IMPL-EVAL policy except roundtrip max 2 Simple IMPL-EVAL has no owner
     round-limit note; lock that as unspecified-in-source rather than inventing one.
4. **Legacy lane aliases are named but not mapped.** S2 calls old lane names input-compatibility
   aliases and requires no silent drift, but there is no old-lane → workload-tier/role table (or an
   explicit fail-closed alternative).

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **Decisions locked / pairing invariant** — Replace locked decision 4 and the matching
   open-decision row. Construction proves _coverage_: every generator candidate has at least one
   opposite-family evaluator candidate by composing fallbacks. A declared fallback may share family
   with a generator candidate; selecting that pair is a runtime skip, not a module construction
   error. Separate sessions stay mandatory. Lock vendor-level `ModelFamily` on each logical model
   (do not reuse the five-bucket `open` lump).
2. **Open-decision sweep / evaluation policy** — Copy the owner per-tier max rounds, notify-after,
   inflight-repair, same-agent re-steer, architecture human-escalate, and documentation max-2
   overlay into the locked matrix in `plan.md` (restore them in `research.md` too). Do not invent
   simple-tier IMPL-EVAL rounds the owner omitted.
3. **Open-decision sweep / legacy lanes** — Add an explicit old `ROUTING_LANES` → new
   workload-tier/role alias table, or state that old lane names are deserialize-only and fail closed
   for new selection.

## Notes

- Owner 2026-09-04 matrix supersedes lane-policy / plan-protocol model examples, as the brief
  required. This verdict does not apply those old Fable/Sol evaluator examples.
- Spot-check finding 4 is load-bearing and true: paid OpenCode dispatch still always loads
  OpenRouter credentials.
- Slices, risks, deferred scope, and internal-tooling gate N/A are sound. Do not start S1 until the
  three fixes are in the plan.
