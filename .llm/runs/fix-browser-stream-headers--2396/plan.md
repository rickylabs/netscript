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

## PLAN-EVAL round 1 repairs (locked before product edits)

1. **Runtime trigger:** the owner explicitly authorizes the coordinator to arm the
`e2e-cli-gate` label; the implementer never changes labels. Notify #2474 of each exact
pushed branch/head and required runtime verdict. Keep 2422/2423 non-draft. Mark 2421 ready
only after complete implementation and blocker-free preliminary IMPL-EVAL, then the
coordinator's label enables CI. READY distinguishes queued/unproven from green; no claim of
merge readiness without the required exact-head runtime verdict. No local scaffold.runtime.
2. **Published graph:** new service exports change plugin publish shape. Under
`.llm/harness/gates/release-gates.md`, record post-publish `e2e-cli-prod` as proposed
`DEBT_ACCEPTED`, targeting the first 0.0.9 canary and necessarily before stable, owned by
the release coordinator (#2474). The new packages cannot be tested from JSR before they
exist. This debt needs independent acceptance and remains explicitly unproven; dry-run is
only static proof. This run does not publish. Record the entry in the canonical debt registry
in S3, without changing pre-existing debt bounds or expiry dates.
3. **Main merge mechanism:** local non-rewriting `git merge origin/main`, on each original
branch, followed by normal fast-forward push. Credential capability was verified through
GitHub's response headers: the authenticated token includes `repo` and `workflow` scopes.
No credential value was emitted or stored. This supports changed workflow files inherited
from main; no independent workflow edits are authorized. If push refuses, use GitHub's
update-branch API with expected-head protection, then fetch/reconcile; never force-push.
4. **Sibling review:** S3 includes read-only review of
`plugins/sagas/services/src/main.ts` and `plugins/triggers/services/src/main.ts` plus their
public export maps. Record their current public/auth/runtime behavior and the adoption
boundary in the host guide. No sibling startup redesign: the issue asks equivalent review,
while new options implementation remains the named workers/streams seam. This explicitly
assigns the research.md gap; sibling redesign is deferred to its own scope.
5. **Exact S3 additions:** `plugins/streams/services/src/main.ts` (delegate legacy startup),
`plugins/workers/services/src/service-host-policy_test.ts`,
`plugins/streams/services/src/service-host-policy_test.ts`,
`plugins/streams/services/src/service-legacy_test.ts`,
`docs/site/services-sdk/how-to/host-plugin-services.md`,
`docs/site/services-sdk/services.md` (one navigation link),
`plugins/streams/README.md` and plugin CHANGELOG files if needed for export/migration notes.
Workers context ownership remains compatible with the existing runtime (host-global KV,
plugin-owned request context); tests characterize this rather than invent a new context API.
6. **Exact canonical generated carriers allowed:**
`packages/cli/src/kernel/assets/agent-docs-prose.generated.ts`,
`packages/cli/src/kernel/assets/agent-docs.generated.ts`,
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`,
`packages/mcp/src/publish-assets.generated.ts`, and existing `.llm/assets/agent-docs/`
prose/provenance carriers only when their canonical generators produce them.

Scope expansion above is recorded in supervisor.md and drift.md before any product write.
Risk mitigations now include verified workflow permission, explicit coordinator CI arming,
post-publish debt without false-green claims, and read-only saga/trigger review.
