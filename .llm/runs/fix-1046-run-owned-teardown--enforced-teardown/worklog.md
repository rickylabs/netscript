# Worklog: #1046 run-owned teardown

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1046-run-owned-teardown--enforced-teardown` |
| Branch | `fix/1046-run-owned-teardown` |
| Archetype | `6 — CLI / tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- `classify(...)` — pure, three-valued resource ownership classification.
- `readRunResources(...)` / `writeRunResources(...)` / registration helpers — schema-versioned,
  atomic run registry.
- `probeResources(...)` — bounded, read-only Aspire and Docker discovery behind command ports.
- `buildLeakReport(...)` / `runLeakCheck(...)` — read-only JSON and Markdown leak reporting.
- `runTeardown(...)` — dry-run-by-default, owned-only scoped teardown.
- `enforceTeardown(...)` — pure terminal-contract downgrade for owned survivors.
- `agentic:leak-check`, `agentic:teardown`, `agentic:dogfood-skills` — operator task surface.

### Domain Vocabulary

- `Ownership = 'owned' | 'foreign' | 'unproven'` — total authorization result.
- `ResourceCandidate` — normalized AppHost or container evidence.
- `RunResourceRegistry` — schema-versioned identities created by one run.
- `LeakEntry` / `LeakReport` — surviving resource, attribution, age, and exact remediation command.
- `CommandPort` / `FilePort` — bounded external-process and filesystem seams used by probes/tests.

### Ports

- Command execution port — keeps unit tests from invoking Aspire or Docker.
- Path resolution port — makes realpath containment deterministic and fail-closed.
- Clock port — makes age/staleness and registry timestamps deterministic.

### Constants

- `RUN_RESOURCES_SCHEMA_VERSION = 1`.
- `STALE_AFTER_MS = 2 * 60 * 60 * 1000`.
- Aspire `com.microsoft.developer.usvc-dev.*` label keys.
- Per-resource command builders for Aspire stop and Docker remove.

### Commit Slices

The authoritative 11-slice table is in `plan.md` § Commit slices. Implementation follows it in
order; every slice updates this worklog and `context-pack.md`, runs its named focused gate, pushes
with the explicit branch refspec, and records a PR comment.

### Deferred Scope

- First-party container run-id labels — Aspire exposes no creation-time injection hook on this base.
- Cross-machine/CI-runner discovery — local shared-host enforcement is the approved scope.
- Editing `skills/**` — owned by PR #1034; this slice only dogfoods the generated consumer bundle.

### Contributor Path

Start at `.llm/tools/agentic/teardown/ownership.ts` for the authorization invariant, then follow
`probes.ts` → `leak-check.ts` → `teardown.ts`. Add a fixture and classification test before adding a
new resource shape. Terminal enforcement is isolated in `run-codex-slice-lib.ts`.

## Progress Log

| Date | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-02 | 1 | Design checkpoint | PLAN-EVAL already passed under the explicit owner waiver; mandatory resumability artifacts completed before implementation. |
| 2026-08-02 | 2 | Ownership proof | Red test first (missing module), then five fail-closed ownership tests passed with wrapper check. Reconcile: PR #1047 remains draft; no new review comments changed scope. |
| 2026-08-02 | 3 | Run registry | Schema v1 registry uses same-directory temp+rename and identity-pair deduplication. Reconcile: issue/PR scope unchanged. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Only positive proof authorizes action | Concurrent sibling worktrees make name/PID inference destructive | `plan.md` D1–D3 |
| MCP exclusion is structural | AppHosts come only from `aspire ps`; stop is only per `--apphost` | `plan.md` D4 |
| Only owned survivors block DONE | A run cannot fail because a sibling owns a resource | `plan.md` D5 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Bootstrap commit omitted mandatory worklog/context-pack/drift artifacts | minor | yes |

## Gate Results

Gate results are appended per slice. `quality:scan`, `arch:check`, and `jsr-audit` are N/A because
this run changes no `packages/**` or `plugins/**` source.

| Slice | Gate | Result | Evidence |
| --- | --- | --- | --- |
| 2 | scoped check + ownership tests | PASS | wrapper: 2 files, 0 findings; `deno test`: 5 passed, 0 failed |
| 3 | scoped check + registry tests | PASS | wrapper: 4 files, 0 findings; `deno test`: 3 passed, 0 failed |

## Handoff Notes

- Review the fail-closed ownership tests and the DONE-to-BLOCKED enforcement test first.
- Confirm no diff path under `skills/**` or `.claude/skills/**` is present.
