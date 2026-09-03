# IMPL-EVAL — PR #1930

- Evaluated head: `f8df31782` (`f8df31782aa7a1b9fac6bffe3e3a96642d4a3199`)
- Lane: Codex · OpenAI · GPT-5.6 Sol · high · `review_claude`
- Generator separation: separate session from the Claude author
- Verdict: `FAIL_IMPL`

## Blocking findings

### C1 — The graph guard skips runtime value-import forms

`fixture-contract-driver.ts:69` recognizes only static `import … from` and `export … from`
statements. Executing that exact matcher against representative syntax produced:

```text
static_value=@missing/value
static_type=SKIPPED
inline_type=@missing/inline-type
side_effect=SKIPPED
dynamic_value=SKIPPED
export_named=@missing/export
export_star=@missing/star
export_type=SKIPPED
export_inline_type=@missing/export-inline-type
```

Both skipped value forms are material holes. A bare side-effect import such as
`import "@missing/side-effect"` requires runtime resolution, and a literal dynamic import such as
`import("@missing/dynamic")` requires resolution when executed. Their relative equivalents are
also invisible to the BFS, so a module reachable only through either form is never visited. The
400-character regex window is an additional avoidable completeness limit.

The type-only concession itself is sound for `import type` and `export type`: those declarations
are erased. Inline type-only bindings are currently scanned, making the guard mildly over-strict,
not under-strict. Package-name normalization is supported by the present known-good graph:
`@orpc/client/message-port` and `@netscript/telemetry/tracer` are reached from package-root entries,
and the exact-head hosted desktop job succeeded.

Required repair: collect module specifiers with a TypeScript-aware parser (preferred), or otherwise
cover side-effect imports, literal dynamic imports, and all static re-export forms. Traverse relative
edges from those forms and add executable negative controls proving that unmapped bare side-effect
and dynamic imports fail, including a module reachable only through a relative side-effect/dynamic
edge.

### C2 — The committed implementation run artifacts are stale

The implementation commit did not update its run artifacts:

- `.llm/runs/desktop-orpc-contract-dep--impl/worklog.md:78-80` still says gate results are
  “Pending implementation.”
- `.llm/runs/desktop-orpc-contract-dep--impl/context-pack.md:9,15-16,24-33,48-55` still says the
  phase is `plan`, no implementation has started, and every gate is pending.
- Plan decision D1 and the worklog describe checking the prepared map, while the final guard instead
  reads the committed fixture map. That necessary correction is not recorded in `drift.md`.
- Commit `f8df31782` changes only `fixture-contract-driver.ts`; it does not satisfy the harness
  requirement that the slice update `worklog.md` and `context-pack.md` with its final implementation
  and gate evidence.

Required repair: update the implementation worklog/context pack with the actual final design,
commit, gates, and phase; append the prepared-map → committed-map correction to drift; reconcile the
PR slice state before reevaluation.

## Verified evidence

| Check | Evidence |
| --- | --- |
| Head identity | Local `HEAD` and PR head are `f8df31782aa7a1b9fac6bffe3e3a96642d4a3199`. |
| Dependency declarations | The committed fixture map and synthesized map both declare `"@orpc/contract": "npm:@orpc/contract@^1.15.0"`; this exactly matches `packages/sdk/deno.json:34`. |
| Non-vacuity, dependency absent | After removing only the committed fixture entry, `deno task check:desktop-native-fixture` exited 1 and named `@orpc/contract` plus `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts`. |
| Restored state | After restoration, the same task exited 0 with `satisfies 14 reachable SDK modules; 0 unmapped specifiers`. The fixture file has no working-tree diff. |
| Current traversal count | Reproducing the BFS enumerated 14 SDK files. A focused scan found no side-effect or dynamic imports in those current files, so 14 is plausible for the present static-value graph. Current `export { … } from` and `export * from` forms are matched. |
| Scope | `git diff --name-only origin/main...HEAD -- packages/sdk` is empty. The PR does not roll back or defer #1889 and changes no SDK source. |
| Established hosted runtime evidence (not rerun) | `desktop-native-linux` succeeded at exact head `f8df31782` in GitHub Actions run `33638728013`, as supplied with head verification. |
| Established local evidence (not rerun) | Scoped check: 5 files/0 diagnostics; fixture-contract test exit 0; lint exit 0; fmt exit 0; `quality:gate` exit 0; `arch:check` exit 0; `deno.lock` byte-identical to `origin/main`. |

## Verdict

`FAIL_IMPL`
