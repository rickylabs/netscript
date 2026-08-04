# Context Pack — #1254

## State

- Branch: `fix/scaffold-database-zod-barrel-1254` at baseline `3a267aef1`.
- Phase: composed plan-eval; no product edit yet.
- Archetype: 6 CLI/tooling; `@netscript/database` script is a touched supporting package.

## Completed

- Read issue, skills, doctrine profile, import-map generators, contract template, Zod postprocessor,
  and focused tests.
- Resolved hidden template mismatch: complete barrel needs all-model create/update aliases.

## Next

1. Commit/push bootstrap and open draft.
2. Add RED two-model/path assertions.
3. Implement aliases and repoint both maps; run targeted gates.

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

