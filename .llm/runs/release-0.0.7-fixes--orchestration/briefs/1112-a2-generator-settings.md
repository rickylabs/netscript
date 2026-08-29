# Brief — #1112 single required advisory fix (IMPL-EVAL A2) at `cd69eb7cb`

Canonical author, thread `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, head
`cd69eb7cbb35fffdd16dba3f68dc26311a45699b`.

**IMPL-EVAL cycle 1 returned `PASS_IMPL` with no blocking findings.** Artifact
`06e38089123923baea3c3b67410a351b69049c72` on `refs/heads/eval/impl-eval-1711-cycle-1`; comment
`5462050873`. The evaluator confirmed the implementation is honest across all seven paths, complete
against every locked decision, adequately gated, and that gate 5 is demonstrably load-bearing.

Four advisories were raised. **Exactly one requires action.** Do not touch the others — the product
is accepted and must not be churned.

## The one fix — A2, `examples/basic-usage.ts` header only

The header's prerequisite 3 promises "A Prisma client generated to `examples/.generated/client.ts`"
and the `@example` block shows `deno run -A npm:prisma generate --schema path/to/schema.prisma`. A
reader with a default schema will **not** get that file: producing it requires
`provider = "prisma-client"`, `runtime = "deno"`, and an `output` pointing at `examples/.generated`.
The evaluator confirmed only the plan's scratch schema (carrying those three settings) produced
`client.ts` at that path.

This matters because the leaf exists to make the published story reproducible. An instruction a
reader cannot follow is the same class of defect the leaf is fixing.

Amend the header prose so the generator requirements are explicit — the three settings named above,
in whatever wording reads naturally alongside the existing prerequisites. Keep it brief; this is a
documentation clarification, not a new section.

## Explicitly NOT in scope

- **A1** (`@deprecated` on the whole `tls.mode` property) — the evaluator states no action is required
  in this leaf; a union literal cannot carry JSDoc and the tag text already scopes the deprecation.
  A future breaking-change slice owns it. **Leave `src/types.ts` untouched.**
- **A2 sub-note** — the site page's `../../schema/...` vs the README's `./schema/...`. The evaluator
  confirms both are correct at their respective depths. Cosmetic only. **Leave both untouched.**
- **A3** (PR still labelled `status:plan`) — supervisor work, not yours.
- **A4** — the evaluator's own probe deviation note. Not a leaf defect. No action.

## Boundaries

- **One file: `packages/prisma-adapter-mysql/examples/basic-usage.ts`, header comment only.** No
  change to the executable body — the code is evaluator-accepted and must not move.
- No `deno.lock` change, no new path, no eighth path.
- Re-run only what the change can affect: package `check`, `lint`, `fmt` on
  `packages/prisma-adapter-mysql`, plus `docs:accuracy` if you judge it touched. Do **not** re-run
  the generation/gate-5 protocol; a header comment cannot alter it.
- No merge, readiness flip, label, or PR state change — the supervisor owns those next.
- No self-certification.

## Finish

Commit, **explicitly push** with a full refspec, report the exact head SHA and the gates you re-ran
with their results. Then stop. The supervisor verifies the delta is header-only, advances readiness
and labels, runs the close/readiness gate, and merges under the standing coordinator mandate.
