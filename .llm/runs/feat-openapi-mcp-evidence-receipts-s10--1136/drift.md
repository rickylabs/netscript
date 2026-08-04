# Drift log — feat-openapi-mcp-evidence-receipts-s10--1136

## 2026-08-04 — milestone PLAN-EVAL composition waiver

- **Severity:** minor / process.
- **Expected by default run loop:** a separate local formal PLAN-EVAL before implementation.
- **Actual:** PLAN-EVAL is composed per `milestone-run.md` (orchestrator waiver); the owner brief
  explicitly cites ruling D6 and requires the plan to lock before same-run implementation.
- **Effect:** `plan-eval.md` records the composed checklist without claiming evaluator PASS.

## 2026-08-04 — pre-existing lockfile change

- **Severity:** none / unrelated workspace state.
- **Observed:** `deno.lock` contains one uncommitted added line before run artifacts or source work.
- **Handling:** preserve it, do not stage it, and verify it remains the only lockfile diff.

## 2026-08-04 — scoped wrapper root-config parsing

- **Severity:** none / tooling invocation.
- **Observed:** scoped lint and format wrapper attempts without `--config` fail while parsing the
  repository root workspace form rather than examining MCP files.
- **Handling:** rerun both with `--config packages/mcp/deno.json`; each scans 103 files with zero
  findings. Only the configured runs are recorded as verdict evidence.

## 2026-08-04 — doctrine reporter baseline false positive

- **Severity:** none / baseline reporter limitation.
- **Observed:** focused doctrine reporting flags A14 in
  `packages/mcp/tests/service-endpoint-sources_test.ts` because its regex sees a local fixture
  function named `describe`; the file uses `Deno.test` and does not contain a Jest global. It also
  reports existing directory-cardinality warnings.
- **Handling:** do not rename unrelated baseline code. Changed-file inspection and the focused
  quality scan show no new ignore, workaround cast, allowance, or doctrine violation.

## 2026-08-04 — JSR audit banner classification

- **Severity:** none / helper parser limitation.
- **Observed:** the audit helper classifies the informational publish output banner `Checking for
  slow types...` as a slow-types warning.
- **Handling:** use the skill-prescribed raw publish dry-run as authority; it succeeds and emits no
  actual slow-type diagnostic. Doc lint also exits zero.

## 2026-08-04 — reviewer-requested documentation reconciliation

- **Severity:** minor / bounded scope addition.
- **Expected by the locked S1 file list:** production refusal guidance, tests, and run artifacts.
- **Observed:** opposite-family review found the hand-authored site reference still described only
  doctor and telemetry receipt producers even though F4a accepts API introspection receipts.
- **Handling:** update `docs/site/reference/mcp/index.md` in S1 so published recovery guidance is
  coherent. The same prose in `packages/mcp/README.md` is embedded in
  `src/publish-assets.generated.ts`; regenerating that asset is explicitly deferred under the
  locked no-generated-asset scope and should be reconciled by its owning documentation slice.
