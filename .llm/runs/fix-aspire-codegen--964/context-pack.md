# beta.12 grouped fix: aspire-codegen

Issues: #964 — fix(aspire): generated AppHost imports .mjs while emitting .mts files

## Shared-cause hypothesis

Single defect, single issue. Code generated under `aspire/.helpers/` writes `.mts` files to disk
but the emitted import specifiers use `.mjs`. Under TypeScript `NodeNext` resolution, `tsx`
rejects the mismatch, so the generated AppHost does not run without hand-editing.

Root cause is expected to be one specifier-construction site in the aspire generator: the
extension used when writing the file and the extension used when referencing it are decided
independently. Fix once, at that seam, and add a regression guard that asserts every emitted
import specifier resolves to a file the generator actually wrote.

Assessed MECHANICAL: no plan document.

## Implementation result

- Generated AppHost and helper imports now name the `.mts` files actually emitted.
- Generated `tsconfig.apphost.json` enables TypeScript-extension imports under NodeNext.
- A semantic generator guard resolves every local relative import against the emitted file set.
- Fails-before mutation and focused/package gate evidence are recorded in `worklog.md`.
- Full `scaffold.runtime` smoke is deferred to evaluator / merge-readiness.
