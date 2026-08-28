# Tier-A returned FAIL — repair F1 inside the seven paths. Plan artifacts only.

Your repaired plan head `3e0f2223ac7bed9068ecc033c92da7ffbed83711` failed fresh Tier-A on **F1 alone**.
F2, F3 and F4 are accepted. Scope was correct throughout: plan-only, zero product paths.

## Why it failed — measured, not argued

Your D3 has the checked-in example import the literal `./.generated/client.ts`, with gate 1
scratch-generating a client, checking with a scratch `--config`, then deleting the output. Proven at
your exact head by `git archive` into scratch (tracked files only, so untracked residue is impossible),
planned import applied, no generated output, ordinary wrapper:

```text
run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts,tsx
filesSelected: 12 | failedBatches: 1 | occurrences: 1 | exit 1
TS2307 Cannot find module '…/examples/.generated/client.ts'
```

Control: the same pristine archive **without** the import returns exit 0. The red is the import.

Your gates cannot see this. Gate 1 passes only inside the scratch window. **Gate 5 is scoped
`--file … mod.ts`**, so it never selects the example. Post-cleanup resolvability appears nowhere in
`plan.md`, `research.md`, or `drift.md`. Implementation as planned would introduce a **permanent
`TS2307`**.

## Ruled out — do not propose it

Adding a top-level `"exclude": ["examples/**"]` to the package `deno.json` **does** return exit 0. It is
**rejected as a false green**: it works by no longer type-checking the example at all. Passing by
exclusion is not passing by resolution, and it is an eighth path besides.

## The architecture to plan and prove — inside the existing seven paths

**Two gates with two honestly different jobs.**

**1. Stable example shell — ordinary clean root check.** Make the generated-client import
**intentionally dynamic and non-literal**, resolved relative to the module at runtime, so `deno check`
performs no static resolution. This topic verified the shape at your exact head:

```ts
const generatedClientUrl = new URL('./.generated/client.ts', import.meta.url).href;
const { PrismaClient } = await import(generatedClientUrl);
const prisma = new PrismaClient({ adapter: connectedAdapter });
```

Measured on a pristine `git archive`, **no generated output present**, ordinary wrapper:
`filesSelected: 12 | failedBatches: 0 | occurrences: 0 | exit 0`. The example is still **selected and
checked** — that is not exclusion. Treat this as a verified anchor, but re-derive it yourself.

**2. Generated-client compatibility — the specialized scratch gate.** Keep your scratch-generated real
Prisma 7 client wrapper exactly as the structural factory/type proof, and **add a scratch runtime/import
smoke** showing the actual example genuinely resolves and runs the dynamic import **after** generation.
A type-check alone no longer covers that path, so the smoke is what replaces the lost static evidence.

## State the trade honestly — this is a required part of the plan

The plan must say plainly that **root checking validates the stable example shell** — adapter
construction, lifecycle, `finally` cleanup — **while the specialized scratch gate validates
generated-client compatibility**. Under the dynamic form `PrismaClient` and `prisma` are untyped at the
root-check level; do not imply root checking proves generated-client typing. Do not describe the
example as "fully type-checked" without that split.

Amend together, as before: `D3`, gate 1, gate 5, slice 2's proving gate, the risk-register row, research
rows 41/44, and the open-decision sweep entry.

## If it cannot satisfy both

If this architecture cannot deliver **both** a clean ordinary root check **and** real generated-client
evidence, **STOP**. Report measured proof of the failure and the **minimum** eighth path. Do not add one
silently, do not fall back to exclusion, and do not downgrade the executable claim to make a gate green.

## Unchanged

Same author, plan artifacts only, no product mutation. Seven-path envelope. No runtime, Aspire, Docker,
browser, `e2e:cli`, no lockfile, no other lane. PR **#1711** stays draft; reference **#1112** without a
closing keyword.

Commit, push by explicit refspec, report your exact head. Fresh Tier-A follows. **Cycle 2 is not
launched until the repaired head is pushed and that Tier-A passes.**
