# Phase B lease-backed receipt procedure

Phase B requires the supervisor-provided Aspire runtime lease. Do not run this procedure from an
unleased implementation session. It reproduces #1429 without changing the host CLI and proves the
foreign-worktree invariant before #1719 or #1429 is closed.

## Preconditions and evidence names

1. Record the leased AppHost's exact real path, the worktree, slice directory, declared owned root,
   CLI PID and PID start identity. Record a second, foreign-worktree AppHost as the control.
2. Save the initial `aspire ps` result and process table as
   `receipts/phase-b-01-baseline-aspire-ps.json` and
   `receipts/phase-b-02-baseline-process-tree.json`.
3. Confirm the foreign control is reported as foreign and is not included in planned mutations.
4. Never invoke `aspire stop --all` or `aspire agent mcp` during the reproduction.

## Canonical generated-project bootstrap

Fixture choice: use the full generated-project S7 fixture because Phase B needs the generated
service contract and the root `node_modules/zod` consumed by the AppHost helpers; do not replace it
with a handwritten minimal AppHost.

For each authorized scratch, use this order before any runtime command:

1. Scaffold the generated PostgreSQL project and pin its Aspire configuration to the required train.
2. Run the hosted `scaffold.runtime` suite's standalone `database.codegen` step from the generated
   `database/postgres` directory, before a root install or type-check resolves
   `database/postgres/schema/.generated/**`:

   ```bash
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres \
   POSTGRES_URI=postgres://postgres:postgres@localhost:5432/postgres \
   deno task db:generate
   ```

3. Run `deno install` at the generated project root. This materializes the root `node_modules/zod`
   required by the AppHost helpers after the generated Zod import target exists.
4. If a root type-check is requested, run it only after steps 2-3.
5. Run `aspire restore --apphost <exact-apphost.mts>`, then the leased start command. Start the
   foreign control first.

This order is the canonical generated-project correction ratified by the `database.codegen` gate;
the earlier rerun attempted the root install before codegen and is preserved as terminal RED
evidence in receipt 11.

## Reproduction and cleanup

1. Terminate only the leased run's validated CLI PID, retaining the AppHost/DCP descendants. Save
   the signal, prior PID start identity, and the immediate process snapshot in
   `receipts/phase-b-03-cli-terminated.json`.
2. Run the read-only reporter with the exact roots:

   ```bash
   deno task agentic:leak-check -- --slice-dir <run-dir> --worktree <worktree> --owned-root <owned-root>
   ```

   Save `receipts/phase-b-04-leak-check.json`. It must report the re-parented owned descendants and
   the foreign control, with only the former classified owned.
3. Preview teardown with the same exact roots. If persistent deletion is part of the leased
   reproduction, add `--force-persistent` to the preview. Save the exact planned argv in
   `receipts/phase-b-05-teardown-preview.json`; it must contain no `--all` and no mutation yet.
4. Apply the reviewed plan:

   ```bash
   deno task agentic:teardown -- --slice-dir <run-dir> --worktree <worktree> --owned-root <owned-root> --apply --force-persistent
   ```

   Omit `--force-persistent` when the receipt does not require persistent-resource deletion. Save
   `receipts/phase-b-06-teardown-apply.json`, including scoped stop, bounded confirmation, and any
   stable targeted orphan termination.
5. Repeat leak-check, `aspire ps`, and the process snapshot. Save them as
   `receipts/phase-b-07-final-leak-check.json`, `phase-b-08-final-aspire-ps.json`, and
   `phase-b-09-final-process-tree.json`. The owned run must be clean. The foreign control must still
   exist and must have no mutation recorded against it.

## Draft closing evidence for #1719

Post only after Phase B receipts exist and the separate evaluator accepts them:

```acceptance-evidence
issue: 1719
acceptance:
  - criterion: "Kill the Aspire CLI, leave AppHost descendants, then leak-check reports the leak and teardown --apply removes only owned resources."
    evidence: ".llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/receipts/phase-b-04-leak-check.json; phase-b-06-teardown-apply.json; phase-b-07-final-leak-check.json"
  - criterion: "A foreign AppHost in another worktree is reported and never mutated."
    evidence: ".llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/receipts/phase-b-04-leak-check.json; phase-b-06-teardown-apply.json; phase-b-08-final-aspire-ps.json"
  - criterion: "The resolving PR closes #1429."
    evidence: "PR #1744 body contains Closes #1429; closure remains gated on the accepted Phase B receipts."
```

## Draft #1429 closure comment

> Reproduced the leaked `aspire-managed` PPID-1 descendants under the leased 13.5.3 runtime. The
> read-only leak report identified the owned descendants while retaining the foreign AppHost as a
> report-only control. Scoped teardown removed only the owned run, bounded helper confirmation
> completed, and the final census shows the foreign control unchanged. Evidence:
> `phase-b-04-leak-check.json`, `phase-b-06-teardown-apply.json`,
> `phase-b-07-final-leak-check.json`, and `phase-b-08-final-aspire-ps.json` in the S7 run directory.
