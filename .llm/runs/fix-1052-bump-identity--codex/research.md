# Research

## Baseline

The requested branch is at `948acd898`. The only opening worktree item was the launcher-generated
`codex-thread-ids.md` in this run directory. This is internal release/dependency tooling, classified
as Archetype 6; it changes no published package/plugin source or public API.

## Confirmed findings

- `replaceVersionFiles()` currently applies blind whole-file `replaceAll(oldVersion, newVersion)`.
- `findVersionResidue()` independently uses an identity-blind exact-version regex.
- The release identity occurs in exactly three owned JSON text shapes: the `"version"` key,
  `jsr:`/`npm:` `@netscript/*` exact specifiers, and values beneath `"@netscript/*"` keys.
- `discoverVersionFiles()` already covers root/member manifests, scaffold manifests, and tracked
  root/member locks; it must remain unchanged.
- Existing tests cover coordinated exact bumps, tracked lock discovery, and residue behavior but
  do not pair a third-party pin with the outgoing NetScript version.
- Follow-up correction: `.llm/tools/release/cut_test.ts` establishes that manifest import-map
  NetScript specifiers may carry range operators and must preserve them across coordinated bumps.
  The emitted-source exact-pin policy is a different surface and does not narrow manifest support.
- JSR audit impact is limited to preserving exact first-party specifiers. No package metadata,
  export, slow-type, documentation, or publish file-list surface changes.

## Open questions

None after the follow-up correction. Supported manifest operators are `^`, `~`, `>=`, `<=`,
`>`, `<`, and `=`; package-own `"version"` fields remain exact.
