use harness

# Slice: canary payload misses merge-commit work — #1166 (PR carries `Refs`, never `Closes`)

You are the implementation supervisor for the PR fixing #1166: `deriveCanaryPayload` in
`.llm/tools/release/canary-label.ts` walks first-parent history and **misses PRs that land behind
a release PR via a merge commit** (observed: #1162/#1164 omitted). Read #1166's body first.

## SKILL

`.agents/skills/netscript-harness`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-release` (payload/label/note contract context — do not change publish
mechanics), `.llm/harness/workflow/canary-cadence.md` (the contract your fix serves).

## Deliverable = the gates

1. Merge-aware payload derivation: PRs merged via merge commits behind a release PR are included.
2. **Genuine-empty vs derivation-failure are distinguishable outputs** — an empty payload must
   say which it is; silence or a bare empty list is a FAIL.
3. Negative-case tests demonstrated RED→GREEN: a fixture history with a merge-commit-buried PR
   fails on today's derivation and passes on yours.
4. Existing behavior preserved: label refusal for unpublished versions, idempotent note update,
   drift-gate semantics untouched (regression-covered).

## Anticipated files

`.llm/tools/release/canary-label.ts` (derivation only), its test file(s) under
`.llm/tools/release/` with fixture git histories (synthetic fixtures preferred — do not mutate
real repo history), possibly a shared helper. **No `.github/workflows/` changes** (that is
#1004's surface — out of scope), no `packages/**` (no doctrine/archetype surface; repo-tooling
slice; framework-wave law not triggered).

## Why `Refs` and not `Closes`

#1166's boxes 2–4 require a real canary cut demonstrating the fix (canary.1 of this run) and
re-verification of #1149's criterion. Those facts cannot exist before your PR merges. Body says
`Refs #1166` + one line stating which boxes remain and that the orchestrator hand-closes on
canary.1 evidence. Do not tick boxes your PR cannot prove.

## PR contract

Branch `fix/canary-payload-merge-commits` (worktree provided), target `main`. Labels: `type:fix`,
`area:tooling`, `epic:harness-v3`, exactly one `status:`; milestone `0.0.5`. Gates before ready:
scoped check/lint on touched files; your own test suite green with output quoted in the PR; no
new lint-ignores; no `deno.lock` churn. Slice `worklog.md`/`drift.md` in this dir as you go.
