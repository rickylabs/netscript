# Drift Log: plugin doctor registry/source drift

Drift is append-only. The original six-path ceiling was superseded by the S6 24-path ceiling after a
blocking evaluator finding. Any product/test path beyond the current ceiling in `plan.md` requires
supervisor approval before editing.

## 2026-08-30 — Current streams plugin has no registry contract

- **What:** Issue #1673 names stream definitions in the generic target contract, but current
  `plugins/streams` has no `scaffold.runtime.json`, generated stream registry, or runtime loader for
  such a registry.
- **Source:** `find plugins/streams -name scaffold.runtime.json`; repository search for
  `streams.registry.ts`; comparison with saga/worker/trigger manifests.
- **Expected:** Every named durable definition kind would have a generated registry contract.
- **Actual:** Manifest-backed generation currently covers sagas, worker jobs, triggers, and AI
  resources; streams are not a registry-backed surface.
- **Severity:** minor
- **Action:** accept for this bounded CLI slice. Doctor wording will state the exact manifest-backed
  targets verified. Creating a streams registry would be significant rescope and is not attempted.
- **Evidence:** `research.md` findings 2–3 and exact path ceiling.

## 2026-08-30 — Generator selection is broader than the original manifest-only plan

- **What:** IMPL-EVAL cycle 1 proved that a runtime manifest can describe candidate files without
  expressing the generator's actual definition selection. The old six-path plan therefore produces
  an untrue AI error and cannot contain an honest fix.
- **Source:** evaluator F1/F4; `plugins/ai/src/cli/ai-registry-compiler.ts`;
  `plugins/workers/src/cli/runtime-registry-generator.ts`; four first-party generator entrypoints and
  manifests.
- **Expected:** Doctor's expected source set is the same set the generator would register now.
- **Actual:** Doctor walks suffix/exclude candidates; AI adds a source-shape predicate and workers adds
  profile/include/conditional/dotfile policy.
- **Severity:** significant.
- **Action:** stop implementation, supersede original D1/D6, expand to the exact 24 paths in the S6
  plan, select an opt-in generator-owned no-write report, require red-before AI coverage, and wait
  for separate PLAN-EVAL approval.
- **F4:** closes in the planned repair; workers must report its full selected set rather than leave the
  divergence knowingly latent.
- **Evidence:** S6 section of `research.md`; D1R–D9R and ceiling/gates in `plan.md`.
