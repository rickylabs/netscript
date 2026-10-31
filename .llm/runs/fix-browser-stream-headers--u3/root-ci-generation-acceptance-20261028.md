# Root acceptance: canonical generated U3 documentation

CI40622012414 identified stale MCP exports and agent prose after the public headers/guide changes.
Root ran both canonical generators, decoded both generated payloads and reviewed their exact semantic
delta. Only two existing generated owners change; accepted authored sources, debt and locks remain
byte-exact. No generator, test, discovery or freshness policy changes.

The299-surface MCP corpus changes only fresh/./streams and plugin-workers/./streams: the existing
options gain native HeadersRecord and both surfaces expose HeadersRecord/MaybePromise identities.
No unrelated declaration changes or removals. Prose retains189 pages, changing only the existing
durable-workflows/streams page that C3 authored; llms-full derives from that corpus. The initial
inspection script expected the wrong reference-page path and failed; its unmodified predecessor is
preserved beside the corrected exact durable-workflows expectation. No failing gate is relabeled.

Canonical agent-docs-prose and mcp-export-corpus freshness both PASS/exit0 (14.476s and15.985s),
including the actual Lume build/render checks. Prose output is a bounded truncated tail with a full
stream hash, not a full raw log. Seven existing embedded-corpus/export-flow tests PASS with explicit
operation/resource sanitizers and no ignores. Prior20+5 authored runtime controls need no repeat for
this generated-only correction. Evidence and protected-byte audit: [bundle](evidence/root-ci-generation-20261028/root-audit.json).

This accepts the generated correction. It does not waive the accepted bounded F15/F5 debt, baseline
Fresh reference findings, Windows tooling integration, critical dependency audit, independent Opus
IMPL or production browser/CEF acceptance. Root will audit staged and committed bytes before push.
