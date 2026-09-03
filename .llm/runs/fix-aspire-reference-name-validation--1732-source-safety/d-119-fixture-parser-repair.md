# D-119 fixture-parser repair

Date: 2026-08-31

## Scope

- Coordinator-selected option (a): make only the Flow-B fixture's three `workers` anchors accept
  either single or double quotes.
- Preserve the matched config/set substrings so index calculations and the set-anchor replacement
  operate on the exact on-disk text.
- Preserve all existing absence guards and error messages.
- `PLAN-EVAL: N/A` — bounded mechanical correction with the full contract and acceptance evidence
  supplied by the coordinator.
- No new IMPL-EVAL — the coordinator explicitly retained the accepted verdict for PR #1747.

## Verification

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Focused structured check | 0 | 1 file selected; 1 batch; 0 failed batches; 0 findings |
| Focused structured lint | 0 | 1 file selected and processed; 0 findings |
| Focused structured format | 0 | 1 file selected and processed; 0 findings |
| Focused fixture unit tests | N/A | No test imports or directly exercises `prepare-flow-b-fixture.ts`; repository search found none |
| `deno task quality:gate` | 0 | Repository quality scan found no findings; doctrine check completed with no failures |

The scaffold-only reproduction ran these local-source operations without starting Aspire, Docker,
or any runtime process:

1. `netscript-dev init d119-smoke --db postgres --no-git --non-interactive`
2. `netscript-dev plugin install workers --name workers`
3. Execute the repaired fixture match/index/replace path against
   `aspire/.helpers/register-background.mts`.

Exact parser evidence:

```json
{
  "workersBinding": "bg_0",
  "executableAnchor": "const bg_0 = builder.addExecutable('workers',",
  "workersConfigAnchor": "  if (config.BackgroundProcessors['workers']?.Enabled !== false) {",
  "workersBackgroundIndex": 2232,
  "workersSetAnchor": "    backgroundProcessors.set('workers', bg_0);",
  "workersSetIndex": 5345,
  "configuredContainsUsersReference": true,
  "configuredUsersReference": "        await bg_0.withEnvironment(\"services__users__http__0\", usersEndpoint);"
}
```

The throwaway scaffold and temporary parser probe were moved to trash after verification. No lock
file, generator, formatting convention, workflow, or unrelated source file changed.
