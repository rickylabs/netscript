use harness

# SLICE — #1590 Slice 1 FAIL_FIX repair: two cross-package subpath-parity consumers

IMPL-EVAL returned **`FAIL_FIX`** at head `f3b50149e`. Both findings are **HIGH**, both are
PR-introduced, and both are mechanical. The approved plan is not wrong — it simply did not name these
two consumers of a new public subpath.

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1590` |
| Branch | `fix/fresh-partial-nav-ordering` |
| Base | current HEAD `f3b50149e` — do **not** rebase or merge `main` |
| PR | #1848 |

## SKILL

`netscript-harness`, `netscript-cli`, `deno-fresh`, `netscript-tools`.

## The two required fixes — exactly as the evaluator named them

**1. `check-test` — CLI web-runtime closure registry parity.**
Adding `./navigation` to `packages/fresh/deno.json` broke
`closure export lists stay in parity with Fresh and SDK manifests`
(`packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure_test.ts:79`).
Actual Fresh export keys now include `./navigation`; `NETSCRIPT_WEB_RUNTIME_EXPORTS['@netscript/fresh']`
does not.

**Fix:** add `'./navigation'` to `NETSCRIPT_WEB_RUNTIME_EXPORTS['@netscript/fresh']` in
`netscript-web-runtime-closure.ts`. One line.

**2. `quality` — stale generated agent-docs carrier.**
`check:assets-barrel` exits 1: regeneration adds `'./navigation'` to
`EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS` in `packages/cli/src/kernel/assets/agent-docs.generated.ts`, so
the committed file is stale.

**Fix:** run `deno task gen:assets-barrel` and commit the regenerated carrier. **Regenerate from
tooling — never hand-edit a generated file.**

## Ceiling

Exactly those two files. The plan's contingency slot covers the registry line. Anything else is a
**rescope: stop and report**.

## Do not "fix" the finding that is not yours

`packages/fresh/tests/defer-island-client-bundle_test.ts:37` fails at head **and reproduces
identically at base** `7ae7fe2da` (Rollup cannot resolve `npm:@opentelemetry/api@^1.9.0` from
`@fresh/core`). The evaluator already excluded it under the attribution rule and it is recorded in
`drift.md` as environmental. **Leave it alone**; do not touch that file and do not attempt a Vite or
dependency change to make it pass.

## Definition of done

- `closure export lists stay in parity with Fresh and SDK manifests` passes.
- `deno task check:assets-barrel` exits 0 — that gate is `gen && git diff --exit-code`, so **zero-byte
  stdout is legitimately clean**; prove it by confirming no regenerated-but-uncommitted carrier
  remains.
- Repo-wide `deno task test` shows the `defer-island-client-bundle` environmental failure as the
  **only** remaining failure; report exact before/after counts.
- Scoped `packages/cli` + `packages/fresh` check/lint/fmt with **non-empty `stdout.bytes`** per receipt
  (`deno task` caching can return `PASS`/exit 0 with zero-byte stdout describing a run that never
  happened).
- `deno.lock` byte-identical.
- One commit on top of `f3b50149e`, pushed by **explicit refspec**. Update `worklog.md` and
  `context-pack.md`, and record the FAIL_FIX and its remedy as drift.
- Post a PR comment with before/after gate evidence.

**Never place `close`/`closes`/`fixes`/`resolves` immediately before an issue number**, including in a
negation. No labels, no acceptance boxes, **no evaluator dispatch and do not cancel any evaluator run**
— evaluator lifecycle belongs to the supervisor. No merge.
