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

## S2 Design: automatic private streams

Two new integration templates: shared secret provisioning/initialization and native streams host. These are generated application composition, not framework APIs. Runtime loads the shared credential before its existing privacy probe; no-key short-circuit stays first. Security vocabulary: canonical workspace identity, non-secret secret-file reference, mode-checked regular credential file, private chat prefix, native persistent stream store. Existing native startStreamsService/static credential authenticator own the listener, guard and shutdown; no replacement proxy/store. Tests isolate provider/auth boundaries and prove actual native HTTP/restart behavior. One scoped implementation commit; parent setup calls the helper and selects the host Entrypoint. Default kv-oauth supports interactive login after external credentials; better-auth is validate-only and must not be advertised as equivalent turnkey sign-in.

## S2 results

Added only the two integration templates; modified the existing native runtime, scoped tests and run notes. The original privacy probe is retained unchanged. Setup generates 256 random credential bits in the current user's private .secrets directory, refuses unsafe links/ownership/modes, never returns/prints a value, and retains an existing valid credential across repeated setup. Only a checked basename/version lives under .netscript. The native host protects every method below the exact chat namespace, preserves public sibling/first-party prefixes, uses native loopback upstream and pins the existing file store to project .data/streams.

The actual generated BFF test proves cookie-to-bearer verification on MCP/chat POST and rejects forged browser subjects. It caught and repaired the previous GET-only BFF method mismatch. No-key rendering is tested with a nonexistent workspace path: it returns connect-provider before even initializing secrets/auth. Better-auth's validate-only limitation and exact kv-oauth credentials/callback/cookie prerequisites are documented, without inventing an identity or claiming unrun external-provider acceptance.

| S2 gate | Result | Evidence |
| --- | --- | --- |
| Emitted source check | PASS, 16 selected files | rendered-check.json |
| Emitted lint/fmt | PASS, 17 selected/processed files, no refusals | rendered-lint.json, rendered-fmt.json |
| Behavioral suite | PASS, 20/20, zero ignores | rendered-tests.json |
| Native streams | PASS, two fresh processes: anonymous GET/HEAD/PUT/POST/DELETE denied; wrong credential denied; matching credential creates/appends/replays; order/workers/sagas/triggers/auth and segment-sibling streams stay public; raw and actual framework chat transcripts survive restart; loopback binding observed; no credential in stdout/stderr | Native probe within behavioral suite |
| Source test/helper check/lint/fmt | PASS | source-check.json, source-lint.json, source-fmt.json |
| Repository quality:gate | PASS, raw exit 0, existing warnings and 7 allowances | quality-s2.log (ordinary command log, not a gate receipt) |

Consumer fixtures reuse exact existing lock resolutions rather than opportunistically resolving npm ranges. Root lock/config/dependencies are unchanged. Temporary listeners, KV handles, native hosts, workspaces and only their test-owned private secret files are cleaned up. Shared/foreign secret files are never enumerated or removed. Public notes use repo-relative paths, generated-workspace placeholders and no session IDs. Parent retains setup.ts, manifests, appsettings integration and source signoff; no PR/push/contact.
