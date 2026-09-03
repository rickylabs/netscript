## Symptom

`scaffold.runtime` and `scaffold.runtime.sqlite` both fail on `main` at gate
`runtime.readiness-fixture`, immediately after `runtime.flow-b-fixture` passes:

```
> runtime.readiness-fixture: Wire dead-port readiness fixture
  FAILED 79ms
error: Uncaught (in promise) Error: generated register-infrastructure helper has no garnet health-check marker
    at injectListenerFaultHealthChecks (packages/cli/e2e/src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts:63:11)
```

Observed in both hosted tiers of run
[`33484656019`](https://github.com/rickylabs/netscript/actions/runs/33484656019).

This is a **baseline blocker on `main`**, not a defect of the PR the run was dispatched from.
PR #1865 does not touch `prepare-readiness-fixture.ts` — `git diff origin/main <head> -- <that file>`
is empty.

## Root cause — measured against a real scaffold, not inferred

The D-101 listener-fault fixture assumes the scaffolded project's cache is **Garnet named
`garnet`**. It is **Redis named `redis`**.

`netscript init` was run at exact `main` (`d2b33a09b`) with the E2E's own flags
(`init <name> --path <root> --db sqlite --service --service-name users --ci --yes --no-git --force`
— `packages/cli/e2e/.../scaffold-gates.ts:39-54`, which never passes `--cache-backend`).
The generated `aspire/.helpers/register-infrastructure.mts` contains:

```ts
const cache_0 = await builder.addContainer('redis', 'docker.io/library/redis:7')
builder.addHealthCheck('redis_resp', async () => {
await cache_0.withHealthCheck('redis_resp');
caches.set('redis', cache_0);
```

and the project's `appsettings.json` declares `Cache: { redis: { Engine: "Redis", … } }`,
`PrimaryCache: "redis"`.

The chain:

1. No `--cache-backend` is passed, so the project takes `SCAFFOLD_DEFAULTS.CACHE_BACKEND`
   (`scaffold-defaults.ts:12`) = **`redis`**.
2. `buildCacheBlock('redis')` → `{ key: 'redis', block: { Engine: 'Redis', Mode: 'Container', … } }`.
3. `generate-register-infrastructure.ts:538` derives the key from the **cache name**:
   `const healthCheckKey = \`${name}_resp\`` → `redis_resp`. (Since #1837 the *binding* is
   positional — `cache_${cacheIndex}` at `:237` — while the key stayed name-derived.)
4. `prepare-readiness-fixture.ts:23` hardcodes `GARNET_REAL_HEALTH_KEY = 'garnet_resp'`, and
   `listenerInfrastructureReference()` (`:151-170`) builds its reference from a hardcoded
   `caches: { garnet: { Engine: 'Garnet' } }`. The statement it searches for is therefore keyed on
   `'garnet_resp'`, which is never emitted → throw.

`usesRespReadiness` covers `Redis` and `Garnet` identically, so the real project **does** get a RESP
readiness check — the fixture simply looks for the wrong one.

## Distinct defect class from #1863

#1863 was a **marker-format** coupling (the generator renamed an emitted comment). This is a
**configuration-assumption** coupling: the consumer hardcodes a backend the scaffold does not use.
The #1837 hardening (`HEALTH_ATTACHMENT_PATTERN`, `uniqueHealthAttachment`) does not catch it,
because the matching is correct — the *literal it is asked to match* is wrong.

## Open anomaly — do not assume this was always broken

`runtime.readiness-fixture` **passed** (96 ms) and `runtime.wait.garnet` **passed** in run
[`33425281612`](https://github.com/rickylabs/netscript/actions/runs/33425281612) at head
`bd239f916` on 2026-08-31, whose merged main base is `8f1fcb2bc`.

Measured, and unexplained: scaffolding at `8f1fcb2bc` with the same flags **also** yields
`redis`/`redis_resp`, and executing that base's own `injectListenerFaultHealthChecks` against that
base's own generated helper throws the identical
`generated register-infrastructure helper has no garnet health-check marker`. So the CI project at
`bd239f916` must have differed from a bare `netscript init` at that commit, in a way not yet
identified.

Stronger still: `runtime.wait.garnet` also passed there, and that gate **cannot** pass without a real
garnet resource — `verify-listener-readiness.ts` runs `aspire wait garnet --status healthy` and then
`readListenerHealthReport`, which throws `garnet omitted healthReports.garnet_resp` when the resource
or key is absent. So the CI-scaffolded project at `bd239f916` genuinely **was** garnet-backed, while a
local `netscript init` at that same commit is redis-backed. The scaffold the E2E produces therefore
differs from a bare `netscript init` in a way that is **not yet identified**.

Two candidate explanations were tested and **refuted**, so do not re-spend time on them:
- *A published-CLI scaffold.* `packageSource` defaults to `PACKAGE_SOURCE.LOCAL`
  (`create-default-runner.ts:61`, `suite-builder-options.ts:23`) and the suites never override it, so
  CI scaffolds with the repo CLI, exactly like the local probe.
- *A plugin or later gate contributing a Garnet cache.* No first-party plugin declares a cache, and
  no code under `packages/cli/src` mutates the `Cache` config after `init`.

Resolving this is part of the work, not a precondition for it: the fix direction below is correct for
the observed failure either way.

**Do not close this by asserting an attribution.** The implementation must capture the CI-scaffolded
project's actual `register-infrastructure.mts` while reproducing, and record what it finds. If that
shows a garnet-backed project in CI, the diagnosis above still holds for the failing runs but the
*cause of the change* is elsewhere and must be named.

## Blast radius — four hardcoded sites, all in `packages/cli/e2e`

| Site | Hardcode | Consequence |
| --- | --- | --- |
| `prepare-readiness-fixture.ts:23` | `GARNET_REAL_HEALTH_KEY = 'garnet_resp'` | throws — the observed failure |
| `prepare-readiness-fixture.ts:151-170` | reference config `caches: { garnet: … }` | reference disagrees with the project |
| `listener-readiness-gates.ts:108-111` | `resource: ASPIRE_RESOURCE.GARNET`, `realHealthCheckKey: 'garnet_resp'` | targets a non-existent Aspire resource (`ASPIRE_RESOURCE.GARNET = 'garnet'`; the real resource is `redis`) |
| `listener-unreachable-fixture.ts:207-211` | fail-closed allowlist pins `'garnet_resp'` | refuses the real (correct) target |

Fixing only the throw site moves the failure one gate later rather than closing it. Note the sibling
`listenerReadinessExpectation` (`listener-readiness-gates.ts:33-58`) **already** derives
`healthCheckKey: \`${resource}_resp\`` — the correct pattern exists in the same file.

## Accepted direction

Discover the RESP health attachment **from the generated project's own
`aspire/.helpers/register-infrastructure.mts`** — the artifact actually being patched — instead of
from a hardcoded backend. #1837 already added the machinery: `HEALTH_ATTACHMENT_PATTERN` captures
both the resource binding and the quoted key, and `uniqueHealthAttachment` enforces uniqueness.

Explicitly **not** accepted: making the E2E scaffold with `--cache-backend garnet` to satisfy the
hardcodes. That would leave the default (`redis`) runtime path unexercised by the merge-readiness
gate — hiding the defect rather than fixing it — and would still leave four literals that break on
the next rename.

The discovered pair must stay **fail-closed**: exactly one RESP attachment, the injected key must
remain `TEST_ONLY_GARNET_HEALTH_KEY`, and the real key must be the discovered one rather than any
key found in the file.

## Definition of Done

- [ ] The RESP resource binding, health-check key, and Aspire resource name are discovered from the generated `register-infrastructure.mts`, not from a hardcoded backend or a hardcoded reference config.
- [ ] `listenerFaultExpectations` and `assertOwnedListenerFaultExpectation` consume the discovered pair and still fail closed on any target that is not the injected test-only check beside the discovered real one.
- [ ] A unit test proves discovery against real generator output for **both** `redis` and `garnet` cache backends, and proves the fail-closed refusal is preserved.
- [ ] A RED commit reproduces the failure before the fix, using generator output for the default backend.
- [ ] The CI-scaffolded project's actual `register-infrastructure.mts` cache block is captured and the "open anomaly" section above is resolved or explicitly recorded as still unexplained.
- [ ] `runtime.readiness-fixture` executes and passes in both hosted tiers.
- [ ] No `packages/cli/src/**` change is required (this is an E2E-consumer defect, not a generator defect).
