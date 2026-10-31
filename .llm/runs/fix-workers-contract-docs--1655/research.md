# Research

Live issue #1655 and tracker #2474 checked; no competing open PR or claim. Prior PRs #2218/#2292/#2313 intentionally left two references. Fresh main baseline a9620a3 still has two private-type-ref, zero other classes, in workers.contract-types.ts. All current 14 plugin export targets are retained (the original issue lists 13); no target may be dropped.

MCP find_guidance then search_docs consulted. Doctrine 02 explicitly sanctions oRPC slow-types because declared upstream internals cannot simply be exposed as owned contracts without loss of soundness. Issue #1655 nevertheless requires raw full-export documentation exit0 and closure of two zero-diagnostic debt rows; do not weaken those requirements.

Isolated prototypes, never applied to production sources:
- Replace ReturnType<typeof implement> with the exported upstream Implementer<TContract,TContext,TContext>: still two native private references; the upstream finding moves from implement to Implementer.
- Namespace-qualified imports, import() type queries, and public interface inheritance: same native private-reference findings; these do not repair visibility.
- Exporting the complete local definition/schema graph via a public namespace plus direct definition export: expands to 40 private refs and 55 missing JSDoc diagnostics. Namespace members do not make the referenced flat types public to native doc lint.
- Publishing the local graph directly makes private upstream contract/base/schema types the next frontier. Re-exporting a few upstream symbols exposes further nested SDK types. This would broaden the package into a vendor facade, conflicting with doctrine 02's prohibition on upstream re-exports; no such change is accepted or committed.

Earlier exploratory wrapper invocation used a different cwd; native isolated-cwd reruns confirmed the findings. Raw prototype logs are private and not merge gate verdicts. No production modification or accepted debt closure yet. Existing public consumer controls prove precise Zod methods, payload correlation, bidirectional upstream implementer assignability, context/config/middleware/router/lazy capabilities and all 22 routes; erasing those is not an option.

Closing-scope baseline completed: plugin full-export gate covers14 targets, core covers19. Both exit1 with exactly2 combined private refs, zero missing JSDoc and zero other classes; no target omitted. Existing debt closure must include both complete maps.
