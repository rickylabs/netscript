# Drift

2026-10-31: Adopt existing PR branches instead of opening a duplicate on the dispatcher branch,
as explicitly required by the operator adoption instructions. Existing draft 2421 satisfies the
early draft review surface. Owner addendum keeps 2422/2423 non-draft. Explicit Refs-only policy
wins over the generic closing-keyword template. Final canonical publication uses the requested
file handoff. RTK absent; raw focused inspection is the available fallback.

2026-10-31 PLAN-EVAL round 1: FAIL_PLAN on trigger/post-publish handling, workflow push
capability, sibling review ownership and unnamed new file scope. Plan now records exact
new S3 paths and canonical carriers before writing them; assigns sibling read-only review;
verifies workflow scope; delegates CI label arming to the coordinator as explicitly authorized;
and proposes canonical post-publish production-gate debt for the first 0.0.9 canary.
No implementation began; same evaluator is re-steered for round 2.

S1 review follow-up scope: the reviewer found stale immediate-health wording in
packages/service/README.md and docs/site/reference/service/index.md. Add the latter exact
path to this slice before writing; correct pipeline/limiter guidance and describe deferred
health registration without changing runtime code. Regenerate only required canonical prose
carriers. This is a bounded documentation repair, not an architectural rescope. Independent
round 1 has no source blockers; CI/runtime evidence remains pending outside this leaf's label
permissions. Continue the independent reader slice after this terminal source review while
coordinator-owned gate proof is pending; do not repeat the evaluator merely to rediscover it.

Integrated factory doc lint reveals a private reference from native AuthnOptions.allowAnonymous
to the newly named AnonymousRule. Preserve the exact existing public request shape by making
AuthnOptions the sole field owner and deriving AnonymousRule/AnonymousRequestMatch type views
from that field. This avoids expanding either factory facade or extending bounded F5 debt.
A standalone native Deno doc-lint probe passes this standard TypeScript shape without erasing
public types. This is a contract-definition repair in the already owned auth/options.ts; no
runtime matching, field, default, guard, resolver or policy semantics change. Re-run native
service tests/doc/publication gates and independently review the new exact service head.
