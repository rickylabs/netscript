# Newly surfaced findings triage

The repaired scans surfaced **3 findings total**: 1 actionable doctrine warning in
`packages/plugin-streams-core` and 2 scanner false positives in the changed tool file. No finding is
fixed in PR-B.

| File | Line | Rule | Assessment |
| --- | ---: | --- | --- |
| `packages/plugin-streams-core/src/application/durable-stream-producer-supervisor.ts` | 501 | `A8/AP-1/F-1` | The file is 515 lines, crossing the doctrine's 500-line warning threshold. This is pre-existing decomposition debt and should be handled in a package-owned follow-up, not in the gate-coverage PR. |
| `.llm/tools/fitness/check-doctrine.ts` | 169 | `explicit-any` | The scanner matches the English word “any” in an existing comment (`any export abstract class`); this is not an explicit TypeScript `any`. Scanner comment-awareness is outside #1403 and must be handled separately. |
| `.llm/tools/fitness/check-doctrine.ts` | 237 | `explicit-any` | The scanner matches the English word “any” in an existing heuristic comment (`any class chain`); this is the same pre-existing false-positive class and is not suppressed here. |

Focused quality scan evidence:

```text
deno task quality:scan --pretty --root packages/plugin-streams-core
exit 0; findings=0; allowCount=0
```

Focused doctrine evidence reports the one warning above and one informational A9 reminder that the
package has no `docs/architecture.md`. The A9 record is informational rather than a finding, so it
is not counted in the triage total. The actual PR changed-file scan exits 1 on the two explicitly
listed false positives, proving the `.llm/tools` workflow path executes rather than silently
succeeding.
