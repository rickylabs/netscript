# Newly surfaced findings triage

The repaired scans leave **1 actionable finding** in `packages/plugin-streams-core`. Two additional
scanner reports in the changed tool file were classified as comment false positives and carry
temporary, per-line allowances linked to #1549. No package finding is fixed in PR-B.

| File | Line | Rule | Assessment |
| --- | ---: | --- | --- |
| `packages/plugin-streams-core/src/application/durable-stream-producer-supervisor.ts` | 501 | `A8/AP-1/F-1` | The file is 515 lines, crossing the doctrine's 500-line warning threshold. This is pre-existing decomposition debt and should be handled in a package-owned follow-up, not in the gate-coverage PR. |

Focused quality scan evidence:

```text
deno task quality:scan --pretty --root packages/plugin-streams-core
exit 0; findings=0; allowCount=0
```

Focused doctrine evidence reports the one warning above and one informational A9 reminder that the
package has no `docs/architecture.md`. The A9 record is informational rather than a finding, so it
is not counted in the triage total.

## Temporary allowance register

| File | Line | Rule | Assessment |
| --- | ---: | --- | --- |
| `.llm/tools/fitness/check-doctrine.ts` | 210 | `explicit-any` | The scanner matches the English word “any” in an existing comment (`any export abstract class`), not a TypeScript `any`. A per-line allowance names #1549; delete it when that issue adds comment-awareness. |
| `.llm/tools/fitness/check-doctrine.ts` | 278 | `explicit-any` | The scanner matches the English word “any” in an existing heuristic comment (`any class chain`), not a TypeScript `any`. The same reversible #1549 allowance applies. |

The committed pre-allowance changed-file run at `b64550722` exited 1 on these two lines. That is the
red-first proof that a `.llm/tools`-only PR now executes and reports; before PR-B the workflow ran no
command and returned success. The final scan is green with two reported allowances.
