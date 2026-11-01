**PLAN-EVAL round 2, issue 2269 (read-only, blockers only): PASS**

The round 1 blocker is fixed. The corrections at the ends of `research.md`, `plan.md` and `worklog.md` cover it:

- **The issue's premise is recorded.** `research.md` now notes that `withReadinessCheck` is not in the `docs/site` prose and is only in the `@netscript/service` export corpus. It also notes that the full corpus alone cannot make a literal search find it.
- **`search_docs` has a defined result for this case.** Search stays literal. Every release search response carries a citation `{frameworkVersion, sha256}`, including zero-match responses. A zero-match response adds `confidence: low` and a "No seam documented" fallback that points to `find_export` and `search_exports`. Both tools exist in `packages/mcp/src`, and the export corpus includes the `service` `.` entrypoint, so the pointer leads somewhere real.
- **The fixture tests the right thing.** The `withReadinessCheck` regression must check the fallback and the citation, not just a zero count. It must also fail when the fallback is reverted, which is the negative control. No `docs/site` edits are needed, so the declared write surface is unchanged.

Everything confirmed in round 1 still stands:
- `@netscript/mcp/docs` is a sound place for the corpus: the CLI already depends on MCP, and MCP does not depend on the CLI.
- The full corpus is embedded rather than loaded lazily, and the measured sizes justify that.
- Slug lookup gives the same result with or without `pages/`, a trailing `/index`, an extension or a trailing slash.
- `find_guidance` gives low confidence when an intent is not really covered, rather than a confident unrelated page.
- The issue's intents become regression fixtures, and all the planned gates exist in the root `deno.json`.

VERDICT: PASS
