# W3-B preflight — intent guidance and measured adoption

Observed on 2026-08-06 before dispatch:

- Docs MCP retrieval is a flat lexical whole-document scorer; it lacks concept aliases, section
  ranking, link traversal, task sequencing, independently retrievable code fences, and a bounded
  intent-guidance contract.
- #1102 defines five minimum intent queries with expected top-three destinations and requires parity
  between filesystem and embedded corpora.
- #1197 measured 452 tool calls with zero MCP/doctor/OTEL/NetScript-skill/tool-bundle use, but Wave
  6 later showed zero available MCP tools because OpenCode had not attached project configuration.
- W1-C must first prove attachment and record available-tool count separately from call count.

## Required supervisor mission

1. Define a bounded structured intent-guidance result: ordered pages and sections, match rationale,
   prerequisite → implementation → verification sequence, cited code excerpts, related links, and
   confidence/fallback.
2. Extend the existing docs/task-router authorities rather than add an independent corpus. Support
   deterministic concept mismatch, section scoring, link traversal, code-fence extraction, token/
   result bounds, and offline operation.
3. Check in a deterministic evaluation corpus covering all #1102 intents and explicit top-three
   destinations, with negative/low-confidence cases and byte-equivalent filesystem/embedded results.
4. Update MCP instructions and generated agent guidance so unfamiliar implementation routes through
   intent guidance before invented APIs, while preserving literal `search_docs` and exact `get_doc`.
5. Add a repeatable measurement extractor for available tools, calls by discovery source,
   doctor/OTEL/skills/tool-bundle use, curls, and a built-in-vs-hand-rolled ledger without storing
   private prompts or secrets.
6. Run focused retrieval/server/generation tests, corpus metrics, parity/bounds, scoped wrappers,
   docs/package/consumer gates, and a real attached-tool smoke.
7. Open a draft PR with `Closes #1102` and `Refs #1197`; leave it at `status:impl-eval` for separate
   Qwen evaluation. Do not tick or close #1197 from code or synthetic fixtures.
8. After the surface is published on the planned canary, the orchestrator runs a real measured agent
   with W1-C attachment receipts and capability-map workflow, compares counts to the 0.0.4 baseline,
   and records honest adoption or non-adoption before hand-closing #1197.

The #1102 corpus is deterministic product acceptance. The #1197 run is observational adoption.
Neither may be substituted for the other.
