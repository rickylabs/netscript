You are an INDEPENDENT IMPL-EVAL evaluator in a SEPARATE session from the implementation author.
EVALUATE ONLY — no edits.

## Scope — bounded delta

Read-only worktree, detached at **`927d24bed`**. **Evaluate only `git diff a2b227941..927d24bed`.**
Three earlier deltas on this branch each hold their own `PASS` (seed connection `f29a0b265`, stderr
bound `bbf866d59`, compile fix `a2b227941`).

## Why this delta exists

Two mechanisms for resolving the typed `<db>-cli` connection string have already failed, for
**different** reasons:

- `getValueAsync()` — **does not type-check** (TS2339; it exists on `EndpointReference`, not
  `ReferenceExpression`);
- `getValue()` — **type-checks**, but CI run `33447847678` returned
  `Unknown capability: Aspire.Hosting.ApplicationModel/getValue`, exit 16. It is **not a supported
  runtime capability** in the command-callback context.

This delta abandons in-callback resolution and returns to **graph injection** —
`withEnvironment(..., target.resource)` + `withReference` + `waitFor` on the executable.

## What to verify — execute, do not infer

1. **The unsupported-capability claim is properly grounded.** The author cites Aspire 13.5.3's
   generated `ExecuteCommandContext` as exposing only services, resourceName, cancellationToken,
   logger and arguments — **no connection-string accessor**. Verify that in the restored SDK's own
   declarations. If true it is decisive: in-callback resolution is not merely unsupported by one RPC,
   it is absent from the context type.
2. **The chosen mechanism is the one `init`/`migrate`/`generate` already use**, which pass on every
   run while `seed` fails. Confirm the emitted `seed` path now matches theirs, and say precisely how
   the connection string reaches the child process.
3. **Render and compile the emitted output.** `register-infrastructure.mts` and the db-cli helper must
   type-check against the restored SDK (`tsc --noEmit -p aspire/tsconfig.apphost.json`). The D-227
   `generated-helpers-compile_test.ts` must still pass — a fix that re-broke compilation would be the
   third failure of this exact kind.
4. **The new coverage catches the runtime class, not just this instance.** The author added
   `compile-clean Container emission must not call an unsupported runtime capability` and
   `Container commands must consume Aspire graph-injected environment instead of a callback resolver`.
   Prove both **red without the fix** (the receipt claims 30 passed / 6 failed at baseline), and judge
   whether they would catch a *future* regression to any in-callback capability call — or only the
   `getValue` spelling.
5. **External and SQLite modes still correct**: `getConnectionString(...)` for External and the file
   URL for SQLite must be untouched, since those were never the defect.
6. **No bypass**: the seed gate, the quality probe, and the generated `check`/`lint` tasks must be
   unweakened. Barrel diff-clean.
7. **Nothing earlier regressed**: the D-224 stderr bounds and the D-227 static compile coverage must
   both survive this delta.

## Runtime

Do not start Aspire, Docker, or an AppHost. `aspire restore`, scaffolding, and `tsc`/`deno check` are
not runtime and are expected.

## Output

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### ExecuteCommandContext evidence
### Mechanism parity with init/migrate/generate
### Emitted-output compile results
### New coverage — red-without-fix, and class-level or instance-level?
### External/SQLite · no-bypass · earlier deltas intact
### Verdict rationale (3–6 sentences)

Under 900 words. Ground every claim in something you executed or read.
