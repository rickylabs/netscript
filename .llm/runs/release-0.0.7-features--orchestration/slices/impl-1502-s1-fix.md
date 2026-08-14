use harness

# #1502 slice S1 fix-up — Tier-A `CHANGES_REQUESTED`

Continue in this same thread. Tier-A topic review of `86d0110a545e449dfa094fc961a37a327604d23a`
returned **`CHANGES_REQUESTED`** with three defects inside S1's own normative contract. Slice hygiene
was clean and is not in question: scope, receipts, draft state, label, and RFC house shape all
passed, and verdict notes N-1/N-2/N-3 were verified closed in the files.

Read the full review before acting:
`/home/codex/repos/netscript-007-features/.llm/runs/release-0.0.7-features--orchestration/slices/tier-a-review-1502-s1.md`
(topic commit `b774998f0`), mirrored as PR comment
`https://github.com/rickylabs/netscript/pull/1651#issuecomment-5299247531`.

**This turn fixes S1 only. Do not start S2.** S2 is released after the next Tier-A stop.

## SKILL

- `.agents/skills/netscript-harness/SKILL.md` — slice discipline, commit trail, no self-certification.
- `.agents/skills/netscript-tools/SKILL.md` — structured wrappers, durable receipts, git ground truth.
- `.agents/skills/netscript-pr/SKILL.md` — per-slice PR comment and body anchors.
- `.agents/skills/netscript-doctrine/SKILL.md` — public-types-first; the contract must state what it
  actually guarantees.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` — `isolatedDeclarations` and published-surface
  semantics behind F1/F2.

## Fixes

All line numbers are in `rfcs/0000-plugin-cli-contribution.md` at the reviewed head.

- **F1 — declare `PluginCliDiagnosticCode`.** Line 350 types the failure boundary with it, and it
  appears exactly once in the document — at that use site, never declared. `PluginCliCapability` has
  an explicit S2 deferral at line 281; this symbol has none, so the gap reads as an oversight. The
  14 stable meanings are already enumerated at line 369. Declare the finite exported tuple and its
  derived union in the S1 normative block — S1 owns the failure contract, so do not defer it. Keep
  the `plugin.` namespace rule intact.
- **F2 — reconcile the builder's immutability guarantee.** Line 117 promises "a deeply readonly
  definition"; line 278 returns shallow `Readonly<TDefinition>`, which leaves `commands`, `children`,
  `arguments`, and `options` mutable. Immutability is load-bearing for the whole design ("a
  contribution is immutable static data", line 20). Express deep readonly in the normative signature,
  or correct the prose to shallow and re-scope the immutability claim. Do not leave the RFC asserting
  a guarantee its own signature does not provide. Whichever you choose, say explicitly what is
  type-enforced versus validated.
- **F3 — stop the handler-ref type from looking sufficient.** `` module: `./${string}` `` (line 225)
  admits `'./../escape.ts'`, which the invariant at line 288 forbids. Add one sentence stating the
  template literal is a shape hint and that normalization plus parent-traversal rejection is
  normative validation, not type-enforced. This is an import-safety seam; an implementer must not
  read the type as the check.

## Evidence labelling

- In `worklog.md`, state plainly that the three durable S1 receipts attest the **parent** commit
  `3e0c8858b`, not `86d0110a5` — the gates ran on the working tree before it was committed. This is
  the same disclosure class as verdict note N-4 and is acceptable for an intermediate slice because
  the S4 final-head rerun binds. Do not let "exact command/head in `receipts/…`" imply S1-head
  coverage.
- Label `receipts/source-format-s1.json` and `receipts/source-format-s1-write.json` as structured
  **wrapper reports**, not `run-gate.ts` durable receipts — they carry no `outcome`, `exitCode`, or
  `gitHead`. Keep them; just do not count them in the durable receipt set at S4.

## Contract — unchanged

RFC-only. `packages/`, `plugins/`, RFC 0003, and RFC 0005 stay inspection surfaces; do not edit
package or plugin source. No `deno.lock`. No merge, publish, ready-for-review, relabel, issue filing,
`#1348` mutation, central cluster-state change, or expensive-gate lease. **Never run
`scaffold.runtime`.** Do not self-evaluate; IMPL-EVAL is a separate fresh opposite-family session
after S4.

## Reporting

One bounded fix-up commit. Rerun only the docs-scoped gates the change touches and preserve their
JSON receipts. Reconcile raw Git truth (local head, explicit remote head, clean tree, no upstream),
push with `git push origin HEAD:refs/heads/docs/rfc-plugin-cli-contribution` only, post one PR
comment naming each fix and its evidence, and update `worklog.md`/`context-pack.md`/`drift.md` in the
same commit.

Then stop and report the exact head, gates with receipt paths, how each of F1–F3 was resolved, and
the literal line `TIER-A STOP: slice S1 fix-up ready for topic review`. Do not begin S2.
