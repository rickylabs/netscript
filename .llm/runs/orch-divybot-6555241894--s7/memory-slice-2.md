# 2026-11-01 carrier, CI and rendering notes

The Pages job checks all tools/docs-site .ts files under the root isolatedDeclarations policy before running browsers. Importing the existing CLI codec exposed its inferred Zod schema type; equivalent explicit UiPreset and ZodType annotations fix the real check. ROOT/OUTPUT also need annotations. Keep the exact original check, never bypass it with a permissive project config. All32 existing codec/init-safety tests pass.

Declaring a new root std/fs alias invalidates private/reference lock workspace metadata. The generator now uses Deno.readDir recursion, with no new std/fs declaration. Its former one-line root lock delta is reverted; no private lock or resolved version changes.

Unwrapped inline callout children must use inlineChildren(...).trim(), rather than childBlocks, to preserve code/links without splitting spans or adding leading whitespace. URL canonicalization needs source, already-prefixed and same-origin absolute duplicated prefixes tested through actual Vento xrefs.

The docs auditor used to merge every published stylesheet into one global role graph. Isolated Fresh UI preview styles are a different document. Keep the outer policy strict, and verify all27 isolated assets with canonical source hashes plus Lume’s actual minifier hashes, then audit authored preview CSS in the Utility token context with raw/red negative controls. Do not merge the24 token palettes into docs chrome. The focused four context/policy/callout browser tests pass.

Existing lexical guidance preferred the general Fresh UI page over Button. component-guidance.ts derives identities from generated component slugs/titles, chooses the requested section, respects curated workflow concepts unless component scope is explicit, and leaves locked ranking constants unchanged. All20 new/locked guidance tests pass, including all52 get_doc twins within12288bytes.

The export generator deliberately supports --allow-dirty before the slice commit. Regenerate prose → export corpus → assets → publish, preserving source-main additions after a normal merge. All required native checks still run. A stash was retained to protect phase2 while merging main; do not drop it until final source verification.
