# Exact-head IMPL-EVAL round 3

Superseded by the S2 test-fixture repair; review of the final new head is required.

No implementation blockers remain at the pushed head, so the verdict is MERGE. That is not full merge-readiness: the external `scaffold.runtime` gate is still unproven.

**One disclosure.** To check whether main had moved, I ran `git fetch -q origin main`. That only updated the local `origin/main` tracking ref. No branch, working-tree, index or remote changes were made. Apart from that I made no writes, edits, comments, label changes or resource starts, and did not run the local scaffold runtime.

**Exact head**
- Local `HEAD` and `origin/orch/divybot-6542166103` both equal `5acb515435e1d3b44cc8ef3d269d6aaf842adc5d`, and the working tree is clean.
- The history from `abe9d3e` is two commits: the plan (`2fa9516`) and the implementation (`5acb515`).
- The source in this commit is what I approved in round 2. The stream reconciler change in `plugins/sagas/streams/producer.ts` is identical. The other changes are run evidence under `.llm/runs/…--2160/` and the reconciler line in the migration note.
- Rerun at this head: the streams, services and atomic-projection tests give 31 passed, 0 failed (run with `--no-lock`, so `deno.lock` is unchanged).

**Currency**
- `origin/main` has one new commit since `abe9d3e`: `aec75e4`, a workers logging change (#2511).
- It touches workers files, lock files and another run directory, and nothing this PR changes. Nothing conflicts.

**Scope and privacy**
- The PR touches only the sagas runtime, service and stream code, its tests, the contract JSDoc, the sagas README and docs page, and this issue's own run directory.
- There is no #2382 status-list work and no `deno.lock` diff.
- The committed run files contain no secrets, tokens or operator home paths.

**Acceptance at this head**
- Business state is returned verbatim in the KV projection, the Prisma projection (`projectionVersion: 2`), HTTP GET and list, and stream reconciliation. Runtime status and identifiers are sibling fields.
- KV GET does exactly two gets: the correlation index, then the stored envelope.
- A Prisma projection GET is one indexed `findFirst`.
- All six canonical/projection backend combinations go through the same backend settings loader as the runner.
- The #2499 atomic/replay/transition seam and #2512 compensation are untouched.
- Doc lint still fails, but with the same findings as baseline (plugin 30, core 7). I saw nothing new introduced.

**Still unproven, outside this code review**
- The required external `scaffold.runtime` E2E (`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`) belongs to the coordinator. They must arm the e2e-cli gate and get a passing verdict before merging.
- CI at this exact head may still be pending; I did not verify it.

This verdict covers code readiness only and does not authorize a merge without that external runtime gate.

VERDICT: MERGE 5acb515435e1d3b44cc8ef3d269d6aaf842adc5d
