# Worklog

## Design

Public surface and domain: Capture native document epoch in the existing SDK default binding adapter; Fresh synchronously closes the retired logical port and upgrades a replacement behind one stable physical binding, with stale/final admission guards and strict actual CEF reload proof

Ports: preserve existing owning package contracts. Constants: existing finite vocabulary; additional values only when needed by the issue. Contributor path: extend existing implementation and adjacent regressions.

Commit slices: bootstrap plan, source/test/mutation evidence, independent evaluation evidence. No speculative files.

PLAN-EVAL: Selected: decision-heavy cross-package native lifecycle/protocol metadata, hard stop until independent PLAN-EVAL PASS; workload capped at feature

## Nine phases

1. Bootstrap: clean clone, fetch, fresh branch from current main.
2. Research: issue, MCP, selected skills/doctrine and existing implementation examined.
3. Plan & Design: locked design recorded above.
4. Plan-Gate: Selected: decision-heavy cross-package native lifecycle/protocol metadata, hard stop until independent PLAN-EVAL PASS; workload capped at feature
5. Implement: pending.
6. Gate: pending; raw exit codes to be recorded.
7. Evaluate: pending; independent different-vendor session mandatory.
8. Release: N/A, owner explicitly requires unmerged PRs.
9. Close: pending source delivery and handoff; publication remains owner work.

## Locked Design detail

State/identity: stable native bindingName owned by one supplied window; current logical SDK MessagePort server, optional finite-positive document epoch, final isClosed admission flag and one shared closePromise. Lifecycle: initial bound legacy slot -> first stamped document adopts epoch -> strictly newer document retires/closes old logical slot and synchronously upgrades new one -> final closed/unbinding; stale epochs always CLOSED and never mutate current slot. Cancellation: old pending RECEIVE resolves CLOSED, terminating old SDK receive loop/ports; final close does the same then unbinds once. Shared final closePromise includes synchronous/asynchronous unbind failure and prevents repeated unbind attempts. Transport/context/serializer: existing DesktopBindingInvoke, SDK server MessageChannel and oRPC RPCHandler/custom JSON serializers; no new serialization/auth/origin policy. Clock/identity boundary: existing native adapter captures Web performance.timeOrigin once as document identity, not a live clock inside handlers; explicit two-argument invoke port unchanged. Concurrency: no awaiting while changing epoch/slot; each dispatched receive captures its own logical server, so old outstanding receives cannot lock replacement. Existing Desktop constants statuses/operations retained; no new lifecycle enum exported. Diagnostics: existing protocol error classes, invalid supplied epoch rejects without changing slot; runtime receipts/errors remain private. Contributor path: extend existing bind-channel native adapter, Fresh binder and adjacent tests; no abstraction/package/handler registry added for one existing transport. Source, native fixture, corpus and independent review slices follow locked S1-S5; selected Plan-Gate is a hard stop.

Independent PLAN-EVAL PASS at 27b27db11eba23c2147bc6f7f8632430c3235061, all eight boxes checked. Evaluator exited zero before source implementation; selected hard stop lifted. Type budget/public seam/native capability classification and strict actual native CI reload obligation accepted. Additional private research verifies real CEF reload on an ephemeral listener and explicit task-scratch output; no framework source touched. Baseline all-entrypoint doc raw exits: SDK one (3 private references), Fresh one (28 private/17 missing); complete private reports retained for final per-entrypoint comparison, not hidden. S2 source/lifecycle tests next.

Gate `s2-adjacent`: raw exit `1`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/sdk/tests/desktop packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`. Full raw output retained privately.

Gate `s2-adjacent-restored`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/sdk/tests/desktop packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`. Full raw output retained privately.

Gate `mutation-native-stamp`: raw exit `1`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter default native invoke captures packages/sdk/tests/desktop/bind-channel_test.ts`. Full raw output retained privately.

Gate `restored-native-stamp`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/sdk/tests/desktop/bind-channel_test.ts`. Full raw output retained privately.

Gate `mutation-document-reset`: raw exit `1`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter new document closes packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`. Full raw output retained privately.

Gate `restored-document-reset`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`. Full raw output retained privately.

Gate `s2-lint`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-lint.ts --root packages/sdk --root packages/fresh --ext ts,tsx`. Full raw output retained privately.

Gate `s2-fmt`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-fmt.ts --root packages/sdk --root packages/fresh --ext ts,tsx`. Full raw output retained privately.

Gate `s2-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `s2-check`: raw exit `1`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-check.ts --root packages/sdk --root packages/fresh --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `s2-check-final`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-check.ts --root packages/sdk --root packages/fresh --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

S2 supervisor review: native default alone captures validated document identity; explicit invoke remains two-argument. Fresh preserves the existing SDK MessagePorts/oRPC serializers/context, synchronously closes before upgrading, captures each dispatched slot before awaiting and closes admission before shared cleanup. Stale operations do not touch the new slot; invalid epochs do not change it. No dependency changes, casting, suppression or auth-policy invention. Both new regressions produce one parsed causal mutation FAIL and restored PASS; adjacent suite passes. Initial mechanical import edit and ambient timer check failures retained, corrected owning check passes. Source slice is inside locked D1-D3. Native acceptance remains S3, not asserted from units.

Gate `s3-check`: raw exit `1`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-check.ts --root packages/fresh/tests/desktop-reload --file packages/fresh/tests/desktop-reload_native.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `s3-check-contract`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-check.ts --root packages/fresh/tests/desktop-reload --file packages/fresh/tests/desktop-reload_native.ts --deno-arg --frozen`. Full raw output retained privately.

Gate `native-mutation-reset`: raw exit `1`. Command: `deno task test:desktop-reload-native`. Actual CEF native display, production SDK/Fresh typed RPC and separate strict receipt; raw private output retained.

Gate `native-restored`: raw exit `0`. Command: `deno task test:desktop-reload-native`. Actual CEF native display, production SDK/Fresh typed RPC and separate strict receipt; raw private output retained.

Gate `s3-lint`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-lint.ts --root packages/sdk --root packages/fresh --ext ts,tsx`. Full raw output retained privately.

Gate `s3-fmt`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-fmt.ts --root packages/sdk --root packages/fresh --ext ts,tsx`. Full raw output retained privately.

Gate `s3-check-full`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-check.ts --root packages/sdk --root packages/fresh --deno-arg --frozen`. Full raw output retained privately.

Gate `s3-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `sdk-jsr`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text`. Full raw output retained privately.

Gate `fresh-jsr`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh --text`. Full raw output retained privately.

Gate `sdk-doc-final`: raw exit `1`. Command: `deno task doc:lint --root packages/sdk`. Full raw output retained privately.

Gate `fresh-doc-final`: raw exit `1`. Command: `deno task doc:lint --root packages/fresh`. Full raw output retained privately.

Gate `full-sdk-fresh`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/sdk packages/fresh`. Full raw output retained privately.

Gate `sdk-publish`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/release/run-publish-dry-run.ts --member packages/sdk`. Full raw output retained privately.

Gate `fresh-publish`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/release/run-publish-dry-run.ts --member packages/fresh`. Full raw output retained privately.

S3 supervisor review: seven owning source/config files add a mandatory actual native regression and strict existing native CI step before bounded packaging exception; packaging and CLI sources unchanged. Frozen production renderer/default SDK/native Fresh/oRPC host perform typed RPC, park old receive, real BrowserWindow.reload, typed RPC in new epoch, old CLOSED and idempotent teardown, one physical bind. Runner requires receipt independently of exit, uses compile/launch deadlines and finally removes only its scratch output. Actual native task passes; suppression of replacement produces one parsed native timeout FAIL then restored PASS. Native fixture initial isolated-declaration annotation failure retained and corrected using explicit actual oRPC Procedure/Schema types, no erasure/cast/suppression. Dedicated case avoids default discovery and is excluded with fixtures from Fresh publication; owning Fresh alias delegates to root strict task. Full SDK/Fresh suite 525 pass, zero failures/ignored; all scoped frozen static/quality/architecture/JSR/raw dry publication gates pass. Full SDK/Fresh doc reports byte-identical to baseline with raw exit one, every entrypoint preserved; proposed desktop-doc-baseline-2041 requires independent adjudication. S3 acceptance source behavior complete, S4 clean-source generated export corpus next.

Gate `corpus-generate`: raw exit `0`. Command: `deno task gen:mcp-export-corpus`. Full raw output retained privately.

Gate `carrier-fresh`: raw exit `0`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

Gate `corpus-tests`: raw exit `1`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts packages/mcp/tests/embedded-export-surface-corpus_test.ts`. Full raw output retained privately.

Gate `corpus-fresh`: raw exit `0`. Command: `deno task check:mcp-export-corpus`. Full raw output retained privately.

Gate `mcp-jsr`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/fitness/audit-jsr-package.ts --root packages/mcp --text`. Full raw output retained privately.

Gate `mcp-doc`: raw exit `1`. Command: `deno task doc:lint --root packages/mcp`. Full raw output retained privately.

Gate `mcp-publish`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/release/run-publish-dry-run.ts --member packages/mcp`. Full raw output retained privately.

Gate `corpus-tests-qualified`: raw exit `1`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts packages/mcp/tests/embedded-export-surface-corpus_test.ts`. Full raw output retained privately.

S4 supervisor review: canonical generator ran against clean committed S3 source. Only two normalized corpus entries changed: Fresh DesktopBindableWindow optional third-argument signature/docs and SDK resolveDesktopBindingInvoke docs. Zero added/removed entries; checksum aaaf38dd723deed345e1574fbf9203d237e72a1e1b95bf21a5ba69553fd45b17, 7947 symbols. No handwritten generated edits. Canonical freshness and committed carrier pass. Initial generator worktree tests fail under global fixture guard, then test-scoped WT_ENFORCE=0 admits legitimate scratch fixtures; two remaining tests correctly report stale S3 committed corpus while regenerated data is uncommitted. Commit canonical output and require all 14 to pass against new HEAD. Owning MCP JSR and dry publication pass. MCP per-entrypoint doc raw failure also compared with pristine baseline; no new generated-source diagnostic.

Gate `corpus-tests-committed`: raw exit `0`. Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts packages/mcp/tests/embedded-export-surface-corpus_test.ts`. Full raw output retained privately.

S4 committed-source proof: all 14 canonical generator/embedded-corpus tests pass at 557351f4315c77df59089d35bb9583bf9a5fb643 (historical stale pre-commit failures retained). MCP pristine baseline complete report byte-identical with raw exit one; debt expands to this inherited entrypoint-only failure. Source and native gates complete; Phase 7 independent IMPL-EVAL launch next; source/branch frozen for reviewer.

S5 independent Google Gemini fallback IMPL-EVAL PASS at exact510856423f270333499f7e8e3639a117c6d7a6ff, final source557351f4315c77df59089d35bb9583bf9a5fb643. Reviewer independently reruns actualnative strict receipt, full525suite,333file frozencheck/lint/fmt, quality/architecture, three owning JSR/raw drypub gates,14corpus tests and carrier/freshness; no findings. Full all-export baseline diagnostics/entrypoint exits byte-identical and desktop-doc-baseline-2041 DEBT_ACCEPTED; rawdocexits remainone. GLM completed partial independent checks then provider stalled withoutverdict; fresh owner-authorized Google fallback certifies finalreport, process exitedzero beforeclose. Qualified workflow37725008136 at exact evaluatedhead510 SUCCESS all native/static/Postgres/SQLite jobs, strict realreload stepSUCCESS with noexception. Subsequent report/debt/context commit changes no runtime/source/config; finalcoreCI stillseparate qualification. Phases5/6/7 complete,8releaseN/A/unmerged,9source closecomplete. Owner finalCI/coordinated SDKFreshpublication/publishedconsumer/EIS epochhelper removal; Refs2041.

## Review repair — Bootstrap / Research / Plan & Design / Plan-Gate
Verified required baseline; read owner harness, skills, retrieval order, run loop, lane policy and gates. Asked MCP find_guidance/search_docs; broad results require focused local code. Main generated corpus conflicts; preserve both README/debt sections. PLAN-EVAL: N/A, bounded exact reviewer-provided repair.

## Design — review repair
Public close(): Promise<void> unchanged; one terminal isClosed state and one shared close promise. Existing window unbind port remains synchronous invocation with async completion. Use native Promise.withResolvers; no abstraction or constants added. Slices: main merge; each asset generator commit; F1 runtime/test and mutation; independent evaluation; closeout. Adjacent desktop test is contributor path. Nonblocking review suggestions and published acceptance deferred.
