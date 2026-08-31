# Drift Log: plugin doctor registry/source drift

Drift is append-only. The original six-path ceiling was reopened after a blocking evaluator finding;
the coordinator subsequently replaced the first S6 24-path proposal with the ruled scope recorded in
`plan.md`. Any product/test path beyond that current ceiling requires rescope-and-stop before editing.

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

## 2026-08-30 — Coordinator ruling supersedes the first S6 scope proposal

- **Source:** coordinator ruling delivered after plan commit `349d5915`.
- **Previous proposal:** optional reporting was to be adopted by AI, workers, sagas, and triggers
  across 24 paths, with a new CLI parser file; workers F4 would close in this leaf.
- **Ruled scope:** AI alone advertises `inspectionProtocol: 1`. The coordinator enumerated eleven
  authorized product/test paths: the seven retained CLI paths and four AI paths listed in `plan.md`.
  The new `runtime-registry-source-report.ts` is removed; its private schema/parser/validator folds
  into authorized `installed-runtime-registry-generator.ts`, which already owns the `ProcessPort`
  invocation.
- **Deferred:** workers/profile adoption (F4), plus sagas/triggers adoption. The generic protocol is
  deliberately compatible with later workers adoption, but no `plugins/workers/*`,
  `plugins/sagas/*`, or `plugins/triggers/*` path may change here.
- **Process:** the design remains architectural and the separate PLAN-EVAL still blocks S7.

## 2026-08-30 — Flagged integration-test scope interpretation

- **Path:**
  `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts`.
- **Coordinator text:** existing adapter/evidence/doctor/test paths may be amended; separately, a
  real AI `skill-loader` healthy regression and proof of no inspect writes are mandatory.
- **Supervisor interpretation:** this existing test path may be amended and is the natural home
  because it already generates AI registries and proves `skill-loader` exclusion.
- **Status:** retained in the plan on that supervisor reading, while explicitly separated from the
  eleven enumerated paths. PLAN-EVAL or the coordinator may overturn the interpretation before S7.
  Anything else remains rescope-and-stop.

## 2026-08-30 — Runtime environment evidence corrected before implementation

- **Current facts supplied by supervisor:** recreated DinD at `10.4.12.19`, Docker client/server
  28.5.2, empty Docker/Aspire sandbox, and `fs.inotify.max_user_instances=1024`.
- **Correction:** the earlier below-28 warning and expected inotify quota-collision framing are
  withdrawn and are not accepted mitigations. Any runtime failure is a finding to investigate.
- **Gate impact:** `scaffold.runtime` is required but supervisor-coordinated under the singleton
  runtime lease. Its durable evidence is the runner `--report` JSON; cleanup is leak-check followed
  by proven-resource teardown and an Aspire/Docker-zero terminal state.

## 2026-08-30 — Integration-test interpretation overturned by PLAN-EVAL

Interpretation overturned by PLAN-EVAL; the real AI health regression and layer-3 byte snapshot are
relocated to authorized path 6, and `installed-runtime-registry-integration_test.ts` remains untouched.

## 2026-08-30 — AI package doc-lint is baseline-red

- **Planned expectation:** `deno task doc:lint --root plugins/ai --pretty` exits zero in S10.
- **Actual:** head exits `1` with 17 findings: 16 private-type references and one other finding, all
  owned by unchanged public entrypoints or their transitive types.
- **Base proof:** the identical raw command against pinned base `13878a80a` exits `1` with the same
  17 findings, same categories, same entrypoint totals, and same four owning source paths.
- **Impact:** this leaf changes no AI public entrypoint/export or any finding-owning path. Repairing
  the baseline would exceed the exact eleven-path ceiling, so no product edit or rescope is proposed.
  The red is recorded as baseline fitness debt, not presented as a passing leaf verdict.
