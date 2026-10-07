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
