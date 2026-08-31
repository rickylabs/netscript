You are an INDEPENDENT IMPL-EVAL evaluator in a SEPARATE session from the implementation author.
EVALUATE ONLY — no edits.

## Scope — bounded delta

Read-only worktree, detached at **`a2b227941`**. **Evaluate only `git diff bbf866d59..a2b227941`.**
The seed-connection repair (`f29a0b265`) and the actionable-stderr bound (`bbf866d59`) each already
hold their own delta `PASS`.

## Why this delta exists

`generated.quality-negative` failed on three consecutive Postgres-tier runs, stopping the suite at
~gate 27 so `database.seed` (gate 40) was never reached. The diagnosis receipt establishes the cause
exactly:

```
throw: generated check did not recover after quality probes   (generated-quality-probes.ts:144)
aspire/.helpers/register-infrastructure.mts(83,69):
  error TS2339: Property 'getValueAsync' does not exist on type 'ReferenceExpression'.
```

So the seed repair's emitted resolver — `(await x.connectionStringExpression()).getValueAsync()` —
**does not compile against the real Aspire 13.5.3 SDK**. This is precisely the residual the seed
repair's own evaluator flagged: *string-tested but not locally type-checked*.

The repair replaces it with `getValue()` plus an explicit `null` check that throws a named error.

## What to verify — execute, do not infer

1. **`getValue()` is the correct API and `getValueAsync` genuinely does not exist** on
   `ReferenceExpression` in the pinned Aspire 13.5.3 SDK. Check the SDK's own type declarations —
   do not accept the compiler diagnostic alone as proof the *replacement* is right.
2. **The emitted output compiles.** Render `register-infrastructure.mts` and `run-tool.mts` and
   type-check both against the restored SDK. Report exit codes.
3. **Semantics are preserved.** The seed repair's value was **late-bound resolution at
   command-execution time**. Confirm `getValue()` on the awaited `connectionStringExpression()` still
   resolves late — not at graph-construction time — and that the change is a compile fix, not a
   silent reversion to static lookup.
4. **The null path is sound.** `getValue()` can return `null`; the repair throws
   `Aspire did not resolve the connection string for database '<name>'.` Confirm that name is
   **`JSON.stringify`-safe or otherwise injection-safe** — this branch carries a slice whose entire
   purpose was escaping user-supplied names into generated source, so an unescaped name in a thrown
   string here would be a regression of the slice's own contract. Check what happens for a name
   containing a quote or `${}`.
5. **The new static coverage is real.** `generated-helpers-compile_test.ts` (+103) is the structural
   fix: a generator emitting non-compiling source should now fail **statically** rather than at gate
   27 of a runtime suite. Prove it **red without the repair** (the receipt claims TS2339), and
   confirm it type-checks genuinely emitted output rather than a hand-written sample.
6. **Scope + barrel**: confirm the delta touches only the resolver emission, its tests, and any
   barrel regeneration — and that `gen:assets-barrel` is diff-clean at HEAD.
7. **No bypass**: the probe, the generated `check`/`lint` tasks, and the gate must not be weakened.

## Runtime

Do not start Aspire, Docker, or an AppHost. Scaffolding and `deno` type-checks are not runtime.

## Output

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### API correctness (`getValue` vs `getValueAsync`)
### Emitted-output compile results
### Late-binding semantics preserved?
### Null-path + name-escaping safety
### Static coverage — red-without-repair proof
### Scope · barrel · no-bypass
### Verdict rationale (3–6 sentences)

Under 900 words. Ground every claim in something you executed or read.
