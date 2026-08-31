use harness

# IMPL-EVAL — #1387 Slice 9 (adoption documentation, final implementation slice)

You are a **separate evaluator session**, opposite family to the author (Codex authored; you are
Claude). You certify or reject; you do not fix, do not commit, do not push, do not comment on GitHub,
and do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, already checked out at the evidence head |
| **Content head** | `236a3d331` |
| **Evidence head** | `2a26f0254ae585e516ac81e78da5d625ea5d1c55` |
| Base | `9ce84de2f`; the head now additionally carries **two integrations of `main`** (through `65cd8a077`) — see "Integration" below |
| PR | rickylabs/netscript **#1762**, draft, `Refs #1387 — partial` |
| Plan | `.llm/runs/feat-service-principal-procedure-policy--1387/plan.md` § Slice 9; the full Key Decisions (LD-1–LD-12) table; research finding 14 |
| Tier-A | `.llm/runs/feat-service-principal-procedure-policy--1387/tier-a-slice-9.md` |
| Receipts | `.llm/runs/feat-service-principal-procedure-policy--1387/receipts/` |

## SKILL

`netscript-harness`, `netscript-doctrine`, `netscript-tools`, `rtk`.

## What to judge

This is a **documentation** slice — judge accuracy against the actual shipped code across Slices
1–8, not merely internal consistency of the prose.

1. **Ceiling.** All eight authorized files: `packages/{contracts,service,plugin,mcp}/README.md`,
   `docs/site/reference/{contracts,service,mcp}/index.md`,
   `docs/site/tutorials/workspace/05-route-authz.md`. No product file outside these eight — confirm
   no plugin-core contract, CLI scaffold/template, `packages/ai`, auth provider, or lockfile edit.
   `deno.lock` byte-identical.
2. **The path-matcher defect is genuinely fixed (research finding 14).** Read the tutorial in full.
   Confirm `.meta({ access: {...} })` plus `createContractAuthorizer()` is now the primary teaching,
   and `createScopeAuthorizer` is retained (not removed, not marked deprecated) and correctly
   explained as the match-aware legacy fallback consulted only when a matched procedure has no
   metadata. Verify the code samples actually compile against the real `packages/contracts` and
   `packages/service` exports — check imports, not just prose.
3. **LD-8's error string, exact.** Compare the tutorial/README's quoted error text against
   `packages/service/src/auth/contract-authorizer.ts`'s actual `OPTIONAL_AUTHENTICATION_ERROR`
   constant and throw site. It must match character for character (the `<procedure>` placeholder
   aside), and the "at construction, before first request" framing must be correct.
4. **LD-6's precedence, both directions.** The docs claim a fallback can neither make a declared
   public procedure private nor weaken declared scopes/roles. Trace this against
   `contract-authorizer.ts`'s actual control flow (Slice 5) — confirm the fallback branch really is
   unreachable whenever metadata exists on a matched procedure, in both the "would allow" and "would
   deny" directions.
5. **LD-11's accepted substitution, not the issue's original wording.** Confirm the docs state rename
   continuity plus the stale-SDK-key compile failure — not a blanket "renames are always
   compile-time-safe" claim, which PLAN-EVAL explicitly rejected.
6. **The evidence-gap fix, verified not trusted.** Tier-A reports that `check`/`lint`/`fmt` were
   originally asserted by prose only, then re-cut as real receipts at the exact content head after
   the supervisor found the gap. Verify the three receipts genuinely satisfy
   `gitHead == actualGitHead == 3cb08103f` and that their `argv` actually scopes to
   `^packages/(contracts|service|plugin|mcp)/` rather than the bare unscoped task. Independently
   confirm the bare unscoped `deno task check` failure (`TS2551` on `health.ts:184`) is real,
   pre-existing, and unrelated to this slice — reproduce it yourself if you can, or at minimum verify
   `packages/service` alone checks clean.
7. **Evidence integrity, the rest.** All twelve receipts, each `gitHead == actualGitHead` at the
   content head. Verify by `argv` and `durationMs`, never `exitCode` alone. Confirm Slices 1–8's
   archived receipt sets are intact and untouched, and the pre-refresh diagnostic set
   (`pre-refresh-s9-582e82322/`) is preserved as history, not silently discarded.

## This is the final implementation slice

If this slice is accepted, #1387's implementation is complete; only the close-gate remains. State
plainly whether you consider the documentation adequate for that close, or whether you found a gap
that should block it.


## Integration — new since the original Slice 9 content

This head is **not** the raw Slice 9 content head. After Slice 9's Tier-A, the leaf was integrated
with `main` **twice** (to `0ac06c5f1`, then to `65cd8a077` after three more PRs landed). Judge the
integration too, not just the documentation slice:

- The first integration's only source conflict was `.llm/tools/gates/catalog.ts`, resolved as the
  **union** of main's `aspire-version-parity` entry and this leaf's D-5 `exports-drift` /
  `mcp-export-corpus` entries. Verify all three are present and that neither side was dropped.
- All generated-carrier conflicts (agent-docs prose/provenance, cli agent-docs, mcp export corpus,
  mcp publish-assets) were resolved by taking `main`'s version and **regenerating from tooling**, never
  hand-merged. Verify the carriers are actually fresh (`check:assets-barrel`,
  `check:mcp-export-corpus`, `docs:exports-drift` should all pass at this head) and that
  `deno.lock` is byte-identical.
- Confirm the integration did not silently revert or alter any of Slices 1–9's product changes.


## This is a RE-evaluation at a moved head — what changed since the prior verdict

A prior IMPL-EVAL returned `ACCEPTED_WITH_FINDINGS` at `ffd380532`. **Its artifact is preserved at
`evaluate-slice-9.md`; do not overwrite it** — write yours to `evaluate-slice-9-final.md`.

Since that verdict the head moved for three reasons, all of which you should judge:

1. **A third `main` integration** to `8a9257642` (PR #1764 landed). One carrier conflicted — the MCP
   export corpus — regenerated from current inputs to **7709 symbols**.
2. **F-1 fixed.** The prior evaluator found `evidence-set.json` declaring `immutableHead 3cb08103f`
   and twelve `1387-s9-*` ids while four top-level receipts had been replaced by integrated-head
   re-cuts. The whole Slice 9 set — **including the four superseded receipts** — was archived to
   `receipts/slice-9-3cb08103f/`, and a single coherent nine-gate set was cut at one head. Verify the
   manifest and directory now agree, and that nothing was discarded rather than archived.
3. **F-2 fixed.** `worklog.md` and `context-pack.md` now record all three integrations and the
   re-cuts, which they previously omitted. Verify they are accurate, not merely present.

**Judge whether the F-1/F-2 fixes are complete and honest, and whether the third integration
preserved every Slice 1–9 product change.** The prior verdict's substantive findings on the
documentation itself (finding 14, LD-6, LD-8, LD-11) were all verified green — you may rely on that
and focus on what moved, but say so if you disagree.

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_FIX`, `FAIL_PLAN`, naming the exact head
you certify. Findings must be concrete: file, line, what breaks. State plainly anything you could not
verify.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane
and none may be acquired.
