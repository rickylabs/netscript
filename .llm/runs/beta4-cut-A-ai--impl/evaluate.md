# Evaluation: beta4-cut-A-ai--impl

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta4-cut-A-ai--impl` |
| Target | Issue #388, plugins/ai flagship parity |
| Archetype | 5 - thin plugin plus core package |
| Scope overlays | service/e2e/docs |
| Evaluator | local implementation-session evaluation, 2026-07-05 |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS | `plan-eval.md` cycle 2 verdict is `PASS`. |
| Design section exists in worklog | PASS | `worklog.md` records boundaries, vocabulary, commit slices, gates. |
| Commit slices match design plan | PASS | `commits.md` records slices 1-9. |
| Each slice has a passing gate | PASS | `worklog.md` gate tables record targeted tests, scoped wrappers, publish dry-runs, and final runtime smoke. |
| No speculative seams | PASS | AI runtime binder is in `plugin-ai-core`; `plugins/ai` remains adapter/scaffold glue. |
| Constants used for finite vocabularies | PASS | E2E suite/gate/plugin constants added under `packages/cli/e2e/src/domain/extension-axes.ts`. |

## Static Gates

| Gate | Command or check | Result | Evidence |
| --- | --- | --- | --- |
| Narrow typecheck | `deno test --unstable-kv packages/plugin-ai-core/tests/contracts/ai-contract-soundness_test.ts` | PASS | 1 test passed. |
| Slice typecheck | scoped `run-deno-check.ts` over `packages/plugin-ai-core`, `plugins/ai`, `packages/cli/e2e`; post-fix `plugins/ai` rerun | PASS | 114 files pass pre-smoke; 30 AI files pass post-fix. |
| Format | scoped `run-deno-fmt.ts --ext ts,tsx` | PASS | 114 files pass pre-smoke; 30 AI files pass post-fix. |
| Lint | scoped `run-deno-lint.ts --ext ts,tsx` | PASS | 114 files pass pre-smoke; 30 AI files pass post-fix. |
| Doc lint | `deno task doc:lint --root packages/plugin-ai-core`; `deno task doc:lint --root plugins/ai` | WARN | Wrapper exits 0 but reports transitive private-type references; package publish dry-runs pass. |
| Publish dry-run | `deno publish --dry-run --allow-dirty` in `packages/plugin-ai-core` and `plugins/ai`; root `deno task publish:dry-run` | PASS | Package dry-runs and root publish dry-run completed. |
| Link/path check | Exact `plugins/ai/deno.json` export map | PASS | Exports include `.`, `./adapter-cli`, `./public`, `./plugin`, `./adapter`, `./scaffold`, `./contracts`; no wildcard subpath. |

## Fitness Gates

| Gate | Function | Result | Evidence |
| --- | --- | --- | --- |
| F-5/F-6 | Public surface and JSR publishability | PASS | Exact export map; package/root publish dry-runs pass. |
| F-10 | Test-shape audit | PASS | Contract soundness, scaffold golden, doctor, verify, CLI registry/runtime tests. |
| F-11/F-12 | Forbidden-folder and naming conventions | PASS | Generated AI artifacts stay under `ai/`; golden tests assert paths and emitter names. |
| F-19 | Scoped source gate runners | PASS | Scoped check/lint/fmt wrappers used for touched roots. |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| `scaffold.runtime` | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS | Raw exit 0; summary `passed=50 failed=0 skipped=0`; `behavior.ai-chat-route` passed. |
| Aspire CLI | `aspire --version`, `aspire doctor --non-interactive`, `aspire ps`, suite `aspire restore/start/wait/describe/stop` | PASS | Aspire 13.4.6; doctor passes with SSL_CERT_DIR warning; no AppHosts left running after cleanup. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Generated scaffold workspace | Full runtime smoke type-checks generated workspaces and imports generated AI chat route | PASS | `generated.deno-check` and `behavior.ai-chat-route` passed in the final smoke. |
| `@netscript/plugin-ai` consumers | Package publish dry-run with included scaffold manifests | PASS | `plugins/ai` dry-run includes `scaffold.plugin.json` and `scaffold.runtime.json`. |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| --- | --- | --- | --- |
| AP-1/AP-2 layering | CLEAR | Router binding lives in `plugin-ai-core`; plugin adapter stays thin. | Doctrine thin-plugin law followed. |
| AP-11 forbidden generated paths | CLEAR | Golden tests assert generated paths. | No scaffold output under framework internals. |
| AP-15 re-export upstream | CLEAR | Plugin exports adapter/public/plugin/scaffold/contracts explicitly. | No wildcard export map. |
| Other APs | N/A | Outside touched surface. | No new debt entry required. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | Drift recorded in `drift.md`; no doctrine debt file needed for this slice. |
| Resolved entries | 0 | N/A |
| Deepened violations | 0 | No accepted doctrine violation. |
| Unrecorded violations | 0 | Known install-variant gap recorded in `drift.md`. |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| medium | Public `plugin install` still does not expose plugin-specific `--persist-threads`/`--mcp` variants as CLI flags. | `drift.md` | Track in follow-up; beta.4 wires default runtime smoke and records MCP beta.6 stub. |
| low | Direct doc lint reports transitive private-type references despite publish dry-run success. | `worklog.md` JSR doc lint row | Keep visible in PR; no publish blocker observed. |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | PASS |
| Rationale | The AI plugin now has contract-bound core routing, golden/doctor/verify coverage, publishable exact exports, and a passing full native WSL `scaffold.runtime` smoke including the generated AI route. Recorded drift is explicit and scoped. |
