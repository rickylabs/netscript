# Worklog

## Design

Surface: app-owned native loader, AI page/island, conversations API, durable session API, protected MCP endpoint, runtime composition, orders tool definitions, KV ownership/lease policy and AG-UI wire adapter.
Vocabulary: verified owner, thread, provider state, pending turn, read-only orders tools. Finite tool IDs and endpoint paths declared in their owning modules.
Ports: existing browser BFF, typed orders client, Deno KV, durable stream transport, ChatModelProviderPort; focused tests inject only external provider/auth/data boundaries.
Constants: page `/ai`, API `/api/showcase/chat`, MCP `/api/showcase/mcp`, workspace/app-scoped durable stream prefix; bounded prompt/history/tool/turn budgets.
Files: canonical `.template` assets under `packages/cli/src/kernel/assets/showcase/ai/` grouped by server/app; tests under `packages/cli/tests/showcase-ai/`; this private run only.
One commit slice proves authenticated durable chat and live read-only MCP via meaningful rendered-template stub tests.
Deferred: parent manifest/carriers/pipeline/nav/root configuration, independent review and generated production/runtime gates. No new framework runtime or dependency pins.
Contributor path: start at runtime composition, then orders tools or the chat island; use framework APIs rather than a new persistence/protocol stack.

PLAN-EVAL: N/A, as recorded in plan.md. No PR/contact/push by owner instruction.

## Implementation and validation

Implemented 15 canonical templates (8 server, 7 app including CSS), grouped below the 12-child cap, plus the focused rendered-consumer fixture and 15 behavioral scenarios. No manifest, embedded carrier, shared page, pipeline, root config, existing framework API or dependency changed.

| Gate | Result | Evidence |
| --- | --- | --- |
| Structured source check | PASS, 2 test/helper TS files | `source-check.json` |
| Structured source lint | PASS | `source-lint.json` |
| Structured source fmt | PASS | `source-fmt.json` |
| Rendered consumer check | PASS, 14 selected files, real framework APIs and real registry UI | `rendered-check.json` |
| Rendered consumer lint/fmt | PASS, 15 files selected and processed, no coverage refusals | `rendered-lint.json`, `rendered-fmt.json` |
| Rendered behavioral tests | PASS, 15/15, no ignores, no real model key | `rendered-tests.json` |
| Focused test entrypoint | PASS, 1/1 outer test (executes the above consumers/gates) | `tests.json` |
| `deno task quality:gate` | PASS, raw exit 0; quality scan had zero findings and existing 7 allowances; architecture/dependency checks had existing warnings | Local tool execution; no new allowances |
| Provider-boundary production build, browser/visual checks, configured real auth/model/runtime, independent IMPL-EVAL and full scaffold.runtime | Parent integration gates, NOT RUN by this implementation lane | `integration.md` |

Behavioral coverage: no-key/no-IO and honest page states; anonymous/header spoof denial; CSRF/cross-owner/unknown/mutation denial; bounded single-user-text input; KV reopen/atomic lease exclusion; MCP input limits and cancellation; real MCP HTTP list/call; real durable writer and one-projection replay; persisted tool cards and follow-up model context after reopen; provider detection; upstream privacy fail-closed; native BFF verification/failure; real typed service discovery and canonical RPC path; redacted provider failure with retry lease release; disconnect cancellation and disposal.

Commands used the structured `.llm/tools/run-deno-{check,test,lint,fmt}.ts` wrappers. Root config deliberately excludes the whole CLI from lint/fmt; scoped source validation therefore used `validation-deno.json` with the same formatting policy and recommended lint rules. Rendered-source validation uses the isolated consumer config and fails closed for missing selections/coverage. Root lock is unchanged; no caches/locks deleted or reloaded. Test listener/KV handles and temporary directories are closed/removed by their owners.

Final repro: `SHOWCASE_AI_EVIDENCE_DIR=.llm/runs/feat-showcase-chat-2571--ai deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --output .llm/runs/feat-showcase-chat-2571--ai/tests.json -- --allow-all packages/cli/tests/showcase-ai/showcase_ai_test.ts`.

## Reconcile and handoff

Reviewed the scoped files and final reports; the typed RPC probe required the routing correction recorded in drift.md. Private upstream policy is a required parent setup cell, with fail-closed runtime enforcement here. Parent receives concrete destinations, commands, imports, secrets/configuration and remaining acceptance gates in integration.md. No GitHub reconciliation was performed because the owner explicitly forbids contact/PR work for this slice. This is implementation handoff, not independent review or merge sign-off.
