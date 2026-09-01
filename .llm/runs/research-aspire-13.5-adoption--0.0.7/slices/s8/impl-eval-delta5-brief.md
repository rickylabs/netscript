You are an INDEPENDENT IMPL-EVAL evaluator in a SEPARATE session from the implementation author.
EVALUATE ONLY — no edits.

## Standing quarantine — read first

The implementation session committed `evaluate.md` in `e4464e9f4` claiming an "IMPL-EVAL PASS" for
this work. **That artifact is inadmissible and you must ignore it entirely.** The harness requires the
evaluator to be a **separate, supervisor-dispatched** session; a generator cannot commission its own
evaluation, whatever model it names. **Do not read, cite, or be influenced by `evaluate.md`.** Form
your own verdict from the diff and from what you execute. This brief is the only sanctioned
evaluation of this delta.

## Scope — bounded delta

Read-only worktree, detached at **`e4464e9f4`**.
**Evaluate `git diff 927d24bed..e4464e9f4`** — three product commits: `592a8e688` (surface retained
typed command failures), `a5f1ab7e0` (retain typed command stdout diagnostics), `9c5fa1b0b` (deploy
typed database migrations).

Four earlier deltas on this branch each hold their own supervisor-dispatched `PASS`
(`f29a0b265`, `bbf866d59`, `a2b227941`, `927d24bed`).

## Context

At `927d24bed`, **`database.seed` finally passed** (58 gates) and `runtime.typed-db-phase-b` failed:

```
aspire resource postgres-cli migrate --timeout 60 … failed (16):
  Failed to execute command 'migrate' on resource 'postgres-cli':
    Loaded Prisma config from prisma.config.ts.
     Prisma schema loaded from schema.
```

Those two lines are **Prisma's informational preamble, not the error** — the real cause was masked.
The author reports two distinct findings: (a) the diagnostic surfaced only the first line, and
(b) the underlying defect is that **request mode ignored a separate task operation and the generated
DB adapter lacked a `migrate` → `deploy` mapping**.

## What to verify — execute, do not infer

1. **The masking fix is generic, not Prisma-shaped.** This seam serves every tool. Confirm no
   Prisma-specific string, path or heuristic was introduced, and that an arbitrary tool emitting an
   informational preamble followed by a real error now surfaces the **error**. Prove it with a fixture
   you construct.
2. **The `migrate` → `deploy` mapping is correct, not merely green.** Confirm `deploy` is the right
   Prisma operation for this path and that the **public action label stays `migrate`** while `deploy`
   is what the Container task actually runs. Check the External/SQLite direct-execution path uses the
   same mapping — a divergence between modes is how the original defect class started.
3. **Retained-stdout change is bounded.** `run-tool.ts.template` grew by 67 lines. Confirm D-224's
   ceilings still hold for the **combined** stdout+stderr retention — constants unchanged is not
   sufficient; check the totals cannot exceed the byte ceiling now that a second stream is retained.
4. **Red-without-fix**, per stream: prove the three named failing records go red against `927d24bed`
   and green at HEAD.
5. **Earlier deltas intact** — verify explicitly, do not accept the author's claim: D-224 bounds and
   head/tail, D-227 emitted-compile coverage, D-231 graph-injection guards. Five repairs now stack;
   a later one silently undoing an earlier one is the realistic failure mode.
6. **No bypass**: the Phase-B verifier, seed gate, quality probe and generated `check`/`lint` tasks
   must be unweakened. Barrel diff-clean.

## Runtime

Do not start Aspire, Docker, or an AppHost. Scaffolding, `aspire restore`, `tsc`/`deno check` are not
runtime.

## Output

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### Masking fix — generic?
### migrate → deploy correctness and mode parity
### Combined stdout+stderr bounds
### Red-without-fix proof
### Earlier deltas intact (verified, not asserted)
### No-bypass · barrel
### Verdict rationale (3–6 sentences)

Under 900 words. Ground every claim in something you executed or read.
