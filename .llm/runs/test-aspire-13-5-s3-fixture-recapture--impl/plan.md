# Plan: Aspire 13.5 S3 fixture re-capture, phase A

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-aspire-13-5-s3-fixture-recapture--impl` |
| Branch | `test/aspire-13-5-s3-fixture-recapture` |
| Phase | `plan` |
| Target | `packages/mcp`, `packages/telemetry`, CLI E2E, teardown tooling |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Archetype

Archetype 2 is the smallest fit: the affected package cases protect Aspire CLI/dashboard adapter
boundaries. This run changes fixtures and tests only; it does not alter integration behavior or a
public package surface.

## Current Doctrine Verdict

- `packages/mcp`: Keep — keep MCP transports behind token-bounded tool contracts.
- `packages/telemetry`: Keep — preserve the OpenTelemetry adapter subpaths.
- Existing package debt is neither deepened nor closed by fixture-only work.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | The retained 13.4.6 and added 13.5.3 cases make compatibility explicit. |
| A8 | Version-suffixed fixtures and folder READMEs keep capture provenance local. |
| A14 | The parity grep and scoped tests preserve the adapter contract. |

## Goal

Land all phase-A 13.5.3 compat cases derivable from S2, record the lease-backed telemetry deferral,
and leave a green draft PR ready for the Fable supervisor to resume for phase B.

## Scope

- Add a RED compat-fixture parity test with an explicit `pending-lease` telemetry arm.
- Add a redacted 13.5.3 `aspire ps` fixture and run teardown probes against both versions.
- Add 13.5.3 banner/describe cases beside all kept 13.4.6 cases.
- Document capture provenance and the exact deferred dashboard commands.
- Run the prescribed scoped, doctrine, export-corpus, and unit gates.

## Non-Scope

- No AppHost start, Aspire CLI invocation, dashboard/MCP capture, or host/runtime mutation.
- No telemetry envelope fabrication, adapter behavior change, exports, pins, Fresh changes, skills,
  or archival-row edits.
- No deletion of any 13.4.6 fixture.

## Hidden Scope

- Each slice updates `worklog.md` and `context-pack.md`, pushes by explicit refspec, and receives a
  draft-PR commit-trail comment.
- The final `#413` comment is drafted locally; the supervisor posts it only after phase B.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| S3-D1 | The parity expectation table is the five-row D-13 manifest set. | Current main lacks a phase-2 hook; the issue explicitly permits a new test. |
| S3-D2 | `pending-lease` asserts the telemetry row still lacks 13.5.3. | Phase B landing makes the test RED until its state is deliberately promoted. |
| S3-D3 | Fixture values come only from S2 raw JSON, then receive deterministic redaction. | Prevents invented Aspire shapes and sensitive/path leakage. |
| S3-D4 | `PLAN-EVAL: N/A`. | Ratified issue, D-13, slices, boundaries, receipts, and gates fully determine this mechanical change. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Dashboard telemetry payload | safe to defer | Phase B is lease-backed and explicitly outside this dispatch. |
| Adapter behavior | safe to defer | Change only if the later captured envelope forces it, in a separate tested commit. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Hand-authored fixture drift | Copy S2 JSON evidence and document its receipt path. |
| Accidental secret/path retention | Use stable placeholders and verify no S2 worktree/home path remains. |
| False phase-A green after telemetry capture | `pending-lease` fails if 13.5.3 appears before table promotion. |
| Public-surface drift | `check:mcp-export-corpus`; do not regenerate. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep fixture/parity helpers small and test-local. |
| AP-16 | risk | Use role-named fixture documentation, not generic helper folders. |
| AP-25 | risk | No runtime side effects; tests consume checked-in evidence only. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-3/F-5/F-10/F-19 | yes | `arch:check`, export-corpus invariant, scoped tests/wrappers. |
| F-6/F-7 | surface invariant | No exports/docs publish surface changed; export corpus stays exact. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing MCP/telemetry entries | none | Fixture-only changes do not deepen or close them. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED parity | structured test wrapper on `check-compat-fixtures_test.ts` | FAIL before fixture slices |
| 2 | Slice tests | structured test wrappers for touched tests | PASS after each owning slice |
| 3 | Static | scoped check/lint/fmt wrappers on all touched roots | PASS |
| 4 | Doctrine | `quality:scan`, `arch:check` | PASS |
| 5 | Consumer/export | `check:mcp-export-corpus` | PASS with no regeneration |

## Dependencies

- S2 committed receipts, read via `git show` from the named remote branch.
- Phase B runtime lease and capture command supplied later by the supervisor.

## Drift Watch

- Any telemetry capture request during phase A, describe/ps shape difference from S2, adapter change,
  public export change, or required runtime start is drift and must stop or be recorded.
