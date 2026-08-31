# IMPL-EVAL — fix-saga-publisher-receipt-discipline--0.0.7 (cycle 1)

- Evaluator session: OpenRouter open-model route · **z-ai/glm-5.3-flash** · 2026-08-31 · separate session from the generator
- Launcher: checked-in current-main `openrouter-run.ts` from `projects/netscript/repo`, cwd pinned to this worktree
- Requested effort: `max`. **Attested:** the evaluator confirms the model id from its environment but states it **cannot independently attest the effort knob**; `max` is recorded as the *requested configuration*, not as verified.
- Evaluated head: `ecb82ae2e`
- Filed by the supervisor at the evaluator's explicit request (it was read-only and wrote no file).

VERDICT: PASS_IMPL

**Independence note:** I am a separate session from the generator; every claim below was re-derived from the diff, commit objects, and re-executed gates, not accepted from `worklog.md`. Per the dispatch constraint ("do not modify, create, or delete any file") I did **not** write `evaluate.md`; this report is the durable record and the supervisor should file it.

## Claim table

| Claim | Verdict | Deciding evidence |
|---|---|---|
| **A. Ceiling integrity** | **UPHELD** | `git diff 0274c0a70..HEAD --name-only` (main tip merged at `b9dcf5a7c`) = exactly **20 paths, all in the locked 21-path ceiling** (conditional path 18 `packages/cli/…/publish-assets.generated.ts` correctly untouched), plus this run's `.llm/runs/…` artifacts. Per-commit audit of all 14 leaf-authored non-merge commits shows zero non-ceiling product paths. Merge commits verified as pure main merges (second parents `8a9257642` #1764, `6bb27e46a` #1796, `0274c0a70` #1800). The extra files in the raw `5197e70b7..HEAD` diff (e.g. `docs/site/reference/mcp/index.md`, telemetry files) are main's, attributed: `git log 5197e70b7..0274c0a70 -- docs/site/reference/mcp/index.md` → `0274c0a70 (#1800)`. |
| **B. Red-before/green honesty** | **UPHELD** | S2.1 RED `2f913f237`: **only** the test file; `git show 2f913f237:…/publisher/mod.ts` contains **0** references to `publish-saga-or-throw` → all 3 tests provably fail on the missing export. S2.2 RED `6276cee76`: **only** the test file; `git show 6276cee76:scan-code-quality.ts \| grep discarded` → **empty** (rule absent), yet the test asserts `discarded-saga-publisher-result` findings (string-interpolated, so it type-checks) → the 2 finding-tests must fail at RED. S2.3 RED `3567b2449`: **only** the sync test; docs at that SHA still contained the discard (`grep -c "await sagaPublisher.publish({ type: 'UserSettingsCreated'"` → 1) while the workers template already discriminated (`grep -c "if (!publishResult.published)"` → 1), and `deno.json` was **not** wired (test run directly). Each GREEN touches only the product file(s): `c123a577a`, `23ea20afc`, `350bf31ee`. |
| **C. Helper is not theatre** | **UPHELD** | `publish-saga-or-throw.ts:31-38` awaits `publisher.publish`, returns the accepted result (generic `TNextMessage['type']` preserved), throws `SagasError.retryable`/`.nonRetryable` with the rejected receipt as `cause` and publisher id + messageType + reason in the diagnostic. Tests prove substance, not shape: `assertStrictEquals(result, receipt)` (identity, not a rebuilt object), options forwarding, both error codes, `assertStrictEquals(error.cause, rejection)`. Port doc states the policy once (`saga-publisher-port.ts` diff). `deno doc` confirms the value on **both** entrypoints (`plugins/sagas/src/runtime/mod.ts` and the core publisher subpath). No new port method, error class, or dependency — matches D-1365-N1/N2. |
| **D. Scanner rule fires, no false positives** | **UPHELD** | Rule detects standalone awaited `.publish`/`.publishMany` on factory-bound (`= createSagaPublisher`) and `SagaPublisherPort`-typed receivers, multiline calls, docs fences (with fenceOrdinal), and strings inside emitted templates — 3 dedicated tests in `scan-code-quality_test.ts:194-287`. Consumed forms (`const receipt = …`, `return …`) and unrelated publishers (`createEventPublisher`) proven non-flagged. **Repo-wide: `deno task quality:scan:repo` → exit 0, `findings: []`, `allowCount: 7` (all issue #1276), `allowanceFailures: []`** — exactly the 7 pre-existing allowances, zero new false positives. |
| **E. Four docs corrections real** | **UPHELD** | Census: exactly **4** `await sagaPublisher.publish` sites remain in `docs/site/**`, **all 4 consumed** (`const publishResult =`, `const published =` ×2, and the JSON-encoded canonical sample which discriminates). Zero standalone discards. `docs/site/reference/sagas/index.md` no longer calls 8092 a fallback — now "Deprecated compatibility metadata; endpoint resolution does not use this value as an HTTP fallback." Storefront success-path rejection **returns** `createFailureResult` inside the `try`, so it cannot enter the catch that reinterprets failure as a payment-provider error. The sync test (`.llm/tools/docs/official-saga-publisher-sample-sync_test.ts`) is a genuine two-file comparison: it regex-extracts the template from `plugins/workers/src/cli/official-sample-configuration.ts` (a file this leaf never touched) and `JSON.parse`s the doc's `code:` string, asserts real content (`const publishResult = await sagaPublisher.publish(`), then `assertEquals(canonical, official)`. Passes in `docs:snippets:test`. |
| **F. Scope discipline** | **UPHELD** | Zero `plugins/workers/**`, discovery, `saga-publisher.ts`, e2e/probe, or README paths in the leaf's delta. Every `no-endpoint`/`8092`/`services__sagas-api`/`VITE_SAGAS` occurrence in the diff is run-artifact prose or the authorized docs correction — no excluded concern implemented. |
| **G. Lock integrity** | **UPHELD** | `sha256sum deno.lock` → `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` (exact match); `git diff 5197e70b7..HEAD -- deno.lock` → empty. |

## Gates re-run (exact numbers)

| Gate | Result |
|---|---|
| `deno task quality:scan:repo` | exit 0 — `findings: []`, `allowCount: 7` (all #1276), `allowanceFailures: []` |
| `run-deno-test.ts -- --allow-all packages/plugin-sagas-core` | exit 0 — **87 passed / 0 failed / 3 ignored** |
| `deno task docs:snippets:test` | exit 0 — **12 passed / 0 failed**, incl. `canonical saga publisher job stays source-derived from the safe workers sample` |
| `run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude …` | exit 0 — **2972 files, 25 batches, 0 failed batches, 0 error occurrences** |
| (extra) `deno test .llm/tools/quality/scan-code-quality_test.ts` | exit 0 — **28 passed / 0 failed** |

Gate 30 correctly remains `NOT_RUN` — I ran no scaffold/`e2e:cli`/Aspire/Docker command. This does not count against the leaf.

## Findings (none blocking)

1. **Minor — rule gap is contract-scoped, not infidelity:** the rule only targets *awaited* standalone calls (locked contract wording). A floating un-awaited `sagaPublisher.publish(message);` still discards the receipt and escapes the rule. Concrete scenario: a plugin author omits `await`; type-check and quality scan both stay green while the message silently drops. Recommend the diagnostic-rule follow-up extend coverage; needs explicit rescope.
2. **Minor — latent scanner edges (currently dormant, repo scan is green):** (a) `await publisher.publish(m).then(handle)` would be flagged despite consuming via `.then`; (b) `void await publisher.publish(m)` escapes (preceding `void` token defeats `isStandaloneAwait`); (c) a line that fires both an existing rule and the discarded-receipt rule reports only the former (`scan-code-quality.ts:1027-1047` else-branch). No occurrence anywhere in the repo today.

## Identity attestation

Observed model id: **`z-ai/glm-5.3-flash`** (Claude Code + OpenRouter transport, per the lane policy). Reasoning effort: I can attest the model id from the environment but **cannot independently attest the effort knob from inside the session** — the dispatch brief requested the GLM 5.3 Flash max IMPL preset; I do not claim `max` as verified, only as the requested configuration.