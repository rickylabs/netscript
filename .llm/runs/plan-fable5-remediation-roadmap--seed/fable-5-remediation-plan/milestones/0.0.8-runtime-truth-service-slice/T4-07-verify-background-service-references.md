# verify(aspire): re-test the wave-6 claim that BackgroundProcessors.*.ServiceReferences is parsed but never injected — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T4-07 · **Proposed milestone:** 0.0.8 (new — "Runtime truth + service slice") ·
**Labels:** `type:test` `area:aspire` `area:cli` `priority:p1` `status:triage` ·
**Depends on:** none (verify-first; converts to a fix or to a regression test depending on the
repro)

## Summary

A wave-6 run reported that `BackgroundProcessors.<name>.ServiceReferences` is parsed from
appsettings but never injected into the background resource, so a background child cannot discover
the services it declares a dependency on. The board sweep found **no owner issue** for this claim.
Re-reading the generator at baseline `fac9e339042c`, the injection **does exist** — the emitted
AppHost writes `services__<ref>__http__0` for every declared reference, and the registration order
places background processors after services and plugins. This issue therefore opens as a
verification, not a fix: reproduce or refute the claim on the current published canary before any
implementation is scheduled.

## Evidence

- Corpus: `SYNTHESIS.md` §3.1 — the `ServiceReferences`-parsed-but-never-injected row is adjudicated
  a framework-generation defect *class* but flagged "no board owner found by the board sweep → new
  issue draft, **flagged verify-on-current-canary first**"; `research/preplan-package.md`
  §Verify-before-filing (the run's standing rule that unverified wave observations are repro'd, not
  filed as defects); `research/repo-audit/runtime-plugins.md` §1.5 (the discovery-key asymmetry that
  is the most plausible surviving mechanism).
- **Counter-evidence at baseline (this is the load-bearing finding):**
  - `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts:178-197`
    — for every entry in `entry.ServiceReferences`, the generator emits
    `const <ref>Endpoint = await _services.get('<ref>')?.getEndpoint('http');` followed by
    `await <id>.withEnvironment('services__<ref>__http__0', <ref>Endpoint);`. `:199-217` does the
    same for `PluginReferences` against `_plugins`.
  - `packages/cli/src/kernel/assets/generated/aspire/helpers/generate-index-1.ts.template:56,59,62,65`
    — registration order is `registerServices` → `registerPlugins` → `wireServiceReferences` →
    `registerBackgroundProcessors`, so the `services`/`plugins` maps are populated before background
    registration reads them.
  - `packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts:77-79` — the background
    entry only carries `ServiceReferences` when `options.serviceReferences` is non-empty.
  - Parsing exists as claimed:
    `packages/cli/src/kernel/adapters/config/deploy-config-background.ts:117`
    (`serviceReferences: raw?.ServiceReferences ?? []`),
    `packages/cli/src/kernel/adapters/config/deploy-config-types.ts:30,87`.
- **Most plausible surviving mechanism if the symptom reproduces:** the emitted key uses the raw
  resource name (`services__sagas-api__http__0`) while the browser-side builder normalizes every
  non-alphanumeric character to `_` (`packages/aspire/src/application/build-vite-env-var-name.ts:50-66`,
  `workers-api` → `workers_api`). Consumers read via
  `packages/sdk/src/discovery/service-url.ts:55-61`, which also uses the raw name. If Aspire itself
  exports the normalized form for a hyphenated resource, the injected key and the read key differ
  and the consumer silently falls through to a fixed-port default.
- Related consumer of that fallthrough: `plugins/sagas/src/runtime/saga-publisher.ts:295-307`
  (owned by T4-01).

## Current surface

At baseline the generator, the appsettings writer, the parser and the registration order all appear
correct. The wave-6 observation was made against a published canary on a generated project, not
against this source, so either (a) the observation predates a fix, (b) the symptom was a
name-normalization mismatch misattributed to missing injection, or (c) a path exists in which
`serviceReferences` is never written onto the background entry (for example a plugin install that
does not pass them). Nothing on the board distinguishes these.

## Target contract

The repository must be able to answer "does a background child receive its declared service
endpoints?" mechanically rather than by re-reading generator source. Concretely: a scaffolded
project with a background processor declaring `ServiceReferences` starts with the corresponding
`services__*` env vars present in the child's environment, the consumer-side resolver finds them
under the exact key it reads, and a regression test pins both halves — the emitted key and the read
key — so the two can never drift apart silently again.

## Acceptance

- [ ] Reproduce or refute the claim on the current published canary, attaching the project's
      `appsettings.json` and the generated `register-background.mts`.
- [ ] Record the exact env keys present in a running background child's environment for a declared
      service reference.
- [ ] Record what Aspire exports for a hyphenated resource name (raw vs underscore-normalized).
- [ ] If refuted, land a regression test pinning the emitted key and the consumer-read key, and
      close the row as not-reproducible with the evidence attached.
- [ ] If reproduced, name the failing mechanism at file:line before any fix is proposed.
- [ ] A negative test proves a background child whose declared service reference is unresolvable
      fails or degrades visibly rather than starting with a missing env var.
- [ ] The result is recorded on the roadmap's verify-first ledger either way.

## Boundaries

- **T4-01** owns the sagas publisher fallback and the server/browser discovery-key normalization
  decision; if this verification confirms the normalization mismatch, the fix belongs there, and
  this issue closes with the evidence rather than duplicating it.
- **#1325** owns the triggers background runtime crash-loop; **T4-02** owns child health. A missing
  service reference is a distinct symptom from a dead child.
- **#979 / #980** own host-port pinning. Not this issue.
- **#1343** owns the installed-consumer smoke; use it as the repro vehicle, do not re-file it.
- **#511 / #529** (process-manager deploy-target wiring) touch adjacent config keys for bare-metal
  targets; out of scope.
- This issue must not be converted into an implementation issue until its first acceptance box is
  satisfied. A wave-era observation is not a defect until it is reproduced on shipped artifacts.

## Docs/consumer proof

Whichever way the verification lands, `docs/site/orchestration-runtime/**` gains one accurate
statement of how a background processor discovers a service it references, with the env key spelled
exactly as emitted. Consumer proof: an unfamiliar agent can confirm the wiring from the generated
`register-background.mts` plus one dashboard env inspection, without reading `packages/cli` source.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. The counter-evidence above
was produced by reading the generator at worktree baseline `fac9e339042c` during this drafting pass;
it contradicts the wave-6 R2 claim as stated and is the reason this draft is verify-first rather
than a defect.
