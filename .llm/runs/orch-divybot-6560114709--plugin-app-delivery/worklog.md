# Worklog

## Design

1. Public surface: plugin install links web apps automatically or through --app, produces runtime
   registries, and AppHost forwards linked endpoints. Doctor explains unsupported remote Docker.
2. Vocabulary: consumer app, plugin resource key, companion API, installed registry producer.
3. Ports: FileSystemPort, ProcessPort, GenerateInstalledPluginRegistries; Aspire endpoint references.
4. Constants: use SCAFFOLD_FILES, existing registry paths, installed version metadata; introduce no
   host-side plugin-name dispatch.
5. Commit slices: bootstrap; delivery plus tests and generated carriers; independent review evidence.
   See plan.md for gates and touched surfaces.
6. Deferred: remote-network relays, auth changes, dependency/version changes, UI redesign, merging.
7. Contributor path: packages/cli/src/kernel/adapters/plugin/plugin-reference-reconciler.ts.

## Routing and owner override

The feature matrix selects sol/xhigh implementation, muse_spark_1_3/xhigh then opus_5/xhigh
implementation evaluation. Owner instruction overrides evaluation verbatim:
“IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.”
Generator/evaluator remain separate sessions and vendor families.

## Bootstrap

Read the complete assignment and issue body/comments. No orchid-triage comment or matching PR exists.
Baseline is the issue's reported main commit. Deno 2.9.7 is installed. RTK is unavailable; use
focused commands and structured gate wrappers. Consulted existing project memory, including
carrier ordering, CLI scope exclusions and remote-Docker history.

Reconcile: issue remains open; scoped draft PR pending bootstrap commit.

## Delivery validation

- Documented local-source workers and streams installs add `workers-api` and `streams` to the
  selected app and produce the worker registry immediately. The install regression also verifies
  `--app`, unknown/disabled/non-web consumers, headless planning, dry-run preservation, subsequent
  reconciliation and in-process AI without a dangling API reference.
- Expanded structured test run: 809 passed, zero failures. Follow-up consumer regression: six
  passed, zero failures, including the added dry-run and in-process AI assertions.
- All 15 root `check:*` tasks passed on Deno 2.9.7, including the four generated carrier checks.
- `quality:gate`, `release:preflight`, `docs:accuracy`, scoped lint and JSR audits passed.
  JSR audits report existing slow-type/cardinality warnings; no new public package export.
- The first full type-check found the new producer field missing in the composition dependency
  shape. Fixed that type and started a fresh structured full check plus targeted composition check.
- Generated carriers refreshed using the native tasks. Export corpus writer's documented
  `--allow-dirty` option was used before review; the subsequent check passed.
- Runtime acceptance extends `behavior.app-home` in `scaffold.runtime`: the actual HTML must contain
  workers and streams panels with state `ready`. Negative controls reject unlinked/unavailable/
  empty/absent states and markers split across elements. Existing missing-registry controls now
  remove their test-owned outputs explicitly before doctor, because install creates them.

Reconcile: PR #2582 remains draft; no labels or closing keywords; implementation is staged for
independent review. No lockfile changes. Docker runtime CI is still unproven pending dispatch.

- Fresh full structured type-check passed: 4,142 source files, 35 batches, zero findings.
  Targeted composition check also passed. Repeated quality:gate has a durable PASS receipt.
- Bounded existing install size/cardinality increase is recorded as
  CLI-PLUGIN-INSTALL-DELIVERY-SIZE in the architecture debt registry.
- Local `deno task e2e:cli run scaffold.plugins --cleanup --format pretty`: 18 passed, zero
  failures or skips. This narrower gate does not certify Docker runtime behavior.
- Read-only leak check found 34 processes with unproven ownership and no run-started resident
  runtime. All were left untouched. Docker inspection is unavailable; absence of containers
  remains unproven. Public leak-report.md carries only the verdict, with raw evidence kept private.

## Independent evaluation repair

Round 1: FAIL_FIX. The reviewer identified update losing persisted app scope and inadequate
workers-specific proof of local doctor remediation. Both are repaired before the same-session
recheck:

- App consumer selection now reads installed metadata during planning, before a scaffolder can
  overwrite it. Explicit --app wins; existing installed scope (including an empty list) wins over
  new package defaults and automatic web-app selection. Staged update regressions prove the scope
  survives even when the scaffolder overwrites its manifest.
- Doctor prefers the real CLI adjacent to its file-backed source package and includes an explicit
  project root. A fresh-project regression removes its generated worker registry, verifies the
  workers-specific doctor line chooses the real local CLI, and executes the corresponding repair.
  Copied local CLI candidates and installed-version JSR fallback remain supported.
- The missing-registry E2E control once again requires the workers-specific check/message, so an
  unrelated generic registry-drift message cannot satisfy it.
- Repair regressions: 26 passed, zero failures. Repeated scaffold.plugins: 18 passed, zero failures.
  Release preflight passes. The generated export corpus remains identical after source changes.

Reconcile: source remains on the same assigned branch; origin/main is unchanged at the baseline.
No labels, rebase, force push, runtime-resource mutation, or lockfile changes.

## Reviewed implementation sign-off

Separate Claude Opus 5.5 review using the requested high effort returned PASS on round 2;
see evaluate.md. No further implementation edits followed that verdict.

Final local proof: 825 focused tests passed; all 4,142 files passed the structured type-check;
quality:gate, scoped lint/format, release preflight and repeated static scaffold suite passed.
All generated documentation/scaffold carrier checks are included in the final check-task sweep.
The runtime overview proof still awaits the one-pass Docker CI workflow; no runtime PASS is claimed.

## CI repair slice

At implementation commit da43b74, CI quality and full type-check passed. Four test shards exposed
stale generated-output expectations. Each failure was read from its structured uploaded report:

- test-3: webhook adoption used the negative doctor fixture as a read-only query. Prepare the
  missing-registry state once, then compare read-only doctor results before/after adoption.
- test-4: auth helper assertions expected a literal endpoint string and the app probe argv omitted
  the new workers/streams assertions. Keep the persisted auth edge and assert live-loop injection.
- test-5: assert the new explicit remote Docker wording and supply the workers-specific missing
  registry output in the suite-runner recording executor.
- test-6: a global regex treated valid nested-loop endpoint/vite locals as duplicate bindings.
  Record those legal repeated names while preserving the actual generated-module type-check;
  add the existing app reference fields to that fixture's SDK/config declaration.

Both Docker runtime tiers failed generated.quality-negative after 42 passing gates because the
baseline templates emitted literal true/false ternaries. The writer now selects hrefs and card
entries at generation time. New real scaffolds with and without a service pass example-route lint.
The runtime proof remains unproven until a complete one-pass CI run succeeds.

Individual repaired regression groups passed: webhook adoption 4, auth/probe 51, template/Docker/
runner 48, and readiness splice 6. Full combined regression and structured check are running;
quality:gate passed after these changes. No lockfile changes or gate suppressions.

CI repair sign-off: the same independent reviewer returned PASS and explicitly classified the
changed expectations as stale, with meaningful checks preserved (evaluate-ci-repair.md).
Combined repair regressions: 109 passed. Full structured check and quality:gate passed. All 15
root check:* tasks passed again, including the four carriers. Generated full-project lint passed
with and without a service. No source changes followed this sign-off. Commit/push and re-dispatch
the full Docker runtime workflow at the new head; previous runtime attempts remain failed.
