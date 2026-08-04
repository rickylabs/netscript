use harness

Perform the formal IMPL-EVAL for NetScript PR #1264 from the existing worktree
`/home/codex/repos/ns005-winmat`, branch `fix/windows-node-modules-materialization`, head
`e24f624e2ac8f9ab1affa5dd2f6f6ef2ab8c48a5`.

## SKILL

- `netscript-harness` — follow the separate-session IMPL-EVAL protocol and write the verdict of
  record.
- `netscript-doctrine` — evaluate `packages/cli` as Archetype 6 with the frontend consumer overlay
  and distinguish baseline doctrine debt from this delta.
- `netscript-pr` — verify the draft-first commit/comment trail, `Refs #1246`, acceptance evidence,
  exact taxonomy, milestone, and close-gate posture.
- `netscript-deno-toolchain` — use native Deno inspection/gates without lock or cache churn.
- `netscript-tools` — use trustworthy repo wrappers, raw git evidence, and lock hygiene.
- `netscript-cli` — evaluate scaffold output and the canonical `scaffold.runtime` evidence.
- `deno-fresh` — verify the generated Fresh 2 dev-task integration remains valid.
- `rtk` — compress read-heavy git/gh/rg commands without changing their semantics.

## Evaluator contract

You are the evaluator, not an implementer. Read completely:

1. `.llm/harness/evaluator/protocol.md`
2. `.llm/harness/evaluator/verdict-definitions.md`
3. `.llm/harness/workflow/run-loop.md`
4. `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`
5. `.llm/harness/archetypes/SCOPE-frontend.md`
6. the selected skills above and relevant doctrine/debt entries
7. every artifact under `.llm/runs/fix-windows-node-modules-materialization--1246/`
8. PR #1264 commit list, body, comments, labels, checks, and the diff from the true base
   `3a267aef17c251350a3e842699119e98365316f4` through the stated head

Milestone ruling D6 explicitly waived the local PLAN-EVAL and `plan-eval.md` records
`COMPOSED_WAIVER`; judge that recorded milestone process override rather than demanding a fabricated
`PASS`. IMPL-EVAL itself is not waived.

Independently verify the implementation against issue #1246 and the locked plan. Pay special
attention to:

- whether the cache-to-local comparison has false passes or false positives across Deno `.deno`
  naming, scoped packages, peer suffixes, registry roots, and Deno-owned cache metadata;
- whether the generated program truly fails if verification becomes a no-op;
- whether all developer start paths that are claimed actually invoke the preflight;
- whether Deno 2.9.0 is described as a pre-window mitigation rather than overclaimed native-Windows
  proof;
- whether `Refs #1246` and the deferred 0.0.6/native-Windows scope are honest;
- whether the PR introduced dependency, lock, public-surface, architecture-debt, or cleanup churn.

Run only the smallest independent read-only/non-mutating validations needed. Do not edit source,
fix findings, commit, push, change PR metadata, delete caches, or remove resources. The existing
`deno.lock` worktree modification predates this run and is explicitly out of scope: do not stage,
revert, rewrite, or include it. If a command would mutate the lock, do not run it.

Write the final verdict of record to:

`.llm/runs/fix-windows-node-modules-materialization--1246/evaluate.md`

Use `.llm/harness/templates/evaluate.md`, give evidence for every PASS, and emit exactly one verdict:
`PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`. Do not merely print the verdict; the tracked
`evaluate.md` artifact is required.
