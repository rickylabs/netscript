# PLAN-EVAL

Round 1: FAIL_PLAN from independent Opus 5.5/high, read-only. Three blocking decisions: gallery target, fail-closed installer/token contract, generated metadata ownership and boundary guard. Plan now locks these decisions. No product changes before round-2 PASS.

## Round 2 — PASS

Independent Opus 5.5/high, same read-only evaluator.

**PASS.** No blockers remain. I made no edits and only used read tools.

**Round-1 blockers, all resolved**

1. **Gallery target and route source lookup.** Decision 1 now picks exactly one source among `<route>.md`, `<route>/index.md`, `<route>.page.ts` and `<route>/index.page.ts`, and fails on zero or several matches. The gallery resolves to `docs/site/design-system/index.page.ts`, the only one that exists, so the lookup is unambiguous. The gallery now points to its MCP/local-doc slug plus a tag-pinned `docs/design-system/` tree, not the Lume generator. No versioned Pages URL is invented.
2. **Install-time rewrite contract.** Decision 4 covers everything round 1 asked for:
   - one exact token, `{{NETSCRIPT_RELEASE_REF}}`;
   - only `netscript-design/SKILL.md` is rewritten;
   - it fails if the token is missing from that file, appears in any other bundle file, or is left over after substitution;
   - the generator rejects the token in GUIDELINES, so the reference copy stays byte-exact;
   - versions go through an `@std/semver` round-trip with no build metadata, and the ref is `v${version}` with prereleases kept;
   - the hash is checked over the original bundle bytes, and all skill content is prepared before any write;
   - the optional `InitAgentDependencies.releaseVersion` defaults to `NETSCRIPT_RELEASE_VERSION`, with no CLI option or public export;
   - test `#1675` changes to: every other file still matches exactly, and only the design skill equals the rewritten source.
3. **Generated metadata ownership and boundary.** Decision 3 makes `design-guidance.generated.ts` the generator's third output. It is plain data, all three outputs are covered by read-only `check:design-skill` before asset regeneration, and a negative-control test rejects any CLI import of `docs/site/**`.

**The token arrangement is sound.** Defining the token once in the generator and emitting it into generated runtime data that the installer imports is normal codegen:
- There is one authority, the generator constant.
- The runtime only imports a generated artifact and never retypes the token.
- `check:design-skill` catches any drift between the constant, the emitted mirror and the generated skill.
- It avoids the generator reading its own output as the authority.

I checked that `generate-cli-assets-barrel.ts` lists its outputs explicitly (lines 23–59) and doesn't glob `kernel/assets/*.generated.ts`. So the new file won't collide with the barrel generator's ownership.

**Notes for implementation (not blocking)**
- The pinned `docs/design-system/` link must be a GitHub `tree/v<version>/…` URL. `raw.githubusercontent.com` doesn't serve directories.
- The emitted metadata file must pass scoped fmt/lint, either by emitting formatted code or with `// deno-fmt-ignore` as `skills.generated.ts` does. If the generated-carrier registry (`.llm/tools/docs/generated-carriers.md`) or the carrier parity tests list every generated file, register it there.
- IMPL-EVAL should see actual receipts for:
  - a stable and a canary install through the `releaseVersion` hook;
  - re-init writing nothing;
  - a test that edits a fixture's xref source and fails;
  - a test that renumbers a fixture heading and fails;
  - the boundary test's negative control failing on purpose.

The plan is cleared for implementation, and I'll stay on as the same evaluator for IMPL-EVAL.
