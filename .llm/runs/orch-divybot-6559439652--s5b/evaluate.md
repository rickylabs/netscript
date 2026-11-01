# Independent final IMPL-EVAL

Native Claude; requested Opus5.5/high; observed model(s): claude-opus-5-5. Separate Anthropic evaluator from OpenAI author; same evaluator resumed across slice and final reviews. Source read-only; build/test outputs only. Effort is the requested CLI setting, not a separate reasoning attestation.

**Verdict: PASS.** This is the final IMPL-EVAL for #2568 on draft PR #2576, reviewed by the independent Anthropic evaluator in the same session.

**What I reviewed:** commit `90cadef` plus the working candidate. All 32 hashes in `reviewed-files.json` match the working tree, and no changed file under `tools/`, `.github/` or `.llm/tools/` is missing from it. Nothing changed in `packages/`, `deno.json`, `deno.lock` or `tools/figma-plugin`. My runs left the working tree unchanged.

**Gates I ran myself:**
- **Dedicated gate:** `run-gate.ts --gate figma-component-library --id s5b-evaluator-final` returned `outcome: PASS`, exit 0.
  - Check, lint and format each processed 26 of 26 files with 0 findings.
  - Tests: 25 passed, 0 failed.
  - The quality scan and the build both exited 0.
  - The report says `ok: true` and `fullInventoryReady: false`. The only source failure is markdown → `prose/h4/tracking`. Live editor, MCP and publication are marked UNPROVEN.
- **Root checks:** `deno task gates:test` gave 76 passed, 0 failed, and `release:preflight` passed.
- **README command:** the documented `cli.ts inventory` exits 1 with 52 available items, 35 unmatched contracts and the single prose failure, as the README says.

**Real-data probe, run against the fake Figma host from `$TMPDIR`:**
- **Import:** the 51-item non-prose subset produced 51 receipt entries.
- **Export:** the export receipt is identical to the import receipt, re-running caused no further changes, and the original page has no children.
- **Code Connect:** the dry run produced 53 files, none matching `*.figma.ts`. Normal output from a fixture receipt is refused.

**Required scope checks:**
- **Source inventory and identity:** the sources are the existing contracts, registry and token data, with no parallel component spec.
  - Variants come only from `attributes.values`, with the default value first, and each attribute carries its declared parts.
  - The importer reads back the actual native properties: property names, `VARIANT` type, options and defaults (`export-library.ts:144-169`).
- **Tokens and native preflight:** before any page is created, the importer checks that each collection exists once with exact modes, and that each variable exists once with the exact type and WEB syntax (`preflight.ts`).
  - Readback rejects any variable binding not declared in the bundle, on sets, variants, parts and token layers (`onlyBindings`), as well as paint and node aliases with the wrong ID.
  - The tests cover all six variable failures with zero mutations, plus a bad file key, a bad digest and a missing font.
- **Page isolation and rollback:**
  - Every new node is tracked before it is moved, and any error removes those nodes and then the page (`import-library.ts:336-340`). Tests cover creation and reparent failures with the original page left untouched.
  - Re-importing the same document returns the same receipt with no changes.
  - A stale hash, a different selection, a duplicate page or an incomplete prior import is refused. No other page is touched.
- **Code Connect:** I checked the output against Figma's current template-file docs: header comments, `import figma from 'figma'`, the `{example, imports, id, metadata}` export, and `figma.config.json` with include/label/language.
  - Receipt checks cover the hash, unique node IDs that differ from the page ID, and exact coverage.
  - Fixture provenance is refused unless `--dry-run` is given, and `.figma.preview.ts` files fall outside the publisher's glob.
  - Output is refused if the directory already exists, and an IO failure removes only the new directory. Tests go through the real command and the executable.
  - Provenance is documented as self-reported, not as proof of editor execution.
- **Plugin build:** the plugin has its own entry and build. Data is turned into synchronous copies at build time from the existing data and schemas. Hashing goes through an injected iframe WebCrypto port.
  - The VM test runs the real bundled `main.js` with crypto, TextEncoder, Blob, DecompressionStream and AbortController confirmed absent. It is labelled as compatibility only, not live proof.
- **CI:** the workflow calls one new gate-catalog entry through `run-gate` and always uploads the receipt and report.
- **Docs:** the README covers source ownership, how to extend, regeneration, import, publication, the prose gap, and the parent issues' remaining acceptance.

**Advisory, not blocking.** These can only be settled with live editor evidence, which stays UNPROVEN under #2418 and #2412:
1. **Cancellation never fires:** the plugin's cancel check depends on `active`, which is only cleared in `finally`, and there is no cancel message. This matches the accepted "minimal cancellation shape".
2. **Message filter:** the UI drops any message whose `event.source !== parent`. This should be checked in Figma Desktop, because if the host's message source differs, the UI never loads.
3. **Spacing binding:** FLOAT token layers bind to `itemSpacing` whatever the variable's scopes. This should be confirmed in the live host.

**Accepted boundaries still hold:**
- Full generation fails before any output because of the existing `prose/h4/tracking` gap.
- The 51-item subset is reported as partial.
- No all-S5 claim is made while both S3 PRs remain open.
- scaffold.runtime stays UNPROVEN after the single environment-preflight failure.
- Visual restyling remains with S6 (#2419).
- Hosted required checks and reconciling against the final pushed head are still separate readiness conditions.

I made no source edits, commits, posts or agent launches. The gate wrote its receipt and report to `.llm/tmp/gate-receipts/s5b/evaluator-final.*`.
