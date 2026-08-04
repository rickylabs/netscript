# Context Pack — #1254

## State

- Branch: `fix/scaffold-database-zod-barrel-1254` at baseline `3a267aef1`.
- Phase: implementation verified; ready for commit and PR readiness transition.
- Archetype: 6 CLI/tooling; `@netscript/database` script is a touched supporting package.

## Completed

- Read issue, skills, doctrine profile, import-map generators, contract template, Zod postprocessor,
  and focused tests.
- Resolved hidden template mismatch: complete barrel needs all-model create/update aliases.
- Repointed root and contracts import maps to the complete models barrel.
- Added deterministic, idempotent aliases for each generated model's create/update inputs.
- Proved the behavior with a real two-model import-map consumer and unchanged contract scaffolding.
- Passed focused, package, static, quality, doc-lint, and publish-dry-run gates.

## Next

1. Commit and push the verified implementation.
2. Post implementation evidence, update issue acceptance, and mark PR ready.
3. Start #1253 from a fresh `origin/main` branch.

## Files planned

- `packages/cli/src/kernel/templates/workspace/deno-json.ts`
- `packages/cli/src/kernel/application/scaffold/workspace-init.ts`
- focused CLI tests
- `packages/database/scripts/fix-zod-imports.ts`
- database multi-model regression test
- run artifacts

## Drift/debt

- No new debt expected; inherited `deno.lock` line remains excluded.
- See draft PR commits/comments for the commit trail.
