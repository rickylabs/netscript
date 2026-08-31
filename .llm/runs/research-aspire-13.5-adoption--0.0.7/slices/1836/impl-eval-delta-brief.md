You are an INDEPENDENT IMPL-EVAL evaluator in a SEPARATE session from the implementation author.
EVALUATE ONLY — no edits.

## Scope — bounded delta

Worktree (read-only): this checkout, detached at **`d23276664`**.
**Evaluate only `git diff 6ef9306ef..d23276664`** — two files, +131/−45. The slice's GLM `PASS` at
`01d32c95f` already carried to `6ef9306ef` on verified product-blob identity (artifact-strip only).

## Why this delta exists

The slice hardened four Aspire generators: **ordinal, user-text-free bindings** and `JSON.stringify`
escaping of every user-supplied string. Exact-head CI then failed **4 tests / 3 unique**, all in
`packages/cli/e2e/src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts`, because that
consumer located its injection points by **user-derived text**:

- `` line.includes(`.withHealthCheck('${key}');`) `` — single-quoted, user-derived;
- `` `  // --- ${name} (task) ---` `` — user text inside a generated comment the hardening removed.

The repair replaces both with **semantic map-write / health-call boundary discovery**.

## What to verify — execute, do not infer

1. **The hardening is untouched.** Confirm no generator changed in this delta and that ordinal
   bindings plus `JSON.stringify` escaping still hold at HEAD. A repair that quietly relaxed the
   generator to match the fixture would be the worst outcome here, and it is what the previous CI
   failure creates pressure to do.
2. **Discovery is genuinely quote- and name-agnostic.** Inspect the new health-call pattern
   (~line 169) and the block-boundary logic (~lines 205–220). Prove by **rendering** hostile inputs —
   reserved words, colliding names (`a-b` + `a_b`), quotes/backslashes/`${}` in names, and **both**
   quote styles (the on-disk file has been through `deno fmt --single-quote`) — that discovery still
   finds the seam and binds the right resource. Do not reason from the regex alone.
3. **Fail-closed survives.** Each `throw new Error(...)` must still fire when the seam is genuinely
   absent. Prove it: remove/rename each marker in a fixture and confirm the corresponding guard
   throws with intent intact.
4. **Duplicate-registration assertions survive** — a second registration for the same resource must
   still be detected and rejected.
5. **The masked test is unmasked.** Before the repair, the missing-**Garnet** assertion failed on the
   *postgres* marker error first, so it no longer proved its own contract. Confirm it now fails for a
   missing **Garnet** marker specifically.
6. **Mutation proof, both directions.** Revert the seam change → the three fixture tests go red.
   Revert the generator hardening → the source-safety tests go red. Both mechanisms must bite.
7. **Whole-directory run.** Execute the full helper-generator test directory in **one** invocation, not
   per file — a per-file pass previously hid two failures in this slice.

## Runtime

Do not start Aspire, Docker, or an AppHost. CI is the runtime authority.

## Output

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### Hardening intact?
### Discovery under hostile input (rendered results)
### Fail-closed + duplicate-registration proof
### Masked-test check
### Mutation proof (both directions)
### Verdict rationale (3–6 sentences)

Under 900 words. Ground every claim in something you executed or read.
