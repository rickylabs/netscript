# Worklog: #1046 run-owned teardown

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `fix-1046-run-owned-teardown--enforced-teardown` |
| Branch         | `fix/1046-run-owned-teardown`                    |
| Archetype      | `6 — CLI / tooling`                              |
| Scope overlays | `docs`                                           |

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

| Date       | Slice | Step                    | Notes                                                                                                                                                                                              |
| ---------- | ----- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-02 | 1     | Design checkpoint       | PLAN-EVAL already passed under the explicit owner waiver; mandatory resumability artifacts completed before implementation.                                                                        |
| 2026-08-02 | 2     | Ownership proof         | Red test first (missing module), then five fail-closed ownership tests passed with wrapper check. Reconcile: PR #1047 remains draft; no new review comments changed scope.                         |
| 2026-08-02 | 3     | Run registry            | Schema v1 registry uses same-directory temp+rename and identity-pair deduplication. Reconcile: issue/PR scope unchanged.                                                                           |
| 2026-08-02 | 4     | Read-only probes        | Aspire 13.4.6 and Docker label fixtures normalize through bounded ports; malformed mounts expose no path proof. Reconcile: no scope changes.                                                       |
| 2026-08-02 | 5     | Leak reporter           | Read-only host run reported one foreign `fix-1025` Postgres container and performed no mutation. Reconcile: no review/scope changes.                                                               |
| 2026-08-02 | 6     | Scoped teardown         | Dry-run executes nothing; apply stops per AppHost path and re-inspects each single container before removal. Repo-wide forbidden-command test passes. Reconcile: no scope changes.                 |
| 2026-08-02 | 7     | Task surface            | Both `agentic:` tasks execute end-to-end; teardown remained dry-run and escalated a foreign `fix-1018` container. Reconcile: PR remains draft.                                                     |
| 2026-08-02 | 8     | Terminal enforcement    | DONE checks leaks, attempts one scoped teardown, re-checks, then blocks on owned survivors only. Reconcile: acceptance-critical behavior is directly tested.                                       |
| 2026-08-02 | 9     | E2E leak origin         | Cleanup now defaults on; `--no-cleanup` preserves registry capture and prints the per-AppHost escalation command. Reconcile: no plan drift.                                                        |
| 2026-08-02 | 10    | Dogfood/discoverability | Local CLI installed its current three-skill bundle; PR #1034's `aspire`/`deno`/`help.md` are absent, so acceptance box 5 remains unticked. Symptoms now route from all approved internal surfaces. |
| 2026-08-02 | 11    | Final gate handoff      | Wrapper check/lint/fmt all green on 17 owned TS files; 25 focused tests passed; Claude mirror check passed. Reconcile: PR/issue acceptance reviewed; box 5 remains the only known gap.             |
| 2026-08-02 | 11    | Supervisor IMPL-EVAL    | PASS under the explicit owner waiver. Close-gate review requires a partial/draft PR without a closing keyword because criterion 5 depends on unmerged #1034.                                       |
| 2026-08-02 | 5R    | Supervisor review fix   | Docker RFC3339Nano `Created` now supplies report-only age when registry time is absent; red-first foreign-stale test passes. Ownership/actionability unchanged.                                    |
| 2026-08-02 | 11R   | Post-merge closeout     | Merged #1034 assets dogfooded as six consumer files; #1048 tracks the exact unsafe Aspire guidance inventory. All post-merge gates pass and acceptance box 5 is evidenced.                          |

## Decisions

| Decision                              | Reason                                                            | Source          |
| ------------------------------------- | ----------------------------------------------------------------- | --------------- |
| Only positive proof authorizes action | Concurrent sibling worktrees make name/PID inference destructive  | `plan.md` D1–D3 |
| MCP exclusion is structural           | AppHosts come only from `aspire ps`; stop is only per `--apphost` | `plan.md` D4    |
| Only owned survivors block DONE       | A run cannot fail because a sibling owns a resource               | `plan.md` D5    |

## Drift

| Drift                                                                   | Severity | Logged in drift.md |
| ----------------------------------------------------------------------- | -------- | ------------------ |
| Bootstrap commit omitted mandatory worklog/context-pack/drift artifacts | minor    | yes                |

## Gate Results

Gate results are appended per slice. `quality:scan`, `arch:check`, and `jsr-audit` are N/A because
this run changes no `packages/**` or `plugins/**` source.

| Slice | Gate                                                 | Result | Evidence                                                                                                             |
| ----- | ---------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| 2     | scoped check + ownership tests                       | PASS   | wrapper: 2 files, 0 findings; `deno test`: 5 passed, 0 failed                                                        |
| 3     | scoped check + registry tests                        | PASS   | wrapper: 4 files, 0 findings; `deno test`: 3 passed, 0 failed                                                        |
| 4     | scoped check + fixture probe tests                   | PASS   | wrapper: 7 files, 0 findings; `deno test`: 2 passed, 0 failed                                                        |
| 5     | scoped check + reporter tests + host read            | PASS   | wrapper: 9 files, 0 findings; tests 2/2; host report names foreign `postgres-bc75ea00` with exact user command       |
| 6     | scoped check + teardown/forbidden tests              | PASS   | wrapper: 12 files, 0 findings; `deno test`: 4 passed, 0 failed                                                       |
| 7     | scoped format + task dogfood                         | PASS   | wrapper: 12 TS files, 0 findings; both task entry points exited 0; supplemental docs/JSON format check passed        |
| 8     | focused wrapper check + contract tests               | PASS   | wrapper: 3 files, 0 findings; `deno test`: 6 passed, including owned→blocked and foreign/unproven→done               |
| 9     | focused wrapper check + option tests                 | PASS   | wrapper: 2 files, 0 findings; `deno test`: 2 passed, 0 failed                                                        |
| 10    | check/lint/fmt + dogfood + sync check                | PASS   | wrapper: 1 script, 0 findings each; consumer install exited 0; `agentic:sync-claude:check` OK; forbidden test passed |
| 11    | final scoped check                                   | PASS   | wrapper selected 17 files; 0 findings                                                                                |
| 11    | final scoped lint                                    | PASS   | wrapper selected 17 files; 0 findings                                                                                |
| 11    | final scoped format                                  | PASS   | wrapper selected 17 files; 0 findings                                                                                |
| 11    | focused tests                                        | PASS   | 25 passed, 0 failed                                                                                                  |
| 11    | `agentic:sync-claude:check`                          | PASS   | 17 skills / 21 mirrored files current                                                                                |
| 11    | `doc:lint`                                           | N/A    | no package export surface; task requires a package `--root`                                                          |
| 11    | `quality:scan` / `arch:check` / `jsr-audit`          | N/A    | no `packages/**` or `plugins/**` source changes                                                                      |
| 5R    | scoped check + reporter/probe tests + live host read | PASS   | wrapper: 12 files, 0 findings; 5 tests passed; live foreign/unproven containers now carry non-null ages              |
| 11R   | post-merge scoped check/lint/fmt                     | PASS   | wrappers selected 17 files; 0 findings in each                                                                       |
| 11R   | post-merge focused tests                             | PASS   | 25 passed, 0 failed                                                                                                   |
| 11R   | `check:assets-barrel`                                | PASS   | regenerated tracked barrels produced no diff                                                                         |
| 11R   | `doc:lint --root packages/cli`                       | PASS   | 3 entrypoints, 0 errors                                                                                               |
| 11R   | dogfood + `agentic:sync-claude:check`                | PASS   | six requested consumer files installed; 17 skills / 21 mirrored files current                                        |

## Handoff Notes

- Review the fail-closed ownership tests and the DONE-to-BLOCKED enforcement test first.
- The `.claude/skills/**` mirror is generated by `agentic:sync-claude`, not hand-edited; no root
  `skills/**` path changed.
