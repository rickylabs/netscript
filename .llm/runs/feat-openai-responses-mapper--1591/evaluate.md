# Evaluation: #1591 typed OpenAI Responses generation-options mapper (IMPL-EVAL)

## Metadata

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Run ID         | `feat-openai-responses-mapper--1591`                                          |
| Target         | rickylabs/netscript PR #1805 (draft, OPEN), `Fixes #1591`                     |
| Archetype      | `packages/ai` adapter slice (Archetype 4 per PR body; plan names no number)   |
| Scope overlays | none                                                                          |
| Evaluator      | separate-session Claude lane (GLM 5.3 Flash), 2026-08-31 — opposite family to the Codex author |

**Certified head: `ff7d2de60ef470c312d633b851975d67a6774471`** (content head), byte-identical in
`packages/ai` at evidence head `1f87b111f`. PR head verified via `gh pr view 1805` =
`1f87b111fce849a66936e76bc203729a79d766a9`, draft, OPEN, body carries `Fixes #1591`.

## Verdict

**ACCEPTED_WITH_FINDINGS.** All six brief points verified independently in this session; findings
are process/observation-level, none touch the certified content.

## Brief-point verification

1. **Ceiling — PASS.** `git diff 0331014fe..ff7d2de60 --stat`: exactly the three authorized files
   (adapter +28, generation_options_test +29, openai_compatible_test +70). `deno.lock` diff empty;
   blob id `a1522e6e…` identical at base/content/evidence; sha256 `edfa0c24…` matches tier-a.md and
   the PR body. Integration: `git diff ff7d2de60..1f87b111f -- packages/ai` is empty (verified
   myself, not taken on trust); the merge's other changes are outside the certified surface.
2. **Mapping vs the real Responses wire — PASS.** Verified against the authoritative OpenAI
   `openai-node` sources, not the sibling mapper: `src/resources/responses/responses.ts` declares
   `max_output_tokens?: number | null` and has **no** flat `reasoning_effort`/`max_tokens` on the
   create body; `src/resources/shared.ts` declares `Reasoning.effort` accepting
   `'none'|'minimal'|'low'|'medium'|'high'|'xhigh'|'max'` — a superset of the
   `low|medium|high` the mapper emits (NetScript `ReasoningEffort` minus `'off'`).
   `openAiResponsesGenerationModelOptions` (adapter lines 63–75) mirrors the sibling's conditional
   structure exactly: `reasoning: { effort }`, `max_output_tokens`, `{}` → `undefined`.
3. **Selection non-regressive — PASS.** `createChatClient` (adapter lines 222–224):
   `mapModelOptions: api === 'responses' ? openAiResponsesGenerationModelOptions :
   openAiCompatibleGenerationModelOptions` — `undefined` and `'chat-completions'` keep the existing
   mapper. Pipeline confirmed live: `resolveModelOptions` (`tanstack-chat-client.ts:123–125`) applies
   `meta.mapModelOptions` to `request.options`, so existing callers' request bodies are unchanged.
4. **Integration test proves mutual exclusion — PASS.** The new test stubs `globalThis.fetch`,
   serializes the real request body, and asserts **both directions for all three configs**:
   responses → `reasoning == {effort:'high'}` + `max_output_tokens == 321` present,
   `reasoning_effort`/`max_tokens` absent (`Object.hasOwn`); chat-completions **and** unset →
   mirror-image, `reasoning`/`max_output_tokens` absent. Presence-only assertions would not pass
   this test against an emits-both implementation. The 401 stub response terminates via the bridge's
   caught `error` event (`tanstack-chat-client.ts:200–204`), so the drain loop completes normally.
   Pure-function tests additionally prove `off` omits the `reasoning` key (`Object.hasOwn`), not
   merely a value-equality.
5. **Evidence integrity — PASS.** `receipts/test.json`: argv `deno task test packages/ai/tests`,
   `gitHead == actualGitHead == ff7d2de60…`, `durationMs` 1897 (inner run 1781ms — real work, not a
   90ms cache hit), **stdout.bytes 291 (non-zero)** with a tail showing `passed:150, failed:0` — no
   D-1 signature (zero-byte stdout + `(cached, inputs unchanged)`). D-1 handling was sound: the
   cached receipts were discarded, and re-verification went through direct `deno run` of the wrapper
   scripts, which bypasses the `deno task` cache layer (the suspected mechanism). I re-ran all gates
   the same way in this session (table below) and got identical counts.
6. **Out-of-scope boundary held — PASS.** Grep of the full diff for
   `output_item|call_id|output_text|content_part|response\.output|parseResponse|toTanstackChatClient|streaming`
   → no hits beyond pre-existing imports; 100% of the 124 added lines are the request-side mapper,
   its selection branch, and tests. No response-parsing or streaming code touched.

## Independently re-run gates (this session, evidence head, cache-bypassed)

| Gate | Command | Result | vs tier-a claim |
| --- | --- | --- | --- |
| check (scoped) | `deno run .llm/tools/run-deno-check.ts --root packages/ai --ext ts,tsx` | exit 0, 100 files, 0 diagnostics | match |
| lint (scoped) | `deno run .llm/tools/run-deno-lint.ts --root packages/ai --ext ts,tsx` | exit 0, 100 files, 0 findings | match |
| fmt-check (scoped) | `deno run .llm/tools/run-deno-fmt.ts --root packages/ai --ext ts,tsx` | exit 0, 100 files, 0 findings | match |
| test | `deno run .llm/tools/run-deno-test.ts -- --allow-all packages/ai/tests` | exit 0, **150 passed / 0 failed** | match (receipt 150/0) |
| exports-drift | `deno task docs:exports-drift` | PASS, real output | match |
| mcp-export-corpus | `deno task check:mcp-export-corpus` | PASS; sha256 `4f33fd93…`, 35 pkgs / 271 subpaths / 7677 symbols | differs — see Finding 3 |
| quality:scan | `deno task quality:scan` | exit 0, `findings: []`, 7 pre-existing #1276 allowances (none in packages/ai) — no new `any`/casts | match |
| arch:check | `deno task arch:check` | exit 0, only pre-existing WARNs outside packages/ai | match |
| publish dry-run | `.llm/tools/release/run-publish-dry-run.ts` | exit 0, "Success" | match (advisory detail not re-inspected) |
| deno.lock | `sha256sum` | `edfa0c24…` | match |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS (N/A route) | `PLAN-EVAL: N/A` justified in `plan.md` (base commit 0331014fe, before implementation) |
| Design section exists in worklog | **FAIL** | no `worklog.md` has ever existed in the run dir (git history: only `plan.md`+`research.md` at base; `drift.md`/`receipts/`/`tier-a.md` added in ff991165f) — Finding 1 |
| Commit slices match design plan | PASS | single slice S1 = content head ff7d2de60, matching LD-1..LD-4 exactly |
| Each slice has a passing gate | PASS | table above; PR body's claims all reproduced |
| No speculative seams (unused files) | PASS | only the mapper + one selection branch + tests; nothing unused |
| Constants used for finite vocabularies | N/A | no new vocabulary; typed `ReasoningEffort` passes through |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| low | Run-dir artifacts incomplete: no `worklog.md`, `context-pack.md`, or `supervisor.md` (never existed, not lost). Design-checkpoint and lane-identity evidence lives implicitly in `plan.md` locked decisions + `tier-a.md` + the PR body. Resume-ability is adequate for this one-slice leaf, but it deviates from the harness artifact contract. | `git ls-tree` across heads; run-dir listing | supervisor backfill (docs-only, outside the certified content) |
| low | The new integration test disables `sanitizeOps` + `sanitizeResources` (`packages/ai/tests/openai_compatible_test.ts:79–80`), suppressing op/resource-leak diagnostics for that one test. Justified by the global-fetch-stub 401 error path, but it is the only test in the file doing so. | file lines cited | none for this leaf; revisit if the test is extended |
| info | Export-corpus hash at evidence head (`4f33fd93…`) differs from the PR body's and tier-a's content-head citation (`a3c4c91e…`). Explained: the corpus is workspace-wide and the main-integration (#1758 sdk, #1743 aspire, …) changed the export surface outside `packages/ai`, whose diff between the heads is empty. Not a defect; recorded so the mismatch is not later misread as drift. | both hashes above | none |
| info | Could not independently verify: (a) D-1's cache-hit behavior itself (I did not re-run `run-gate.ts` to reproduce it — its diagnosis is accepted on the recorded receipt description and confirmed indirectly, since my direct-wrapper re-runs all produced real, non-empty output); (b) the `test.json` receipt was cut in the author's leaf worktree (`cwd` `007-leaf-1591`) — content is pinned by `gitHead == actualGitHead` and by my own 150/0 re-run here. | this file | none |

## Arch-Debt Delta

New entries: 0 · Resolved: 0 · Deepened: 0 · Unrecorded violations: 0. D-1 is harness-tooling drift
(`drift.md`), not architecture debt; nothing in this diff introduces a doctrine violation.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| `run-gate.ts` should detect/reject the `(cached, inputs unchanged)` stderr marker (D-1) | zero-byte-stdout PASS receipts certify nothing | all lanes using `run-gate.ts` | high — already recorded in `drift.md` |

## Anti-Pattern Check

All AP rows N/A — the diff touches one pure function, one ternary selection branch, and two test
files; no layering, inheritance, barrel, naming, or permission surface. Doctrine fitness covered by
`arch:check` exit 0 and `quality:scan` `findings: []` (no new `any`/casts, no new
`deno-lint-ignore`/`as unknown as` introduced).
