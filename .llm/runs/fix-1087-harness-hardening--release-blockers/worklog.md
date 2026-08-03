# Worklog: release-blocking harness hardening

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1087-harness-hardening--release-blockers` |
| Branch | `fix/1087-harness-hardening` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- `claudePrintArguments` and the Claude runtime adapter remain the evaluator launch/resume entry.
- A focused evaluator request-guard module owns HTTP allow/deny, redacted audit, and abort signaling.
- `agentic:gh-pr create` remains the PR creation entry but publishes only a staged owned artifact.
- A Redis integration-gate CLI is the CI entry for required real-Redis tests and the negative control.
- `release-notes-0.0.4-intro.md` is the hand-authored release intro input.

### Domain Vocabulary

- `EvaluatorModelGuard` / `EvaluatorModelAttempt` — exact open-model request enforcement and
  redacted audit event.
- `PublicationBodyArtifact` — session id, path, fingerprint, and metadata path for one staged body.
- `RedisIntegrationMode` — normal required integration run or serialization-removal negative control.

### Ports

- HTTP upstream fetcher — fakeable seam proving allowed forwarding without a real provider.
- evaluator abort callback — lets a rejected request terminate the owning Claude process.
- publication filesystem functions — exact staged write/read/fingerprint boundary.
- child command runner — real Deno test execution with thrown-spawn and exit-code classification.

### Constants

- `OPEN_EVALUATOR_MODEL_IDS` — the only child-model allowlist authority.
- publication root `.llm/tmp/agentic/gh-pr` and evaluator audit root
  `.llm/tmp/agentic/evaluator-policy`.
- Redis test files and #1075 serialization markers as finite negative-control vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | Harness bootstrap and approved plan | PLAN-EVAL `PASS` | this run directory and draft PR |
| 1 | #1087 enforces open-only evaluator child requests and terminal audit | focused proxy/wrapper/adapter tests; full agentic suite | `.llm/tools/agentic/claude/**`, runtime adapter/ports/tests, README/docs as required, run artifacts |
| 2 | #1084 makes publication bodies session-owned and collision-free | concurrent/cross-owner/tamper tests; gh-pr dry-run | `.llm/tools/agentic/github/**`, `deno.json`, active harness guidance/templates, run artifacts |
| 3 | #1080 makes real Redis regressions mandatory and proves sensitivity | explicit Redis integration + negative control + affected package suites | `.github/workflows/ci.yml`, `.llm/tools/validation/**`, tests if needed, run artifacts |
| 4 | #1083 adds the breaking 0.0.4 release note and removes live residue | docs overlay checks and live-surface `rg` | release intro and run artifacts |
| 5 | Final gates/evidence/IMPL-EVAL remediation | full requested gates and separate evaluator | run artifacts plus only evaluator-approved fixes |

### Deferred Scope

- Redis connection pooling and broader adapter audit — #1080 is CI execution, not production refactor.
- Release publication/canary — this PR is the last pre-cut slice, not the cut itself.
- Historical run-log rewriting — immutable incident evidence remains intact.

### Contributor Path

Evaluator route behavior is changed through central model ids/policy, the runtime Claude adapter,
and its focused guard module. GitHub publication behavior is changed through the staging module and
`gh-pr.ts`. CI integrations are added through the explicit validation runner and the `check-test`
job. Release prose is edited in the tracked notes-file input.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-03 | 0 | bootstrap/research | Read all four issue bodies; verified clean requested baseline; selected Archetype 6 + docs overlay. |
| 2026-08-03 | 0 | design | Locked child-request proxy, publication ownership, Redis negative control, and release-note location. |
| 2026-08-03 | 0 | PLAN-EVAL | Open-model evaluator session `e52d58f7-9130-4c7b-af67-2e975edcb1e5` returned `PASS`; tool surface was restricted to `Bash`, `Read`, and `Write` during the pre-#1087 safety gap. |
| 2026-08-03 | 1 | #1087 implementation | Added a loopback Anthropic request guard configured through the evaluator child environment, exact central open-model allowlist, real launch/resume session identity, redacted JSONL denial audit, and SIGTERM→SIGKILL abort with exit 78. |
| 2026-08-03 | 1 | opposite-family review | Fable review session `7a34e115-1da4-4a2e-b7ad-621f79c1f5d6` returned `PASS`; remediation continuation `55852a33-55b4-4898-9909-0a1ad0545c7c` verified all actionable findings resolved. |
| 2026-08-03 | 1 | supervisor sign-off | Inspected the guard/wrapper/adapter boundary, reviewer evidence, complete suite, scoped wrappers, and credential-blind audit tests; approved the slice for commit. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Do not launch an unconstrained local Qwen evaluator before #1087. | That would knowingly exercise the release's only p0 cost hole. | issue #1087 + lane policy |
| Use a session-scoped Claude configuration excluding all child/session delegation tools for bootstrap PLAN-EVAL. | Keeps the formal local Qwen route while making child recruitment unavailable before the code guard lands. | local Claude `--help`; runtime isolated config design |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Current Codex session is the owner-assigned supervisor rather than canonical Fable entry session. | significant | yes |
| Bootstrap local evaluator requires a temporary `Agent` deny until #1087 lands. | significant | yes |
| Planned light-review Opus route was unavailable at launch; #1087 review was reclassified to the canonical complex security route (Fable medium). | significant | yes |

## Gate Results

- PLAN-EVAL: `PASS` — `.llm/runs/fix-1087-harness-hardening--release-blockers/plan-eval.md`.
- #1087 focused guard/policy suite: `50 passed, 0 failed` after remediation.
- #1087 complete `.llm/tools/agentic/` suite: `332 passed, 0 failed` (independently rerun by reviewer).
- #1087 scoped check/lint/fmt: `129 files, 0 findings` each.
- #1087 review: `PASS`; all actionable findings resolved.
- Remaining implementation gates: `NOT_RUN`.

## Handoff Notes

- #1087 is supervisor-approved for its issue commit. After push and evidence comment, proceed to
  #1084 without combining the slices.
