# Research — leaf-1881

## Re-baseline

- Carried-in source: coordinator brief for issue #1881 and the parent Aspire 13.5 adoption run.
- Re-derived against `origin/main` at `79adb103be568260e51b0eb3ba9fae281a5fe1f0` on 2026-09-03.
- The worktree HEAD and remote `main` both resolve to the coordinator's baseline. The parent
  `research.md` named in the brief is absent from this worktree, so Aspire readiness syntax was
  verified directly with local Aspire CLI 13.5.3 help.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Root README Quickstart commands are not marked or parsed by an executable gate. | `README.md` Quickstart section; `quickstart-command-drift_test.ts` reads `docs/site/quickstart.vto`. |
| 2 | The existing `quickstart.walk` intentionally rewrites the flow and retries its combined Aspire gate. | `packages/cli/e2e/suites/quickstart/quickstart-walk-suite.ts`. |
| 3 | `aspire wait postgres --status healthy --timeout 60` is valid on Aspire CLI 13.5.3. | `aspire wait --help` on 2026-09-03. |
| 4 | Command gates already record argv, cwd, exit, duration, attempt count, and bounded stdout/stderr tails. | `src/application/gates/command-gate.ts`. |
| 5 | Cleanup already delegates to the exact-AppHost, ownership-proving durable cleanup gate. | `createCleanupGates()` in `runtime-gates.ts`. |
| 6 | The nested `packages/cli/e2e` workspace is gate code, not an independently published doctrine unit. | Doctrine 06 and 09 F-19. |

## jsr-audit surface scan

- N/A: this slice changes no package export, `mod.ts`, `deno.json`, JSDoc contract, dependency, or
  publish surface. It adds private CLI E2E gate code and documentation markers only.

## Open questions

- None. The coordinator locked command substitutions, execution order, no-retry behavior, cleanup,
  workflow placement, and hosted-runtime ownership.
