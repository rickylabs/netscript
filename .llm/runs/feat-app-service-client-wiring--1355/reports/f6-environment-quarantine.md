# F6 binding-test environmental attribution and quarantine

## Preserved red receipt

`receipts/f6-test.json` remains the append-only first-attempt verdict. It attests content head
`7fa29ad3ed10ad903b9cbbd518111e6bf2754761` with matching `gitHead` and `actualGitHead`, exit 1,
and 4,228 passed / 1 failed / 19 ignored (4,248 total; one unique failure). It is not overwritten,
deleted, re-pointed, or included in a later passing evidence set.

The exact failure was:

```text
PermissionDenied: Permission denied (os error 13): readdir
  '<cwd>//.llm/tmp/cli-e2e/plugin-smoke-20260815-203755/.data/postgres/18/docker'
```

## Count-based attribution

F5's binding test reported 4,226 passed / 0 failed / 19 ignored (4,245 total). F6 attempt 1
reported 4,228 passed / 1 failed / 19 ignored (4,248 total). The F6 delta therefore added three
results, including two additional passing results; its new deterministic termination coverage is
executing and passing. The sole red is the forbidden-command walk into the abandoned S5 attempt-4
runtime tree, not an F6 product or probe assertion.

## Recoverable coordinator quarantine

The coordinator moved, rather than deleted, the protected runtime tree:

- source: `.llm/tmp/cli-e2e/plugin-smoke-20260815-203755` — verified absent before attempt 2;
- destination: `/tmp/netscript-f6-quarantine.7kXcDX/plugin-smoke-20260815-203755` — verified
  present before attempt 2.

Docker was independently reported empty and no process working directory referenced the tree. The
leaf did not delete, chmod, move, or otherwise mutate the residue. A single distinct
`f6-test-attempt2` receipt may now retest the unchanged content at `7fa29ad3e`; a second failure is
a new finding and stops the sequence without a third attempt.
