# Plan & Design — READY FOR REVIEW

Issue #2162, B2 / #2474. Doctrine archetype 6 CLI/tooling with archetype 5 plugin seams and
runtime acceptance. Public behavior: install before writing the first definition succeeds;
generate plugins writes importable typed empty registries; doctor warns; runners report ready
with zero definitions when real dependencies are available.

## Locked decisions

- Empty is a valid registry state, not absence. Keep missing, corrupt, stale, and invalid-module
  failures strict. Do not weaken #2161 exclusions or configured worker policy validation.
- Reuse existing per-plugin renderers, shared manifest pipeline and shared drift doctor.
- Keep adapter boolean contracts unchanged; successful empty structure checks are informational,
  with the shared host registry check providing the warning for all three plugins.
- Keep EmptyPluginRegistryError exported for compatibility, with no zero-source throw.
- No runtime lifecycle edits unless focused production startup identifies a real gap.

## Slices and gates

S0: this run's plan and independent PLAN-EVAL; draft PR immediately after bootstrap commit.
S1: installed generator + tests, workers runtime registry renderer + tests, saga/worker adapter
checks + tests, shared doctor + tests, installed integration tests. Prove generation, imports,
nonempty→empty transitions, read-only doctor warning and strict negative controls. Structured
focused tests/check/lint/fmt and quality:gate, independent slice review before commit/push.
S2: README documentation for all three plugins; real --no-samples install/generate/doctor proof
and required isolated production startup tests for all three plugins; run records/lessons. Scoped wrappers, JSR audit
for affected packages, independent implementation evaluation, commit/push and ready transition.

## Risk / mitigation

- Empty can hide corruption: retain existence, completeness and orphan/import drift checks and
  negative controls. Unmarked factories must still fail at runtime import.
- Workers has several registry targets and plugin job directories: render every declared target,
  preserve configured-job mismatch validation and test plugin-only paths.
- Startup health must reflect dependencies: use existing startup APIs and health snapshots;
  no fake ready branch based on definition count.
- Full Aspire runtime acceptance requires CI: no local scaffold.runtime per owner. READY must
  request coordinator's e2e-cli-gate and report Aspire proof unproven until available.

No unresolved implementation decisions. No new architecture debt accepted. Deferred: release,
merge, full runtime CI execution/label ownership, non-registry topology redesign, new doctor
severity API. Contributor entry: installed-runtime-registry-integration_test.ts.

## S3 — CI fixture follow-up

The coordinator armed runtime CI. Static E2E found a stale package-backed doctor assertion
requiring the old "is non-empty" check title. Update only that expectation to "is initialized";
retain healthy status, registry content, declared-job registration and permissions assertions.
Run the actual package-backed fixture, focused wrappers and quality:gate; independent slice
review before commit, then exact-pushed-head evaluation again. No source behavior redesign.

## S4 — CLI check regression expectation

Core CI's last shard found the historical test that requires deleting the last workers registry
after its final source is removed. The approved empty-registry contract requires retaining it.
Replace that expectation with runtime zero-size checks for both maps, explicit output/producer
inventory membership, read-only parity and missing-output negative control. No runtime source
changes. Run the full plugin-check test file, scoped wrappers and quality gate, then independent
slice review, commit/push and renewed final-head evaluation.
