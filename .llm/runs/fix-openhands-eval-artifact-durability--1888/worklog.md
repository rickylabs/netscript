# Worklog: durable formal OpenHands evaluator artifacts

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-openhands-eval-artifact-durability--1888` |
| Branch | `fix/openhands-eval-artifact-durability` |
| Archetype | N/A — GitHub Actions infrastructure |
| Scope overlays | none |

## Design

### Public Surface

- `.github/workflows/openhands-agent.yml` formal-evaluator status/artifact contract.
- Existing `openhands-status` local metadata and remote status-marker read surfaces (unchanged).

### Domain Vocabulary

- `absent` — no eligible `OPENHANDS_VERDICT:` marker.
- `unparseable` — marker exists, but no valid eligible token line exists.
- `ambiguous` — more than one valid eligible token line exists.
- `parsed` — exactly one valid eligible token line exists.
- `evaluated_head` — immutable PR head the formal evaluator inspected.
- `verdict_artifact_uri` — immutable GitHub blob URL for the exact committed verdict file.
- `artifact ref` — unique non-PR branch containing the durable verdict/trace record.

### Ports

- Git object database (`read-tree`, `write-tree`, `commit-tree`) — creates evidence without moving
  or staging the evaluated checkout head.
- GitHub authenticated push — publishes the unique artifact ref.
- Workflow status comment and compact trace metadata — remote/local provenance readers.

### Constants

- Verdict tokens remain `PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN|NONE`.
- Verdict states become `absent|unparseable|ambiguous|parsed`.
- Phase artifacts remain `plan-eval.md` for PLAN-EVAL and `evaluate.md` for IMPL-EVAL.
- Artifact refs use `openhands-eval-artifacts/pr-<n>/run-<id>-<attempt>`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Prove formal read-only evaluators preserve one durable verdict and reject ambiguous summaries. | Focused workflow tests + YAML/static validation + lock/scope checks | `.github/workflows/openhands-agent.yml`, `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts`, run artifacts |

### Deferred Scope

- Artifact-ref cleanup/retention automation — owner-controlled lifecycle, not required for durable
  creation.
- Changes to status reader UX — their existing raw provenance fields are sufficient for parity.

### Contributor Path

Start with the `Materialize OpenHands trace`, `Preserve formal evaluator verdict`, and `Publish final
status comment` steps, then run `phase-eval-workflow_test.ts`. Keep the shell and JavaScript verdict
cardinality logic synchronized.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-09-01 | 1 | bootstrap/research/design | Baseline verified; `PLAN-EVAL: N/A` recorded before implementation. |
| 2026-09-01 | 1 | implementation | Added exact-one verdict cardinality, isolated evidence-ref publication, provenance parity, and raw-summary suppression on fail-closed formal results. |
| 2026-09-01 | 1 | regression | Added explicit formal read-only evaluator + default `pr-comment` coverage and immutable-ref assertions. |
| 2026-09-01 | 1 | reconcile | Issue #1888 remains `status:impl`, milestone `0.0.7` (ID 27), with the requested taxonomy and internals orchestrator; no new issue comments changed scope. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Unique evidence ref with immutable blob URI | Durable and does not mutate evaluated head | `plan.md` D1–D3 |
| Exact-one formal summary | Acceptance requires fail-closed cardinality | `plan.md` D4–D5 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| None | N/A | N/A |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Focused workflow test (initial) | structured `run-deno-test.ts` on `phase-eval-workflow_test.ts` | FAIL, exit 1 | Test assertion syntax typo; fixed before any verdict. |
| Workflow + reader test (intermediate) | structured `run-deno-test.ts` on workflow + `agentic-lib_test.ts` | FAIL, exit 1 | 85/86 passed; one source assertion crossed a YAML line break, then was narrowed and rerun. |
| Focused workflow test | structured `run-deno-test.ts` on workflow + `agentic-lib_test.ts` | PASS, exit 0 | 86 passed, 0 failed; includes exact reproducer pairing and marker compatibility. |
| Type check | structured `run-deno-check.ts --file phase-eval-workflow_test.ts` | PASS, exit 0 | 1 file selected, 0 findings. |
| Format check (initial) | structured `run-deno-fmt.ts --file phase-eval-workflow_test.ts` | FAIL, exit 1 | One long assertion; scoped `deno fmt` exited 0, then authoritative rerun passed. |
| Format check | structured `run-deno-fmt.ts --file phase-eval-workflow_test.ts` | PASS, exit 0 | 1/1 file processed, 0 findings. |
| Lint | structured `run-deno-lint.ts --file phase-eval-workflow_test.ts` | N/A, exit 2 | Repository lint config excludes `.llm/**`; wrapper refused all-excluded coverage, so this is not reported as green. |
| Trace shell syntax | extracted `Materialize OpenHands trace` script via Deno; `bash -n` child | PASS, exit 0 | No pipeline used for gate capture. |
| Preserve shell syntax | extracted isolated-ref script via Deno; `bash -n` child | PASS, exit 0 | No pipeline used for gate capture. |
| Final-comment JavaScript syntax | extracted `github-script` body compiled with `AsyncFunction` | PASS, exit 0 | Whole embedded script parsed, including provenance/fail-closed branches. |
| Diff whitespace | `git diff --check` | PASS, exit 0 | No whitespace errors in tracked diff. |
| Lock hygiene | `git diff --exit-code 302409f0c... -- deno.lock` | PASS, exit 0 | `deno.lock` byte-unchanged from the supplied base. |
| Scope checker (initial) | Deno wrapper over porcelain status | FAIL, exit 1 | Checker trimmed the first status column and misread `.github`; status output itself showed only allowed paths. |
| Scope checker | corrected Deno wrapper over porcelain status | PASS, exit 0 | 9 entries, all limited to the workflow, focused test, and run directory. |

Two YAML parser attempts were non-verdict setup failures: `deno eval --allow-read` exited 1 because
the flag is invalid in Deno 2.9; the corrected eval exited 1 because `@std/yaml` is intentionally not
in the import map. No dependency was added and `deno.lock` was not touched. Workflow structure is
covered by the focused source-contract test; GitHub CI remains the hosted parser.

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Package/plugin fitness | N/A | Boundary inspection | No package/plugin surface. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Live formal evaluation | NOT_RUN | Owner directive | Owner explicitly retained evaluation; no OpenHands run was dispatched. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Local/remote provenance readers | PASS | Workflow regression assertions | Both records carry the same phase, immutable head, formal verdict, source, path, commit, and URI. |

## Handoff Notes

- Owner explicitly retains evaluation and requested no PLAN-EVAL/IMPL-EVAL run from this session.
- Review the isolated-ref plumbing and the explicit `pr-comment` regression before any ready-state
  transition.
- `rtk` was unavailable on this host (`command not found`), so authoritative Git reads used direct
  Git/Deno commands per the documented fallback.
