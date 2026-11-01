**Verdict: FAIL_FIX** (S3 slice review; this does not cover S4–S6)

The import, values-only comparison, bundle split and credential handling are sound. One defect blocks the slice: the GitHub export only proves the change is values-only structurally. The PR's text diff can still contain non-value lines, and the tests currently accept that case.

## Blocker: a non-canonical baseline file produces a whole-file rewrite

The problem is in `tools/figma-plugin/src/github-export.ts`:
- `pushThemePullRequest` parses the baseline file and runs `assertValuesOnly`, which compares canonicalized structures.
- It then commits `JSON.stringify(input.item, null, 2) + '\n'`.
- The original bytes of the baseline are never checked. If the baseline in the user's repo was reformatted (compact JSON, different indentation or key order, a missing final newline), the commit rewrites the whole file. The PR body still says only values changed.
- `tests/workflow_test.ts` already does this. Its mock serves the baseline as compact `JSON.stringify(previous)`, and the push succeeds with a fully reformatted blob.

That contradicts the #2418 acceptance box ("a PR whose only diff is token values") and the plan's rule that every changed PR file differs only in values.

**Required fix:**
1. After decoding the baseline, require `text === JSON.stringify(previous, null, 2) + '\n'`.
2. Otherwise refuse before any write, with a clear message such as "Baseline is not in canonical export format; re-download and commit it".
3. Change the mock to serve canonical bytes.
4. Add a negative test: a compact or reformatted baseline is rejected with zero mutation calls.

## What I verified

- **Native import (`import-snapshot.ts`).**
  - All checks run before the first mutation: snapshot validity, names, modes, cycles, ambiguous collections, existing mode prefixes, and type conflicts with existing variables. The zero-mutation test covers this.
  - Collections and variables are created first, then values and aliases are set. Existing IDs are reused.
  - An explicit `ff` alpha is written as `fround(1-2^-24)`, so the Figma API reads it back as `ff`. The test confirms this.
- **Values-only comparison (`assertValuesOnly`).**
  - The masking depends on the path, so `meta.$value` and `meta.oklch` outside the documents are not masked. A test proves it.
  - It masks only literal `$value` entries in the token documents and the `oklch` extension. Alias strings, `$type`, resolver, metadata, preset, files and title are all compared.
  - Both items must pass the full bundle import and name check, and "no value changed" is rejected.
- **GitHub sequence.**
  - Only the `api.github.com` origin is used, with `redirect: 'error'`.
  - Repository, branch and path inputs are validated.
  - All reads happen before any write.
  - The write is exactly one tree entry, then one commit, one ref and one PR.
  - The token stays in a closure and is cleared from the input field. It never appears in request bodies, error messages or storage.
  - The manifest restricts network access to GitHub.
- **Bundle split.**
  - The main IIFE imports only zod and the synchronous name-only inventory, `figma-names.generated.ts`, with no top-level await.
  - `bundle_test.ts` runs the real built `main.js` with the DOM and decompression globals set to `undefined`.
  - The UI re-validates every message from main, and main re-validates every import sent from the UI.
- **Name and mode check.** Mode lists must now match the inventory exactly. The cycle check walks every consistent selection of collection modes.

## Recommended (don't block S3)

1. **Transient alias cycles on re-import.** The third pass sets aliases in collection order. On a file whose existing alias graph points differently, Figma could reject an intermediate state and leave the file half-written. Writing alias values in topological order (targets first) avoids that.
2. **Stale WEB syntax is never removed.** If the snapshot has no WEB syntax for a variable, an existing one is left in place, and the next export then fails the name check. Remove the existing code syntax in that case.
3. **The file key falls back to the fixture's key.** `ui.html` pre-fills the fixture key, and `figma.fileKey` is `undefined` unless the plugin is a private plugin. For any other file, `index.json` would silently carry the wrong key. Leave the field empty unless the host supplies one, or require it before snapshot downloads.
4. **`event.source !== parent` in `ui.ts`** can't be checked against the real Figma host. Include it in the manual host acceptance, which is already recorded as UNPROVEN.
5. **zod is imported inline** as `npm:zod@^4.6.5` in the plugin, while Fresh UI uses the catalog entry. Confirm in S4 that the dependency gates accept or cover `tools/`.

I didn't run anything; the test results above are as you reported them.

OPENHANDS_VERDICT: FAIL_FIX
