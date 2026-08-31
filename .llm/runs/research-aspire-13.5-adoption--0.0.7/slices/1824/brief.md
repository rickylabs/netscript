use harness

## SKILL

- netscript-harness — commit-by-slice + push + draft PR from the first commit, run-dir artifacts; no
  self-certification.
- netscript-doctrine — `packages/sdk` and `packages/aspire` are framework code: contract first, no
  `any`, no unsafe casts, no new lint-ignores.
- netscript-pr — draft PR on start, closing keyword in the body, namespaced labels, milestone.
- netscript-tools — scoped check/lint/fmt wrappers; lock hygiene.

## Slice — #1824: browser full-key discovery never matches Aspire for hyphenated resources

**Confirmed in source at `origin/main` before dispatch** (do not re-derive, but do verify):

- `packages/sdk/src/discovery/browser-env.ts` — `createBrowserServiceEnvKey()` interpolates the
  resource name **as-is**: `` `VITE_services__${serviceName}__${protocol}__${index}` ``. For
  `sagas-api` that yields `VITE_services__sagas-api__http__0`.
- `packages/aspire/src/application/build-vite-env-var-name.ts` — the Aspire side **normalizes**:
  `value.replace(/[^a-zA-Z0-9_]/g, '_')` (line ~64), and its own docstring example states
  `workers-api` → `VITE_services__workers_api__http__0`.
- So for **any hyphenated resource the full-key lookup can never match**. Discovery survives only
  because the shorthand alias (`createBrowserServiceShortEnvKey`, which already uppercases and
  replaces hyphens) happens to agree.
- **Server side is NOT affected**: `packages/sdk/src/discovery/service-url.ts:60`
  (`createServerServiceEnvKey`) preserves the hyphen and matches real Aspire server output
  (`services__sagas-api__http__0`). **Do not "fix" the server path** — changing it would break real
  discovery.

## Required change

Make the SDK's **browser full-key** builder apply the **same normalization Aspire applies**, so both
sides agree for hyphenated (and any invalid-identifier-character) resource names.

- Reuse the existing normalization rule rather than re-implementing a second, divergent one. If
  `packages/aspire` already exports a suitable helper, prefer importing/sharing it; if that would
  create an unacceptable dependency direction (`sdk` → `aspire`), define the rule once in the SDK with
  a comment naming `build-vite-env-var-name.ts` as the contract source, and add a test that pins the
  two implementations to the same expected output so they cannot silently diverge again.
- Keep `createBrowserServiceShortEnvKey` behaviour unchanged (it is already correct).
- Keep `createServerServiceEnvKey` behaviour unchanged.

## Tests (contract first)

Write the failing test first and record the RED output in the run dir, then fix:

- Hyphenated resource (`sagas-api`, `workers-api`): browser full key must equal
  `VITE_services__sagas_api__http__0` — i.e. exactly what Aspire injects.
- Non-hyphenated resource (`orders`): unchanged, `VITE_services__orders__http__0`.
- Other invalid identifier characters normalize consistently with the Aspire rule.
- Shorthand and server-side keys are unchanged by this slice (regression guards).
- A cross-package agreement test pinning SDK browser full key == Aspire `full` for the same input.

## Gates

Scoped `deno check --unstable-kv`, `deno lint`, `deno fmt --check` on changed files; focused tests for
`packages/sdk` and `packages/aspire`; **repo-wide `deno task check`** expecting `failedBatches: 0`;
`deno task quality:scan` and `deno task arch:check`. **No runtime** — do not start Aspire or Docker
(runtime is parked host-wide by an upstream constraint).

## PR

Open a **draft PR** against `main` from the first commit, body per the template with **`Closes #1824`**
in `## Scope`, labels `type:fix, area:sdk, area:aspire, priority:p2, status:impl,
orchestrator:aspire`, milestone `0.0.7`. Do not mark ready-for-review; the supervisor owns lifecycle.
Report the branch, head SHA, PR number, and every gate's exit code.
