# Newly surfaced findings triage

The repaired scans surfaced **1 actionable finding** in `packages/plugin-streams-core`. No finding is
fixed in PR-B.

| File | Line | Rule | Assessment |
| --- | ---: | --- | --- |
| `packages/plugin-streams-core/src/application/durable-stream-producer-supervisor.ts` | 501 | `A8/AP-1/F-1` | The file is 515 lines, crossing the doctrine's 500-line warning threshold. This is pre-existing decomposition debt and should be handled in a package-owned follow-up, not in the gate-coverage PR. |

Focused quality scan evidence:

```text
deno task quality:scan --pretty --root packages/plugin-streams-core
exit 0; findings=0; allowCount=0
```

Focused doctrine evidence reports the one warning above and one informational A9 reminder that the
package has no `docs/architecture.md`. The A9 record is informational rather than an actionable
finding, so it is not counted in the triage total.
