# S9 cycle 2 — mcp-smoke: the dashboard gates ALL MCP tools in headless CI (same thread, static)

Same rules as cycle 1 (thread `01a0523a…`, worktree `007-aspire-s9`, branch head `b9f4d30b0` =
your fix reordered onto `d81a8fe19`; the workflow commit `0d9cc78d8` stays local/unpushed).

## Evidence (proof run 33330455111 at `4ad9ad4c4`, which contains your `892b636f4`)

`agent.aspire-mcp-smoke` failed again with a **byte-identical** stderr
(`sha256 b92f3ec2…`): `tools/call failed: {"code":-32603,"message":"The Aspire Dashboard is not
available in the running AppHost. The dashboard must be enabled to use MCP tools. Ensure your
AppHost is configured with the dashboard enabled (this is the default configuration)."}`.
The throw site is `stdio-transport.ts` `#request('tools/call', …)`; your catch guards only the
`list_structured_logs` call — the earlier `call(primary, 'list_resources', …)` (evaluate.ts:109)
is uncovered, and the message wording says the dashboard gates **MCP tools generally**, so
per-tool tolerance cannot make this gate meaningful in a dashboard-less AppHost.

## Decide and implement (bounded, one of two shapes — with evidence)

A. **Preferred if true:** the CLI message says dashboard-enabled is the *default* configuration,
   yet the CI AppHost runs without it. Find why in the generated scaffold / suite start path
   (scaffold `aspire.config.json` profiles carry `ASPIRE_DASHBOARD_*` env only for named
   profiles; the suite's detached `aspire start --format Json` may select no profile → no
   dashboard). If the suite/scaffold can enable the dashboard headlessly (env or config —
   `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS` etc.) with a **harness/e2e-scope change only**
   (gate code, suite start invocation, scratch config — no `packages/` product source unless the
   scaffold itself is provably defective), do that: the smoke then exercises the real contract.
   State exactly where the dashboard was lost.
B. **Fallback:** if a headless AppHost legitimately has no dashboard and cannot enable one in CI,
   extend the degrade to the whole tool-call phase: `initialize` + `tools/list` (surface,
   visibility, redaction of the *listing*) must still pass; every `tools/call` returning the
   exact -32603 dashboard error records `dashboardAvailable: false` and skips call-dependent
   assertions; any other error still fails. Keep cycle-1's receipt fields.

RED first from the live shape (a transport whose `list_resources` throws the exact -32603), then
GREEN. Scoped gates as cycle 1. Commit citing run 33330455111 (+ chosen shape rationale), push
`HEAD:refs/heads/fix/aspire-13-5-s9-skills-mcp-alignment` (your branch head is `b9f4d30b0`; do
NOT include the local workflow commit), PR #1759 comment, final line = new head SHA.
