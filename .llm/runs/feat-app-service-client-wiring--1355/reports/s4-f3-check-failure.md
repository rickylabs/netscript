# S4-F3 binding check failure

- Content head: `6e822a74b4de527a23da46f1c9c2f6ba6c94c72f`
- Receipt: `receipts/s4-f3-check.json`
- Invocation: `app-service-client-wiring-s4-f3-check`
- Verdict: `FAIL`, exit 1
- Attestation: `gitHead == actualGitHead`; no mismatch override

The structured `check` gate selected 2,937 files in 25 batches. One batch failed with one
diagnostic:

```text
TS2322 packages/cli/e2e/src/application/gates/scaffold/verify-producer-reconnect.ts:268:5
Type 'Timeout' is not assignable to type 'number'.
```

## Attribution

The diagnostic-bearing file has no diff from either the last accepted cheap-evidence head
`2c8219968` or the pre-implementation verdict head `c53726c69`. Git blame attributes the line to
`3ce91f2c2` (PR #1402).

The same full `deno task check` command was measured in an isolated `git archive` of
`c53726c69`: 2,924 files, 25 batches, zero failed batches, zero diagnostics, exit 0. Because the
current red does not reproduce at the named earlier commit, it is not eligible to be carried as a
pre-existing baseline. The changed file count/batch composition is observed; no causal mechanism
beyond the measurement is claimed.

## Stop disposition

The ordered binding run stopped immediately. These contracted receipts do not exist:

1. `receipts/s4-f3-test.json`
2. `receipts/s4-f3-publish-dry-run.json`
3. `receipts/s4-f3-arch-check.json`

No repair was attempted. No lease or expensive gate ran.
