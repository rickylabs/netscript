I found no blockers in the current working tree (pre-sign-off, bootstrap HEAD `797b9be` plus uncommitted changes). This was a read-only review, and I did not re-run any gates myself.

**What I checked**

- **Adapter (`deno-agent-docs-generator.ts:237-243, 302-305`)**
  - The `Prose source commit` value is `sha256:` of the canonical JSON `{schemaVersion:1, files:<sorted map>}`, built from the decoded prose plus the derived `llms-full.txt`.
  - The `Prose extraction time` value is `release:${EMBEDDED_AGENT_DOCS_PROVENANCE.version}`.
  - Both are computed at install time. Neither depends on Git or the clock, and nothing is written back to the sidecar or carrier, so page edits still merge cleanly.
  - `API generation time` still comes from the injected `now`.
  - `renderManifest` is still private. The constructor signature, exports and dependencies are unchanged; hashing uses Web Crypto and `.toHex()`, which the CLI kernel already uses.
- **The chain from carrier to installed file**
  - `kernel/assets/agent-docs.generated.ts:4` re-exports `EMBEDDED_AGENT_DOCS_PAGES` from `@netscript/mcp/docs`, so the CLI has no second copy of the carrier.
  - `inflateProse()` decodes it.
  - `initAgent` (`init-agent.ts:91-139`) writes every `docs.files` entry unchanged to `.netscript/docs/<path>`.
- **Is the test independent? (`_test.ts:175-243`)**
  - It reads `packages/mcp/.../agent-docs-prose.generated.ts` as text through `readAgentDocsPages` (`agent-docs-page-carrier.ts:53-62`), which parses the rows without loading the module.
  - It computes the digest itself and writes out the whole expected manifest by hand, without calling the production renderer.
  - The row counts are derived independently and agree with the adapter: `renderAgentDocsPages` skips `llms-full.txt`, so both sides count the pages plus one, and the total is prose + 1 `deno-doc` file + `MANIFEST.md`.
  - It compares the bytes from the real `DenoAgentDocsGenerator` and the real `initAgent` + `DenoAgentInitFileSystem` against the expected bytes, as `Uint8Array`s.
  - A second run with a different clock changes only the API time row.
  - Package tests already import from `.llm/tools` (for example `install-plugin_test.ts`), and `packages/cli/deno.json` excludes `**/*_test.ts` from publishing.
- **Negative controls:** `negative-controls.json` records 4 mutations: each row removed, and each row given a volatile value. Each one exits 1 on the full MANIFEST byte-equality assertion, and the source was restored afterwards.
- **PLAN-EVAL notes:** all three are met. The digest is computed in the test, the mutations fail the same strict comparison, and `generated-carriers.md:29-33` now documents the kept row labels and how the digest is formed.
- **Scope and locks:** only the adapter, its test, the contributor doc and the run records changed. No lock, carrier, sidecar, export or runtime-wiring changes.
- **Validation record:** `validation.md` shows scoped check, lint and fmt passing; 45 tests passing; `quality:gate`, `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets` and `check:mcp-export-corpus` passing through durable receipts; the JSR audit and publish dry-run succeeding; and source hashes recorded. Skipping e2e is justified for this scope.

VERDICT: PASS