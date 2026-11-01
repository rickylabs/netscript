**Verdict: PASS_PLAN, with five conditions.** One of them (C2) makes the change smaller. The approach is the right one; I don't see a smaller fix that is still safe.

## The cause, confirmed in the code

- **Where `{}` comes from:** `render-resource-slice.ts:131` renders `procedureInput: JSON.stringify(input.procedure.initialInput ?? {})`. On the public path, `generate-resource.ts:121` gets the procedure from `resolveProcedure`, which never returns `initialInput`. So the loaders leaf comes out with `{}`.
- **Why it conflicts:** init wrote `{limit:25,offset:0}`. The file on disk still matches its hash, so it classifies as `owned`. But the candidate differs, and `isCanonicalAdditiveTransition` (`reconcile-resource-slice.ts:172–185`) only accepts variant-subset renders for `page`/`view`. The result is a conflict at line 137 unless `--force` is used.
- **What the plan's constraints rule out:** forcing overwrite, weakening ownership, changing the test, and inferring the input from service names or config. Pulling the value back out of the generated source is source sniffing, which is also excluded. That leaves persisted, generator-owned provenance as the only safe option. Adding an optional field to the schema-1 marker is the narrowest version of that.

## Smaller alternatives I rejected

| Alternative | Why not |
| --- | --- |
| Give `limit`/`offset` defaults in `contract.memory.ts.template` so `{}` is valid | Changes the service contract, which drift explicitly forbids. Whether `{}` type-checks also depends on the client's input typing. |
| Have the procedure resolver infer pagination from the contract schema | This is input inference. It is more code and more fragile than persisting the value. |
| Regex the `…Input = {...}` line out of a hash-verified body | Source sniffing, and it breaks if the formatter changes. |

## Conditions

**C1 — Prove the recovered input by re-rendering, not only by the body hash.** `bodySha256` covers the body and not the marker line, so a stored `queryInput` is not protected by the hash. Recover the input only if re-rendering the loaders leaf with it reproduces the current file byte for byte, marker included. This brings two benefits:
- An untouched init-then-generate rerun becomes `exact`, so the leaf is skipped. That is a true no-op, not a rewrite.
- A mismatched procedure path, client module or factory, or an edited marker, automatically fails the check. The flow then falls back to today's conflict behaviour without needing per-field checks.

**C2 — Drop `clientModule` and `factory` from the metadata.** C1 already ties the stored input to the module and factory through the rendered body. Store only `queryInput: Record<string, string | number | boolean | null>`, which keeps the contract change minimal.

**C3 — Tighten the parser:**
- Accept `queryInput` only when `role === 'loaders'`.
- Accept flat primitive values only.
- Serialize with sorted keys on both write and validation, so the existing exact-line check at `resource-slice-contract.ts:293` is still the single canonical form.
- Existing markers without the field must keep parsing exactly as they do now.

**C4 — Document compatibility with older CLIs.** An older CLI's strict line check will reject a marker that carries `queryInput` and treat the file as `unowned`, which produces a conflict rather than an overwrite. That is fail-safe, but it should be written into the contributor docs. Don't bump the schema: it gives no extra safety and would split the format.

**C5 — Leave reconcile alone.** Make no change to `decideLeaf`, `isCanonicalAdditiveTransition` or `--force`. Recovery belongs only in `generate-resource.ts`, inside the same pass that already reads existing leaves for `readPriorVariants`. Precedence is: an explicit resolver or request `initialInput`, then the input recovered and proven under C1, then `{}`.

## Tests

The tests in the plan are sufficient once these are added:
- Init followed by public `generate resource` reports the loaders leaf as `skip`/`exact` with exit 0, on both dry-run and apply.
- An edited marker input (body untouched) produces a conflict and is not adopted.
- Running with a different `--procedure` does not adopt the stored input.
- A marker carrying `queryInput` on a non-loaders role is rejected.
- Keys in a different order do not parse as canonical.
- The existing public-command-tree test passes unchanged.
