# Drift Log — chore-prod-readiness--cleanup

Append-only. Severity ∈ {minor, significant, architectural}.

## D-G1-1 — "stray root file" directive vs. reality (significant)

- **Observed:** Handover §3.1's named stray root file `agents-handover.md` does not exist. The
  nearest real file, `AGENTS-handoff.md`, is **load-bearing** — cited by
  `.agents|.claude/skills/openhands-handoff/SKILL.md` (lines 44, 87) and
  `.llm/harness/workflow/agent-handoff.md:26` as the canonical OpenHands trigger protocol.
- **Impact:** Following the directive literally would have deleted a referenced doc and broken the
  `openhands-handoff` skill + harness-workflow references.
- **Resolution (user-directed 2026-06-18 — "if it's still valid then it should be a skill not a root
  .MD file"):** Relocate `AGENTS-handoff.md` content into the canonical
  `.agents/skills/openhands-handoff/SKILL.md`, re-point the 3 refs, delete the root file, regenerate
  the `.claude/skills/` mirror, `validate-claude-surface.ts` green. Atomic **Slice G1-0**; locked as
  plan **PR-4**. Supervisor `scorecard.md`/`phase-registry.md` phantom example corrected.
- **Status:** RESOLVED into plan (slice pending implementation).

## D-G1-2 — internal shim removals with live consumers (minor)

- **Observed:** The G1-2 consumer scan found two planned internal shim removals still have live
  consumers:
  - `packages/cli/src/kernel/constants/windows.ts:232` `V8_HEAP_MB` is imported by
    `packages/cli/src/kernel/adapters/windows/runtime/v8-profiles.ts:12` and read at lines 46 and
    73.
  - `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:252` `updatePluginRegistry` is
    still exercised by `packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts:219`.
- **Impact:** The hard consumer-scan rule does not authorize removing those symbols in G1-2 without
  expanding scope into test/consumer rewrites.
- **Resolution:** Removed only the zero-consumer G1-2 targets (`telemetry/src/context/job.ts` and
  seven deprecated `windows.ts` aliases). Deferred `V8_HEAP_MB` and `updatePluginRegistry` for a
  later cleanup/refactor slice.
- **Status:** Deferred; no functional change in this run.

## D-G1-3a — database doc-lint pre-existing failures (minor)

- **Observed:** After removing the deprecated `buildConnectionString` alias,
  `deno doc --lint packages/database/mod.ts` failed on pre-existing public-surface lint issues:
  `PostgresAdapter.prototype.getDriverAdapter` references `PostgresDriverAdapter`, and the still
  present `mssqlJsonExtension` references private extension types.
- **Impact:** The G1-3a alias removal did not introduce these diagnostics, and fixing them would
  require widening this subtractive slice into unrelated public-surface additions/signature changes.
- **Resolution:** Recorded the doc-lint failure as drift. The slice still ran the scoped database
  check, database tests, full `publish:dry-run`, and `scaffold.runtime` smoke; all passed.
- **Status:** Deferred to the relevant database public-surface cleanup.
