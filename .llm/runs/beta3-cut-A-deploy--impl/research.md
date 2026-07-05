# Research — beta3-cut-A-deploy--impl

## Re-baseline

- Carried-in source: user prompt for beta.3 #393/#394 deployment slices; issues #393/#394; epic #327.
- Re-derived against branch `fix/deploy-compose-target-393` on 2026-07-05.
- What changed vs the carried-in version:
  - `packages/cli/src/public/features/root/public-command-dependencies.ts` already appends `compose` and `docker` when constructing public CLI dependencies, which masks the default-registry bug for the public command tree but leaves `DEFAULT_DEPLOY_TARGETS` incomplete.
  - GitHub issue #393 is open with milestone `0.0.1-beta.3`; #327's live milestone is `0.0.1-beta.5`, but the design context says GitHub milestones win and #393/#394 are beta.3 foundation.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `DEFAULT_DEPLOY_TARGETS` only contains `windows-service`, `linux-service`, and `deno-deploy`. | `packages/cli/src/kernel/application/registries/deploy-target-registry.ts` |
| 2 | The Aspire Docker/Compose adapter exists and serves the two registry keys `compose` and `docker`. | `packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts` |
| 3 | `deploy-group.ts` wires `.command('docker', ...)` and `.command('compose', ...)` through the registry-backed target router. | `packages/cli/src/public/features/deploy/deploy-group.ts` |
| 4 | Existing deploy target tests already assert default registry keys and need expansion to prevent future unregistered targets. | `packages/cli/src/kernel/domain/deploy/deploy-target-port_test.ts` |
| 5 | `public-command-dependencies.ts` manually appends `compose` and `docker` after spreading `DEFAULT_DEPLOY_TARGETS`; moving those entries into the default registry removes the duplicate source of truth. | `packages/cli/src/public/features/root/public-command-dependencies.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: N/A.
- Slow-type / surface risks: none.
- Reason: #393 changes internal CLI registry wiring and tests only; it does not change `mod.ts`, `deno.json` exports, or public JSR docs.

## Open questions

- None for #393. The target registry should be the single first-party target source, and public command dependencies should consume it directly.
