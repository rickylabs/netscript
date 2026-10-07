# Evaluation — fix-release-observation-1985-2004--urgent-canary

- Evaluator: separate IMPL-EVAL session, 2026-10-08, observed route `opencode-go/glm-5.3-flash`, effort `max`, no fallback used. Generator requested OpenAI gpt-6.1-sol high; this session is neither the generator session nor the PLAN-EVAL session (distinct vendor family and separate session, as required).
- Exact HEAD at evaluation: `da7943381b496a1c1adc63f19732f2bc56d5d28f` on `fix/release-observation-1985-2004`, tree clean; baseline `6f6cbdf030d7595d1730272d0a74aedd66225069` is its ancestor. The post-gate commit `da7943381` touches only run-dir artifacts, so all gate evidence recorded at source head `35408e2b6c4217810e1eb3a616d49785c67d3bba` remains valid at this HEAD.
- Review bound, honored: the 7 changed source/test/workflow files (`.github/workflows/release-canary.yml`, `.llm/tools/release/github-release.ts`, `.llm/tools/release/github-release-pagination_test.ts`, `.llm/tools/release/watch-canary-e2e.sh`, `.llm/tools/release/canary-failure-description.sh`, `.llm/tools/release/watch-canary-e2e_test.ts`, `.llm/tools/release/release-canary-workflow_test.ts`), the run artifacts, and sibling evidence (`evidence/C/1985-*.log` with launcher `tooling/C-1985-mutations.py` at the run's outer scope). No broad forensic sweeps, CI waits, dependency probes, home-cache searches, source/config edits, branch changes, pushes, release dispatch, or publication.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-release-observation-1985-2004--urgent-canary` |
| Target         | Issues 1985 + 2004: complete fail-closed closed-issue collection and truthful fail-closed canary child observation |
| Archetype      | 6 — CLI/tooling, release policy overlay |
| Scope overlays | none (doc-lint/JSR N/A: tool-local only, no package exports) |

## Process Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Plan-Gate passed before implementation | PASS | `plan-eval.md`: independent `PASS` at head `299dbeecb91d04c70530b0874cefe3d4f3d51a7f`, distinct vendor family/session; source commits follow the approval record. |
| Design checkpoint exists | PASS | `worklog.md` items 3–4 lock slices/gates in `plan.md` at design + PLAN-EVAL hard stop. |
| Commit slices match plan | PASS | `5cfa97dab` (S1: collector + focused pagination tests), `35408e2b6` (S2: workflow + two consumed shell helpers + focused Bash tests), `da7943381` (S3: run artifacts only); each slice well under thirty files. |
| Each slice has a passing gate | PASS | sibling `evidence/C/1985-focused.log`, `1985-check.log`, `1985-lint.log`, `1985-fmt.log`; slice commits in `1985-s1-commit.txt` / `1985-s2-commit.txt`. |
| No speculative seams | PASS | Both shell helpers are consumed by workflow (await step, failed-pair handler) and by the Bash tests; emitter-side collector exports are tool-local test-injection-only. |
| Constants for finite vocabularies | PASS | Conclusion allowlist identical in `watch-canary-e2e.sh:20-24` and `canary-failure-description.sh:5-9`, pinned by tests (`observed canary terminal failures…`, `failed-pair descriptions…` mutation controls). |

## Contract Verification (brief §5 — independently inspected)

| Contract | Result | Evidence |
| -------- | ------ | -------- |
| Pagination counts raw results, guards PRs, preserves order/dedup | PASS | `github-release.ts:809-854` counts `items.length` before the `pull_request` guard; first-seen dedup; newest-first order untouched; exercised by the 205-item focused test with an injected PR and a duplicate, asserting exact result sequence and per-page query params (page/per_page/sort/order/q). |
| Metadata validation + refusals (errors/incomplete/changing totals/short-before-total/ceiling) | PASS | `github-release.ts:811-854` validates HTTP, `items` array, nonnegative safe-integer `total_count`, boolean `incomplete_results`, per-page length ≤100, malformed issue fields; refuses failed pages (diagnostic names page/HTTP status, never token/body), `incomplete_results=true`, unstable total, short page before total, and explicit ceiling `total_count >= 1000` with the window-narrowing instruction; zero total stays a valid single-call empty response (dedicated test asserting exactly one request). |
| Merged-PR path native generate-notes, full body pass-through | PASS | `generateWhatsChanged` unchanged apart from tool-local export; focused test proves a 205-line merged body returns complete in a single POST `/repos/.../releases/generate-notes` call — no client truncation, no pagination change on that path. |
| Bash watcher watches/views same child, bounded retries | PASS | `watch-canary-e2e.sh:5-8,14-34`: numeric child ID + `GITHUB_OUTPUT` required, `gh run watch` then `gh run view` on the same immutable `$run_id`, five attempts, delays 1→2→4→8 capped; fake executables record every call, reject any unexpected command/ID, and never dispatch. |
| Green only on confirmed terminal success; watch exit non-evidence | PASS | Exit 0 requires `status=completed` plus a well-formed two-field TSV with `conclusion=success` (`watch-canary-e2e.sh:16-24`); the "misleading watch success" mutation control (`watch-exit-trust`) and its test prove a zero watch exit without terminal observation cannot grant green. |
| Actual non-success conclusions terminal failure; exhaustion fail-closed | PASS | All eight allowlisted conclusions map to `state=failure` + exact conclusion + immediate exit 1 (`watch-canary-e2e.sh:22-23`); five-time exhaustion emits `state=unknown`, empty conclusion, nonzero exit, never asserting child failure; retries cover API-504-then-success and nonterminal/malformed views. |
| Consumed failure-description helper never asserts child failure on unknown | PASS | `canary-failure-description.sh:4-11` prints "concluded X" only for `E2E_STATE=failure` + allowlisted conclusion; unknown state, unrecognized conclusion, or unset env yield "observation unknown" with exit 0; handler-side fake-env cases cover failure/cancelled/unknown/unrecognized/empty. |
| Workflow output wiring consumes helpers; immutable gate order unchanged | PASS | `release-canary.yml` diff is confined to the await step calling `watch-canary-e2e.sh` and the failed-pair handler consuming `steps.e2e.outputs.state/conclusion` via `canary-failure-description.sh`; partial-publish branch stays first, publish-before-and-failure branch verbatim; immutable tag/version, exact source pair, publisher order, green-pair status step, and parent `timeout-minutes: 120` (`release-canary.yml:44`) all unchanged. |
| Five attempts / capped delays; parent timeout bounds native watch | PASS | Loop bound at `watch-canary-e2e.sh:14,27-30`; tests assert delays exactly `1,2` (recoverable) and `1,2,4,8` (exhaustion); job-level timeout unchanged, bounding the watch. |
| No duplicate dispatch, manual bypass, or release execution | PASS | Helper performs no dispatch and no status write (helper writes only its two `GITHUB_OUTPUT` keys; the single unchanged dispatch step supplies `$E2E_RUN_ID`); no release/tag/version/publisher/content changes in the diff; worklog reconciles no release execution. |
| Evidence hygiene | PASS | No credentials/endpoint literals in helpers/tests (checked); tests use UUID identities and generated numeric run IDs; committed artifacts contain no operator paths or usage counts. |

## Independent Runs (this session, through the repo test wrapper, all repo-relative)

| Run | Result |
| --- | ------ |
| `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/release/github-release-pagination_test.ts .llm/tools/release/watch-canary-e2e_test.ts .llm/tools/release/release-canary-workflow_test.ts` | exit 0 — 19 passed, 0 failed, 0 ignored |

Executed under the run's given TMPDIR after confirming it canonicalizes to itself (no parent-directory segments), matching the worklog's recorded fixture caveat without any source change. The three files cover the 11 focused regressions plus the existing workflow-YAML gate, which parses the real workflow file in the same red-green approach as recorded receipts.

## Mutation Controls Review (receipts, no re-run)

- Launcher `tooling/C-1985-mutations.py` implements 11 mutants spanning both focused suites: `paginate`, `empty`, `ceiling`, `incomplete`, `changing-total`, `merged-body`, `watch-retry`, `child-failure`, `unknown`, `watch-exit-trust`, `failure-description`. Validity rule excludes compiler diagnostics and requires a genuine failed assertion ("failed":1 / FAILED), then restores and byte-asserts the original.
- Receipts reviewed: `evidence/C/1985-mut-*.log` show exit 1 with genuine assertion/test failures (e.g. unequal call ordering, unexpected rejection, truncated body diff, wrong emitted state) — zero TS compilation errors; verdicts in `evidence/C/1985-mutations.log` (11/11 `test_red=True`); every restore byte-asserted and the working tree is byte-identical to HEAD.
- Optional bounded reproduction was not needed — no concrete concern arose from the receipts.

## Gate Receipts Review (recorded by the run; consistent with my independent run and the clean tree)

- Focused suite `passed=11,failed=0` and full existing release-tool suite `passed=146,failed=0,ignored=0` (`evidence/C/1985-focused.log`, `1985-release-suite.log`) — full suite already restored exit 0, per brief.
- Scoped wrappers: check/lint/fmt receipts report the four changed TypeScript files selected and processed, zero findings/refusals (`evidence/C/1985-check.log`, `1985-lint.log`, `1985-fmt.log`); the derivative lint config retains canonical rules, removing only selection exclusions, and processes all four files.
- Bash syntax: both helpers re-validated by me with `bash -n` (read-only), plus they execute for real in the tests; workflow YAML validated by the existing repo parser test (part of my independent run).
- Quality gate receipt WARN-only, all pre-existing and outside the owned files; `evidence/C/1985-quality.log` shows no ERROR-class findings.
- Carrier freshness: all four generator `--check` receipts recorded (`evidence/C/1985-check-*.log` with matching `1985-gen-*.log`); working tree shows no generated drift.
- Shared actual critical audit exit 1 (`evidence/C/1985-audit.log`) is a pre-existing dependency advisory; classified in plan/brief as separate owner maintenance — not a gate of this repair.

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | No doctrine/integration violation introduced in `.llm/tools/` or workflow scope; quality gate green. |
| Resolved entries | 0 | n/a |
| Deepened violations | 0 | n/a |
| Unrecorded violations | 0 | n/a |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low (non-blocking, process) | Launch briefs use the compressed `use harness` activation style with named surfaces rather than a template `## SKILL` chapter heading; activation semantics were carried out and the required record/read chain was followed, so nothing rides on it for this verdict. | `impl-eval-brief.md`, `plan-eval-brief.md` in the run dir | Suggest future supervisor briefs include the `## SKILL` chapter per evaluator protocol rule 13. |
| low (non-blocking, owner-maintained) | Repo-level critical dependency audit remains red from a shared, pre-existing advisory unrelated to this repair; brief and plan assign it to owner maintenance, so merge readiness stays owner-gated and is not claimed here. | `evidence/C/1985-audit.log` (exit 1, pre-existing advisory), `worklog.md` final item | Owner maintenance on the dependency; no action in this run. |
| low (observation) | The >10-page collector exhaustion throw is fail-closed code without a dedicated test case (would require ten full 100-item pages); all other specified refusal classes, including the explicit ceiling that dominates that window, are test-pinned. | `github-release.ts:854` vs test list above | None required; optional future test if the loop bound changes. |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **PASS** |
| Rationale | Approved scope is complete at exact HEAD `da7943381b496a1c1adc63f19732f2bc56d5d28f`: the collector now paginates raw results with unchanged order/dedup/PR-guard and fail-closed metadata refusals including the explicit ceiling; merged-PR notes remain native with proved full-body pass-through; the watcher observes only the dispatched child, accepts green solely from confirmed terminal success, treats every other conclusion truthfully and exhaustion fail-closed as unknown, and the failure-description helper prevents any API error from becoming a child failure — all wired through the workflow with the immutable pair/publisher surfaces untouched. My independent run of the canonical focused suite plus the existing workflow test passed 19/19 through the test wrapper under canonical TMPDIR; all 11 mutation controls are genuine test-red with byte-exact restoration receipts; scoped gates, Bash syntax, YAML validation, quality gate, and carrier-freshness receipts are green with no tree drift. This verdict covers the repair at this HEAD only: the separately-owned shared critical dependency advisory keeps overall merge readiness owner-gated, and no release dispatch or publication is authorized by this evaluation. |
