use harness

# #1387 — typed principal + contract-declared procedure policy: research and locked plan

You are a **fresh Codex thread** and the research/planning author for this leaf. This slice produces
**research and a plan only — no product code.** Implementation is a separate dispatch that happens
only after a PLAN-EVAL in a separate opposite-family session returns `PASS`.

## SKILL

- `.agents/skills/netscript-harness/SKILL.md` — run loop, research/plan artifacts, evaluator protocol.
- `.agents/skills/netscript-doctrine/SKILL.md` — **mandatory here.** This touches `packages/service`,
  `packages/contracts`, and `packages/plugin`. Identify archetype, public surface, layering rules, and
  gates for each before proposing anything.
- `.agents/skills/netscript-pr/SKILL.md` — branch, draft PR, closing keyword, labels, milestone.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` — use `deno doc` to learn public surfaces instead
  of reading whole source trees.
- `.agents/skills/rtk/SKILL.md`.

## The defect, in one paragraph

`buildRpcContext` writes the resolved `Principal` into a `Record<string, unknown>`, so every handler
that wants an identity hand-declares an optional field and trusts it. `@netscript/plugin` has no
principal concept at all. Separately, authorization is **path-prefix-only**: `AuthzRequest` carries
`{ principal, method, path }` and rules match with `startsWith`, so policy lives in a second place
that can drift from the contract. Renaming a router silently unguards a route. OpenAPI emits no
`security`, and no generated surface can tell a protected procedure from a public one.

Anchors to verify, not to trust: `packages/service/src/types.ts:270-272`,
`packages/service/src/builder/service-builder-impl.ts:276-279`,
`packages/service/src/auth/types.ts:29-46`, `packages/service/src/auth/scope-authorizer.ts:22-29`.
Re-derive each one; some may have moved since the issue was filed.

## The binding constraint this lane already established

**The policy declaration must extend `NetScriptProcedureMeta`** — the metadata vocabulary delivered by
#1466 slice 1 on `feat/sdk-procedure-meta`, whose Stage 1b shape already carries
`access.authentication`. It must **not** introduce a second metadata vocabulary.

This is not a style preference. #1387's own headline defect *is* policy living in a second place that
can drift from the contract. Inventing a parallel metadata vocabulary to fix it would reproduce the
exact defect one layer up. Read `packages/contracts/src/domain/` and the `NetScriptProcedureMeta`
shape on that branch **before** proposing any policy type, and state in `plan.md` how your proposal
extends it additively (optional readonly fields) rather than alongside it.

Check whether #1466 has merged to `main` yet. If it has not, your plan must state the dependency
explicitly and the implementation slice must not start before it lands.

## What research must answer

1. **Archetype and layering** for each of `packages/service`, `packages/contracts`, `packages/plugin`
   — and where the authorizer adapter belongs without creating a layering violation. `@netscript/plugin`
   re-exporting a principal type must not mean plugin importing service internals; say exactly which
   package owns the type and which re-exports it.
2. **The `ContextFactory` parameterization.** Today it widens to `Record<string, unknown>`. Establish
   what typed composition looks like, and what it breaks. Enumerate every existing `withContext`
   caller and whether it still compiles. This is the change most likely to ripple.
3. **Fail-closed semantics, stated precisely.** "A procedure with no declared policy and no matching
   rule is denied" — determine what that does to every currently-unguarded route in the repo and in
   scaffolded projects. If turning this on breaks existing consumers, that is a **migration
   question**, and the plan must answer it rather than discover it during implementation.
4. **Composition with `createScopeAuthorizer`.** It stays the path-prefix adapter, not the ceiling.
   Define the composition order and what happens when contract metadata and a path rule disagree.
5. **OpenAPI `security` propagation** and how far it reaches into SDK/MCP/agent surfaces. Establish
   what exists today before proposing generation changes.
6. **Forward compatibility with #884.** The shapes must let #884's organization/membership/assurance
   model extend them. This issue does **not** add tenant fields. Read #884 and say concretely what
   you are leaving room for.
7. **Negative-test feasibility.** Three of #1387's acceptance points are negative tests, including
   "renaming a router breaks a contract-declared policy **at compile time**". Determine whether that
   is actually achievable with the proposed design, and if not, say so in the plan rather than
   promising it. An unachievable acceptance point is a finding to raise now, not to discover later.

## What the plan must contain

- An explicit **slice decomposition** with a Tier-A stop after each, sized so no slice mixes a type
  contract change with a behaviour change.
- A **product ceiling**: the exact file list each slice may touch. A file outside it is a rescope —
  stop, record in `drift.md`, and report.
- The **named gate set** per slice, chosen by running each candidate gate **at the base first**.
  This lane learned that expensively (D-27): a gate already red on `main` cannot signal a regression
  and is worse than useless in a contracted set. State the base result for each gate you contract.
  `deno task docs:exports-drift` is green at base and is branch-sensitive for public-surface growth —
  this leaf grows the public surface, so include it.
- Contract-first ordering per `AGENTS.md`: schema/type contract, then implementation, then tests.
- Every open design decision resolved, or listed explicitly as a question for PLAN-EVAL.

## Deliverables

`research.md`, `plan.md`, `drift.md`, `worklog.md` under a new run dir for this leaf; a branch; and a
**draft** PR targeting `main` with body carrying `Closes #1387`, labels
`type:feat`, `area:service`, `area:contracts`, `area:auth`, `area:plugins`, `priority:p1`, exactly one
`status:` label, milestone `0.0.7`. Commit, push by explicit refspec, post the research/plan PR
comment per `netscript-pr`, and **stop**.

## Hard boundaries

- **No product code in this slice.** Artifacts and PR scaffolding only.
- No merge, ready-flip, relabel after creation, milestone change, issue close, acceptance-box
  ticking, or self-certification.
- No `e2e:cli`, Aspire, Docker, or browser gates — no runtime lease is held.
- Do not touch `deno.lock`; prove it byte-unchanged.
- Do not write thread ids, rollout paths, or daemon handles into committed run artifacts.
- Root `deno task test` is red on this host for an infrastructure reason outside any diff; do not
  chase it and do not contract it as a green gate.

If the honest conclusion of research is that #1387 is too large for one leaf at 0.0.7, say so with
evidence and propose the split. That is a valid outcome and a better one than a plan that cannot be
executed.
