use harness

# S2 review fixes — keyword fidelity and record hygiene

Resume the same tracked Codex thread in `/home/codex/repos/ns005-proofs-impl`. Read
`reviews/S2-fable.md` completely and resolve M1 plus m1–m3. Do not run a scaffold/AppHost, start
P3, change product/template source, commit, push, or contact GitHub.

Required amendments:

1. Fix `p2-measure-live-spec.ts` so the observed OpenAPI 3.1 / JSON Schema 2020-12 keyword evidence
   cannot silently omit present standard keywords such as `summary`. Use a defensible complete
   standard-key set and also emit non-allowlisted object keys with paths (or an equally auditable
   mechanism). Document the context-blind property-name limitation if it remains.
2. Copy the retained, hash-matched, credential-free 3657-byte raw no-DB spec into normalized
   committed evidence under `proofs/evidence/` using `apply_patch`, then rerun only the measurement
   script against that retained spec to regenerate `P2-no-db.json`. Do not fetch the network.
3. Update `P2-verdict.md` so its keyword claim exactly matches the amended evidence.
4. Update the no-lint-ignore gate note to cover both P1 and P2 experiment files.
5. Append drift for the split fetch/measurement command and its filename/permissions deviation.
6. Name the lock-digest algorithm in P1/P2 evidence, or otherwise make the 40-vs-64-hex distinction
   explicit without changing the historical values.
7. Re-run the scoped wrappers, JSON assertions, raw-spec hash/byte checks, lint-ignore scan, and
   diff/scope checks. Update worklog/context/drift, leave a stable uncommitted amendment, and stop
   for Fable re-review.

The combined P2 verdict remains `FAIL`; do not claim #1128 acceptance or issue an IMPL-EVAL
disposition.
