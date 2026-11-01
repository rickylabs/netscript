## IMPL-EVAL #2569: **FAIL_FIX**

**Reviewer:** independent Anthropic evaluator (owner override: `claude-opus-5-5`, effort high, read-only). The implementation is OpenAI. I edited no source, carrier, run artifact, issue or PR.

**Scope reviewed:** the full diff from `125c26fc` plus the untracked `tools/docs-site/fresh-ui/payload-budgets.ts` and `preset.ts`. That covers the builder, preview, catalog, generator, check, render, README, the browser spec, the `publish-size` test, the MCP component and guidance routing, and the routing tests.

### Material finding (blocking)

**F1: component routing now takes over ordinary task questions.** This is a regression from the baseline.

- **Where:** `packages/mcp/src/domain/docs/component-guidance.ts:24` and `:31-32`. The guidance index at `packages/mcp/src/domain/docs/guidance-index.ts:118-119` returns the component result before any concept ranking.
- **Cause:** the change removed the explicit UI-word gate (`fresh ui|components?|props?|keyboard|shortcuts?|ui:add`). Two paths now match with no UI context:
  - **Hyphenated names:** `if (name.includes('-') || named) return true;` matches any hyphenated component name as soon as its words appear. It also bypasses `hasWorkflowConcept`.
  - **Capitalised names:** the fallback matches a capitalised component name with `\bName\b`. That fires on the ordinary first word of a sentence.
- **Failure scenarios:** I reproduced each one with `ReleaseEmbeddedDocsCorpus.findGuidance`. Each returned the component page as the top result with medium confidence:

| Question | Routed to |
|---|---|
| How do I create a data table in Postgres with migrations? | `components/data-table` |
| How do I validate a form field in a service endpoint? | `form-field` |
| How do I set the page header for an HTTP response? | `page-header` |
| How do I handle an empty state when a worker queue has no jobs? | `empty-state` (worker context ignored) |
| Pagination for list endpoints / Pagination in a service list endpoint | `pagination` |
| Select a database provider for my project | `select` |
| Search docs for database migrations | `search` |
| Alert on failing health checks | `alert` |
| Input validation for service endpoints | `input` |
| Label conventions for GitHub issues | `label` |
| Markdown linting in docs | `markdown` |
| Progress reporting for a long import | `progress` |

- **Why it matters:** at baseline, none of these questions reached `componentGuidance`. Generic ranking now also excludes component pages, so the over-matching component path is the only way component pages get reached.
- **Test gap:** in `packages/mcp/tests/component-guidance_test.ts:81-97`, every negative starts with "How do I…" or "What props…" and none uses a hyphenated generic phrase. The suite therefore misses both regression paths.
- **Fix direction:**
  - A hyphenated name should match only on its CamelCase API spelling (`DataTable`), on nearby component context (`component`, `props`, `ui:add`, `Fresh UI`), or when the question contains an explicit component word.
  - Never bypass `hasWorkflowConcept`.
  - Drop the capitalised fallback, or ignore the first word of the sentence.
  - Add the probes above as negatives. Keep the current positives; I checked that `DataTable`, `CodeBlock`, `Button`, `Pagination?`, "data table component" and "empty state component" all route correctly.

### Minor, non-blocking
- **Missed positive:** "How do I theme the toast?" falls through to `reference/fresh-ui`, because a lower-case single word without component context is not recognised.
- **Formatting churn:** `tools/fresh-ui-browser/docs-tests/components.spec.ts` was entirely reformatted from single to double quotes, which inflates the diff. It passes `deno fmt --check` under both the root and `docs/site` configs.

### Checked and correct
- **Lazy decoder:** `builder.js` has no static `ns1_` or zod. The codec loads only through `import("./preset-*.js")`, and normal preset changes use the precomputed `preset.code`. The browser spec checks that the preset chunk is absent at first load and requested on import, and still covers the "Invalid", "Unsupported version" and 4096-character errors.
- **Compact presets:** `presets.json` is 9,130 bytes, against 1,408,122 bytes for `catalog.json`. It keeps the five displayed values, and a unit test confirms the build-only fields are stripped.
- **Static closure check:** `check.ts` follows `from"./…"` and `import"./…"` and skips dynamic `import(`. It reads every target, so a missing file fails the check rather than passing silently. `bundle-files.json` comes from a fresh temporary output directory, so retired chunks cannot leak into it.
- **Budgets catch regressions:** all JS chunks together are 1,368,475 bytes raw and 367,592 gzip, against initial budgets of 120,000 and 38,000. Going back to eager imports would fail. The browser spec measures real responses from the page and the iframe, and also checks that no request returns 400 or above and that `catalog.json` and unrelated example chunks are never requested.
- **Base path:** the chunks import each other by relative path, and `fetch('../presets.json', import.meta.url)` resolves from the bundle's location. HTML `src` attributes still go through Lume `base_path`. The browser config runs under `/netscript/`.
- **Unsupported-picker docs:** the builder page and README match the codec and `supportedPreset`. Font and icon library are rejected, Utility is the only style, menu style has no independent field, and S6b is the stated extension path.

### Commands I ran
- `.llm/tools/run-deno-test.ts -- --allow-all --unstable-kv packages/mcp/tests/component-guidance_test.ts tools/docs-site/fresh-ui/generate_test.ts`: exit 0, 11 of 11 passed.
- An in-memory `deno eval` that listed the component slugs and ran 26 routing probes (the table above).
- Inspection of the bundle import graph and the raw and gzip totals in `docs/site/_site/assets/fresh-ui/js`.
- `deno fmt --check` on the browser spec under the root and `docs/site` configs.

### Not independently verified
I did not rerun the site build, browser tests, carrier freshness checks, the wider MCP suite, quality/arch gates or the full CLI runtime E2E, so I am not claiming any of them pass. `packages/mcp/src/publish-assets.generated.ts` showed as modified while I worked, so the carrier chain was still settling and I did not treat provenance results as a source failure.

**Re-review:** after F1 is fixed, I need the corrected routing plus the new negatives above, re-reviewed in this same session.
