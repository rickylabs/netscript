Review the post-review correction only. The generated `Deno.Command` wrapper was found to alter
detached AppHost ownership, so it was replaced with two direct Deno task-shell commands:
`aspire:start` (300-second default) and `aspire:start:isolated` (same default plus
`DcpPublisher__RandomizePorts=true` and `--isolated`). Inspect the current diff from commit
`38eb35c2e`, including tests and run-artifact drift. Do not edit. Report actionable findings or
`PASS`.
