# Research — Slice A client selector

## Baseline

- The branch and `origin/feat/app-service-client-wiring` both resolve to `a30405df11c03f0fa88eb67fba866eb231905d39`.
- #1664's `findBinding`, `selectionRemedy`, and selector regression cases are present in `web-scaffold.ts` and `web-scaffold_test.ts`.
- The locked #1354 plan was read from `origin/feat/cli-resource-slice-plan`; D2 and Slice A match the owner-provided excerpt.

## Findings

- The selector is currently private UI application code. It discovers conventional `lib/*.ts` query clients first, falls back to example `service-query.ts` files only when no lib candidate exists, resolves zero/one/many candidates, and validates service identity, query symbol, contract existence, and list-input dialect.
- Exact diagnostics are observable #1664 behavior and must remain stable.
- The shared resolver can depend on `FileSystemPort` and `@std/path`; it needs no UI or presentation imports.
- No package export, `mod.ts`, `deno.json`, command/input, carrier, or template changes are needed. The JSR public surface is unchanged, so slow-type/export risk is N/A for this extraction.
- Relevant doctrine is Archetype 6 horizontal kernel application layering. The extracted application service remains below UI and does not import adapters.
- Existing CLI debt entries are unrelated and are neither deepened nor closed.

## Re-baseline drift

- The fixed #1664 head contains 10 direct children under `application/resource-slice/`; the selector and its test make 12. The locked plan's 14-child WARN describes the later combined state after Slice D, which is not present on this stacked branch.
- `rtk` is not installed on the host. Direct Git is used for authoritative state and diff evidence.

## Open questions

- None. The selector behavior, four-file product ceiling, diagnostic contract, and stacked PR base are locked.

