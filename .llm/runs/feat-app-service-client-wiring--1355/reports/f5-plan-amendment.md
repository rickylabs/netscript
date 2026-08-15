# F5 plan amendment — post-init generated content

## Stop boundary

This artifact records research and design only. No product/test file, generated asset, lockfile, or
documentation tree was changed. No binding or expensive gate, Aspire command, Docker command,
browser gate, evaluator, or lease action ran. A read-only replay of the preserved generated
project's already-failing `deno task fmt:check` was used only to enumerate its structured exact path
set; it does not replace or alter the suite-owned S5 verdict.

## Accepted evidence and corrected attribution

S5 attempt 3 ran at its immutable leased head and stopped at `generated.deno-fmt-check` with 12 of
172 files unformatted. F4's service-client contract gate had already passed. The raw failure and
its SHA-256 remain append-only in the attempt-3 report.

The formatting mechanism predates this leaf: `formatOutput()` exists unchanged at
pre-implementation `c53726c69` and is called only by `init-pipeline.ts`. The earlier report's
"pre-existing failure" label is too broad, however. The omission is pre-existing; the failing
post-init `service add` / `service generate` state is part of this leaf's generated-output contract
and is not a carried merge baseline.

The preserved generated project's structured quality runner identifies this exact set:

1. `apps/<app>/lib/users.ts`
2. `apps/<app>/lib/payments.ts`
3. `contracts/versions/v1/payments.contract.ts`
4. `contracts/versions/v1/mod.ts`
5. `services/payments/src/routers/v1.ts`
6. `aspire/.helpers/register-apps.mts`
7. `aspire/.helpers/index.mts`
8. `aspire/.helpers/db-cli-mode.mts`
9. `aspire/.helpers/register-tools.mts`
10. `aspire/.helpers/register-infrastructure.mts`
11. `aspire/.helpers/register-background.mts`
12. `aspire/.helpers/register-plugins.mts`

That is two client files, three payments-derived contract/service files, and seven Aspire helpers.

## Chosen abstraction

Use one internal `GeneratedSourceFormatterPort` and one `DenoGeneratedSourceFormatter` adapter.
The adapter provides:

- bulk path formatting for the existing init/post-script flow; and
- target-extension-aware content canonicalization through Deno formatter stdin.

The content operation uses the existing generated-file style policy (`--no-config`, width 100,
single quotes), not a hand-written formatter. The bulk operation preserves init's current
project-config discovery and warning behavior. `formatGeneratedFiles` delegates to the same
adapter. Optional text stdin is added to `ProcessPort` and implemented by `DenoProcess`; there is no
direct command execution in the domain/application writers and no package export change.

Every post-init owner receives the port and calls it before equality/write. If `R` is rendering and
`F` is canonicalization, both comparison and disk bytes are `F(R(input))`. The immediate repeat is
therefore stable. Formatting the target after writing would instead compare `R(input)` with
`F(R(input))` on every later run and is explicitly prohibited.

## Exact bound ceiling

Product inclusions:

- `packages/cli/src/kernel/ports/generated-source-formatter-port.ts` (new)
- `packages/cli/src/kernel/ports/process-port.ts`
- `packages/cli/src/kernel/adapters/runtime/process/deno-generated-source-formatter.ts` (new)
- `packages/cli/src/kernel/adapters/runtime/process/deno-process.ts`
- `packages/cli/src/kernel/application/scaffold/support/format-generated-files.ts`
- `packages/cli/src/kernel/application/scaffold/support/post-scripts-init.ts`
- `packages/cli/src/kernel/adapters/service/client-scaffolder.ts`
- `packages/cli/src/kernel/adapters/service/workspace-mutator.ts`
- `packages/cli/src/kernel/adapters/contracts/contract-scaffolder.ts`
- `packages/cli/src/kernel/adapters/contracts/version-registry.ts`
- `packages/cli/src/kernel/adapters/service/scaffolder.ts`
- `packages/cli/src/public/features/generate/aspire/generate-aspire.ts`
- `packages/cli/src/public/features/services/add/add-service.ts`
- `packages/cli/src/public/features/services/services-group.ts`
- `packages/cli/src/public/features/root/public-command-dependencies.ts`

Focused-test inclusions:

- `packages/cli/src/kernel/adapters/runtime/process/deno-generated-source-formatter_test.ts` (new)
- `packages/cli/src/kernel/adapters/runtime/process/deno-process_test.ts`
- `packages/cli/src/kernel/application/scaffold/support/format-generated-files_test.ts`
- `packages/cli/src/kernel/application/scaffold/support/post-scripts-init_test.ts` (new)
- `packages/cli/src/kernel/adapters/service/client-scaffolder_test.ts`
- `packages/cli/src/kernel/adapters/service/workspace-mutator_test.ts` (new)
- `packages/cli/src/kernel/adapters/service/scaffolder_test.ts`
- `packages/cli/src/kernel/adapters/contracts/version-registry_test.ts` (new)
- `packages/cli/src/public/features/generate/aspire/generate-aspire_test.ts`
- `packages/cli/src/public/features/services/add/add-service_test.ts`
- `packages/cli/src/public/features/services/generate/generate-service-clients_test.ts`
- `packages/cli/e2e/tests/application/gates/service-client-generated-format_test.ts` (new)

Explicit exclusions: `render-service.ts`, `generate-service-clients.ts`,
`generate-service-command.ts`, `add-service-command.ts`, `workspace-init.ts`, every template,
`embedded.generated.ts`, all existing fixtures, SDK/Fresh product files, `docs/**`, and `deno.lock`.
The reasons for each named orchestrator exclusion are recorded in `plan.md`. Any compiler-proven
path outside this ceiling requires a new amendment before mutation.

## Proof matrix

1. Unit-lock Deno stdin, extension selection, exact style flags, stable second canonicalization,
   target-named failures, and bulk init delegation.
2. Unit-lock canonical content before comparison/write for the client, contract/version, service,
   and Aspire owners.
3. In a temporary real scaffold, execute database-backed `users` init, then
   `service add --name payments --with-client`, then `service generate`. Assert the exact 12 paths
   exist, exact-set `deno fmt --check` exits 0, and the generated full `deno task fmt:check` exits 0.
   This test starts no Aspire runtime or Docker resource.
4. Snapshot and prove `--dry-run` writes zero bytes; prove `--force` still rewrites identical
   canonical content.
5. Rerun the existing missing-contract add-path negative so all manifest contracts still validate
   before the first target write and its exact error remains unchanged.
6. Rerun the existing F4 sequence and negative: convergence may write, but the immediately repeated
   same-input generate writes zero and retains exact SHA-256 path/byte identity.

Fresh Tier-A review is required before any implementation.
