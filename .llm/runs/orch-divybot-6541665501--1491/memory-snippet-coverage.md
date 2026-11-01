# Command documentation gates

Tier-1 is the explicit list in .llm/tools/docs/snippet-policy.ts; a TS fence outside it is counted but not compiled. The command/relay pages and existing outbound-webhooks page are enrolled. Keep the census negative fixture synchronized by iterating TIER_1_PAGES rather than duplicating the list. docs:snippets compiles synthetic modules against public export-map aliases. command-guide-example_test.ts separately executes the actual first command fence using a published-only export map and no scaffold aliases or runtime permissions. It also asserts every command/webhook fence is checked and unexempted.

Root lint excludes .llm, so the structured lint wrapper correctly refuses coverage for tools under it. To lint those files, pass an explicit minimal config that preserves root lint.rules (recommended/jsr tags and included rules) without the root path exclusion. Do not report the excluded invocation as a pass.

The CI shard dispatcher discovers tests dynamically, including hidden .llm tooling; a new *_test.ts does not require a shard-manifest edit. The manifest stores measured weights, not an allowlist. This keeps docs test additions within the approved docs-tooling scope.
