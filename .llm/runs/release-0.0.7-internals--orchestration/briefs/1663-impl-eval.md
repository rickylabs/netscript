# Brief — #1663 `package-gate-honesty` IMPL-EVAL (mandatory, separate session)

You are a **fresh, separate-session formal implementation evaluator**. Read this brief completely
before acting.

## Target

| Field                | Value                                                              |
| -------------------- | ------------------------------------------------------------------ |
| Leaf                 | #1663 `package-gate-honesty` — `Closes #1604`, `#1618`, `#1622`    |
| Worktree             | `/home/codex/repos/netscript-007-package-gate`                     |
| Branch               | `fix/package-gate-honesty` (**no upstream by design**)             |
| **Evaluated head**   | **`cf31de902e530a5874fdd074338cb6f7b16167f9`**                     |
| Immutable base       | `05fc3132b6800a85eb6152691a961b658962571b`                         |
| PR                   | #1663, draft, milestone `0.0.7`, `status:impl`                     |

Verify local `HEAD`, `git ls-remote origin refs/heads/fix/package-gate-honesty`, and PR
`headRefOid` all equal `cf31de902…` before evaluating. If any differs, stop and report.

## Route and identity — record before any mutation

`formal_impl_evaluation` per `lane-policy.md:46`: native Anthropic **Claude Fable 5, effort medium**,
`--remote-control`. Record session id, non-empty `bridgeSessionId`, job `state.json` backend and
`respawnFlags`, `providerEnv` (must be `{}`), cwd, CLI version, and state whether requested equals
observed.

**Independence:** you must not be, and share no state with, the Codex author thread
`01a004ec-86a6-7c21-8886-81c09de099f5`, the topic supervisor `f7691917-0be2-4bcd-8839-43d3fc809c34`,
or the three plan evaluators `9078ecb6-…`, `517ac0e7-…`, `0f7c4fdf-…`.

## What landed

Four slices, each Tier-A reviewed and signed off by the supervisor:

| Slice | Head        | Content                                                                  |
| ----- | ----------- | ------------------------------------------------------------------------ |
| S1    | `4b988a381` | child-only marker, memoized nearest-config batching, `deno.json` exclusion move, healthy fixture normalization, canonical barrel regeneration |
| S2    | `22dc3906e` | three CLI tests/helper made cwd-independent (#1604)                       |
| S3    | `fd508978c` | `closeScoreGap` pinned bidirectionally + empirical rationale (#1622)      |
| S4    | `cf31de902` | evidence only — commit-bound gate matrix, publish/docs/JSR                |

The full arc `05fc3132b..cf31de902` touches **exactly thirteen product paths**, identical to the
contract table in `plan.md`. S4 changed no product content, so its receipts attest the implementation
parent `fd508978c` by design — do not demand self-referencing receipts.

The plan passed its gate unusually: three `FAIL_PLAN` cycles (`be2b18728`, `c415daad2`, `65c5e1ac4`,
preserved as `plan-eval-cycle-1.md`, `plan-eval-cycle-2.md`, `plan-eval.md`), then an owner-granted
amendment at `62811a9dd` with the supervisor's Tier-A review standing in for the gate. That history
is in `drift.md`. **You are evaluating the implementation, not re-litigating the plan gate.**

## Known red gate — do NOT score this as a regression

`deno doc --lint` on `packages/mcp` export entrypoints is **red**: `./cli.ts` and `./mod.ts` each
report one `private-type-ref`; `./openapi-projection.ts` passes.

The supervisor reproduced this on separate archive copies at **both** ends:

| Ref              | `./cli.ts` | `./mod.ts` | `./openapi-projection.ts` |
| ---------------- | ---------- | ---------- | -------------------------- |
| base `05fc3132b` | exit 1     | exit 1     | exit 0                     |
| head `cf31de902` | exit 1     | exit 1     | exit 0                     |

It is an unchanged pre-existing baseline this PR neither caused nor deepened. Re-derive it yourself
rather than trusting the table. It is **not** covered by the plan's named baseline debts and
`arch-debt.md` has no `private-type-ref` entry for `packages/mcp`, so its explicit registration is
escalated to the coordinator/owner. Judge whether that disposition is adequate; do not treat the red
itself as an implementation defect.

## What to verify — re-derive, do not accept receipts on trust

1. **The three issues are actually fixed.** #1604: `deno task --cwd packages/cli test` green.
   #1618: the exact acceptance command
   `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx`
   exits 0 with non-empty selection and `failedBatches: 0`. #1622: `closeScoreGap` fails the suite
   when widened **and** when narrowed.
2. **No false green.** The point of this leaf is eliminating gates that report success over work
   they did not do. Check specifically that `deno check` still covers all five doctor fixture files
   (a `Warning No matching files found` at exit 0 is failure), that the four healthy TS files are
   genuinely selected by both wrappers, and that no gate passes by empty selection or task cache.
3. **Nothing was weakened to pass.** No assertion deleted, no test skipped or ignored, no new
   `deno-lint-ignore`/`any`/`as unknown as`, no new `quality:scan` allowance (`allowCount` must be
   **7**), no malformed fixture repaired (`broken/deno.json` sha256 must still be
   `6815999dbd68bd1ab5bb137b59808cb1f1a38fb3393c9133721f439c0ad37361`).
4. **Publish honesty.** `@netscript/cli` ships changed embedded lint-tool text and a changed
   `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` with **no** export/API change; the barrel must be reproducible
   by `deno task gen:assets-barrel` rather than hand-edited. `@netscript/mcp`'s only published delta
   is a comment. Existing CLI `isolatedDeclarations: false` and doc-completeness debt must be
   reported as baseline, not silently greened.
5. **Surface discipline.** Exactly thirteen product paths; no fourteenth anywhere in the arc.
6. **`scaffold.runtime`** is coordinator-waived `n/a` for this surface. Recording it as `n/a` is
   correct; it must not have been run or substituted. Do not run it, and do not request the mutex.

## What you may and may not do

**May:** read anything; execute reproductions on `git archive` copies or scratch projects under
`$CLAUDE_JOB_DIR/tmp`; edit run artifacts **only**, inside the slice run dir; commit; push
`fix/package-gate-honesty` by **explicit refspec**; post truthful PR evidence on #1663.

**Must not:** mutate any product or config path — your commit's diff versus `cf31de902` must contain
only files under
`.llm/runs/release-0.0.7-internals--orchestration/slices/package-gate-honesty/`; merge; flip
draft→ready; relabel; check issue boxes or post acceptance-evidence blocks; edit central cluster
state; take any lease; run `scaffold.runtime`, Aspire, Docker, or `e2e:cli`. Do not touch the three
preserved `plan-eval*` files. Verify `git status --short` is empty at exit.

## Output

Write `evaluate.md` in the slice run dir: identity/route/independence, target verification,
per-obligation results with executed evidence, findings with `file:line` and reproduction, the
known-red-baseline disposition, and **one verdict line** — `PASS` or `FAIL_IMPL`. On `FAIL_IMPL`,
list specific required fixes. Commit as
`docs(harness): IMPL-EVAL <verdict> for package-gate-honesty`, push by explicit refspec, post the
phase comment, and report your session id, verdict, and commit SHA to the internals topic supervisor.

An honest `FAIL_IMPL` is a correct outcome. Do not soften a verdict because four slices already
passed Tier-A review.
