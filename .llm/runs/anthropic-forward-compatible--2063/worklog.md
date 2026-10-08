# Worklog

## 2026-10-05 — reproduce and fix

Input: construct `AnthropicModelProvider({ apiKey: 'test-key', models: ['claude-future-test'] })`. Observed on baseline: `supports` is false and construction throws before any request. Expected: configured ID resolves/constructs while unconfigured IDs reject. The new regression failed twice by assertion on the unchanged source (not type errors); retained in `regression-before.json`. Source change then passes both assertions. Expanded suite: 10 passed/0 failed, exit 0, `regression-after.json`.

Root cause: baseline `packages/ai/src/adapters/anthropic.adapter.ts:156` checks only global catalog IDs (construction at line187), and `packages/ai/anthropic.ts:35` drops additive config in the registered factory. Instance catalog and public factories now use explicit IDs. No SDK/global registry mutation.

Native compatibility: exact Opus 5.5/Fable 5.1 IDs retain mandatory thinking; Sonnet 5.5 `off` uses between_tools. Effective merged request/call options are validated, covering the previously unchecked providerOptions path. Mocked real SDK transport preserves selected model, endpoint, per-turn keys, reasoning/text, tools/results, usage, abort and errors.

The tool regression failed with six requests for two owned calls because TanStack defaults to three model iterations and generates placeholder client-tool results. Explicit `maxIterations(1)` restores the documented single-turn port (baseline bridge header and `packages/ai/src/ports/chat-client.ts`). The new test now checks exactly two requests with real caller-supplied results.

GLM 5.3 Flash/provider_default on guarded OpenCode Go replied ROUTE_OK to the bounded preflight, exit 0. Actual independent implementation evaluation still pending. The launcher validates live expense and exact matrix route before inference; no handcrafted provider bypass.

The mock usage frame includes cumulative input/output token fields, matching the selected adapter’s normalization. Streaming compatibility has not been tested by paid live inference. Existing 0.18.3 adapter emits usage from message_delta; input counts supplied only in message_start remain a dependency follow-up, not silently certified here.

## Broader gates and release evidence

Full `deno task check`: 3162 files across27 batches, zero failed batches/errors, plus desktop fixture import-map check PASS. Full `deno task test`:5418 passed/9 failed/19 ignored; every failure is in executable browser fixtures on the noexec TMPDIR or export-corpus tests whose git shim relocates temporary worktrees. Retest with executable TMPDIR and native git is recorded separately; no source repair is needed for those failures. The initial full run overlapped the evaluator’s baseline restore; targeted fixed regressions are independently rerun and the full suite is rerun after isolation is corrected.

`deno task e2e:cli` -> scaffold.runtime failed at preflight.aspire/cleanup.aspire-stop: missing Aspire binary and unavailable Docker daemon. No code-dependent scaffold steps ran. See `e2e-cli.log`; rerun the CLI E2E merge gate in an Aspire-capable environment. This gate is unproven locally. AI publish dry-run, quality scan, doc accuracy/export/prose/publish-assets checks passed.

Released0.0.7 with exact consumer core0.52.3/adapter0.18.3 rejects all three requested IDs with0 provider requests (`published-consumer-exact-graph.json`). An unpinned consumer resolves adapter0.18.13 and constructs Fable while Opus/Sonnet reject (`published-consumer.json`). Source workspace core0.52.0/adapter0.18.3 and isolated exact consumer core0.52.3/adapter0.18.3 both pass10/10. Stable0.0.8 publication, released-fixed-package qualification and paid live inference remain outstanding; no publication or live provider proof is invented.

Independent GLM returned PASS for51d8e10d5 and reproduced both assertion failures and the single-turn tool regression. Launcher cwd was the evaluation checkout, but reviewer tool arguments incorrectly selected the author checkout; its first report claims isolation inaccurately. The same evaluator session was re-steered to repeat reproduction in the detached checkout and correct the report. No source mutation remains.

Raw evaluator tool traces are retained in the ignored run private/ directory; the public verdict and structured receipts preserve independent verification without copying retrieved vendor pages or session internals. The project runs parent is not writable in this environment.

Corrected GLM source evaluation: PASS at51d8e10d5. Detached-checkout receipts independently reproduce both baseline assertion failures (exit1 each), restore fixed source byte-for-byte, pass10/10 regression and201/201 entire AI/plugin selection, and pass10/10 on exact consumer0.52.3/0.18.3. First plugin-only receipt counted26 from three files; complete plugin selection is34 from six files, plus167 AI =201. Corrected evaluate.md discloses first-checkout deviation; evaluation-launch.json records the same-session repair.

## Final local gate results

CI Deno2.9.5/native Git/executable project TMPDIR full repository test:5425passed,2failed,19ignored, exit1. The two remaining hook decoy fixtures explicitly reject TMPDIR paths containing worktrees (claude-hook-log_test.ts:192); the corpus tests need their actual detached worktrees there under this host's layout rules. Rerun ONLY those two hook cases with TMPDIR=/tmp:2passed/0failed, exit0. Thus all5427active test cases have passing evidence across compatible runs, but no single full invocation is claimed green. Keep both exact receipts and verification.json. Source and dependency files were not changed to accommodate this host.

Corrected independent GLM verdict PASS. Generated documentation carriers are committed; all associated freshness checks pass. Harness build14stages and test6stages PASS. Release and live/E2E limits remain as stated. Drafts will be updated and marked ready without remote CI polling or waiting for merge.

## Continued completion audit

Published-package acceptance is incomplete: registry metadata still latest0.0.7, no stable0.0.8. Both PRs are open and ready. Source-only PASS cannot satisfy requested-scope item5. The release skill requires a same-content canary publish + production E2E pair and prohibits local/per-slice publication. Prepare the exact stable public-export consumer check without triggering a coordinated framework release for this slice.

Corrected the standard Messages fixture: input_tokens appears only in message_start; final delta contains output_tokens8. Before the repair, the exact transport regression fails by assertion promptTokens0 vs3 (standard-usage-before.json). A per-turn observer uses the documented public Logger provider-frame hook to retain only valid reported counters, cache details and server-tool counters; it logs nothing and never mutates SDK data. Existing registry/id/options behavior is unchanged. Tests additionally prove cumulative replacement, cache/server details, missing usage stays undefined, observer isolation across turns and privacy across all console methods. Full AI/plugin suite202passed; scoped142-file check/lint/fmt and quality gatePASS. Public-export source rehearsal passes11 on core0.52.3/adapter0.18.3 and explicitly reports publishedConsumerProof:false.

## Continuation verification at source9e375a176

Standard message_start input plus output-only message_delta failed by assertion before repair (`standard-usage-before.json`), then all11 public source-consumer regressions and202AI/plugin cases pass. Scoped check/lint/fmt142files and quality pass. CI Deno2.9.5 refreshed prose/provenance/CLI/MCP carriers; unchanged export corpus regenerated and its check passed. Docs accuracy and prose/publish-assets freshness pass. Fresh full source check3162files/27batches and AI publish dry-run pass (`carrier-gates-usage.json`). Exact published0.0.7 public exports fail the new models type check; planned stable0.0.8 resolves no exact modules. Both proof=false; registry metadata latest0.0.7, no stable0.0.8. A source rehearsal is recorded separately.

Independent GLM same-session round3 is evaluating new source9e375a176 in the detached checkout. This artifact and the final PR update notify the reviewer at policy round3; no new model route or fallback was selected. Full repository tests are split into the entire hook file under TMPDIR=/tmp (9PASS) and all other discovery under project/worktrees TMPDIR. These selections are disjoint; current-source complete coverage is claimed only when both receipts pass. The previous unmodified full command's host failures remain documented. Full upstream objective remains open at stable publication and released-fixed consumer acceptance. See completion-audit.md and release-adoption.md for every requirement.

Independent GLM round3 PASS at exact9e375a176: standard native-wire fixture fails prompt0 versus3 by assertion with only the usage source repair removed; both files restored byte-identically. Complete11 regression, full202AI/plugin and exact0.52.3/0.18.3 public-source rehearsal11 pass in the detached evaluator checkout. `evaluate-usage.md`, `evaluation-launch.json` and `receipts/usage-eval-*.json` preserve evidence; previous catalog evaluation remains anchored at51d8 and is not overwritten. No source findings; release gap explicitly retained.

Complete current-source root coverage: repository discovery excluding the9hook cases passes5420 with19ignored; whole hook suite passes9/9. Both exit0, disjoint total5429active PASS/0fail. Receipts repository-test-partition-usage.json and hook-suite-usage.json contain actual forwarded commands. This is complete partition coverage under the two incompatible TMPDIR requirements, not a claim that the historical unmodified full invocation was green. Native Git leaves no temporary test worktrees registered.
