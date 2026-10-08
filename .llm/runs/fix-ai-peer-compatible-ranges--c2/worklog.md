# Worklog

## Design

Public surface and domain: Pin the existing qualified AI core/provider family and add an all-admitted-version peer metadata plus cold Deno resolution guard; preserve provider transport and validate production bundling

Ports: preserve existing owning package contracts. Constants: existing finite vocabulary; additional values only when needed by the issue. Contributor path: extend existing implementation and adjacent regressions.

Commit slices: bootstrap plan, source/test/mutation evidence, independent evaluation evidence. No speculative files.

PLAN-EVAL: N/A: issue and registry evidence fully specify the bounded compatibility contract; exact pins avoid a framework/API upgrade decision

## Nine phases

1. Bootstrap: clean clone, fetch, fresh branch from current main.
2. Research: issue, MCP, selected skills/doctrine and existing implementation examined.
3. Plan & Design: locked design recorded above.
4. Plan-Gate: N/A: issue and registry evidence fully specify the bounded compatibility contract; exact pins avoid a framework/API upgrade decision
5. Implement: pending.
6. Gate: pending; raw exit codes to be recorded.
7. Evaluate: pending; independent different-vendor session mandatory.
8. Release: N/A, owner explicitly requires unmerged PRs.
9. Close: pending source delivery and handoff; publication remains owner work.

Gate `baseline-peer-guard`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/deps/check-ai-peers.ts`. Full raw output retained privately.

Gate `peer-regression`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `fixed-peer-guard`: raw exit `0`. Command: `deno task deps:check:ai-peers`. Full raw output retained privately.

Gate `mutation-peer-policy`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `restored-peer-regression`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `provider-suite`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/ai/tests plugins/ai/tests`. Full raw output retained privately.

Gate `bundle`: raw exit `1`. Command: `deno bundle --frozen --platform deno --minify --output <private-evidence> packages/ai/anthropic.ts packages/ai/openai-compatible.ts`. Full raw output retained privately.

Gate `lint`: raw exit `2`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/deps --include check-ai-peers --ext ts`. Full raw output retained privately.

Gate `fmt`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/deps --include check-ai-peers --ext ts`. Full raw output retained privately.

Gate `jsr-ai`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/ai --text`. Full raw output retained privately.

Gate `doc-ai`: raw exit `1`. Command: `deno task doc:lint --root packages/ai`. Full raw output retained privately.

Gate `quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/ai --root packages/fresh --ext ts,tsx`. Full raw output retained privately.

Gate `lint-corrected`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --config <private-evidence>`. Full raw output retained privately.

Gate `bundle-corrected`: raw exit `0`. Command: `deno bundle --frozen --platform deno --minify --outdir <private-evidence> packages/ai/anthropic.ts packages/ai/openai-compatible.ts`. Full raw output retained privately.

Gate `lint-final`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --config <private-evidence>`. Full raw output retained privately.

Gate `peer-regression-final`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `source-check-final`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `durable-peer-guard`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate ai-peer-resolution --id c2-ai-peer-resolution --output <private-evidence>`. Full raw output retained privately.

Gate `durable-peer-guard`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate ai-peer-resolution --id c2-ai-peer-resolution --output <private-evidence>`. Full raw output retained privately.

Gate `lint-final`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --config <private-evidence>`. Full raw output retained privately.

Gate `peer-regression-final`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `source-check-final`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `doc-ai-baseline`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-doc-lint.ts --root <private-evidence>`. Full raw output retained privately.

Gate `mutation-live-manifest`: raw exit `1`. Command: `deno run --no-lock --allow-read --allow-write --allow-run --allow-env .llm/tools/deps/check-ai-peers.ts`. Full raw output retained privately.

Gate `publish-ai`: raw exit `0`. Command: `deno task --cwd packages/ai publish:dry-run`. Full raw output retained privately.

Gate `assets-carrier`: raw exit `0`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

Gate `publish-ai-restored`: raw exit `0`. Command: `deno task --cwd packages/ai publish:dry-run`. Full raw output retained privately.

Gate `published-negative-guard`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run --allow-env .llm/tools/deps/check-ai-peers.ts --published-version 0.0.7`. Full raw output retained privately.

Gate `fmt-final`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `gates-suite`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/gates`. Full raw output retained privately.

## Source gate result

The cold published 0.0.7 consumer independently reproduces incompatible adapter/core peers. Original declarations fail the new live guard (exit 1); qualified exact declarations pass (exit 0). The one new policy regression passes; disabling the peer comparison fails it (exit 1), restoring source passes (exit 0). Widening the real Anthropic manifest range independently fails the live guard (exit 1), restored pins pass. Published-version mode correctly rejects 0.0.7 (exit 1); it is a negative reproduction, not fixed-published proof.

Final source check, package check, lint, format, provider/plugin suite (165 pass), existing gate-runner suite, production provider bundles, publish dry-run, JSR audit, assets carrier, quality:scan and arch:check exit 0. Earlier lint selection and bundle invocation errors were corrected; their initial exits are retained above.

Doc lint exits 1 on both unchanged main and the changed branch, with identical per-entrypoint private-type diagnostics. This baseline finding is registered in arch-debt for independent review; no doc-lint pass is claimed.

Reconcile: PR #2087 references #2036 without a closure claim because coordinated publication and consuming-release qualification are outstanding. S2 source/dependency implementation is complete; independent evaluation is next. Public implementation changes contain no operator identities or locations.

Gate `peer-receipt-committed`: raw exit `1`. Command: `deno run --allow-all .llm/tools/gates/run-gate.ts --gate ai-peer-resolution --invocation c2-ai-peer-resolution-committed --output <private-evidence>`. Full raw output retained privately.

Gate `peer-receipt-committed-corrected`: raw exit `0`. Command: `deno run --allow-all .llm/tools/gates/run-gate.ts --gate ai-peer-resolution --id c2-ai-peer-resolution-committed --output <private-evidence>`. Full raw output retained privately.

## Completion

Independent GLM IMPL-EVAL PASS at `987048499e80d42b8f8aa65905d8f8558c818672` (source `b03385dc31cfee4df098639d5c22cd616db38d00`), with explicit unchanged baseline documentation debt. A post-commit durable peer receipt now pins that evaluated head and passes; initial receipt CLI typo failed before execution and was corrected. Phases 5 implementation, 6 source gates, 7 independent evaluation and 9 source handoff complete. Phase 8 release remains owner work. No merge/publication.

# AI peer correction plan

CI reveals Fresh UI private lock stale after manifest changes and reports @tanstack/openai-base@0.10.16 peer ^0.59.0 against core 0.52.3. The first guard wrongly selected only @tanstack/ai-* packages, omitting openai-base. The first source PASS is superseded for final scope.

Use the latest exact peer-coherent family: core 0.65.1, Anthropic 0.19.5, OpenAI 0.27.0, MCP 0.8.0 (its actual core dependency ^0.65.0), Preact 0.20.0. Transitive openai-base 0.12.4 peers ^0.65.0, ai-client 0.38.0 aligns. Inspect public upstream API through package source; adapt only owning bridge if changed. Provider behavior regressions must still pass; no release claims. Pins alone cannot freeze future transitive patches, so live guard examines every npm package with an AI core peer, independent of name prefix, plus enforces exactly one core. Add the missing transitive package regression to existing meaningful policy test or new graph-selection regression, with causal mutations.

Refresh root and Fresh UI private lock only required graph edges and preserve unrelated versions where native update refreshes metadata; do not accept new advisory baseline. Run both frozen provider/Fresh/FreshUI checks after selective refresh, provider suite, production bundles, all required quality/JSR/publish gates. Update documented family and guard description. Independent PLAN-EVAL required because this amendment upgrades multiple upstream APIs. After PASS implement, then a new independent IMPL-EVAL on final source. Refs #2036 until a fixed published consumer exists.

Qualification update before implementation: default Deno dependency-age policy rejects newly-published core 0.65.1 and Preact 0.20.0. The cold graph for core 0.65.0 / Anthropic 0.19.5 / OpenAI 0.27.0 / MCP 0.8.0 / Preact 0.19.5 resolves one core, no unresolved modules, under the unchanged default age policy. Select that exact family; transitive ai-client 0.37.0 and openai-base 0.12.4 align. Preserve the policy; do not disable it. The independent evaluator should adjudicate this qualified candidate before source implementation. Evidence retained privately.

## Amendment plan remediation (independent FAIL_FIX)

Locked qualified family: core 0.65.0, Anthropic 0.19.5, OpenAI 0.27.0, MCP 0.8.0, Preact 0.19.5; transitive ai-client 0.37.0, openai-base 0.12.4. The preceding patch candidate is selected because the newer core/Preact pair fails default dependency-age qualification. Cold graph resolves one core with no module errors; independently verify peers before PASS. No global age policy change.

Ordered amendment slices (each under 30 files):

1. A1 family manifests: packages/ai/deno.json and packages/fresh/deno.json. Prove declared peer compatibility with registry metadata and frozen package check.
2. A2 graph peer sweep: .llm/tools/deps/check-ai-peers.ts and check-ai-peers_test.ts. Inventory every resolved npm package without a name-prefix assumption; metadata supplies the actual AI core peer. Bound registry subprocess concurrency. Keep exactly-one-core enforcement. Add graph-selection regression; mutations MUST disable graph selection and peer-policy separately, each fail then restored pass. Structured test and cold guard prove this slice.
3. A3 lock refresh: root deno.lock and packages/fresh-ui/deno.lock; update required AI-family graph edges only, preserve unrelated pinned versions. Frozen AI/Fresh/FreshUI checks detect missing graph edges. No new advisory baseline.
4. A4 owned bridge qualification and docs: inspect upgraded upstream APIs used by packages/ai/src/adapters and Fresh AI; edit owning bridge only if required. README/run update. Provider suite and production bundles prove behavior; scoped lint/fmt, quality:scan, arch:check, JSR audits, all-export doc lint and publish dry-runs prove ownership/publishability. Baseline F-7 debt explicitly adjudicated.
5. A5 new independent IMPL-EVAL on final source; original source PASS remains superseded. No merge/publication.

Risk register: API drift across pre-1.0 minor releases -> inspect upstream definitions, adapt owning bridge only, prove provider streaming/tools/usage/abort and production bundles; selective lock drift -> preserve unrelated original records, frozen check both locks and review semantic diff; peer surprises -> optional unchanged peers remain absent unless checks require them, exactly-one-core catches MCP/client dependency divergence; guard cost -> bounded subprocess concurrency and deduplicated exact metadata specifiers, structured one-line result; age policy -> use the default-age-qualified family, no policy bypass; shipment -> owner release and exact published consumer gate remain open.

Open-decision sweep: regression host must resolve now, selected exported graph-inventory helper exercised directly by new regression (existing policy regression retained). Optional peers safe to defer: status-quo absence with frozen checks as detector. Lock refresh mechanism safe to defer: native update plus reviewed selective restoration and frozen checks. API adaptations safe to defer until upstream/source check: only owning adapter files, any public contract change re-audited, material design drift returns to PLAN-EVAL. Version choice settled above; no other material decisions open.

JSR rubric before slices: exported AI/Fresh public contracts remain owned/native; AbortSignal, message/tool/usage port types stay unchanged. Upstream-derived bridge typings/re-exports can change under upgrade, creating private references/slow types or incompatible consumer contracts; all-export deno doc --lint, publish dry-run and audit-jsr-package run for AI/Fresh, and Fresh UI consumer checks/publication where touched. Re-audit any shifted public surface and rescope rather than publish an unqualified break. Existing baseline AI private-type documentation debt is explicitly accepted only by independent evaluator; never declare doc-lint green from a zero combined summary. Native fixture imports and production bundle also check consumer resolution.

Independent amendment PLAN-EVAL PASS at `46ec3293b5f5474ab7816786d5221af536cae50f`; all five plan findings remediated, default-age-qualified family independently verified. Source implementation unblocked. Original IMPL-EVAL remains superseded.

Gate `amendment-refresh-root`: raw exit `0`. Command: `deno cache --frozen=false packages/ai/anthropic.ts packages/ai/openai-compatible.ts packages/fresh/src/runtime/ai/mod.ts`. Full raw output retained privately.

Gate `amendment-refresh-fresh-ui`: raw exit `0`. Command: `deno task --cwd packages/fresh-ui lock:update`. Full raw output retained privately.

Gate `amendment-peer-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `amendment-frozen-fresh-ui-check`: raw exit `0`. Command: `deno task --cwd packages/fresh-ui check`. Full raw output retained privately.

Gate `amendment-frozen-source-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/ai --root packages/fresh --ext ts,tsx`. Full raw output retained privately.

Gate `amendment-mutation-selection`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `amendment-mutation-policy`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `amendment-restored-peer-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `amendment-frozen-source-explicit`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/ai --root packages/fresh --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `amendment-cold-full-peer-guard`: raw exit `0`. Command: `deno task deps:check:ai-peers`. Full raw output retained privately.

Gate `amendment-provider-suite`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/ai/tests plugins/ai/tests`. Full raw output retained privately.

Gate `amendment-bundle`: raw exit `0`. Command: `deno bundle --frozen --platform deno --minify --outdir <private-evidence> packages/ai/anthropic.ts packages/ai/openai-compatible.ts`. Full raw output retained privately.

Gate `amendment-jsr-ai`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/ai --text`. Full raw output retained privately.

Gate `amendment-doc-ai`: raw exit `1`. Command: `deno task doc:lint --root packages/ai`. Full raw output retained privately.

Gate `amendment-publish-ai`: raw exit `0`. Command: `deno task --cwd packages/ai publish:dry-run`. Full raw output retained privately.

Gate `amendment-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `amendment-lint`: raw exit `2`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --config <private-evidence>`. Full raw output retained privately.

Gate `amendment-fmt`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --file packages/ai/README.md`. Full raw output retained privately.

Gate `amendment-guard-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `amendment-jsr-fresh`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh --text`. Full raw output retained privately.

Gate `amendment-doc-fresh`: raw exit `1`. Command: `deno task doc:lint --root packages/fresh`. Full raw output retained privately.

Gate `amendment-publish-fresh`: raw exit `0`. Command: `deno publish --dry-run --allow-dirty --config packages/fresh/deno.json`. Full raw output retained privately.

Gate `amendment-fresh-doc-baseline`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-doc-lint.ts --root <private-evidence>`. Full raw output retained privately.

Gate `amendment-lint-corrected`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --config <private-evidence>`. Full raw output retained privately.

Gate `amendment-carrier-freshness`: raw exit `0`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

Gate `amendment-fresh-doc-baseline-corrected`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-doc-lint.ts --root <private-evidence>`. Full raw output retained privately.

Gate `amendment-fresh-doc-baseline-workspace`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-doc-lint.ts --root <private-evidence>`. Full raw output retained privately.

## Amendment source qualification

Qualified exact family core 0.65.0, Anthropic 0.19.5, OpenAI 0.27.0, MCP 0.8.0, Preact 0.19.5; full cold inventory passes with one core and all resolved core-peer holders considered, no prefix filtering. Two regressions pass; prefix-selection mutation kills the new inventory test and disabled peer-policy kills assertions; restored pair passes. Provider/plugin suite 165 pass, zero fail. Explicit frozen AI/Fresh source and Fresh UI private lock checks pass, as do production provider bundles, quality/architecture, lint/fmt, JSR audits, AI/Fresh publish dry-runs and carrier freshness. No owning bridge change needed after qualified upgrade.

Both locks preserve every unrelated version. Native metadata refresh/pruning was selectively restored; added MCP v2/jose/AG-UI graph edges belong to the AI upgrade. Existing jose 6.2.3 retained and dependency edges qualified alongside new 6.2.12. Lock ordering and compact platform arrays retained.

AI doc-lint has exact same per-entry diagnostics as original baseline. Fresh doc-lint also has identical per-entry counts and exits on a complete source baseline archive preserving workspace globs; preliminary incomplete-archive probes were invalid and are superseded by the valid comparison. Fresh AI exports have zero doc errors. Explicit fresh-doc-baseline-2036 records the unchanged F-7 finding for evaluator adjudication. Missing private lint config attempt failed before lint and corrected config passed. No false-green combined doc summary claim.

Original IMPL-EVAL superseded; a fresh independent amendment evaluation is required next. Publication and successful fixed published consumer remain open.

Gate `amendment-durable-peer-receipt`: raw exit `0`. Command: `deno run --allow-all .llm/tools/gates/run-gate.ts --gate ai-peer-resolution --id c2-ai-peer-amendment --output <private-evidence>`. Full raw output retained privately.

Gate `amendment-published-negative`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run --allow-env .llm/tools/deps/check-ai-peers.ts --published-version 0.0.7`. Full raw output retained privately.

## Final amended evaluation

Independent GLM max IMPL-EVAL PASS at source `f413a1f612683f054d44d74297627129987feff9`, actual evaluation head `d5c07c0874eb561f130957d1867bd84ff2c5dd6d`. Report `amendment-evaluate.md` supersedes the original source verdict. Reviewer independently reran both regressions (2 pass) and the live cold resolution guard (one core 0.65.0). Both unchanged doc baseline rows explicitly DEBT_ACCEPTED. Source phases 5–7 complete; review phase ready. No merge/publication; fixed published-consumer receipt remains owner work. Report-record commit reused the prior brief message after unavailable python alias; this follow-up correctly records completion.

Final B1–B3 independent PLAN-EVAL PASS at f9ba4e3515000c45f2ac7ec0456fe06ad8fe4590; fresh GLM max report review-plan-evaluate.md. Earlier reused-session review produced no applicable verdict and is discarded; no source implementation preceded this PASS. All bounded fixes and required one-pass scaffold gate obligations retained.

Gate `review-fmt-write`: raw exit `2`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --file packages/cli/src/kernel/adapters/scaffold/import-resolver.ts --file packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts --write`. Full raw output retained privately.

Gate `review-guard-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `review-mutation-equals`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `review-mutation-mixed-peers`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `review-restored-guard-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `review-lint`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --file packages/cli/src/kernel/adapters/scaffold/import-resolver.ts --file packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts --config <private-evidence>`. Full raw output retained privately.

Gate `review-guard-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `review-live-cold`: raw exit `1`. Command: `deno task deps:check:ai-peers`. Full raw output retained privately.

Gate `review-cli-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts`. Full raw output retained privately.

Gate `review-fmt-final`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --file packages/cli/src/kernel/adapters/scaffold/import-resolver.ts --file packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts --config <private-evidence> --write`. Full raw output retained privately.

Gate `review-mutation-equals`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `review-mutation-mixed-peers`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `review-fmt-final`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --file packages/cli/src/kernel/adapters/scaffold/import-resolver.ts --file packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts --config <private-evidence> --write`. Full raw output retained privately.

Gate `review-mutation-equals`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `review-mutation-mixed-peers`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `review-restored-guard-tests`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-ai-peers_test.ts`. Full raw output retained privately.

Gate `review-cli-doc`: raw exit `0`. Command: `deno task doc:lint --root packages/cli`. Full raw output retained privately.

Gate `review-cli-jsr`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text`. Full raw output retained privately.

Gate `review-scaffold-runtime`: raw exit `1`. Command: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`. Full raw output retained privately.

Gate `review-cli-publish`: raw exit `0`. Command: `deno task --cwd packages/cli publish:dry-run`. Full raw output retained privately.

Gate `review-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `review-live-cold-final`: raw exit `0`. Command: `deno task deps:check:ai-peers`. Full raw output retained privately.

Gate `review-final-lint`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --file packages/cli/src/kernel/adapters/scaffold/import-resolver.ts --file packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts --config <private-evidence>`. Full raw output retained privately.

Gate `review-final-fmt`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --file packages/cli/src/kernel/adapters/scaffold/import-resolver.ts --file packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts --config <private-evidence>`. Full raw output retained privately.

Gate `review-final-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/deps/check-ai-peers.ts --file .llm/tools/deps/check-ai-peers_test.ts --file packages/cli/src/kernel/adapters/scaffold/import-resolver.ts --file packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `review-published-negative-equals`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run --allow-env .llm/tools/deps/check-ai-peers.ts --published-version=0.0.7`. Full raw output retained privately.

Gate `review-published-negative-space`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run --allow-env .llm/tools/deps/check-ai-peers.ts --published-version 0.0.7`. Full raw output retained privately.

Gate `review-carrier`: raw exit `0`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

B1–B3 slice review: strict std parser now accepts both exact-version forms and rejects missing, duplicate, unknown or invalid inputs before workspace reads. Registry loader enumerates versions then queries every exact release's peer metadata, bounds concurrency, accepts peer-less blank output and npm's singleton exact-result array. Fixture has a peer-less first, incompatible intermediate and compatible last release. Both new regressions fail under causal source mutation and pass restored (4/4). A first metadata mutation did not apply after formatting; its zero exit is invalid evidence, superseded by verified applied mutation/exit 1. Initial fmt coverage refusal corrected with explicit scoped config; subsequent coverage is complete.

CLI sole MCP pin and adjacent existing assertions now match exact owning 0.8.0; existing workspace-mutator plus resolver suites pass both modes. Frozen selected check, lint/fmt, quality scan/architecture, carrier freshness, CLI JSR audit, all-export docs and publish dry-run pass. Live lock-free guard passes one core 0.65.0. Both genuine published 0.0.7 argument forms fail on the same actual Anthropic/OpenAI/openai-base peer conflicts; no publication claim.

Required one-pass scaffold.runtime actually ran, raw exit 1: preflight.aspire and cleanup.aspire-stop failed because required runtime infrastructure is unavailable. Deno preflight passed; no skipped suite is reported green. Merge readiness remains blocked pending successful qualified CI receipt (e2e-cli-gate opt-in retained). CLI source pin cannot ship independently of coordinated AI family. Existing AI/Fresh documentation baseline debt remains unchanged. Fresh independent IMPL-EVAL required for B delta.
