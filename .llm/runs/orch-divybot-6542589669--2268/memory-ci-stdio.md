# CI stdio refusal contract

CI's measured test-5 includes packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts, outside the focused package suites. It deliberately passes an unreachable telemetry endpoint. After issue 2268, that response is an MCP error with telemetry_unavailable and provenance counts null, rather than a warn/fail summary with domains.

Focused gate: deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --unstable-kv --allow-all packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts. It scaffolds an offline project and runs the real CLI stdio process; it does not start Aspire or run scaffold.runtime. Root CLI lint/fmt exclusions require explicit config retaining the repository rules.

When a CI run is still live, retrieve a completed job's uploaded test.report.json/test.receipt.json artifact. gh run view --log-failed waits for the whole run; gh api job logs needs --allow-escape-sequences when logs contain ANSI. The durable report identifies the failing test without printing machine/credential data.
