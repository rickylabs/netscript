# P1 verdict — post-allocation endpoint manifest

## Verdict

`FAIL`

## Arbitrated F1 outcome

**F1(b): use the `aspire-cli` query adapter as the first-class endpoint source for the current
decision record.**

The post-allocation seam itself produced correct allocated endpoint values. F1(b) is selected
because the locked D5 coherent-owned-run bar was not met due to service health, not because the seam
was shown impossible. A later healthy owned-run proof may legitimately give the owner reason to
revisit F1; both sources remain additive implementations of the same endpoint-source port.

The TypeScript `onResourceEndpointsAllocated` callback and `EndpointReference.getValueAsync()` did
atomically emit a complete identity-bound manifest with the localhost-name URL
`http://localhost:3001`. No literal numeric loopback address was observed. That is necessary but not
sufficient for the locked P1 bar. In the prepared owned run, Aspire described `users` as `Finished`
with exit code 1 and no resource URL; the generated command lacked `--allow-ffi`, which `libsql`
requires. A later request to the manifest URL returned HTTP 200, but listener PID/ownership and
precise describe-to-fetch timing were not captured. That observation could reflect a restart, stale
description, or foreign listener and is therefore ambiguous—not a satisfied pass-bar condition. The
manifest, owned description, healthy resource, and attributed live request did not agree in one
coherent observation. Per D5/D6, any incomplete or inconsistent proof is `FAIL` and selects F1(b).

## Evidence

- Experiment: `proofs/experiments/p1-post-allocation-manifest.ts`
- Normalized runtime evidence: `proofs/evidence/P1-runtime.json`
- Attempt and teardown record: `proofs/evidence/P1-attempts.md`
- Normalized owned-resource report: `proofs/evidence/P1-resource-hygiene.json`

## Implementation recommendation

Rescope the generated SQLite service permission fix outside this proof PR. The implementation lane
recommends `FAIL_RESCOPE` as the eventual IMPL-EVAL disposition for that DB-backed product path;
this is not a self-issued evaluator verdict.

Making the generated SQLite service healthy requires a product/template permission change. This
proof run does not own that change and did not make it. The DB-backed half of P2 is blocked pending
that fix because it needs the same service to expose a coherent live spec. The no-DB half of P2 and
P3 do not depend on `libsql` or `--allow-ffi`; they remain runnable after the supervisor clears the
normal review/sequence gate. The seed RFC §9, RFC issue #1123, and epic #1126 remain for the
supervisor to update only after separate Fable review and sign-off of this draft verdict.
