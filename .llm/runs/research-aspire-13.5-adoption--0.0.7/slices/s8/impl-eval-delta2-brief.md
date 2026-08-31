You are an INDEPENDENT IMPL-EVAL evaluator in a SEPARATE session from the implementation author.
EVALUATE ONLY — no edits.

## Scope — bounded delta

Worktree (read-only): this checkout, detached at **`bbf866d59`**.
**Evaluate only `git diff f29a0b265..bbf866d59`.** The seed-connection repair at `f29a0b265` already
holds its own delta `PASS`; you are judging the observability change on top.

## Why this delta exists

`run-tool.ts.template` capped retained actionable stderr at **3 lines**. That bound destroyed real
diagnostics twice in this programme:

1. the `database.seed` Prisma failure — retained detail ended at
   `Invalid prisma.user.findFirst() invocation:`, so the Prisma **`code`** and **`meta`** on later
   lines were **never serialized**; an evaluator confirmed their absence in the full 237,687-byte job
   log;
2. a `generated.quality-negative` failure whose retained stderr began mid-path inside a file list, so
   the decisive error line was absent entirely.

The change raises the bound and adds byte ceilings.

## What to verify — execute, do not infer

1. **The bounds are real and coherent.** `MAX_ACTIONABLE_STDERR_LINES = 32`,
   `MAX_ACTIONABLE_STDERR_BYTES = 16 * 1024`, a derived per-line ceiling, and head/tail split
   constants. Confirm the arithmetic cannot overflow the total ceiling for any input, including
   32 maximally-sized lines, and that `truncateUtf8` cannot split a multi-byte character.
2. **Head-and-tail retention actually helps the motivating case.** Render/execute a fixture whose
   identifying field sits **beyond line 3** — the Prisma shape — and prove the field now survives into
   the persisted error file. Then prove a >32-line stderr still retains its tail, since the original
   defect was that the informative part came *after* the preamble.
3. **D-07 behaviour is intact**: the first actionable line is still `message`; `Task ` banners are
   still filtered; `stripVTControlCharacters` still runs before classification; `actionableStderr`
   remains additive. The original ANSI-banner test must still pass **unchanged**.
4. **No unbounded growth path.** Confirm a single enormous line, and a pathological stderr of many
   large lines, are both clamped — this is the failure mode the cap exists to prevent, and removing
   it would trade one defect for a worse one.
5. **Mutation proof**: revert the change and show the new test goes red for the right reason (the
   identifying field lost), not merely because a constant differs.
6. **Barrel**: `embedded.generated.ts` must be a faithful regeneration — confirm
   `deno task gen:assets-barrel` yields no tracked delta at HEAD.
7. **Scope**: confirm the delta touches only the observability seam, its tests and the barrel — the
   seed connection-path repair must be untouched.

## Runtime

Do not start Aspire, Docker, or an AppHost. CI is the runtime authority.

## Output

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### Bound arithmetic + UTF-8 safety
### Motivating-case proof (field beyond line 3 survives)
### D-07 behaviour intact
### Unbounded-growth check
### Mutation proof · Barrel · Scope
### Verdict rationale (3–6 sentences)

Under 900 words. Ground every claim in something you executed or read.
