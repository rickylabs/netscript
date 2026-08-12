use harness

# IMPL-EVAL cycle 2 — Slice A / PR #1539 / issues #1438 + #1430

You are a **fresh formal IMPL-EVAL evaluator**. A previous evaluator returned **FAIL** on this PR;
the slice has since pushed a repair. You are not that evaluator and you must not inherit its
conclusions — re-derive them.

| Field | Value |
| --- | --- |
| Lane | `formal_impl_evaluation` — native opposite-family (Claude evaluating Codex work) |
| Your route | Claude · Fable 5 · medium |
| Evaluator worktree | `/home/codex/repos/ns006-f-a-impleval2` (detached at `5350d01fc`) — **work here** |
| Generator worktree | `/home/codex/repos/ns006-f-a-release-tooling` — **never touch it** |
| PR | #1539, head `5350d01fc` |
| Issues | #1438 (p1), #1430 (p2) |
| Prior verdict | `verdict.md` in this directory (cycle 1, FAIL) |
| Your output | `verdict-2.md` in this directory |

## SKILL

- `netscript-harness` — evaluator protocol, evidence discipline.
- `netscript-release` — **authority on release-tree identity and canary-pair invariants.**
- `netscript-deno-toolchain` — Deno 2.9 bump/publish behaviour.
- `netscript-tools` — validation wrappers, git ground truth.
- `rtk` — `rtk git`, `rtk grep`, `rtk proxy deno task`.

## What happened in cycle 1

The prior evaluator answered the load-bearing question — *can non-version-bump content be admitted
for canary-pair inheritance?* — with **yes**, and reproduced it:

`verifyGreenCanaryPair` skipped the parent→HEAD byte comparison for writer-declared generated paths
and trusted `--check` reproductions run against **HEAD only**. That is sound for *source-derived*
outputs, but `rebaseAgentDocsProse` does not rebuild `prose.json.gz` from raw docs — it
version-rewrites the committed blob. On a same-version tree the rewrite is a no-op, so `--check`
compared the blob **to itself**. An injected non-version marker passed `gen:publish-assets --check`
(exit 0) and `generate-cli-assets-barrel --check` (exit 0), and reached the decoded published
barrel.

## What the repair claims (commit `5350d01fc`)

It anchors the prose blob to its **canary parent** rather than to itself: decompress parent and HEAD
prose, apply the writer's version rewrite to the **parent** payload, and require HEAD bytes to equal
that derivation exactly. HEAD writer reproduction stays in force afterwards for provenance and
generated consumers. It fails closed if the comparison cannot be performed.

The slice reports it added the regression **before** the repair and saw it red
(`AssertionError: Expected function to reject`), then green after.

## Your job

**Re-derive the headline answer yourself.** Your verdict must state explicitly: *can any
non-version-bump content now be admitted for canary-pair inheritance?* Do not answer from the
slice's evidence or from cycle 1's verdict.

1. **Re-run the original attack, end to end, in your own worktree.** Inject a non-version marker
   into the prose payload, update `provenance.json` sha256/byte-counts with the version unchanged,
   sync `agent-docs.generated.ts`, and drive the actual inheritance path. Confirm it now **rejects**.
   A repair you have not personally watched refuse the attack is not proven.
2. **Then try to get around the repair.** The fix is a specific equality — parent-rewritten ==
   HEAD. Probe its edges:
   - non-version content injected into the **parent** as well as HEAD, kept mutually consistent;
   - a version-bump cut where prose legitimately changes for a reason other than the version
     rewrite (does it now falsely *reject* a good release?);
   - gzip non-determinism: different compression levels/timestamps producing different bytes for
     identical payloads — does the byte equality compare compressed or decompressed content, and
     can a legitimate re-compression break inheritance?
   - the other four writer-declared paths (`provenance.json`, the barrels, package metadata,
     export corpus) — cycle 1 judged the source-derived ones sound, but **verify that independently**;
     the same tautology could exist elsewhere.
   - an empty/absent prose blob, and a parent that lacks the file entirely.
3. **Confirm the repair did not break the legitimate path.** The slice claims it validated against
   the real measured v0.0.5 cut (`6ec75573d`) with `agentDocsDeltaAccepted: true`. Reproduce that.
   If a genuine coordinated cut can no longer inherit, #1438's feature is inert — fixed on paper,
   dead in practice — which is the same defect class in a new costume.
4. **B-2 from cycle 1, still open and unresolved.** `check:mcp-export-corpus` failed on the clean
   committed tree in the prior evaluator's environment (deno 2.9.5 `deno doc` byte drift). If real
   CI likewise cannot reproduce the committed corpus byte-for-byte, the **entire inheritance path
   always rejects**. Determine whether this reproduces for you, and say plainly whether you can or
   cannot establish CI determinism. Do not let a PASS imply the path works in CI if you have not
   shown it.
5. **#1430** — cycle 1 judged it correct and complete. Spot-check rather than re-audit in full:
   `--prev-tag` resolves a real date and actually queries closed issues (the original bug was
   `since: ''` being falsy so `fetchClosedIssues` never ran and `0` looked real); commit-date
   fallback; loud failure on known-tag-with-empty-`since`.
6. **Scope** — diff against the **merge-base**, not `origin/main`, which moves during this milestone.

## Gates you must execute yourself

```
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno test --allow-all .llm/tools/release/
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts
rtk git status --porcelain     # empty afterwards; deno.lock unmodified
```

Reproduce, do not relay. Quote real output.

## Hard constraints

- **No publication, ever.** No `deno publish`, no `release:publish`, no tag push, no canary.
- Do not commit, push, or merge. Do not touch the generator's worktree.
- Do not fix the code — describe defects precisely instead.
- Restore every deliberate tamper; leave your worktree clean and say so.
- `deno fmt` rewraps prose and can silently undo a scripted edit — verify any edit you make.

## Verdict format

`verdict-2.md`:

- **VERDICT: PASS** / **PASS WITH FINDINGS** / **FAIL** — one line, first.
- **The headline answer**, explicitly: can non-version-bump content be admitted? With the command
  output that establishes it.
- Whether the legitimate v0.0.5-shaped cut still inherits (feature not inert).
- Per-item findings, blocking or non-blocking, each with a concrete failure scenario.
- What you executed, verbatim; and what you could **not** verify.

A PASS here authorizes merging a widened guard that stands between this repo and publishing content
that was never canary-verified. Cycle 1 found a real hole that seven green CI checks, 3188 tests and
both runtime tiers missed. Assume there may be another.
