# Drift — sagas-prisma-store

## 2026-06-20

- **minor / planned deferral:** Prisma `SagaIdempotencyPort` parity remains deferred. This slice adds
  Prisma durable saga state persistence only; KV remains the idempotency and applied-key backend.
  Recorded in `.llm/harness/debt/arch-debt.md`.
- **minor / test harness:** Prisma store unit tests use a structural in-memory Prisma-shaped client
  for deterministic adapter contract coverage. Real database execution is covered by the final
  `scaffold.runtime` smoke, which provisions Postgres for generated projects.
- **minor / worktree hygiene:** pre-existing `.llm/tmp/run/openhands/**/request.md` line-ending-only
  modifications were present before implementation and excluded from all slice commits.
- **minor / doctrine debt:** adding `PrismaSagaStore` and the backend resolver deepens the existing
  `plugins/sagas/src/runtime` folder-cardinality warning. The public runtime export remains stable;
  the follow-up split is recorded in `.llm/harness/debt/arch-debt.md` as
  `sagas-runtime-folder-cardinality`.
- **minor / validation tooling:** broad `run-deno-lint.ts` and `run-deno-fmt.ts` wrappers returned
  exit code 1 with zero findings for the selected roots. Touched-file `deno lint`,
  `deno fmt --check`, and `deno check --unstable-kv` all passed and are the package-quality
  verdicts for this slice.
- **minor / validation tooling:** `audit-jsr-package.ts --root packages/cli --text` could not parse
  the CLI JSONC `deno.json`; `deno publish --dry-run --allow-dirty --no-check=remote` passed for
  `packages/cli` and is the CLI publishability verdict.
- **baseline / arch gate:** `deno task arch:check` remains baseline-red for pre-existing repo-wide
  doctrine findings. No new slice-specific FAIL was identified; the new/deepened saga runtime
  cardinality WARN is recorded as accepted debt above.
- **minor / final repair:** the first two final `scaffold.runtime` attempts failed at
  `behavior.sagas-health`. The generated appsettings contained `Sagas.Store.Backend`, but the
  Aspire config parser stripped that plugin-local metadata before helper generation, so generated
  saga executables did not receive `NETSCRIPT_SAGA_STORE`. The repair preserves `Sagas` metadata in
  `@netscript/aspire` config entries and emits `NETSCRIPT_SAGA_STORE` in generated plugin/background
  helpers. The third one-pass `scaffold.runtime` run passed 41/0.
