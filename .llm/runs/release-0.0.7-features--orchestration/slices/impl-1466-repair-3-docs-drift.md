use harness

# #1466 cycle 3 — branch-owned docs-site drift, narrow repair

Same thread, same worktree `/home/agent/projects/netscript/worktrees/007-leaf-1731`, same branch.
Start from your pushed head `c2ae8c4257c9aeb5cfd9751a227f7f88aab9f0f1`. Do not rebase, do not revert.
Cycle 2 is accepted — AF-1, AF-2 and AF-3 all landed and I verified them independently.

## SKILL

No new skill reading. One gate, one file, then recut.

## The failure, already classified — you do not need to diagnose it

Workflow **Deploy docs site to Pages**, run `33298487084`, job `99222167342`, step
**Check documentation exports drift** (`deno task docs:exports-drift`), exit 1:

```text
Coverage [contracts]: mode=complete; reason="The contracts reference is maintained as a complete
  published-symbol inventory."
Symbol Drift Error [contracts]: docs/site/reference/contracts/index.md OMITS exported symbol 'commonErrorMap'
Symbol Drift Error [contracts]: … OMITS exported symbol 'BaseContractErrors'
Symbol Drift Error [contracts]: … OMITS exported symbol 'BaseContractMeta'
Symbol Drift Error [contracts]: … OMITS exported symbol 'CommonErrorMap'
Symbol Drift Error [contracts]: … OMITS exported symbol 'NetScriptAuthenticationRequirement'
Symbol Drift Error [contracts]: … OMITS exported symbol 'NetScriptProcedureMeta'
```

I established the attribution rather than assuming it:

- `deno task docs:exports-drift` on `origin/main` `13878a80a` exits **0**.
- It has failed on **every** head of this branch — `c9a391811`, `f9056f879`, `b4157a9d`, `c2ae8c425`.

So it is **branch-owned and 100% yours**, it is not the host-zombie baseline, and it is not new to
the repair: three of the six symbols are slice-1 exports, so this check has been red since your first
content commit. It went unnoticed because `docs:exports-drift` is **not in the plan's eight-receipt
set** — see the drift item below.

The contracts reference page is declared `mode=complete`: a complete published-symbol inventory. Six
new public exports without six new documented symbols is exactly the drift it exists to catch, and it
is right.

## Scope — one file, then recut

1. **Document all six symbols** in `docs/site/reference/contracts/index.md`, following that page's
   existing structure, ordering and prose conventions — read it before writing. This is squarely
   **acceptance point 5** ("public docs explain ownership and compatibility boundaries"), so it is in
   scope and not a docs excursion. For each: what it is, that NetScript owns it, and the
   compatibility rule — additive optional readonly fields for the metadata types, and for
   `commonErrorMap` / `CommonErrorMap` that the error codes, statuses and message literals are the
   stable contract.
2. **`commonErrorMap` is an exported mutable singleton.** Its `Readonly<>` typing stops TypeScript
   consumers from writing to it, but nothing stops a JavaScript consumer, and it backs every contract
   in the workspace. Document it as read-only-by-contract and say plainly that mutating it is
   unsupported. Do not change the value or its type to address this — just document it honestly.
3. **Verify locally**: `deno task docs:exports-drift` must exit **0** at your new head. Report the
   exit code.
4. **Recut all eight receipts** at the new content head (`--attempt 4`, contracted paths / `gateId`s /
   `invocationId`s, `gitHead == actualGitHead`, never `--allow-git-head-mismatch`). Your attempt-3
   receipts stop attesting the moment the head moves — they are not carried forward. Run them
   serially. Expect `public-doc-lint` to stay FAIL at 12 (delta 0, unchanged), and expect root `test`
   to stay FAIL on `hybrid-launcher_test.ts` alone.
5. **Do not run additional root-`test` retries beyond the single attempt-4 cut.** The coordinator has
   ruled that red a host baseline: this host has 7,733 PID-1-owned zombies, and
   `hybrid-launcher_test.ts:167` tests liveness with `Deno.kill(pid, 0)`, which **succeeds on a
   zombie** — so a correctly-exited descendant still reads as alive and the assertion cannot pass
   here at any code state. Record it, do not chase it, do not modify that test.
6. **Capture `docs:exports-drift` as supplemental evidence** — raw command, exit code and output into
   the run dir alongside the JSR audit, explicitly outside the named eight. **Do not add a gate id to
   `.llm/tools/gates/catalog.ts`**; that is repo tooling and outside this leaf.

## Record this drift — it is the real finding

The plan's eight-receipt set contracts `public-doc-lint`, which is **baseline-red on `main`** and
therefore could never signal a regression — while `docs:exports-drift` is **green on `main`**,
precisely detects this leaf's public-surface growth, and is **absent from the set**. The evidence set
was structurally blind to the one branch check that actually works, and four heads shipped red
because of it.

Write that up in `drift.md` and **propose** adding `docs-exports-drift` to the contracted gate set.
Propose only — the plan is PLAN-EVAL-approved and neither of us amends it. The IMPL-EVAL and the
coordinator rule on it.

## Prohibitions

**No `packages/**` source change in this cycle** — docs, run dir and receipts only. Above all: **do
not un-export, rename, or hide any of the six symbols to make the gate pass.** Making an inventory
check green by shrinking the inventory is the failure mode this whole repair exists to avoid. The
public surface is correct; the documentation is what is missing.

Otherwise unchanged: no merge, publish, ready-flip, relabel, milestone change, issue close,
`#1348`/cluster-state mutation, rebase, force-push, push to `main`, expensive-gate lease,
`scaffold.runtime`, `fresh-browser`, Aspire, Docker, sibling worktrees, lock churn, IMPL-EVAL, or
slice 2.

## Report back

The six documented symbols and where they landed on the page; `docs:exports-drift` exit code at the
new head; the new content head and evidence head; all eight attempt-4 receipt outcomes with
`gitHead == actualGitHead` shown; your sufficiency verdict; the supplemental drift evidence path; the
PR comment URL. Then stop. Land what exists before you stop.
