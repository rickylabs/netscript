# Plan & Design — READY FOR REVIEW

Feature-tier adoption of PRs 2422, 2423, 2421, in that order. Separate owner-selected
Anthropic PLAN-EVAL is required before product edits; no self-certification.
Archetypes: service public builder (4), thin plugin composition (5), Fresh integration (2).
Service overlay applies. Existing doctrine debt is retained; no cap extensions.

## Locked decisions

1. Adopt original branches; merge current main, never force-push or replace historical evidence.
2. Keep legacy public startup and default anonymous health behavior. Restrictive host options
are opt-in. Document intentional custom-health and final-response CORS behavior in 2422.
3. Native ServiceAuthPolicy is asserted before runtime access. Reuse native ServeOptions,
RunningService, CorsOptions, SDK contribution and durable-stream native HeadersRecord.
4. Preserve workers runtime registration/mutation hook and stream upstream/storage/proxy code.
Legacy streams delegates to the same factory with its existing explicit public/wildcard policy;
the new singular factory remains inert. Direct CLI remains supported.
5. Header callbacks resolve in the upstream client. Explicit empty headers suppress ambient
producer credentials; omitted headers preserve compatibility. No SDK credential owner is
installed or overwritten automatically.
6. Main-only prerequisite landings. The final factory head can integrate reviewed prerequisite
heads, recording exact parents. All READY reports distinguish proofs from unproven CI.
7. No labels/milestones, no local scaffold.runtime, no releases/merges. Body starts with Refs.
The explicit adoption brief supersedes the generic duplicate-PR/closing-keyword template.

## Open-decision sweep

No architectural choice remains open. Routine test/merge failures are repaired within these
owners. External CI scheduling is safe to defer to the coordinator, explicitly unproven until
green on the exact head. If a native evaluator cannot run, record the exact blocker and do
not invent an evaluator PASS or silently substitute a model.

## Slices

| Slice | Files | Proof |
| --- | --- | --- |
| S0 audit/plan | This run and branch-specific run records; existing PR metadata | Current main audit, independent PLAN-EVAL |
| S1 service prerequisite 2422 | Adopted packages/service source/tests/README/CHANGELOG; plugin auth test; existing docs tools/carriers/debt | Root check, complete service/plugin tests, scoped lint/fmt, quality/arch, doc lint, service publish dry-run, independent review |
| S2 reader headers 2423 | Adopted Fresh stream runtime/tests, workers streams/tests, durable-workflows guide/carriers/debt | Root check; complete Fresh/workers suites; type/negative consumers; quality/arch; Fresh/workers publish dry-run; migration metadata; independent review |
| S3 host factories 2421 | Adopted workers/streams service facades/options/tests/deno.json; streams legacy main; workers README; host-policy integration tests/guide | Root check; complete touched plugin tests; auth/CORS/listener/SDK/legacy/storage/proxy integration; package publish dry-runs; consumers; independent review |
| S4 exact-head handoffs | Run summaries, PR bodies/comments and final report handoff | Review-thread gate, current-head CI and exact pushed-head IMPL-EVAL |

Each implementation slice updates worklog and context before commit/push; generated-carrier
refreshes follow source finalization. Follow-ups for generated files remain bounded to their
canonical generators, without editing checker policy or relaxing tests.

## Gate set

Use structured check/test/lint/fmt wrappers. Root `deno task check` is required. Run complete
touched-package suites, `quality:scan`, `arch:check`, full export doc lint and JSR audit,
`publish:dry-run --member` for each changed published member, generated freshness gates,
review-thread/metadata gates and CI e2e-cli for each final head. Use run-gate receipts where
allowlisted; preserve diagnostics locally and commit concise privacy-safe summaries.
CI, not local scaffold.runtime, owns expensive scaffold runtime validation.

## Risks and mitigations

- Auth ordering can break custom health probes: retain default public probes and document exact
GET/HEAD migration; test custom restrictive lists.
- Proxy responses can inject forbidden CORS: verify final responses and protocol header lists.
- Stale branches can drop main repairs: use real merge bases and resolve source conflicts
semantically; regenerate generated carriers after source is final.
- FFI/storage tests may expose platform prerequisites: run genuine Linux controls, distinguish
environment failures from source failures, never replace runtime claims with text scans.
- SDK service identity differs from reader headers: exercise existing contribution and server
authenticator end to end, without default adoption or duplicate authorization ownership.
- Historical debt/freshness can block CI: measure against main, repair within scope, report
unproven gates rather than inflate ceilings or omit tests.

## Deferred scope

#829 process-manager/pure-start migration; #2364 parameterized contract-policy resolver;
enterprise RBAC/session provisioning; releases; downstream EIS/browser/installer certification.
No cleanup of retained historical runs. Contributor path: the documented host startup recipe.
