use harness

## SKILL

- `netscript-harness` — apply the separate-session IMPL-EVAL protocol and exact verdict vocabulary.
- `netscript-cli` — evaluate the generated Aspire helper and CLI E2E contract.
- `netscript-tools` — independently run the structured wrapper gates and preserve lock hygiene.
- `netscript-pr` — inspect the draft PR commit trail, labels, closing keyword, and unticked supervisor-owned DoD without changing GitHub.
- `netscript-doctrine` — apply AP-18 semantic generated-output testing; recognize that `packages/cli/e2e` is not an independently published doctrine root.

Act as the mandatory fresh opposite-family IMPL-EVAL for issue #1898 / draft PR #1899 in
`/home/agent/projects/netscript/worktrees/007-leaf-1898`. You are native Claude Fable 5 at medium
effort, separate from the Codex generator and from the earlier Fable-low ordinary slice review.

Read in order:

1. `.llm/harness/workflow/run-loop.md`
2. `.llm/harness/evaluator/protocol.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` as the owning CLI profile, noting doctrine
   explicitly excludes the nested E2E workspace as an independent published root
5. this run's `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, and `drift.md`
6. the branch diff/commit list and PR #1899 body/comments/labels

Evaluate pushed head `09e7b24b5fd2d4c2b24d018be81e93bc295afa89` against the brief. Independently run the exact
authorized focused gates from `worklog.md`. Do not run `deno task e2e:cli`, do not run root E2E
lint, and do not modify `deno.lock`. Verify the RED commit is tests-only, the GREEN namespace covers
all suffixed identifiers, the actual injected module type-checks, both resource registrations and
reinjection failure remain tested, the ceiling is respected, and the generator/listener deadline
files are untouched.

Write only
`.llm/runs/fix-readiness-fixture-app-identifier-collision--1898/evaluate.md` using the harness
template/protocol. Emit exactly one verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.
Do not edit product/tests/other run artifacts, do not commit or push, do not comment or mutate
GitHub, do not mark the PR ready, and do not tick any Definition of Done or issue acceptance box.
