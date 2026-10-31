# Plan & Design — READY FOR REVIEW

Archetypes: 5 (streams integration), 2 (Aspire contract), 6 (generated AppHost); service/docs overlays.

## Locked decisions

1. Keep default ephemeral. Explicit `NetScript.Plugins.streams.DataDirectories` maps
   `STREAMS_DATA_DIR` to a persistent directory path. Omit the mapping for the current default.
   This is a core-owned declarative resource primitive; the CLI must not recognize plugin names.
2. The streams Aspire contribution accepts optional `dataDir`, emits the same directory declaration
   and STREAMS_DATA_DIR environment binding. The generated AppHost consumes DataDirectories through
   generic registration: resolve relative paths from the resource workdir, recursively mkdir, then
   withEnvironment(key, absolutePath) before starting. Directory bindings win conflicting literals.
   No Deno I/O at contribution import/registration time; the AppHost owns filesystem provisioning.
3. Missing parent directories are created only for this opt-in. Empty/invalid declarations fail
   config validation. A file at the target or permissions failure aborts AppHost composition. Existing
   Environment.STREAMS_DATA_DIR remains a manually provisioned opt-in with unchanged fail-closed rules.
4. Prove generated helper execution, config roundtrip and default off. Before runtime start, a new
   `runtime.streams-storage-fixture` gate keeps a copy of the pristine streams config as
   `streams-ephemeral-control` and adds DataDirectories.STREAMS_DATA_DIR to the original `streams`.
   It regenerates Aspire helpers with the same local/published CLI source used by the suite.
   Thus there is one AppHost start with both modes; resource restart never pretends to reconfigure it.
   The service directory is NOT created by the fixture: only the generated AppHost may create it.
5. A new `behavior.streams-storage-restart` gate in both scaffold.runtime tiers checks the generated
   ephemeral control health (memory/durable:false), file health (file/durable:true/probe:passed),
   provisions a real producer document and tombstone, requires nonempty exact HTTP reads, subscribes
   to streams updates, executes `aspire resource streams restart`, waits for the new healthy process,
   and requires identical HTTP history after restart. It uses the exact logical name `streams`.
6. CI: `e2e-cli` (armed by coordinator e2e-cli-gate) executes both fixture and restart gates in the
   one-pass scaffold.runtime suite. Do not run that full suite locally. A focused generated-project
   AppHost with just streams and its ephemeral control may run locally to exercise this one gate.
   Negative controls: execute on/off contribution and generated helper tests with directory wiring
   reverted; execute restart-gate evaluator tests with memory file-health, empty/changed before/after
   reads and failed restart evidence. In the focused Aspire proof also remove the emitted directory
   provisioning/binding, restart the AppHost, and require failure; retain the red result. An unrun
   runtime/CI acceptance remains unchecked in READY; never mark it passing from synthetic evidence.

## Open-decision sweep

Resolved: core directory map rather than hardcoded plugin detection; project resource workdir base;
config map as explicit scaffold/plugin option; startup provisioning rather than service auto-mkdir.
Safe to defer: default-durable policy (#2114), migration, power-loss durability, multiwriter storage,
backups/compaction and substrate replacement. No unresolved decision blocks implementation.

## Slices and gates

0. This research/plan/design bootstrap; commit and open draft PR.
1. Core directory declaration/schema, streams contribution option, generated AppHost provisioning,
   on/off/failure/config/runtime tests, docs and generated-project Aspire restart acceptance. Run
   structured focused test/check/lint/fmt, quality scan + architecture scan, plugin verification,
   JSR audit/doc-lint, existing real producer storage restart, generated-helper execution and
   meaningful negative controls. Independent review before slice signoff, commit and push.
2. Review/CI remediation only if necessary, with evidence and context in the same commit. Mark ready
   after no-blocker implementation review; final same-session evaluator reviews exact pushed head.

## Risks and mitigation

- Node AppHost cannot consume Deno-only APIs: emitted setup uses node:fs/path and a typed compat seam.
- Relative paths or env collisions: execute generated registration tests with a nontrivial workdir
  and assert directory exists and exact absolute environment before any process starts.
- False-positive restart proof: compare nonempty documents read through HTTP before/after exact
  Aspire resource restart, check file health, and retain failure when opt-in wiring is reverted.
- Shared-host runtime contention: do not run local scaffold.runtime; CI owns expensive acceptance.
- Legacy producer-loss finding: run actual producer against current-main file mode; report observed
  outcome, not an assumed resolution from epochs work.

No new architecture debt intended. Retain inherited substrate limits and truthful claims.
