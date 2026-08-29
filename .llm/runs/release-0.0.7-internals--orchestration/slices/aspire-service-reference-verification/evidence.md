# Evidence — #1371 runtime verification on published canary `0.0.7-canary.1`

Runtime lease held once, globally serialized. AppHost `apphost.mts` PID **429229**, CLI PID
**429144**, started with `aspire:start:isolated` (`DcpPublisher__RandomizePorts=true`), dashboard
`https://localhost:42413`. Owned root `/home/codex/repos/ns-verify-1371`.

Experiment shape, added to an otherwise stock scaffold:

- `workers.ServiceReferences = ["users"]` — resolvable service reference (positive path)
- `triggers.ServiceReferences = ["ghost-service"]` — no such service (negative path)
- `sagas`/`triggers`/`workers` retain their stock **hyphenated** `PluginReferences`
  (`sagas-api`, `triggers-api`, `workers-api`) — the raw-vs-normalized probe

## Box 2 — exact env keys in the running background children

Read first-hand from `/proc/<pid>/environ`, corroborated by the Aspire MCP resource receipt.

| Child | pid | `services__*` keys actually present |
| --- | --- | --- |
| `workers` | 431303 | `services__redis__tcp__0`, `services__streams__http__0`, **`services__users__http__0=http://localhost:43277`**, `services__workers-api__http__0` |
| `sagas` | 431302 | `services__redis__tcp__0`, `services__sagas-api__http__0`, `services__streams__http__0`, `services__workers-api__http__0` |
| `triggers` | 431307 | `services__redis__tcp__0`, `services__streams__http__0`, `services__triggers-api__http__0`, `services__workers-api__http__0` |

The declared service reference **is present in the running child**, with a real endpoint value.
The Aspire receipt independently shows `workers-eptnxjtf` carrying both the env var *and* a
first-class `{"type":"Reference","resource_name":"users-mvtsykxw"}` relationship — two independent
signals for the same injection.

## Box 3 — raw vs underscore for a hyphenated resource

Aspire exports the **raw** name, hyphens preserved:
`services__workers-api__http__0`, `services__sagas-api__http__0`, `services__triggers-api__http__0`.
A targeted grep for any underscore-normalized variant (`workers_api`, `sagas_api`) returned
**nothing** in any child environment.

Therefore, on the server/background path the emitted key, the key Aspire exports, and the key
`packages/sdk/src/discovery/service-url.ts:55-61` reads are **the same string**. The
normalization-mismatch hypothesis does not hold here.

**Stated limit:** this run did **not** exercise the browser path for a hyphenated resource. `web`
carries `services__users__http__0` and `VITE_services__users__http__0`, but `users` has no hyphen,
and no hyphenated resource is referenced by `web` in a stock scaffold. The browser-side
`build-vite-env-var-name.ts` normalization is therefore **neither confirmed nor refuted** by this
evidence, and remains #1365's.

## Box 6 — the negative path is silent (this one fails)

`triggers` declared `ghost-service`. Result:

- `grep -c ghost` over the triggers child environment: **0** — the key is absent entirely.
- `grep -ci ghost` over the AppHost log and the Aspire CLI log: **0 / 0** — never mentioned.
- Aspire receipt for `triggers-ymavusef`: `"state": "Running"`, `health_reports: {}`, and **no**
  relationship to any ghost resource.

The child started, stayed `Running`, and reported healthy siblings, while a dependency it declared
does not exist. Acceptance box 6 requires that this "fails or degrades visibly rather than starting
with a missing env var". It does the opposite.

## Mechanism, at current main `3b32d1628`

`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts`

```
185  for (const ref of serviceRefs) {
189    const ${refId}Endpoint = await _services.get('${ref}')?.getEndpoint('http');
191    if (${refId}Endpoint) {                 ← the guard
193      await ${id}.withEnvironment('services__${ref}__http__0', ${refId}Endpoint);
```

**`:191` is the precise failing line.** The generated guard has no `else`: an unresolved reference
emits nothing, warns nothing, and fails nothing. The parallel `PluginReferences` block below it
carries the identical pattern, so the same gap applies to plugin references.

The guard is correct for *optional* wiring and wrong for a *declared* dependency — the config author
wrote the reference down, so its absence is a configuration error, not an absent option.

## Teardown

`aspire stop` → `apphost.mts stopped successfully`. Containers **0** (session-lifetime `redis-*`
and `garnet-*` both gone). `leak-check --owned-root /home/codex/repos/ns-verify-1371` →
`aspire ok`, `docker ok`, `survivors: []`. The seven foreign `aspire mcp start` servers and the
foreign lane's `deno publish` were left untouched throughout.
