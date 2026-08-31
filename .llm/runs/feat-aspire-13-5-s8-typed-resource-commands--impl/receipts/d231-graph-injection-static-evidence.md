# D-231 graph-injection static evidence

Baseline: `a2b227941160bd993b0468cea2a0e12cebc63013`

## Runtime-capability distinction

- Workflow run `33447847678`: `Unknown capability:
  Aspire.Hosting.ApplicationModel/getValue`; database operation exit 16.
- Aspire 13.5.3 `Resources/base.mts:149-166`: declared `getValue()` dispatches that exact live RPC.
- Aspire 13.5.3 generated `ExecuteCommandContext`: services, resourceName, cancellationToken,
  logger, and arguments only; no connection-string accessor.
- Supported mechanism selected: the existing explicit-start executable annotated with
  `withEnvironment(..., target.resource)`, `withReference`, and `waitFor`. Existing workflow
  init/migrate/generate behavior is the runtime proof for allocation/environment injection; no
  local runtime was permitted or run.

## RED

Structured focused wrapper before the product fix: exit 1; passed 30, failed 6, total 36.
Named failures included:

- `compile-clean Container emission must not call an unsupported runtime capability`
- `Container commands must consume Aspire graph-injected environment instead of a callback resolver`

The baseline emitted `connectionStringExpression().getValue()` and had no Container resource-start
branch.

## GREEN

| Gate | Exit | Result |
| --- | ---: | --- |
| focused helper directory | 0 | 256 passed, 0 failed |
| generated asset barrel | 0 | intended embedded delta regenerated |
| scoped check | 0 | 7 files; `failedBatches: 0` |
| scoped lint | 0 | 7/7; no findings or drops |
| scoped fmt | 0 | 6/6 plus 1/1; no findings |
| `quality:gate` | 0 | scanner clean; doctrine `FAIL=0` |
| repository check | 0 | 2,986 files; 25 batches; `failedBatches: 0` |

Post-commit asset-barrel, remote, push, and clean-tree evidence is appended after the clean product
commit. Runtime/Aspire/Docker/AppHost/E2E and evaluator dispatch are intentionally absent.
