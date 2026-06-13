# 5d2 builders — drift ledger

## D-5d2-4: RTK unavailable in implementation shell

**Date:** 2026-06-14  
**Plan slice:** implementation bootstrap  
**Status:** open environment drift

**Description:**
The run protocol prefers `rtk` for read-heavy git/grep/listing commands and `rtk proxy` for Deno
task validation. In this WSL shell, the first `rtk git status --short --branch` command failed with:

```text
/bin/bash: line 1: rtk: command not found
```

**Disposition:** Continue with focused direct commands. Keep validation commands narrow and record
raw command names in `worklog.md`.

**Closing gate:** Environment PATH includes `rtk` again, or the supervisor accepts direct-command
evidence for this sub-run.

---

## D-5d2-5: Direct define-page types doc-lint baseline is larger than plan

**Date:** 2026-06-14  
**Plan slice:** Slice 1  
**Status:** open implementation drift

**Description:**
The approved plan states slice 1 should clear the local builders type doc-lint debt for
`packages/fresh/builders/define-page/types.ts` and budgets it as 2 private-type-ref errors plus
1 missing-jsdoc error. The direct command:

```text
deno doc --lint packages/fresh/builders/define-page/types.ts
```

currently reports 186 documentation lint errors. Many are missing JSDoc entries for exported
internal type-catalog symbols that will be moved or narrowed during later slice-16 type trimming;
others are private references to external package types or private helper aliases.

**Disposition:** Keep slice 1 focused on the approved public-surface snapshot and the specific
`InferDefinePageLayerLoaderProps` private-type-ref/JSDoc fix. Treat full direct
`define-page/types.ts` doc-lint cleanliness as part of the planned later type/barrel cleanup and
final slice-26 doc-lint gate.

**Closing gate:** Final `deno doc --lint packages/fresh/builders/mod.ts` and
`deno doc --lint packages/fresh/form/mod.ts` pass, and any remaining direct type-file doc-lint
exceptions are either eliminated by the decomposition or explicitly recorded.

---

## D-5d2-1: Form-package surface visibility touched by 5d2

**Date:** 2026-06-13  
**Plan slice:** Slice 2  
**Status:** planned, implementation pending

**Description:**
`packages/fresh/builders/mod.ts` re-exports `RuntimeFormState` (and members whose types are
declared in `packages/fresh/form/types.ts`). JSR's doc-lint reports 19 `private-type-ref` errors
and 18 `missing-jsdoc` errors because those member types (`FormValues`, `FormFieldErrors`,
`FieldDescriptorMap`, `FormElementProps`, `FormCsrfInputProps`, `CollectionKeyInputProps`,
`LabelProps`, `ErrorProps`, `DescriptionProps`, `ControlProps`, `IntentButtonProps`,
`FieldConstraints`, `FormIntent`, `FormIntentResult`, `FormReplyInit`, `CollectionDescriptor`,
`FieldDescriptor`) are not exported from `form/types.ts` and lack JSDoc.

This is nominally 5d5 (forms) scope, but it blocks 5d2's JSR publishability gate. The fix is
limited to:

1. Adding `export` to the referenced types in `packages/fresh/form/types.ts`.
2. Adding JSDoc summaries to each newly exported symbol and to `RuntimeFormState` members.
3. No behavior changes, no signature changes, no new runtime code.

**Rationale:** The umbrella plan requires 0 doc-lint errors over all exports combined. Since the
leak surfaces through the builders barrel, 5d2 will close it rather than leave a known JSR blocker
for 5d5.

**Closing gate:** `deno doc --lint packages/fresh/builders/mod.ts` returns 0 errors.

**Cross-unit impact:** 5d5 should be notified that 5d2 changed form-package public surface
(visibility/JSDoc only). If 5d5 later renames or removes these symbols, it must coordinate with
the builders surface test added in slice 1.

---

## D-5d2-2: F-18 sub-barrel opt-outs for A4 role modules

**Date:** 2026-06-13  
**Plan slices:** Slices 6, 10, 14, 17  
**Status:** planned, implementation pending

**Description:**
The decomposition creates role-named subfolders under `packages/fresh/builders/define-page/`:
`builder/`, `runtime/`, and `navigation/`. Each has a `mod.ts` that aggregates its role modules.
`define-page/mod.ts` also aggregates the role modules. Doctrine F-18 forbids sub-barrels inside
`packages/*/src/**` subdirectories unless they are declared subpath exports or genuinely aggregate
one symbol from many.

The new `mod.ts` files are genuine aggregation points that construct the public `definePage`
surface from role modules, so they qualify for the `// arch:barrel-ok` opt-out.

**Required action:**

1. Add a comment at the top of each new sub-barrel:
   ```ts
   // arch:barrel-ok A4-aggregate: composes public definePage surface from role modules
   ```
2. Record an entry in `.llm/arch-debt.md` (or the audit registry used by `deno task arch:check`)
   naming the files and the rationale.

**Closing gate:** `deno task arch:check:sub-barrels` passes for `packages/fresh/builders`.

---

## D-5d2-3: Potential slow-type opt-in for recursive form types

**Date:** 2026-06-13  
**Plan slice:** Slice 26  
**Status:** planned, decision pending on `deno publish --dry-run` output

**Description:**
`FieldDescriptorMap<T>` in `packages/fresh/form/types.ts` is a recursive mapped type. After it is
made public (D-5d2-1), JSR may classify it as a slow type. `RuntimeFormState<TValues>` depends on
it and may also be flagged slow.

Slow types do not block publishing if the package explicitly opts in, but they reduce the JSR
documentation score. The decision whether to add a slow-type declaration to
`packages/fresh/deno.json` is deferred until slice 26 produces `deno publish --dry-run` output.

**Closing gate:** `deno publish --dry-run` from `packages/fresh` succeeds.

---

## D-5d2-6: Builders form API needed structural schema input helper

**Date:** 2026-06-14  
**Plan slice:** Slice 2  
**Status:** open implementation drift

**Description:**
The approved slice budget focused on form-package private-type references, but
`deno doc --lint packages/fresh/builders/mod.ts` also reported private references to upstream Zod
types from the legacy `PageFormConfig` / `PageBuilder.withForm` public API. Exporting upstream Zod
types would deepen AP-14, so Slice 2 removed the direct public `zod` type references and added a
structural `SchemaInput<TSchema, TFallback>` helper next to the existing public `SchemaOutput`.

**Disposition:** Accept as the smallest public-surface addition needed to keep the builders barrel
doc-lint clean without re-exporting upstream Zod internals. Surface snapshot was updated to include
the helper.

**Closing gate:** Final `deno doc --lint packages/fresh/builders/mod.ts` and
`deno publish --dry-run --allow-dirty` from `packages/fresh` pass.

---

## D-5d2-7: Builder entry remains TSX and over the slice-6 size target

**Date:** 2026-06-14  
**Plan slice:** Slice 6  
**Status:** open implementation drift

**Description:**
The approved plan names `packages/fresh/builders/define-page/builder/mod.ts` as the replacement for
`builder.tsx`. At implementation time, the builder entry still contains JSX in the streaming
response assembly path, so moving it to `.ts` would fail parsing. Slice 6 therefore moved the entry
to `builder/mod.tsx` and added the planned `// arch:barrel-ok` justification.

The moved file is still 29396 bytes, above the planned slice-6 target. That is because `createBuilder`
still owns response assembly and form handler wiring until the runtime/render slices move those
concerns out.

**Disposition:** Continue with `builder/mod.tsx` temporarily. Close this drift when later slices
extract render/form runtime code so the builder entry can become a small `.ts` barrel or receive an
explicit final rationale.

**Closing gate:** Final file-size gate passes for `packages/fresh/builders/define-page/builder/`.

---

## D-5d2-8: Direct builder entry doc-lint expands imported type aliases as private

**Date:** 2026-06-14  
**Plan slice:** Slice 6  
**Status:** open implementation drift

**Description:**
`deno doc --lint packages/fresh/builders/define-page/builder/mod.tsx` reports private-type-ref
errors for the moved `DefinePageBuilder` interface because it now lives in `builder/state.ts` and
references type-state aliases exported by `define-page/types.ts`. The public `define-page/mod.ts`
surface still exports both modules, and the surface snapshot passes.

**Disposition:** Treat direct `builder/mod.tsx` doc-lint as deferred until the planned public barrel
cleanup. The slice still ran type-check and surface snapshot gates.

**Closing gate:** Final `deno doc --lint packages/fresh/builders/define-page/mod.ts` and
`deno doc --lint packages/fresh/builders/mod.ts` pass.

---

## D-5d2-9: Push blocked by HTTPS credentials

**Date:** 2026-06-14  
**Plan slice:** post Slice 6 publication checkpoint  
**Status:** open publication blocker

**Description:**
After completing and committing slices 2 through 6, a single normal push attempt failed with:

```text
fatal: could not read Username for 'https://github.com': No such device or address
```

**Local commits not pushed by this implementation session:**

- `b01ec31 fix(fresh): document form builder surface`
- `aed2925 refactor(fresh): extract define page builder state`
- `5105cf1 refactor(fresh): extract define page builder factory`
- `52bd5b9 refactor(fresh): extract define page builder validators`
- `8e519ad refactor(fresh): move define page builder entry`

**Disposition:** Do not loop on push. Continue local implementation and publish progress to PR #35
through the GitHub connector when available.

**Closing gate:** Supervisor or authenticated environment pushes the local branch.
