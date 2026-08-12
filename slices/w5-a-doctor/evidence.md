# W5-A Evidence — plugin doctor service entrypoint release window

## Baseline

- Branch: `fix/doctor-service-entrypoint-unpublished`
- Base: `origin/main@9a7cadcaa9066970e931ed6abf1e61b65fcef20e`
- Release blocker: PR #1624 (`chore(release): cut 0.0.6`)

## Discriminating tests

The exact tests and the assertion that fails on pre-fix code will be recorded here before the fix.

## Gate output

Untruncated command output and raw exit codes will be appended after implementation.

## Lock hygiene

Pending final explicit-path diff assertion for `deno.lock` and `packages/fresh-ui/deno.lock`.
