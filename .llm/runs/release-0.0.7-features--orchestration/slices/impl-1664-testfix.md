use harness

# SLICE — #1664: two test expectations left stale by the ruled `--client` change

Bounded. Two failing tests, both direct consequences of changes already accepted on this PR. Nothing
else.

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1664` |
| Branch | `feat/app-service-client-wiring` |
| Base | current HEAD — do **not** rebase or merge `main` |

## SKILL

`netscript-harness`, `netscript-cli`, `netscript-tools`.

## The two failures — measured, and both ours

Repo-wide `deno task test` at the current head: **4,511 passed / 4 failed**. Two of the four are
environmental to this sandbox and do **not** reproduce in CI (they spawn a fake browser binary from a
`noexec` tmpfs and fail with `PermissionDenied … os error 13`):

- `service-client-runtime-probe_test.ts :: browser version probe distinguishes path and process failure classes`
- `service-client-runtime-probe_test.ts :: browser startup reports early status and bounded stderr instead of a target timeout`

**Leave those two alone.** CI reports exactly **2** failures, which are the other two — and both are
stale expectations created by this PR's own accepted changes:

1. **`packages/cli/src/public/features/ui/add/add-ui-command_test.ts`** ::
   *"ui:add help explains the page island query-loader triad"* — the `--client <service>` flag we added
   changes the command's help output; the assertion still describes the pre-flag text.
2. **`packages/cli/e2e/tests/presentation/suite-registry_test.ts`** ::
   *"capability suites select only their scoped gates"* — we deliberately stopped wiring
   `GATE.GENERATED_DENO_LINT` into the **service** suite (it stays in the runtime suite, where the
   scaffold registers plugins and the Aspire helper's slots are populated). The test still expects the
   old gate set.

## What to do

Update **only** those two expectations so they describe the shipped behaviour.

- For the help test: assert the real help text **including** `--client`, so the flag is covered rather
  than merely tolerated.
- For the suite-registry test: assert the corrected service-suite gate set. Do **not** re-add
  `GENERATED_DENO_LINT` to the service suite to make the test pass — that would reintroduce a failure
  caused by pre-existing template debt this branch does not own, and the reasoning is recorded inline
  at the call site.

## Ceiling

Exactly those two test files. If a product file appears to need changing, **stop and report** — that
would mean the diagnosis above is wrong.

## Definition of done

- Both named tests pass.
- Repo-wide `deno task test` shows **only** the two environmental browser-spawn failures remaining
  (they are expected in this sandbox and absent in CI). Report the exact counts.
- Scoped `packages/cli` check/lint/fmt with **non-empty `stdout.bytes`** on each receipt.
- `deno.lock` byte-identical.
- One commit, pushed by explicit refspec; update `worklog.md`/`context-pack.md` in the same commit;
  post a PR comment with the counts before and after.

No labels, no acceptance boxes, no evaluator, no merge. **Never place `close`/`closes`/`fixes`/
`resolves` immediately before an issue number**, including in a negation.
