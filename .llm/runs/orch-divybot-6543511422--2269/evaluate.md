# Independent implementation evaluation

**IMPL-EVAL for issue 2269 (PR 2529), feature tier. I found no blockers: PASS.**

**Head and separation**
- The checked-out head is `1261c03e42626a941d5b60d311f2b8c598fef780`, three commits on top of baseline `46b22e6`. The working tree was clean before my checks and is still clean after them.
- The implementer was the OpenAI lane. The slice reviews (S1 and S2) ran in separate sessions. This evaluation is a new Claude session, as the owner's override in `supervisor.md` and `drift.md` allows. Evaluator and implementer are separate.

**Acceptance, checked against the code**
- **One shared corpus:** the carrier, transport and policy now live under `packages/mcp/src/infrastructure/docs/`, and `@netscript/mcp/docs` is a new subpath in `packages/mcp/deno.json`. The CLI imports `@netscript/mcp/docs` in both `agent-docs.generated.ts` and `deno-agent-docs-generator.ts`, and its old copies are deleted. Nothing in MCP source imports CLI internals; the only CLI references are `jsr:` spawn strings and tests. The curated `MCP_EMBEDDED_DOC_PATHS` list is gone. Provenance covers every carrier row except `llms-full.txt`, and the carrier stores 209 rows without that aggregate.
- **No eager decode:** `publish-assets.generated.ts` holds only the version, the README and a fixed digest. The pages are decoded through a dynamic import in `loadReleaseDocsSource()`, then checked against that digest and per-page integrity. A child-process test counts decompressions when `cli.ts` is imported and fails if there is more than one (the README's).
- **Slug lookup:** `docsSlugCandidates` tries the exact slug first, then the form with or without `pages/`. Normalization strips `/index`, the extension and trailing slashes. The tests cover:
  - every published page under 5 lookup forms each;
  - the six issue slugs under 4 forms each.
- **Search:** it still matches literal substrings, so `ReadinessHandler` finds `pages/services-sdk/services` with no fallback. I confirmed that `withReadinessCheck`, `getMany`, half-life and prepared-view appear nowhere in the `docs/site` prose. For those, search returns a cited `confidence: low` with the "No seam documented" fallback pointing to `find_export`. The issue says `withReadinessCheck` is documented on the services page, but the prose doesn't contain it; this was handled correctly at PLAN-EVAL.
- **Citations:** `{frameworkVersion, sha256}` is on `list_docs`, `search_docs`, `get_doc` and `find_guidance`, and the output schemas declare it.
- **Guidance:** an intent that isn't covered now gets `low`. That happens when the top section covers less than 60% of the intent's terms (inverse-frequency weighted), or when an uncovered term appears nowhere in the corpus. The issue's intents either reach the right page or section (readiness/liveness, KV watch) or return low with a fallback, and every recommended or related citation opens through `get_doc`.
- **Golden fixture:** the plugin case checks only the ordered two-route prefix, the CLI `init` expectation is the concrete one, and the score-only ownership case keeps all 3 original expectations. All three match what the supervisor approved, and all 8 cases still run with the adapter-parity and determinism checks.

**Checks I ran myself (no lock writes, no changes left behind)**
- `published-docs-corpus`, `issue-2269-guidance`, `guidance-evaluation` and `release-embedded-docs-corpus` tests: 27 passed, 0 failed.
- CLI `deno-agent-docs-generator` and `carrier-parity` tests: 7 passed, 0 failed. These include the frozen legacy page and full-corpus digests, so offline install output is unchanged.

**Not run by me:** the 303-test suite, check/lint/fmt, `quality:gate`, doc-lint, `docs:exports-drift`, the negative controls, and the four freshness gates that were still running through run-gate (`check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus`). Those results are as the implementer reported them. Their green receipts at this head are a precondition the coordinator needs to confirm.

**Runtime e2e-cli CI:** not required for this change. No scaffold templates, plugin scaffolding, DB or runtime wiring changed. The only CLI changes are an import path for the docs adapter and one added export row (`./docs`), and the carrier-parity digests prove the offline docs bytes are the same. If the CI e2e-cli job runs by default, it should still be green at this head before merge; the coordinator owns that.

**Not blocking:** "TTL renewal" returns low even though sliding stream TTL renewal is documented. That's acceptable because the issue's TTL intent is about native KV document TTL, which the docs don't cover, and the fallback only says support is weak rather than claiming nothing exists.

VERDICT: MERGE 1261c03e42626a941d5b60d311f2b8c598fef780

Final exact-head review is published on PR 2529 and in the canonical READY report after the
evidence-only commit. This file preserves the pre-ready implementation evaluation.
