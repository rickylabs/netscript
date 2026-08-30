use harness

## SKILL

- netscript-harness — run lifecycle, slice review gate, evaluator separation (you never
  self-certify).
- netscript-doctrine — `packages/mcp`, `packages/telemetry` are framework code; `quality:scan` +
  `arch:check` per slice; no `any`/casts/lint-ignores.
- netscript-tools — scoped wrappers, receipts, `check:mcp-export-corpus`.
- netscript-pr — draft PR, labels, `Closes`, commit-trail comments.
- aspire — Aspire facts; **no AppHost start, no host CLI change, no dashboard capture** (no runtime
  lease in this phase).

## Context

You are the GPT-5.6 Sol implementation agent for **S3 of the Aspire 13.5 epic** (#1712): **#1715 —
[aspire-13-5 S3] Re-capture 13.5 fixtures: dashboard telemetry, `aspire describe`, `aspire ps`**.
Supervisor: the Fable 5 session.

### Your worktree / branch

- Worktree: `/home/codex/repos/netscript-aspire-13-5-s3` (native ext4; work ONLY here)
- Branch: `test/aspire-13-5-s3-fixture-recapture` (off `origin/main` `13878a80a`; no upstream — push
  only with `git push origin HEAD:refs/heads/test/aspire-13-5-s3-fixture-recapture`)
- Run dir you own: `.llm/runs/test-aspire-13-5-s3-fixture-recapture--impl/` (`supervisor.md` from
  `.llm/harness/templates/supervisor.md`, `worklog.md` with `## Design`, `context-pack.md`,
  `drift.md`).

### Required reading (in order)

1. Issue #1715 (scope, boundaries, acceptance), epic #1712.
2. `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md`
   — D-13 (parity phase 2 asserts a 13.5.3 case beside every kept 13.4.6 `compat-fixture` case), and
   the `compat-fixture` rows of `aspire-surface-manifest.tsv`
   (`.llm/tools/agentic/teardown/probes_test.ts`,
   `packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-evidence_test.ts`,
   `packages/cli/e2e/tests/application/gates/generated-app-endpoint_test.ts`,
   `packages/mcp/tests/service-endpoint-source-fixtures.ts`,
   `packages/mcp/tests/telemetry-live-fixture_test.ts`).
3. S2 receipts on `origin/test/aspire-13-5-s2-runtime-verification` under
   `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/`:
   `02-v5-aspire-ps-final.json`, `02-v5-aspire-describe-final.json`, `02-v5-shape-comparison.md`
   (13.5.3 `ps` adds `logFilePath`; `describe` shape unchanged; sensitive env values redacted),
   `03-v10-doctor*.json`, `03-v11-*.json`. Copy raw JSON with `git show <ref>:<path>` — never
   retype.
4. Current fixtures:
   `packages/mcp/tests/fixtures/telemetry/aspire-13.4.6-{fixture.ts,resources.json,spans.json}`,
   `.llm/tools/agentic/teardown/__fixtures__/aspire-ps-13.4.6.json`, `docker-inspect-13.4.6.json`.

### Known fact — telemetry envelopes are NOT in S2's receipts

S2 captured `aspire ps`/`describe`/doctor/MCP projections, **not** the dashboard
`GET /api/telemetry/spans` and `/api/telemetry/resources` envelopes that back
`aspire-13.4.6-{resources,spans}.json`. Capturing them requires a running 13.5.3 AppHost, which
needs a runtime lease that this phase does not hold. Therefore:

- **Phase A (this dispatch, no lease):** everything that derives from S2 receipts or is structural.
- **Phase B (later, lease-backed, same PR):** the dashboard telemetry fixture; the supervisor will
  resume you with the lease and the capture command. Do not attempt any capture now; do not
  fabricate or hand-edit a 13.5.3 telemetry envelope.

## Slices (commit in order)

1. **Parity grep gate RED.** Add a test (next to
   `.llm/tools/validation/check-aspire-version-parity_test.ts` or a new
   `check-compat-fixtures_test.ts` if the parity tool lacks a phase-2 hook — read it first)
   asserting every `compat-fixture` manifest row has a `13.5.3` case beside its `13.4.6` case;
   commit the RED receipt.
2. **`aspire ps` fixture (teardown).**
   `.llm/tools/agentic/teardown/__fixtures__/aspire-ps-13.5.3.json` from
   `02-v5-aspire-ps-final.json` (redact paths/pids consistently with the 13.4.6 file's conventions);
   teardown/probes tests run against both versions (keep 13.4.6 cases). Fixtures-folder `README.md`
   with capture command, date (2026-08-29), CLI version 13.5.3, and the S2 receipt path.
3. **`aspire describe` + banner fixtures (mcp + cli e2e).**
   `packages/mcp/tests/service-endpoint-source-fixtures.ts`: add the 13.5.3 banner and `describe`
   shape (from `02-v5-aspire-describe-final.json`, redacted); `telemetry-live-fixture_test.ts`,
   `generated-app-endpoint_test.ts:132`, `service-env-evidence_test.ts:65`: add the 13.5.3 case
   beside the kept 13.4.6 case. Fixtures README as in slice 2.
4. **Deferred telemetry arm recorded.** `packages/mcp/tests/fixtures/telemetry/README.md` stating
   the 13.4.6 envelope remains the only captured dashboard fixture, why (no lease in phase A), and
   the exact phase-B capture commands (`GET <dashboardUrl>/api/telemetry/resources` and
   `/api/telemetry/spans` after the health-check worker job, per the 13.4.6 header comment).
   `drift.md` entry (severity minor, action: phase B). Parity grep test must pass with the telemetry
   row satisfied only after phase B — encode that row as `pending-lease` in the test's expectation
   table so the test is green for phase A and RED again when phase B lands the file without updating
   the table.
5. **Gates + `#413` comment text.** Scoped wrappers on `packages/mcp`, `packages/telemetry`,
   `.llm/tools/agentic/teardown`, `packages/cli/e2e` (+ raw fmt/lint on config-excluded files),
   `quality:scan`, `arch:check`, `check:mcp-export-corpus` (exports must not change), unit tests for
   the touched roots. Draft the `#413` comment text in the run dir (supervisor posts it after phase
   B).

## Boundaries

- No adapter behaviour change unless a fixture diff forces it (then a separate commit with its own
  test). No pins, no `packages/fresh`, no skills/docs, no archival rows, no runtime start, no
  dashboard/MCP capture.
- Never remove a public export; never delete a 13.4.6 fixture.

## Draft PR and receipts

- After commit 1: draft PR to `main`, title
  `test(aspire): re-capture 13.5.3 fixtures beside kept 13.4.6 compat cases (S3)`; body per
  `.github/pull_request_template.md`, `## Scope` = `Closes #1715`, `Part of #1712`; labels
  `type:test`, `epic:aspire-13-5`, `area:telemetry`, `area:tooling`, `area:mcp`, `priority:p1`,
  `status:impl`; milestone `0.0.7`. State explicitly that the dashboard telemetry fixture is phase B
  (lease-backed) and the PR stays draft until it lands.
- Push with the explicit refspec after every commit; per-commit PR comment with scope, SHA, gate
  evidence; push lines in `worklog.md`.

## Stop conditions

- Final non-empty line exactly `DONE` (plain text, no table, nothing after) when slices 1–5 are
  pushed, the draft PR carries the commit trail, gates green locally, run-dir artifacts committed.
  You do not mark ready and do not self-certify.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>` (plain text).
