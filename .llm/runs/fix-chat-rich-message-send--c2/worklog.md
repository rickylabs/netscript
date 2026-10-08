# Worklog

## Design

Public surface and domain: One documented owning rich send-input structural union separated from reduced rendering projection; direct unchanged forwarding to existing native transport and existing hub retained, native compile/identity/actual HTTP+SSE proof, no dependency or upstream export changes

Ports: preserve existing owning package contracts. Constants: existing finite vocabulary; additional values only when needed by the issue. Contributor path: extend existing implementation and adjacent regressions.

Commit slices: bootstrap plan, source/test/mutation evidence, independent evaluation evidence. No speculative files.

PLAN-EVAL: Selected independent PLAN-EVAL PASS against immutable current main 8aad14940c52cd3a4db7efa57d56d50ae131df6c; verify fresh main equality before implementation, feature capped

## Nine phases

1. Bootstrap: clean clone, fetch, fresh branch from current main.
2. Research: issue, MCP, selected skills/doctrine and existing implementation examined.
3. Plan & Design: locked design recorded above.
4. Plan-Gate: Selected independent PLAN-EVAL PASS against immutable current main 8aad14940c52cd3a4db7efa57d56d50ae131df6c; verify fresh main equality before implementation, feature capped
5. Implement: complete; rich owned input, direct forwarding, native consumers and actual default transport covered.
6. Gate: complete; raw exits recorded below, unchanged documentation baseline independently DEBT_ACCEPTED.
7. Evaluate: independent Google Gemini PASS at `ffdb32a7d0bef56a8ecc37749d87e689beda6625`; exact report in evaluate.md.
8. Release: N/A, owner explicitly requires unmerged PRs.
9. Close: unmerged source delivery and review handoff complete; coordinated publication, published native consumer and live one-SSE-per-pane remain owner work.

S1 Design checkpoint: D1-D4 locked in plan.md. Independent Google Gemini selected PLAN-EVAL PASS at immutable main8aad14940c52cd3a4db7efa57d56d50ae131df6c, all8boxes. Fresh fetch baseline equality confirmed before implementation. Model/session/vendor separated; owner-authorized fallback after primary provider stalled. Actual native data/signal already forwarded; only message mapper drops parts/metadata. Planned2runtime regressions plus native compile consumer, eachdistinctcausalmutant. Full owning doc baseline to be recorded before source and compared at everyentrypoint; proposed existing-debt acceptance requires independent IMPL ifrawfailed. S2 source stillpending.

Gate `chat-doc-baseline`: raw exit `1`. Command: `deno task doc:lint --root packages/fresh`. Full raw output retained privately.

Gate `chat-s2-fmt-write`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/src/runtime/ai --file packages/fresh/tests/type-fixtures/chat-send-consumer_type.ts --ext ts,tsx --write`. Full raw output retained privately.

Gate `chat-s2-focused`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/runtime/ai/create-chat-connection_test.ts packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts`. Full raw output retained privately.

Gate `chat-s2-consumer`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/fresh/tests/type-fixtures/chat-send-consumer_type.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `mutant-native-consumer`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/fresh/tests/type-fixtures/chat-send-consumer_type.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `restored-native-consumer`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/fresh/tests/type-fixtures/chat-send-consumer_type.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `mutant-identity`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter rich native send preserves packages/fresh/src/runtime/ai/create-chat-connection_test.ts`. Full raw output retained privately.

Gate `restored-identity`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter rich native send preserves packages/fresh/src/runtime/ai/create-chat-connection_test.ts`. Full raw output retained privately.

Gate `chat-s2-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/src/runtime/ai --file packages/fresh/tests/type-fixtures/chat-send-consumer_type.ts --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `chat-s2-lint`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh/src/runtime/ai --file packages/fresh/tests/type-fixtures/chat-send-consumer_type.ts --ext ts,tsx`. Full raw output retained privately.

Gate `chat-s2-fmt`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/src/runtime/ai --file packages/fresh/tests/type-fixtures/chat-send-consumer_type.ts --ext ts,tsx`. Full raw output retained privately.

Gate `chat-s2-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

S2 substantive review complete: six owning source/docs/test/fixture files introduce one documented NetScriptChatSendMessage structural union, public AI export and direct unchanged send array forwarding. Existing data/signal linkage, single hub, projection and intentional reduced server response formatting retained. Native declared UI/Model consumers compile without cast/new dependency, malformed shapes rejected. Public-type narrowing yields intended consumer TS2345 then restoredcheckPASS; compiling old-lossy-projection mutant kills exactly1identity/lifecycle runtime case thenrestorePASS. All20focused chat cases and scoped frozen check/lint/fmt/quality/architecture PASS. Existing fake durable lifecycle expectation changed only from synthesizedtextparts to exactoriginalModelmessage, preserving full optimism/reload/multibyte coverage as selectedPLAN requires. Newfixturecontains actualnative image/audio/video/document/tool/reasoning/metadata/structuredoutput fields. Pristine all17entrypoint baseline rawdoc1 with45combinedfindings retained; finalallentrycompare pending. No public upstream type reexports or lock churn. S3 actualdefaultnative HTTP/SSE regression next; source notqualifiedasnativewireyet.

Gate `chat-s3-fmt-write`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts --write`. Full raw output retained privately.

Gate `chat-s3-native`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter default native chat transport retains packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts`. Full raw output retained privately.

Gate `mutant-native-http`: raw exit `1`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter default native chat transport retains packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts`. Full raw output retained privately.

Gate `restored-native-http`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter default native chat transport retains packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts`. Full raw output retained privately.

Gate `chat-final-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `chat-final-lint`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx`. Full raw output retained privately.

Gate `chat-final-fmt`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx`. Full raw output retained privately.

Gate `chat-final-suite`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --unstable-kv packages/fresh/src packages/fresh/tests`. Full raw output retained privately.

Gate `chat-final-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `chat-final-jsr`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh --text`. Full raw output retained privately.

Gate `chat-final-publish`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/release/run-publish-dry-run.ts --member packages/fresh`. Full raw output retained privately.

Gate `chat-final-doc`: raw exit `1`. Command: `deno task doc:lint --root packages/fresh`. Full raw output retained privately.

S3 actualnative qualification complete: defaultdurableStreamConnection, no createConnection injection, owningrealHTTP POST captures complete nativeUI andModelmultimodal/metadata/tool/reasoning/structuredoutput/date/nullcontent/futurefields plusdata. Native bootstrapJSON countedseparately, exactly1liveSSE sharedby2logicalreaders before/aftersend, caller+disposalabortactualinflightPOSTs and finalnativeSSEcancel/0active verified. Compilinglossymapper source mutant causes exactly1parsedwire mismatch FAIL, restoredPASS; nativefixture cleansowned streams/heldPOSTs/server in boundedfinally. Two new runtime regressions and1nativecompileconsumer each causalFAIL/restoredPASS. FullFresh285pass/0fail/0ignored,225file scopedfrozencheck/lint/fmt, quality/architecture,owningJSR/rawpublish PASS. All17entrypointdocJSON byte/semanticidentical to pristine mainbaseline rawexit1 (45combined:28private/17missing), no newdiagnostic. Proposedchat-send-doc-baseline-2068 recordedowner/target/closinggate forindependentDEBT_ACCEPTED; no false rawgreen. ExistingruntimeAI folder13children unchanged, no newsourcefile. Only1owningS3testfile, no dependencies/locks/hub/projection changes. S4cleansourcepubliccorpusnext; S5independentIMPLmandatory.

Gate `chat-corpus-generate`: raw exit `0`. Command: `deno task gen:mcp-export-corpus`. Full raw output retained privately.

Gate `chat-carrier`: raw exit `0`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

Gate `chat-mcp-check`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `chat-mcp-jsr`: raw exit `0`. Command: `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/mcp --text`. Full raw output retained privately.

Gate `chat-mcp-publish`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/release/run-publish-dry-run.ts --member packages/mcp`. Full raw output retained privately.

Gate `chat-mcp-doc`: raw exit `1`. Command: `deno task doc:lint --root packages/mcp`. Full raw output retained privately.

Gate `chat-corpus-fresh`: raw exit `0`. Command: `deno task check:mcp-export-corpus`. Full raw output retained privately.

S4 canonical corpus generated from clean committed S3 source4f429df3a. A pristine main git archive was exported into task-local temporary storage (ordinary immutable files, not a branch/worktree) and read using the owning buildExportSurfaceCorpus API; comparison proves exactly one added Fresh AI type, NetScriptChatSendMessage, no removed or changed normalized declarations, unchanged277subpaths,7947to7948symbols. Main checked-in corpus predates current main public inventory; comparison uses canonical current-main output, never claims stale artifact as semantic baseline. Initial private archive extraction used a newer Python API unavailable here; corrected safe path-validated extraction and removed owned snapshot in finally. New compressed corpus sha1c1feb6b0b838298ffc52c67cd63fce6bd6685d81cace48d6ff9040cc8798546. Existing asset carrier and canonical freshness pass; owning MCP static/JSR/actualdrypublication pass. Complete MCP doc report byte-identical to pristine main baseline (combined0, two entrypoints3private each, rawtaskexit1), proposed same doc debt extended with explicit MCP owner/closinggate. No hand-edited generated source. Commit canonical output before committed-tree14corpus tests.

Gate `chat-corpus-tests`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts packages/mcp/tests/embedded-export-surface-corpus_test.ts`. Full raw output retained privately.

S4 committed-source proof complete: all14canonical generator/embedded tests pass at04bd92161, with test-scoped WT_ENFORCE=0 and task-local TMPDIR. Source/gates complete; S5 mandatory fresh independent Google Gemini evaluation next via recorded owner-authorized fallback. Final implementation head04bd92161 includes all runtime/type/test/corpus/debt source; subsequent launch record has no production delta. Source and branch frozen until reviewer process exits. Publication, published consumer and EIS live one-SSE-per-pane/removable singleSubscriberConnection remain owner work, Refs2068.

S5 independent evaluation complete. Google Gemini session `74542e15-2e64-41dc-9653-be9ba2cff7f4` returned PASS at exact frozen head `ffdb32a7d0bef56a8ecc37749d87e689beda6625`. The reviewer independently reran 285 Fresh tests, 21 focused tests, the actual native case, 225-file static/lint/fmt, quality, Fresh/MCP JSR and publication dry-runs, canonical corpus/carrier and 14 corpus tests. All three causal mutation records were inspected. Full Fresh/MCP documentation reports remain byte-identical to pristine baseline, raw exits one, explicitly DEBT_ACCEPTED with owner/target/closing gate. No source or branch mutation occurred during evaluation. The same evaluator performed report-only factual reconciliation: parsed JSON equality, dry-run rather than release publication, and source PASS rather than full published-consumer acceptance. Initial launch lookup recovery is recorded in drift.md. Original selected PLAN report remains intact.

Final record commit contains only the evaluator report, accepted debt status and run close-out. Production/source/corpus/test files remain identical to the independently evaluated head. PR2092 is delivered for review without merge or publication; final-head CI is audited separately. Owner must publish the coordinated capability, qualify a published native consumer and verify one live SSE per pane before removing EIS singleSubscriberConnection or closing #2068.
