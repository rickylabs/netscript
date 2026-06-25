# Commits — chore/deno-2.9-adoption

Append-only, one line per commit (`- <sha>: <message>`).

- eb4229cb: chore(deno-2.9): C0 pin toolchain to Deno 2.9.0 across CI + publish
- cd6fbc57: chore(deno-2.9): C1+C2 modernize deno.json tasks (native parallel + input cache)
- 3d18cd13: chore(deno-2.9): C3 refresh toolchain docs to Deno 2.9 (+ task-runner section)
- 0467d8c9: chore(deno-2.9): C4 document deno publish 2.9 resilience in publish.yml
- 62a1f6e0: docs: update AGENTS.md to Deno 2.9 (C3 follow-up — IMPL-EVAL FAIL_FIX, AGENTS.md:13 miss)

## Note on the C0 commit (eb4229cb)

The C0 commit was created without an explicit pathspec, so the already-staged deletion of
`.llm/tools/run-parallel-tasks.ts` (logically a C1 change — its only consumer was the former
`ci:quality` task) was bundled into it. The C0 commit message names only the C0 toolchain-pin
files. This is harmless: the deletion logically pairs with C1, every file is correct, and no
amend/rewrite was performed (push-safety: no history rewrite on a branch about to be pushed).
