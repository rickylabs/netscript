**Verdict: PASS** (formal IMPL-EVAL for S5a phase 1: implementation and local evidence only, not READY)

The implementation meets the operator scope and the locked plan. Every prior source-review finding is resolved, and the evidence holds up when checked against the private logs and receipts. I found no blocking issue. This verdict comes from reading the source diff, the code, and the logs, receipts and wrapper JSON; I ran nothing myself.

## Scope against the brief

**1. Plugin**
- **Fork and licence.** `tools/figma-plugin/` is a tools-side fork, not a publishable package. `LICENSE` carries the 2023 Pavel Laptev MIT text. `NOTICE` pins the upstream URL and exact commit and lists local changes. `upstream/normalize-rgba.ts` now has an attribution header. I couldn't compare `LICENSE` byte-for-byte with upstream offline.
- **Fixture bytes.** The stateful Plugin API mock reproduces all ten handoff files byte-for-byte: 9 collections, 2,186 variables.
- **DTCG round trip.** It is lossless in both directions and tested against the official 2025.10 format and resolver schemas. This includes the downloaded mode documents, the standalone resolver and the full bundle. Raw float precision, aliases routed by the target collection's mode, WEB syntax, scopes, descriptions, the explicit `ff` alpha byte and oklch in `$extensions` are all preserved.
- **Shared resolver and code.** The resolver is built from `TOKEN_PRESETS` (`domain/token-resolver.ts`). `tokens:validate` and `tokens:check` pass at the final source head: 96 inputs, 88 outputs, 24 presets. The CLI and plugin share one converter.
- **Main-thread constraints.** The main IIFE uses only zod and the synchronous name inventory. `bundle_test.ts` runs the built `main.js` with the DOM and decompression globals absent.
- **Native import.** Validation covers names, modes, types and cycles before any write. Alias edges are cleared to neutral values first, stale WEB syntax is removed, and existing IDs are kept.
- **GitHub export.**
  - The token stays in memory only.
  - Only `api.github.com` is reachable, with `redirect: 'error'`.
  - The baseline must be exact canonical bytes in the same key order, and only literal `$value` and oklch leaves may change.
  - The write is one blob, tree, commit, ref and PR.
  - Compact or reordered baselines, metadata changes and unchanged values are all refused before any POST.

**2. Name check in CI**
- `check-names.ts` runs `assertFigmaTokenNames` on the pinned snapshot plus actual `--theme` files.
- An unknown WEB name fails with exit 1 and names the collection, variable and CSS name.
- The `figma-ci` step in `ci.yml` has no condition, so it also runs for `tools/`-only diffs. It writes a receipt.
- The README gives the theme repository a ready-to-copy workflow using the same checker.

**3. URL import**
- **URL kinds.** Share links (non-empty `?preset=`) are decoded locally. Other http(s) URLs are fetched once and treated as strict preset JSON (its theme must be a built-in id) or a published-schema `registry:theme`/`registry:base` item. Credentials, other protocols and an empty `?preset=` are refused.
- **Install path.** The S2 staged plan, path checks and lock are reused. Sources persist under `tokens/source` with `sourceRoot` set, and the semantic override is retained.
- **Ownership and protection.**
  - Baselines transfer to the new URL entry, so local edits still conflict.
  - A custom source root is refused.
  - An emptied old entry is removed only when nothing depends on it.
  - Every failure leaves the filesystem unchanged.
- **Init.** `init --preset` resolves `apps/<appName>` through `SCAFFOLD_DIRS.APPS`, applies after scaffolding and before agent setup, and skips the preset on dry-run. The maintainer init uses the same path.

**4. Round-trip proof**
- The workflow test changes Scheme `bevel/edge` (Light) and one Theme Studio scalar and validates the complete item as values-only.
- `url-theme-command_test.ts` (`s5-native.json`: 1/0/0) runs against a real loopback server:
  - one `init --preset <url>` in a clean scaffold, which sets `sourceRoot` and carries the changed value into `tokens.css`;
  - an actual `ui:apply`;
  - a `tokens build` that keeps the values;
  - the generated workspace's `deno task check`, which passes;
  - a bad item, which leaves the lock and CSS untouched.

## Evidence I checked myself

- **Receipts at the final source head:**
  - `final-quality-gate.json` PASS (`quality:scan` + `arch:check` including `deps:check`). The Fresh UI doctrine warnings are the inherited set.
  - `final-aspire-version-parity.json` PASS, `manifestFresh: true`.
  - `final-fresh-ui-tokens.json` and `final-fresh-ui-token-quality.json` PASS.
- **Receipts from the slice run** (parent head plus the S6c working tree): root check (4,031 files, 0 failed batches), lint and fmt (2,768 files, 0 findings), docs-accuracy and `publish:dry-run`, all PASS.
- **Focused wrapper runs:**
  - `s6c-figma.log`: check, lint and fmt each processed 15 files; 12/0/0 tests; names PASS (2,186); build done.
  - `s6b-test.json` 14/0/0; `s6b-dependents.json` 1/0/0; `s5-test` 4/0/0; `s5-regression` 27/0/0.
  - Scoped CLI check, lint and fmt: 16 files each, 0 findings.
- **Final check exits.** Every `final-check-*.exit` is 0, as are release preflight, docs export drift, generated agent prose and the desktop-native fixture. `final-check-review-threads.log` reports 0 threads and 0 unanswered. Publish-size is 1/0/0.
- **Baseline comparisons.**
  - Fresh UI doc-lint is identical to the baseline: 124 findings, the same per-entrypoint exit codes, and `tokens.ts` at 0.
  - The Fresh UI audit has the same 7 findings as the baseline, including the inherited `contracts.json` `@module` false positive. The `./tokens` surface grew from 7 to 11 exports as planned.
- **Runtime.** `scaffold-runtime.exit` is 1 at preflight because Docker is unavailable. The public leak report has counts only: 24 unproven, 0 owned, 0 mutated.
- **Public record.** The public run directory has no absolute paths or session identifiers. `docs/site/deno.lock` is not in the diff. The census and CLI reference ratify both `--preset` options.

## Non-blocking findings

1. **Receipts at the parent head (Low).** The check, lint, fmt, docs-accuracy and `publish:dry-run` receipts record the parent head with the uncommitted S6c tree, not the final source head. `evidence.md` (line 3) reads as if every gate ran at the final head. Either note this, or rely on exact-head CI, which is required before READY anyway.
2. **No full test suite locally (Low).** Only focused suites ran: plugin, URL/init and token tests. The root `deno task test` and full Fresh UI suites are covered by CI test shards. `url-theme-command_test.ts` is slow (about 64 s) and needs network for the scaffold check, so watch it on the shards.
3. **Stale PR body (Low).** The local `pr-body.md` still shows the Plan & Design checklist. Refresh it before READY with `Refs #2418` only. `drift.md` already records that the owner's instruction overrides the dispatcher's `Closes` footer.
4. **Supplementary CLI lint/fmt (Info).** The scoped CLI lint/fmt evidence used the plugin's lint config and only the files changed in each slice. The CLI is excluded from repository lint/fmt by existing policy, so this is extra evidence, not a gate.
5. **Residuals already documented (Info).**
   - Selecting a built-in preset after a URL theme keeps the Figma sources.
   - Init fails after scaffolding on a bad URL; the recovery steps are documented.
   - The UI's `event.source` guard needs checking on the real host.
   - The theme-repo workflow defaults to NetScript `main`.
   - The import fallback's error message could be clearer.

## Limitations that remain (not substitutes for PASS)

- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`: **UNPROVEN**, because the Docker daemon is unavailable. This is permitted by the brief.
- Optional Chromium UI smoke: **UNPROVEN** (missing `libnspr4`).
- Running inside the real Figma editor: **UNPROVEN**. CI can't host it; the mock, fixture, schema and bundle evidence stands separately.
- Code Connect is deferred to phase 2, after PR #2488.

## What READY still needs

READY needs every required GitHub check green on the exact final head, i.e. after the evaluation and final-evidence commit, with that head stated in the READY report. Cockpit owns the merge.

OPENHANDS_VERDICT: PASS
