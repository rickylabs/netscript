use harness

## SKILL

- netscript-harness — commit-by-slice + push + draft PR from the first commit; no self-certification.
- netscript-doctrine — `packages/sdk` and `packages/cli` are framework code: contract first, no `any`,
  no unsafe casts, no new lint-ignores.
- netscript-pr — draft PR on start, `Closes #1833` in `## Scope`, namespaced labels, milestone.
- netscript-tools — scoped check/lint/fmt wrappers; lock hygiene.

## Slice — #1833: residual Aspire key-normalization mismatches

#1831 (merged, `bd9d463b4`) fixed the browser **full** key. Three residuals of the *same* root cause
remain. **All three were verified empirically before this dispatch** — reproduce them, then fix.

### 1. Shorthand key still diverges for non-hyphen invalid characters

`packages/sdk/src/discovery/browser-env.ts` — `createBrowserServiceShortEnvKey()` replaces **only
hyphens** before uppercasing; `packages/aspire/src/application/build-vite-env-var-name.ts:58`
normalizes **all** invalid identifier characters first. Executed proof:

```
orders.api  | SDK short: VITE_ORDERS.API_URL  | Aspire short: VITE_ORDERS_API_URL   <-- diverges
sagas-api   | SDK short: VITE_SAGAS_API_URL   | Aspire short: VITE_SAGAS_API_URL
a--b        | SDK short: VITE_A__B_URL        | Aspire short: VITE_A__B_URL
```

`VITE_ORDERS.API_URL` is not a valid identifier segment, so Vite never statically replaces it — for
such a resource **both** discovery keys now miss, and the shorthand no longer acts as the safety net
that masked the original full-key bug.

**Fix:** apply the same normalization the full key now uses, reusing
`normalizeViteIdentifierSegment()` (already present in `browser-env.ts` from #1831) rather than
introducing a third copy of the rule.

### 2. CLI deploy prebuild drops full-key injection instead of normalizing

`packages/cli/src/public/features/deploy/build/build-windows-prebuild.ts:39-44` reads
`// Full format — skip names with hyphens (invalid JS identifiers)` and **skips** full-key injection
for hyphenated names, degrading to shorthand-only coverage. Now that the SDK normalizes, this site
should **inject the normalized full key** instead of dropping it. Apply the same shared rule; do not
hand-roll a fourth copy.

### 3. Cross-package pin corpus is too narrow

`packages/sdk/tests/discovery/env-ordering_test.ts:77-86` pins the SDK browser full key against
Aspire's `buildViteEnvVarName().full` over only two inputs (`sagas-api`, `workers.api/v2`). The pin is
genuine — it imports the Aspire implementation — but a one-sided change preserving output for those
two names (e.g. collapsing consecutive underscores) would diverge on `a--b` while the test stays
green.

**Fix:** widen to a character sweep — ASCII punctuation in **leading, embedded and trailing**
positions, consecutive underscores, whitespace, empty string, and a leading digit. Pin **both** the
full key and the shorthand against Aspire for every case.

## Constraints

- **Do NOT change `packages/sdk/src/discovery/service-url.ts`.** The server path correctly preserves
  hyphens and matches real Aspire server output (`services__sagas-api__http__0`); changing it would
  break real discovery. Add a regression guard proving it is unchanged.
- Preserve the browser **full**-key behaviour shipped in #1831 exactly — its blobs were merged under
  an accepted IMPL-EVAL.
- Keep the normalization rule single-source: reuse the existing helper, and if you must relocate it
  for sharing, leave the contract-source comment pointing at `build-vite-env-var-name.ts`.

## Tests (contract first)

Write failing tests first and record the RED output in the run dir, then fix. Cover: shorthand
agreement for `orders.api` and the widened sweep; deploy-prebuild emitting the normalized full key for
hyphenated names; fallback ordering (browser full → shorthand → server) still intact; server key
unchanged.

## Gates

Scoped `deno check --unstable-kv`, `deno lint`, `deno fmt --check` on changed files; focused tests for
`packages/sdk`, `packages/aspire`, `packages/cli`; **repo-wide `deno task check`** expecting
`failedBatches: 0`; `deno task quality:scan`; `deno task arch:check`.

**No runtime** — do not start Aspire or Docker. **No self-dispatched evaluator** — a supervisor
-dispatched IMPL-EVAL follows. Do not change lifecycle labels.

## PR

Draft PR against `main` from the first commit, `Closes #1833` in `## Scope`, labels
`type:fix, area:sdk, area:cli, area:aspire, priority:p2, status:impl, orchestrator:aspire`, milestone
`0.0.7`. Report branch, head SHA, PR number, RED evidence, and every gate's exit code.
