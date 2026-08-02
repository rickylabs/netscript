SUPERVISOR COURSE CORRECTION (Part A, better-auth mapping) — verified from the pinned packages in the local Deno cache. Use this; do not re-derive.

1) Per-entity `modelName` IS supported in the pinned version. `@better-auth/core@1.6.25/dist/db/get-tables.mjs` resolves:
   - line 132: `modelName: options.user?.modelName || "user"`
   - line  79: `modelName: options.session?.modelName || "session"`
   - line 179: `modelName: options.account?.modelName || "account"`
   - line  42: `modelName: options.verification?.modelName || "verification"`
   So Part A is feasible — do NOT stop on stop-line 5 for this reason.

2) IMPORTANT — the value must be the PRISMA CLIENT ACCESSOR, not the Prisma model identifier.
   `@better-auth/prisma-adapter@1.6.25/dist/index.mjs` calls `db[model].create(...)`,
   `db[model].findFirst(...)`, `db[model].findMany(...)`, `db[model].count(...)` (lines 172-246)
   directly with the resolved `modelName`, and Prisma client accessors are camelCase.
   So with Prisma models `AuthUser` / `AuthSession` / `AuthAccount` / `AuthVerification`, the
   options must be:

       user:         { modelName: 'authUser' },
       session:      { modelName: 'authSession' },
       account:      { modelName: 'authAccount' },
       verification: { modelName: 'authVerification' },

   i.e. lowercase first letter. Passing `'AuthUser'` would throw
   `BetterAuthError: Model AuthUser does not exist in the database`.

3) Prove it with a test rather than by inspection:
   - assert `createBetterAuthOptions()` returns those four `modelName` values;
   - assert a caller-supplied `betterAuthOptions.user.modelName` still OVERRIDES the default
     (caller precedence must be preserved).

Everything else in the brief stands unchanged, including all stop-lines. In particular: still no
canary/release dispatch, still no merge, still no weakening of any assertion or of
`--service-name users` in `scaffold-gates.ts`.
