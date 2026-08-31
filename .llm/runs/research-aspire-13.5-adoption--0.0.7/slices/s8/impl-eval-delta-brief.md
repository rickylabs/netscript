You are an INDEPENDENT IMPL-EVAL evaluator in a SEPARATE session from the implementation author
(Codex GPT-5.6 Sol). EVALUATE ONLY — no edits.

## Scope — bounded delta

Worktree (read-only): this checkout, detached at **`f29a0b265`**.
**Evaluate only `git diff d1c6d8b54..f29a0b265`.** S8's prior IMPL-EVAL `PASS` at `bc838a0b3` already
carried to `d1c6d8b54` on verified blob identity; you are judging the seed repair on top, not the
whole slice.

## What the repair claims

S8's Postgres-tier gate `database.seed` fails with **exit 16** and a `PrismaClientKnownRequestError`
on `prisma.user.findFirst()`, immediately after `database.init`, `migration-artifacts` and `generate`
all pass. Ownership is established by containment: every head carrying S8's typed-db surface fails
this gate; the two heads without it (#1747 `2032d4ed7`, #1744 `bd3dbc843`) **pass** it.

The author's stated cause: **the typed `<db>-cli` callback replaced Aspire's late-bound resource
injection with a static AppHost configuration lookup**, so the typed command resolved a connection
that is not the live resource's. The repair "restores resource-expression resolution".

## Required verification — execute, do not infer

1. **Confirm the mechanism in the code.** Show what the callback resolved *before* and *after*, in
   `generate-db-cli-mode.ts` / `generate-db-cli-mode-1.ts.template` and
   `generate-register-infrastructure*.ts`. Is late-bound resource-expression resolution genuinely
   restored, or is a different value merely substituted?
2. **Render and inspect the emitted output.** The changed files are generators/templates — render
   them and show the emitted connection-resolution lines before and after. A generator diff that
   looks right can still emit wrong source; this programme has already shipped one such head.
3. **Prove the new tests bite.** `generate-db-cli-mode_test.ts` (+21) and
   `generators-config-infra_test.ts` (+16) are the claimed regression coverage. **Revert the repair
   and show they go red.** Assertions that merely restate the new emission are not coverage.
4. **Check the generated barrel.** `embedded.generated.ts` moved by 4 lines — confirm it is a faithful
   regeneration of the changed templates and not a hand edit.
5. **Confirm no bypass.** The repair must not make the gate pass by weakening it: no skipped gate, no
   caught Prisma error, no seeded-around failure, no tier exclusion.
6. **Scope discipline.** Confirm the delta touches only the seed connection path and its tests — no
   unrelated product behaviour changed under cover of a repair.

## An honest limitation you should verify, not repeat

The author reports that the Prisma **`code` and `meta` are unrecoverable** from the CI artifacts: D-07
bounded retained stderr to three lines, ending at `Invalid prisma.user.findFirst() invocation:`, and
both report ZIPs and both job logs stop there. The author **declined to label the failure `P2021`/
`P2022`/`P1001`/`P2002` without bytes** — that restraint is correct. Verify the limitation is real,
and state whether the repair is justified **without** the code, on the code-path evidence alone.

## Runtime

Do not start Aspire, Docker, or an AppHost — leases are serialized and this is not yours. CI is the
runtime authority.

## Output

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### Mechanism — confirmed or refuted
### Emitted-output comparison
### Mutation proof
### Barrel + scope check
### Verdict rationale (3–6 sentences)

Under 900 words. Ground every claim in something you executed or read.
