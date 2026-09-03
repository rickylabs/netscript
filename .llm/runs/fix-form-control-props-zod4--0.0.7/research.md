# Research — fix-form-control-props-zod4--0.0.7

## Re-baseline

- Carried-in source: `implement-brief.md` and issue #1249.
- Re-derived against the owner-pinned `main` baseline `8c549c061569967f6f06ee35b03cd6fdfce2172f` on 2026-09-02 UTC.
- Local `main` has advanced to `08f581e8334485c29c845b39615276c59b48cc35`; this run intentionally remains on the supplied base.
- Before implementation, the branch contains only `93c5fa5a5 chore(harness): stage #1249 implement brief`; the worktree is clean and the remote branch matches.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The public form entrypoint exports `ControlProps`; `deno doc` renders `role?: string`. | `deno doc --filter ControlProps packages/fresh/src/application/form/mod.ts` |
| 2 | `ControlProps.role` is the incompatibility reported by the intrinsic-element consumer contract. | `packages/fresh/src/application/form/_internal/prop-types.ts`; S1 RED probe |
| 3 | The existing constraint adapter recognizes legacy numeric kinds but not Zod 4 `greater_than`, `less_than`, or `multiple_of`; `string_format` only handles URLs. | `packages/fresh/src/application/form/schema-adapter/zod-constraints.ts`; S2 RED probe |
| 4 | Fresh declares `zod: catalog:` and the root catalog is `^4.4.3`; `deno.lock` contains `npm:zod@^4.4.3 -> 4.4.3`. | `packages/fresh/deno.json`, root `deno.json`, `deno.lock`; `deno task deps:why zod` |
| 5 | `deno.lock` is byte-identical to the pinned base before work. | Both current and `git show 8c549c061:deno.lock` SHA-256 are `6c8f90a26375dcc0cec969f01e5bfb9e474216adb10f1cfbf68df5edab6b94d6`. |
| 6 | Current doctrine classifies `@netscript/fresh` as Archetype 4, verdict `Keep`. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:38` |

## jsr-audit surface scan

- Surface scanned: `packages/fresh/src/application/form/mod.ts` via `deno doc --filter ControlProps` and package metadata/exports in `packages/fresh/deno.json`.
- Planned public change: narrow one property of an existing exported interface; no export-map or runtime-permission change.
- Slow-type / surface risks: deriving the property from Preact must remain renderable by `deno doc --lint`; S3 checks the full Fresh export map. No new inferred exported function is planned.
- Publish filtering already excludes `*_test.ts` and `*_test.tsx`, so both regression probes remain outside the JSR payload.

## Open questions

- None that force implementation rework. The RED probes decide only admission: S2 proceeds if the exact locked Zod family reproduces, otherwise it is visibly deferred to 0.0.8.
