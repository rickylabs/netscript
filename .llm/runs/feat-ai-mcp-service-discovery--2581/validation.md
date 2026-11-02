# Validation — AI MCP service discovery

Source commit:f4b03a9. Derived documentation commit:623d911.

| Gate | Result | Scope |
| --- | --- | --- |
| Structured test wrapper | PASS:86,0 failures | plugins/ai; packages/ai/tests/mcp_test.ts; CLI workspace-mutator tests |
| Structured check wrapper | PASS | AI plugin42 TS files plus2 CLI import-map files; unstable-kv enabled |
| Structured lint/format | PASS:44 selected files | Source TS only; root rules without the CLI exclusion |
| quality:gate | PASS | Quality scan, dependency checks and architecture doctrine |
| Root check receipt | PASS, exit0 | deno task check,174381ms |
| Plugin publish dry-run | PASS | plugins/ai isolated-member publication, no slow-type errors |
| Plugin export doc lint | Baseline-equivalent |16 findings both before/after;15 private type refs plus scaffold finding |
| docs:accuracy | PASS | Published docs and command coverage |
| docs:snippets | PASS | Repository snippet corpus including36 extracted fences |
| Four carrier freshness gates | PASS | Export corpus, agent prose, asset barrel, publish assets |
| Review-thread gate | PASS | PR2590,0 threads/0 unanswered |
| Independent IMPL-EVAL | PASS | Opus5 independently reproduced86 tests and checked source/carriers |
| Aspire manifest parity | PASS after CI correction | Regenerated one newly Aspire-aware docs page;1025 checked,0 failures |
| Core CI/full scaffold runtime | Pending at corrected head | Initial core quality caught missing manifest row; fresh exact-head proof required |

The HTTP MCP fixture binds127.0.0.1 port0 and uses the real AI transport through emitted config.
It proves tools/list, tools/call, auth header, explicit path and discovery origin. Additional controls
prove missing discovery, HTTPS selection and invalid/ambiguous options without writes. Both JSR
and local-source import maps are checked, with the SDK no-pin negative. A real CLI install plus
this checkout's plugin adapter emits and typechecks a populated consumer registry.

These are local-source and protocol-fixture proofs. No external model/provider call or post-publish
artifact is claimed. The existing public host forwarding command fetches the released adapter;
post-publish production smoke owns that proof.

Private logs and JSON receipts retain command output, hashes and exit codes. Public paths are
repository-relative; final CI run links belong in the PR/issue handoff comment.
