# Fresh scaffold check evidence — #1287

Date: 2026-08-05

## Scaffold

The workspace was generated from this branch without source edits:

```text
deno run -A packages/cli/bin/netscript-dev.ts init issue-1287-fresh \
  --path .llm/tmp --db postgres --service --yes --no-git
Created: 218 files, 45 directories
Copied 28 local packages.
```

Workspace: `.llm/tmp/issue-1287-fresh`

The normal Postgres client generation prerequisite was run with a local placeholder
`DATABASE_URL`; the first check had reached the showcase but reported only the absent generated
Prisma/Zod artifacts. No scaffold source file was edited.

## Artefacts checked

The generated root task is:

```text
deno check apps/**/*.ts services/**/*.ts contracts/**/*.ts
```

| Artefact | SHA-256 |
| -------- | ------- |
| `deno.json` | `a22b350b80825241d27310d161b27f9433320b91732cc9c70a7ccc7ed2e63b48` |
| `apps/dashboard/routes/examples/users/(_shared)/service-showcase.ts` | `8f0625def7b97b73b3842e20dc90e9c754fef16fae2543149e8bd5df50ba6204` |

The showcase contains the uncast boundary:

```ts
const queryClient = createNetScriptQueryClient();
// ...
dehydratedState: dehydrateQueryClient(queryClient),
```

## Workspace check result

`deno task check` enumerated 24 generated TypeScript artefacts, including:

```text
Check apps/dashboard/routes/examples/users/(_shared)/service-showcase.ts
Check services/users/src/routers/v1.ts
Check contracts/versions/v1/users.contract.ts
```

The checker emitted no `TS` diagnostics and no `Found ... errors` summary. The command completed
after the final contracts artefact. This is content evidence that the generated showcase was in the
compiler program and produced zero errors, not an exit-code-only claim.
