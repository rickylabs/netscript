# W5-A Evidence — plugin doctor service entrypoint release window

## Baseline

- Branch: `fix/doctor-service-entrypoint-unpublished`
- Base: `origin/main@9a7cadcaa9066970e931ed6abf1e61b65fcef20e`
- Release blocker: PR #1624 (`chore(release): cut 0.0.6`)

## Discriminating tests

### Pre-fix run

Command:

```text
NO_COLOR=1 deno test --allow-all packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts --filter "service entrypoint"
```

Raw exit code: `1`

Untruncated output:

```text
╭ Warning
│
│  Ignored build scripts for packages:
│  npm:lmdb@3.5.5
│  npm:msgpackr-extract@3.0.4
│
│  Lifecycle scripts are only supported when using a `node_modules` directory.
│  Enable it in your deno config file:
│  "nodeModulesDir": "auto"
╰─
Check packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts
running 3 tests from ./packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts
plugin doctor reports an exact unpublished service entrypoint as a named exclusion ... FAILED (25ms)
plugin doctor fully checks a published service entrypoint and rejects a missing export ... ok (25ms)
plugin doctor keeps a non-404 service entrypoint registry failure hard ... ok (18ms)

 ERRORS

plugin doctor reports an exact unpublished service entrypoint as a named exclusion => ./packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts:108:6
error: AssertionError: Values are not equal.

    [Diff] Actual / Expected

-   error
+   warning

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.19/equals.ts:67:9)
    at file:///home/codex/repos/ns006-w5a/packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts:123:5
    at async withProject (file:///home/codex/repos/ns006-w5a/packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts:390:5)
    at async file:///home/codex/repos/ns006-w5a/packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts:109:3

 FAILURES

plugin doctor reports an exact unpublished service entrypoint as a named exclusion => ./packages/cli/src/public/features/plugins/doctor/doctor-plugin-invariants_test.ts:108:6

FAILED | 2 passed | 1 failed | 9 filtered out (75ms)

error: Test failed
```

### What discriminates on the pre-fix code

| Test | Pre-fix result | Discriminating assertion |
| --- | --- | --- |
| Exact unpublished version | **RED** | `assertEquals(check.status, 'warning')` fails because current code reports `error`. The later message/command-success assertions are consequently not reached. |
| Published version, missing export | PASS negative control | Proves the loader is called for the exact published version and the genuine missing-export defect still fails. This behavior must remain unchanged. |
| HTTP 503 | PASS negative control | Proves non-404 registry failures are already hard and must remain unchanged. |

The focused three-test set is red before the fix. Only the contract being changed is expected to
fail; the other two cases are preservation controls, so claiming they were individually red would
be false evidence.

## Gate output

Untruncated command output and raw exit codes will be appended after implementation.

## Lock hygiene

Pending final explicit-path diff assertion for `deno.lock` and `packages/fresh-ui/deno.lock`.
