# Worklog: PR 0A canonical WSL agentic foundation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-epic-574-wsl-agentic-runtime-foundation--pr-0a` |
| Branch | `chore/epic-574-wsl-agentic-runtime-foundation` |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Design

### Public Surface

- `deno task agentic:wsl-foundation doctor [--json]` — read-only structured runtime report.
- `deno task agentic:wsl-foundation bootstrap [--dry-run] [--json]` — idempotent user-local install.
- `deno task agentic:wsl-foundation rollback-plan [--json]` — non-destructive reversal instructions.
- Pure exported parsing/planning functions used by tests and #576 migration.

### Domain Vocabulary

- `RuntimeComponentId` — finite IDs for Node, npm, Deno, Git, Codex, Claude, Gemini, .NET, Aspire,
  Docker, and required local state directories.
- `ProbeStatus` — `ready | missing | outdated | version_skew | auth_required | auth_conflict |
  unavailable`.
- `RuntimeProbe` — component ID, detected version, expected constraint, status, and redacted detail.
- `RuntimeDoctorReport` — schema version, native path proof, component probes, mobile-control probe,
  auth-boundary probes, and overall status.
- `InstallAction` — download, checksum verification, atomic install/symlink, npm stable install,
  directory creation, or PATH update.
- `BootstrapPlan` — ordered actions plus rollback actions; contains no secret values.
- `CommandOutcome` — exit code and bounded/redacted output.

### Ports

- `CommandRunner` — executes bounded child processes at the adapter edge.
- `FileSystemPort` — reads/writes local state and performs atomic links without embedding paths in
  domain logic.
- `DownloadPort` — fetches official Node metadata/artifacts and checksum data.
- `ClockPort` — timestamps evidence deterministically.
- `EnvironmentReader` — reports only allowed key presence/conflicts, never values.

### Constants

- `FOUNDATION_SCHEMA_VERSION` — report schema version.
- `NODE_VERSION` — `26.5.0`.
- `RUNTIME_COMPONENT_IDS` — finite component vocabulary.
- `PROBE_STATUSES` — finite diagnostic states.
- `FORBIDDEN_GEMINI_AUTH_KEYS` — API-key and Vertex route indicators checked by presence only.
- `LOCAL_STATE_DIRS` — `.claude`, `.codex`, `.gemini`, `.config/netscript-agentic`.
- `EXIT_CODES` — ready, degraded/auth-required, invalid configuration, and execution failure.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| S1 | Foundation contract and read-only doctor | unit tests + scoped check/lint/fmt | `deno.json`, `.llm/tools/agentic/wsl-foundation*.ts`, README, run artifacts |
| S2 | Idempotent bootstrap and rollback plan | unit tests + native WSL dry-run/live doctor | same owned surfaces |
| S3 | Mobile/auth/reconnect/rollback evidence | native WSL canaries with raw exit codes | run artifacts plus directly required fixes |

### Deferred Scope

- Generic routing/controller/fallback/provider policy belongs to #576-#581.
- Full rollout matrix belongs to #582.

### Contributor Path

Add a component by extending `RUNTIME_COMPONENT_IDS`, one pure probe, its adapter command, and
table-driven tests. Add installation behavior by introducing an `InstallAction` planner case and
its rollback action; do not put provider credentials or values into reports.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-10 | plan | baseline | Native WSL toolchain, managed Codex daemon, and Windows rollback versions captured. |
| 2026-07-10 | plan | worktree | Native ext4 worktree created at `/home/codex/repos/netscript-epic-574-pr0a-foundation` with no upstream. |
| 2026-07-10 | plan-eval | owner waiver | Owner personally reviewed the plan, declared it passed, and directed immediate WSL Codex delegation. |
| 2026-07-10 | launch | thread created | Checked-in launcher created thread `019f4b48-abaf-77d2-9cca-5cdec9f2446d`; UNC artifact write failed before the initial turn persisted. |
| 2026-07-10 | launch | managed repair | Active-work/rollout checks found no active implementation. Anchored PID repair restored managed remote control on environment `env_e_6a2d7485c5a0832a82505a12442cd3ec`, with CLI/app-server `0.144.1`. |
| 2026-07-10 | S1 | implementation | Added the stable doctor schema, pure version/auth/mobile classifiers, read-only CLI edge, focused tests, task, and permissions/auth documentation. |
| 2026-07-10 | S1 | doctor baseline | Native ext4 PASS; Node `18.19.1` outdated; Claude/Gemini and their local state missing; both provider sessions `AUTH_REQUIRED`; Codex managed with CLI/app-server `0.144.1`. Raw exit `2` (expected degraded baseline). |
| 2026-07-10 | S1 | reconcile | #575 and draft PR #584 remain open at `status:impl`; PR carries `Closes #575` and `Part of #574`; no new reviewer/evaluator comments changed scope. |
| 2026-07-10 | S1 | artifact ownership | Root-owned run artifacts blocked mandatory updates; ownership was narrowed to `codex:codex` for this run directory only, with contents/modes preserved. |
| 2026-07-10 | S2 | dry-run | Resolved npm stable dist-tags Claude `2.1.206` and Gemini `0.50.0`; planned 7 ordered actions with Node `26.5.0`; raw exit `2` only because pre-existing provider sessions were auth-required. |
| 2026-07-10 | S2 | live bootstrap | Official Node archive/checksum verified; installed Node, Claude, and Gemini below `~/.local/share/netscript-agentic`; created owned links/state dirs and mode-0600 manifest. Raw exit `2`: installation ready, browser auth still required. |
| 2026-07-10 | S2 | idempotence | Immediate second live bootstrap resolved the same stable versions and returned `actions: []`, `changed: false`; raw exit `2` solely for provider auth. |
| 2026-07-10 | S2 | reconcile | #575/#584 remain open at `status:impl`; no new reviewer/evaluator comment changed scope. Owner-only Claude/Gemini browser sign-in is now the only provider-session prerequisite. |
| 2026-07-10 | S3 | Codex canary | Native worktree/branch, exact rollout, managed `--remote-control` process, socket, and CLI/app-server `0.144.1` passed. Active-turn reconnect returned unmanaged-state exit 1; no repair/restart attempted. |
| 2026-07-10 | S3 | provider canaries | Claude/Gemini native binaries and command surfaces pass; Claude requires claude.ai `/login`; Gemini policy now enforces `oauth-personal` and requires owner Google browser sign-in. |
| 2026-07-10 | S3 | rollback/reconnect boundary | WSL rollback output passes. Host sleep/network and Windows Claude proof require the owner/coordinator; WSLInterop is absent in this worker, so PowerShell returned exit 126. |
| 2026-07-10 | S3 | reconcile | #575/#584 remain `status:impl`; closing keyword and issue milestone/labels remain correct. No evaluator was dispatched. Owner canaries and coordinator slice sign-off remain before IMPL-EVAL. |
| 2026-07-10 | S3 | coordinator post-idle reconnect | After an anchored daemon repair, managed remote control returned `status=connected` on `YogaBook9i` / `env_e_6a2d7485c5a0832a82505a12442cd3ec`; CLI/app-server remained `0.144.1`. Same-thread resume returned exactly `CODEX_PR0A_RECONNECT_OK` with no edits. |
| 2026-07-10 | S3 | coordinator Windows rollback | Native Windows Claude path remained present; version/help passed at `2.1.205`. A Windows no-edit interactive session remains owner-only and pending. |
| 2026-07-10 | S3 | evidence reconcile | Coordinator evidence resolves the post-idle Codex reconnect gate and the Windows path/version/help checks. Claude/Gemini browser sign-in, mobile steering, sleep/network reconnect, and Windows no-edit interactive use remain pending. No evaluator was dispatched. |
| 2026-07-10 | review fix | version false-green | Coordinator substantive review found that an exit-0 version probe with unparseable output was classified `ready`. The classifier now returns `unavailable` with a sanitized, bounded diagnostic; focused semantic coverage passes. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Attach-only first Codex turn | Records exact thread identity before implementation while preserving one-sender rule. | Owner directive + codex-wsl-remote |
| Keep PR 0A bootstrap seam narrow | Generic controller belongs to #576. | #575/#576 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Checked lane policy names GPT-5.5-high, not owner-selected GPT-5.6 Sol high. | significant | yes |
| Codex CLI/app-server versions differ. | minor | yes |
| Launcher lacked UNC write permission; unmanaged daemon surfaced before first turn. | significant | yes |
| Persisted worker used daemon-default `medium` effort instead of requested `high`. | significant | yes |
| Coordinator-created run artifacts were root-owned. | minor | yes |
| Active-thread Codex reconnect probe reports unmanaged state despite passive managed proof. | significant | yes |
| Worker WSL lacks Windows interop for the host rollback command. | significant | yes |

## Gate Results

### Plan Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Research current | PASS | `research.md` | Re-baselined at `b58b4c2a`. |
| Design checkpoint | PASS | This section | Contract, ports, constants, slices, deferred scope, and contributor path recorded. |
| PLAN-EVAL | PASS | `plan-eval.md` | Owner-reviewed explicit waiver. |

### S1 — Foundation contract and read-only doctor

| Gate | Result | Raw exit | Evidence |
| ---- | ------ | -------- | -------- |
| Focused unit tests | PASS | 0 | `7 passed`, `0 failed` in `wsl-foundation_test.ts` |
| Scoped check wrapper | PASS | 0 | 3 files, 1 batch, 0 findings; command used `--unstable-kv` |
| Scoped lint wrapper | PASS | 0 | 3 files, 1 batch, 0 findings |
| Scoped format wrapper | PASS | 0 | 3 files, 1 batch, 0 findings |
| Doctor JSON baseline | EXPECTED_DEGRADED | 2 | Stable schema `1.0`; native ext4 true; explicit missing/outdated/auth-required states; no secret values |
| Lock hygiene | PASS | 0 | `deno.lock` unchanged |

Worker review notes (not harness sign-off): the pure module contains no `Deno.*`, filesystem, process, or output side
effects; the CLI edge uses fixed command/argument specs and bounds retained command output. Gemini
forbidden routes expose key names only. File sizes are 242/167/89 LOC, below the internal-tool hard
cap, and no generic desired-state routing from #576 was introduced.

### S2 — Idempotent bootstrap and rollback plan

| Gate | Result | Raw exit | Evidence |
| ---- | ------ | -------- | -------- |
| Full agentic unit set | PASS | 0 | `67 passed`, `0 failed` across 2 files; S2 adds plan/idempotence/rollback semantics |
| Scoped check wrapper | PASS | 0 | 3 files, 1 batch, 0 findings |
| Scoped lint wrapper | PASS | 0 | 3 files, 1 batch, 0 findings |
| Scoped format wrapper | PASS | 0 | 3 files, 1 batch, 0 findings |
| Bootstrap dry-run | EXPECTED_DEGRADED | 2 | Exact Node/Claude/Gemini versions and 7 value-free ordered actions; auth-required only |
| First live bootstrap | EXPECTED_DEGRADED | 2 | All tools/state ready; Claude/Gemini browser auth required; no forbidden auth conflicts |
| Second live bootstrap | IDEMPOTENT | 2 | `actions: []`, `changed: false`; auth-required only |
| Doctor JSON + human | EXPECTED_DEGRADED | 2 each | All 15 components ready; only two provider auth probes degraded |
| Non-login consumer smoke | PASS | 0 | Native paths resolve Node 26.5.0, npm 11.17.0, Deno 2.9.0, Codex 0.144.1, Claude 2.1.206, Gemini 0.50.0 |
| Claude static/native smoke | PARTIAL_AUTH_REQUIRED | 1 | version/help/agents pass; `remote-control --help` explicitly requires claude.ai subscription login |
| Gemini help smoke | PASS | 0 | CLI help renders without credentials; Google subscription route remains owner-login pending |
| Rollback plan | PASS | 0 | Non-destructive output scopes owned roots, restores previous symlink targets, preserves `~/.codex` and Windows Claude |
| State manifest | PASS | 0 | mode `0600`, 2 owned roots, 5 owned links, no credential values |
| Deno/Codex preservation | PASS | 0 | Deno `2.9.0`; Codex CLI/app-server `0.144.1`, managed |
| Lock hygiene | PASS | 0 | `deno.lock` unchanged |

Worker review notes (not harness sign-off): Node installation verifies the official SHA-256 before extraction and
atomically renames a user-owned staging directory. npm stable tags are resolved before exact-version
installation; fixed argv and bounded output keep credentials out of reports. Existing non-symlink
files are refused, previous symlink targets are recorded, and rollback output never executes.
Machine mutation is confined to the documented user-local roots. Source files remain under the
500-LOC internal-tool cap at 340/436/152 LOC. Generic routing/state transitions remain deferred to
#576/#579.

### S3 — Mobile, auth-boundary, reconnect, and rollback evidence

| Gate | Result | Raw exit | Evidence |
| ---- | ------ | -------- | -------- |
| Full agentic unit set | PASS | 0 | `68 passed`, `0 failed`; includes Gemini auth-policy semantics |
| Scoped check/lint/fmt wrappers | PASS | 0 each | 3 owned TS files, 0 findings |
| Final doctor | EXPECTED_DEGRADED | 2 | 16 component/policy probes ready; Claude/Gemini browser sessions auth-required only |
| Bootstrap after policy fix | IDEMPOTENT | 2 | immediate repeat returned `actions: []`; auth-required only |
| Codex native/thread proof | PASS | 0 | native ext4 cwd/branch, exact rollout, managed process/socket, matching `0.144.1` versions |
| Codex active-turn reconnect | EXPECTED_BLOCKED_THEN_RESOLVED | 1 worker; coordinator exit not supplied | Active-turn reconnect reported unmanaged; post-idle anchored repair restored managed `status=connected`, and same-thread resume returned the exact no-edit sentinel |
| Claude native surface | PASS | 0 | version `2.1.206`; help exposes remote-control, worktree, session prefix, and tmux flags |
| Claude Remote Control | AUTH_REQUIRED | 1 | exact CLI response requires claude.ai subscription `/login` |
| Gemini native surface | PASS | 0 | version/help execute from `~/.local/bin/gemini` on native WSL |
| Gemini auth policy | PASS | 0 | mode-0600 settings enforce `selectedType=enforcedType=oauth-personal`; created file recorded for rollback |
| Gemini grounded prompt | AUTH_REQUIRED | 41 | pre-policy canary stopped at missing auth method; post-policy browser auth intentionally left to owner |
| Forbidden-auth redaction | PASS | 0 | fake-key canary observed doctor raw exit 3 + `auth_conflict`; fake value absent from output |
| Sleep/network reconnect | OWNER_CANARY_REQUIRED | N/A | no firewall/network mutation or host sleep performed from the active worker |
| Windows Claude rollback | PARTIAL_HOST_PASS | 126 worker; coordinator exit not supplied | WSLInterop absent in worker; coordinator confirmed native path plus version/help at `2.1.205`; no-edit interactive session pending |
| Rollback output | PASS | 0 | preserves provider sessions/Codex, restores prior links, conditionally removes only recorded Gemini settings |
| Lock hygiene | PASS | 0 | `deno.lock` unchanged |

Worker review notes (not harness sign-off): the S3 code change is limited to the locked Gemini
subscription boundary. Existing settings are never overwritten; absent settings are created mode
0600 with `oauth-personal`, recorded in the rollback manifest, and checked by the doctor. The CLI
edge is 498 LOC, below the internal-tool 500-LOC cap. No generic provider routing, daemon repair,
credential acquisition, or evaluator work entered #575. Coordinator substantive review/sign-off is
still required; this implementation worker does not self-certify.

### Coordinator substantive review remediation — unparseable version output

| Gate | Result | Raw exit | Evidence |
| ---- | ------ | -------- | -------- |
| Coordinator finding | FIXED | N/A | Exit-0 fixed version probes no longer become `ready` when `parseVersion` returns `null` |
| Focused unit set | PASS | 0 | `12 passed`, `0 failed`; new test checks unavailable status, null version, single-line sanitization, 108-character total bound, and actionable diagnostic |
| Scoped check wrapper | PASS | 0 | 3 owned TS files, 1 batch, 0 findings |
| Scoped lint wrapper | PASS | 0 | 3 owned TS files, 1 batch, 0 findings |
| Scoped format wrapper | PASS | 0 | 3 owned TS files, 1 batch, 0 findings |
| Scope boundary | PASS | N/A | No #576 routing, #580 daemon repair, provider auth, or owner-canary behavior changed |

Implementation detail: successful probes without a parsed semantic version now return
`status: unavailable`, preserve `detectedVersion: null`, and report
`unparseable version output: <diagnostic>`. The diagnostic replaces control/whitespace runs with one
space and retains at most 80 characters of probe output. This closes the coordinator-identified
false-green without changing missing, nonzero-exit, outdated, or ready semantics.

### Tier-A sign-off and owner evaluation waiver

The coordinator substantively reviewed the foundation contract, bootstrap boundary, provider policy,
rollback behavior, and S3 evidence. The only correctness finding was the unparseable-version
false-green above; `6ea5224` fixes it and all focused/scoped gates pass. The owner explicitly waived
a separate evaluator run and directed that personal review be treated as passed. `evaluate.md`
records that `PASS` waiver. It does not waive the interactive acceptance checks below, which still
block merge readiness.

### Exact owner canaries still required

1. In native WSL, run `claude`, enter `/login`, and complete the claude.ai subscription browser
   flow. Then start two distinct sessions from this repo using `--remote-control <name>` with
   `--worktree <name>`, and steer both from mobile.
2. In native WSL, run `gemini`, select **Sign in with Google**, and complete the browser flow using
   the subscription account. Do not set an API key or Vertex variable. Re-run the grounded native
   prompt canary afterward.
3. With both mobile sessions visible, perform one host sleep or network disconnect/reconnect and
   steer them again. Record raw outcomes without tokens, URLs, or credential material.
4. In native Windows PowerShell, open a no-edit break-glass Claude session to confirm interactive
   Windows use. Path, version, and help already passed at `2.1.205`.

## Handoff Notes

- Evaluator should challenge the #575/#576 boundary and whether every mobile/auth acceptance item has
  a concrete gate without requiring credentials in artifacts.

## 2026-07-10 Scope Reconciliation: Antigravity Replaces Future Gemini Lane

Owner directive at 15:13:25 +02:00: uninstall the already-installed Gemini CLI, configure Google
Antigravity CLI (`agy`), update related issues, and identify required refactoring. This changes the
future desired state only; all completed Gemini facts in this log remain historical evidence.

Planning-only reconciliation identifies the foundation refactor in
`wsl-foundation-lib.ts`, `wsl-foundation.ts`, `wsl-foundation_test.ts`, and the agentic README.
The future implementation must remove only NetScript-owned Gemini links/package state, preserve
`~/.gemini`, install/prove `/home/codex/.local/bin/agy` as `codex`, and never touch
`/root/.local/bin/agy`. Official sources verify interactive Google Sign-In and `/logout`, but not an
`agy login` command. Canonical-user auth, headless execution, structured output, exit taxonomy,
quota/subscription, web research/citations, and instruction-file behavior remain unpassed canaries.
No runtime source changed in this reconciliation; PR #584 remains draft.
