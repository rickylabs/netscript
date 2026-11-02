# S3 repair evidence

Implementation response to the parent's first terminal source-review verdict FAIL_FIX. This report is test evidence, not independent acceptance. The parent retains the same reviewer and the remaining repair evaluation. No evaluator was dispatched and no PR, push or contact was performed.

The only product changes are `app/NorthwindChat.tsx.template` and `server/thread-store.ts.template` under `packages/cli/src/kernel/assets/showcase/ai/`. Parent-owned page/CSS/setup/carriers/manifests/configuration were not edited.

| Finding / gate | Negative evidence | Repaired evidence |
| --- | --- | --- |
| P1 empty-thread readiness | `browser-red.json`: exit 1 on immutable baseline `fdf51e27468fc496650154bba52d820c4572210e`; mounted real composer remains disabled after 5 seconds with “Opening your saved conversation…” and no page errors | `browser-green.json`: exit 0, 1 mounted test; `browser-observation-green.json` records create/send, reopen-unused/send, reload native message/tool history and auth/origin denial |
| Exact replay continuity | Baseline opens SSE without the finite catch-up, never reaches first-prompt readiness | Browser compares each live GET offset to the exact preceding finite authenticated catch-up response's Stream-Next-Offset; all match |
| P2 UUID-order truncation | `threads-red.json`: original 20 scenarios pass, added chronological test fails with 50 actual versus 64 expected | `rendered-tests.json`: 21 pass, 0 fail/ignore; all 64 retained newest-first, deterministic timestamp ties, owner isolation |
| Existing source/stub suite | Original 20 preserved | `tests.json`: outer entrypoint exit 0; includes native host restart/privacy/persistence tests and actual generated BFF cookie verification |
| Rendered source | — | `rendered-check.json`: 16 selected, 0 failures; `rendered-lint.json` / `rendered-fmt.json`: 17 processed, 0 findings/refusals |
| Test tooling source | — | `source-check.json`: 3 TS files, 0 findings; `source-lint.json` / `source-fmt.json`: 4 TS/MJS files, 0 findings/refusals |
| Repository quality | — | `quality-s3.log`: raw exit 0, existing warnings and 7 allowances; ordinary command log, not a durable gate receipt |

The island's finite catch-up uses the existing pinned native client through the authenticated production BFF. Every returned native chunk passes through the framework's existing chat-message replay and StreamProcessor before live resume. An empty authenticated catch-up unlocks the composer. Failed catch-up leaves it locked. The browser fixture mounts the actual emitted island and real PromptInput, Markdown and ToolCallCard; native streams/file store, app handlers, sends/proxies/owner/origin checks and typed order MCP are real. Only auth/provider composition ports are test injections; no identity or model stub ships in product templates. The fixture issues an opaque HTTP-only cookie and never accepts a browser subject.

The metadata regression deliberately assigns newer timestamps to lexically smaller valid-format UUIDs, including two newest ties. Its expected sequence is explicit, independent of the implementation comparator. Listing scans all owner metadata and then sorts: O(n) for this small single-host showcase. A larger deployment should add a chronological index and pagination; no thread silently disappears at 51.

Commands run from repository root:

```sh
npm ci --ignore-scripts --prefix tools/fresh-ui-browser

SHOWCASE_AI_EVIDENCE_DIR=.llm/runs/feat-showcase-chat-2571--ai \
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts \
  --output .llm/runs/feat-showcase-chat-2571--ai/tests.json -- \
  --allow-all packages/cli/tests/showcase-ai/showcase_ai_test.ts

SHOWCASE_AI_BROWSER_SOURCE_REF=fdf51e27468fc496650154bba52d820c4572210e \
SHOWCASE_AI_BROWSER_OUTPUT=../../runs/2026-11-02-showcase-ai-repair/red \
LD_LIBRARY_PATH="$(realpath ../../runs/2026-11-02-scaffold-2587/browser-libs/usr/lib/x86_64-linux-gnu)" \
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts \
  --output .llm/runs/feat-showcase-chat-2571--ai/browser-red.json -- \
  --allow-all packages/cli/tests/showcase-ai/browser/showcase_ai_browser.ts

SHOWCASE_AI_BROWSER_OUTPUT=../../runs/2026-11-02-showcase-ai-repair/green \
LD_LIBRARY_PATH="$(realpath ../../runs/2026-11-02-scaffold-2587/browser-libs/usr/lib/x86_64-linux-gnu)" \
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts \
  --output .llm/runs/feat-showcase-chat-2571--ai/browser-green.json -- \
  --allow-all packages/cli/tests/showcase-ai/browser/showcase_ai_browser.ts

deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-check.ts \
  --root packages/cli/tests/showcase-ai --ext ts \
  --output .llm/runs/feat-showcase-chat-2571--ai/source-check.json
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-lint.ts \
  --root packages/cli/tests/showcase-ai --ext ts,mjs \
  --config .llm/runs/feat-showcase-chat-2571--ai/validation-deno.json \
  --output .llm/runs/feat-showcase-chat-2571--ai/source-lint.json
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-fmt.ts \
  --root packages/cli/tests/showcase-ai --ext ts,mjs \
  --config .llm/runs/feat-showcase-chat-2571--ai/validation-deno.json \
  --output .llm/runs/feat-showcase-chat-2571--ai/source-fmt.json
deno task quality:gate
```

The browser commands used the same project-managed OS-library directory resolved to an absolute process-only LD_LIBRARY_PATH so it survives the child consumer's different working directory. The commands above resolve that repo-relative directory without publishing machine-specific paths. No global changes, parent node_modules reuse, lock churn, cache deletion or model key was involved. Browser tool prerequisites and the explicit reusable local/CI command are checked in at `packages/cli/tests/showcase-ai/browser/README.md`.

Screenshots were inspected and remain private under project runs: `../../runs/2026-11-02-showcase-ai-repair/red/failure.png` shows the locked empty conversation; `../../runs/2026-11-02-showcase-ai-repair/green/reloaded-tools.png` shows the native user message, expanded completed named MCP call with NW-00012 output, Markdown reply and enabled composer. Fixture layout CSS is test-only and does not claim visual signoff for the parent's restyled page. Public reports contain logical outcomes only; no conversation IDs, cookies, credentials or absolute paths.

Parent integration: apply this scoped diff and regenerate carriers in the integration branch; retain the parent's page/CSS; ensure the generated app resolves `@durable-streams/client` to existing `npm:@durable-streams/client@0.2.7`; add the explicit browser gate to parent CI after its tooling prerequisite; send the combined repair to the same source reviewer. Overall provider-boundary/production-build/full scaffold.runtime and independent review remain parent gates.
