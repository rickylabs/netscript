use harness

# PLAN-EVAL — #1387, PR #1762 (`feat/service-principal-procedure-policy`)

You are a **fresh, separate** `formal_plan_evaluation` session: Claude **Fable 5 · medium**, native
opposite-family for Codex-authored work (`.llm/harness/workflow/lane-policy.md`). The plan's author is
a Codex `gpt-5.6-sol` thread. You evaluate the **plan**; you do not implement, and you do not fix.

## Where to work

Your **own detached worktree** — do not touch `/home/agent/projects/netscript/worktrees/007-leaf-1387`
(D-19). Establish the head yourself from live git and GitHub; do not trust a SHA in this brief.

## What this leaf is

#1387: `buildRpcContext` writes the resolved `Principal` into a `Record<string, unknown>`, so handlers
hand-declare an identity and trust it; `@netscript/plugin` has no principal concept at all; and
authorization is **path-prefix-only** (`AuthzRequest` = `{ principal, method, path }`, matched with
`startsWith`), so policy lives in a second place that can drift from the contract. Renaming a router
silently unguards a route.

**This PR contains research and a locked plan only. No product code.**

## S0 is satisfied — verify that, do not assume it

The plan's `S0` is a **precondition**, not an implementation slice: verify #1466 has merged, rebase
onto the new `main`, and re-run the base-gate census. All three were done by the supervisor before you
were dispatched:

- **#1466 / PR #1731 merged** at `e325b7fe`, `2026-08-30T13:41:17Z`; #1466 `CLOSED / COMPLETED`, both
  `status:shipped`. `origin/main` is now **`3e5cbabf`**.
- The metadata vocabulary is **on `main`**: `packages/contracts/src/domain/procedure-meta.ts` exists
  and `src/public/mod.ts` exports `NetScriptProcedureMeta`, `NetScriptAuthenticationRequirement`,
  `BaseContractMeta`.
- The branch was **rebased** onto `3e5cbabf` (LD-1 prescribes rebase; this branch is plan artifacts
  only, so no receipt or archive cites a rewritten SHA — unlike #1731, where rebase was refused twice
  for exactly that reason).
- The base-gate census was re-run at the rebased head; results are recorded in the run's `worklog.md`.

**Re-derive all of it.** In particular, confirm the merged `NetScriptProcedureMeta` shape on `main`
matches the one the research was written against — the plan itself says to *stop* if it differs.

## The binding constraint

**#1387's policy declaration must extend `NetScriptProcedureMeta`, never introduce a second metadata
vocabulary.** #1387's own headline defect *is* policy living in a second place that can drift from the
contract; inventing a parallel vocabulary to fix it reproduces that defect one layer up.

The plan claims to honour this (LD-2: additive optional readonly `authorization.scopes` /
`authorization.roles` on `access`, "no parallel `{ public }` policy"). **Test that claim against the
merged shape**, not against the plan's description of it.

## What to evaluate

1. **Is the plan executable as written** against `main` `3e5cbabf` — file ceilings real, slice
   boundaries coherent, each slice independently gateable?
2. **LD-3 dependency direction**: `@netscript/service` owns `Principal` / `ServiceHandlerContext`;
   `@netscript/plugin` **re-exports** rather than importing service internals. Is that actually
   achievable given current layering, and does it survive `arch:check`?
3. **`ContextFactory` parameterization.** Today it widens to `Record<string, unknown>`. The plan
   proposes typed composition. Does it enumerate the blast radius — every existing `withContext`
   caller — or defer that discovery to implementation?
4. **Fail-closed semantics.** "A procedure with no declared policy and no matching rule is denied"
   changes behaviour for every currently-unguarded route, in this repo *and* in scaffolded projects.
   Does the plan answer that migration question, or discover it later?
5. **The three negative acceptance points**, especially *"renaming a router breaks a
   contract-declared policy **at compile time**"*. Is that achievable with the proposed design? If it
   is not, the plan should say so now rather than promise it — an unachievable acceptance point is a
   finding at PLAN-EVAL, not a surprise at IMPL-EVAL.
6. **Gate selection.** The plan ran a base-gate census and excluded base-red signals (`deno doc --lint`
   red in contracts/plugin/SDK/MCP; plugin JSR audit red for four missing module tags), contracting
   only base-green ones. Verify those base claims and the resulting contracted set. **This lane has
   been bitten four times by gates outside the contracted set** — see #1769 — so also ask what the set
   is *missing*: this leaf grows public surface and touches docs, so `docs:exports-drift`,
   `docs-tagline` and the `agent-docs-prose` carrier group are the candidates to check for.
7. **Scope realism.** #1387 has 8 acceptance points across `packages/service`, `packages/contracts`,
   `packages/plugin`, OpenAPI and MCP. If the honest conclusion is that it is too large for one leaf
   at 0.0.7, say so with evidence and propose the split — that is a valid and better outcome than a
   plan that cannot be executed.

## PR metadata — preserve exactly

PR #1762's live `closingIssuesReferences` is **`[]`** and must stay empty: this is a **partial,
plan-only** PR and a closing keyword would incorrectly mark #1387 complete on merge. The coordinator
already repaired one accidental parse — GitHub parsed an earlier phrase as a closing keyword, and the
body now reads **"incorrectly mark #1387 complete"**. **Preserve that wording.** Do not edit the PR
body, and if you quote it, do not introduce any phrase GitHub could parse as a closing keyword.

## Deliverable

Write `plan-eval.md` in the leaf's run dir following the harness PLAN-EVAL template: metadata,
immutable identity, what you re-derived, findings with required actions, and a verdict
(`PASS` / `FAIL_FIX`) with an explicit re-evaluation scope if not terminal. Commit **evidence-only**
and push by explicit refspec. Report your head.

## Hard boundaries

- **Do not implement, and do not fix the plan** — findings with required actions only.
- No merge, ready-flip, relabel, milestone change, issue close, acceptance-box ticking, or PR body
  edit — including on `PASS`.
- No `e2e:cli`, Aspire, Docker, or browser gates; no runtime lease is held. The DinD sandbox being
  reachable is not authorization.
- Do not touch `deno.lock`; do not write thread ids or daemon handles into committed artifacts.

---

## S0 results handed to you — re-derive, do not accept

Branch head after S0: **`5fafc3a0`** (rebased onto `origin/main` `3e5cbabf`, then one S0 evidence
commit). Base-gate census run by the supervisor at that head:

| Gate | Result |
| --- | --- |
| `G-CHECK` · `G-LINT` · `G-FMT` · `G-QUALITY` · `G-EXPORTS` | **all PASS** |

**Two contracted test baselines moved, and this is a finding for you to rule on:**

| Package | `plan.md` says | Measured at the rebased base | Δ |
| --- | --- | --- | --- |
| contracts | 8 | **16** | **+8** |
| sdk | 69 | **77** | **+8** |
| service / plugin / mcp | 90 / 68 / 136 | 90 / 68 / 136 | — |

Both are attributable to #1466 landing its contracts metadata suite and SDK propagation tests. The
plan's numbers were measured against `13878a80a` *before* that merge — stale rather than wrong. But a
plan contracting `contracts 8` would now report a **false regression signal on its first slice**.

It was deliberately **not** patched into the locked plan: amending a PLAN-EVAL-approved plan is not
the supervisor's to do, and these numbers are yours to verify independently. Rule on whether the plan
needs a baseline correction before implementation, and whether anything else in it was measured
against the pre-merge `main` and is now stale for the same reason — the test counts are the ones I
found, not necessarily the only ones.
