## Verified acceptance — evidence for every previously-unticked box

Rebased onto `main` @ `4634afe56` (post-#1077). All 11 previously-unticked boxes below were verified
by the supervisor before being ticked. Every gate result here was run by me, not self-reported.

---

### #1067 — order-independence (all four were unticked)

**1. Any install order produces the same wiring; `workers → sagas → streams` and
`streams → sagas → workers` yield identical `appsettings.json`**

`reconciles dependency-derived plugin references independently of install order` runs the **real**
`installPlugin` against the real plugin sources, in both permutations, into two temp projects, and
asserts the parsed entries are equal:

```ts
const forward = await installOfficialPlugins(forwardRoot, ['workers', 'sagas', 'streams']);
const reverse = await installOfficialPlugins(reverseRoot, ['streams', 'sagas', 'workers']);
assertEquals(forward, reverse);
assertEquals(forward.Plugins['workers-api'].PluginReferences, ['streams']);
assertEquals(forward.Plugins['sagas-api'].PluginReferences, ['streams', 'workers-api']);
assertEquals(forward.BackgroundProcessors.sagas.PluginReferences, ['sagas-api','streams','workers-api']);
```

**Proof it fails without the fix** — I short-circuited `reconcilePluginReferences` and re-ran; the
diff is precisely the missing streams edge, and I restored the file afterwards:

```
public install plugin flow ... reconciles dependency-derived plugin references independently of install order => FAILED
error: AssertionError: Values are not equal.
    [Diff] Actual / Expected
    [
+     "streams",
      "workers-api",
    ]
```

Order-independence is by construction, not retro-wiring:
`PluginReferences(entry) = ( declared pluginReferences ∪ { serviceConfigKey(p) : p ∈ dependencies(entry) } ) ∩ installed resource keys`,
recomputed over **every** installed entry at both the install boundary and inside
`regenerateAspireHelpers`, with references and records sorted so output is byte-stable.

**2. A producer with no reachable streams URL fails rather than blocking or dropping writes**

URL resolution moved into the `DurableStreamProducer` **constructor**. The pre-existing test
`DurableStreamProducer drops writes when streams URL is unavailable` — which *enshrined* the defect —
is now:

```
DurableStreamProducer fails synchronously when streams URL is unavailable ... ok
```

asserting the throw and its message:

```
[DurableStreamProducer] Missing plugin reference "streams" for stream "<path>".
Install the streams plugin, then run `netscript service generate` to regenerate Aspire wiring.
```

It never queues, never blocks, never drops.

**3. An E2E case covers install-order permutations for a stream-dependent plugin**

⚠️ **Read this one before accepting it.** The permutation coverage is the integration test named
above: it drives the real install pipeline (real scaffolders, real plugin sources, real filesystem,
real `appsettings.json` writes) in both orders. It lives in
`packages/cli/src/public/features/plugins/install/install-plugin_test.ts`, **not** as a gate inside
the `e2e:cli` suite. I judged that it meets the criterion in substance and ticked it on that basis.
If you read "E2E case" strictly as "a gate in the `e2e:cli` suite", this box should be unticked —
your call, flagging it rather than quietly interpreting it my way.

**4. Docs state the dependency explicitly**

No manual step remains — wiring is order-independent. `docs/site/durable-workflows/streams.md` and
`docs/site/reference/streams/index.md` were both corrected in `3e9abf10c`; they previously documented
a `assertResolvable` escape hatch that this PR removes (see the breaking-change note in the body).

---

### #1014 — clean public-install test asserts fragments in the root schema

```
installs a published Prisma fragment from JSR metadata into the root schema tree ... ok
```

Performs a clean public (dependency-mode) install and asserts the fetched plugin fragment is present
under the root schema tree.

---

### #1015 — two boxes

**1. Every saga entrypoint receives an absolute, project-owned registry path/URL**

`plugins/sagas/src/aspire/sagas-contribution.ts` emits it through the Aspire environment, asserted
exactly:

```
SAGAS_REGISTRY_MODULE: 'file:///workspace/netscript-app/.netscript/generated/plugin-sagas/sagas.registry.ts'
```

Absolute, and rooted in the consumer project — not `jsr.io`. `plugins/sagas/tests/aspire` +
`tests/runtime`: **5 passed, 0 failed**.

**3. Dependency-mode test starts a saga runtime from the published package**

```
published dependency starts a saga runtime with a project-owned non-empty registry ... ok
```

Imports `jsr:@netscript/plugin-sagas@0.0.3/runtime`, starts it against the consumer project's
generated registry, asserts `definitionCount === 1`. Full file: **9 passed, 0 failed**. No saga
engine/store/runtime source was modified (that is PR-A's territory).

---

### #1017 — the negative flag is threaded into every official plugin scaffolder

Four named cases running the **real** scaffolders:

```
threads includeSamples false into the workers scaffolder ... ok
threads includeSamples false into the sagas scaffolder ... ok
threads includeSamples false into the triggers scaffolder ... ok
threads includeSamples false into the streams scaffolder ... ok
```

Each asserts the exact sample path from the issue's 8/8 reproduction is absent and the required glue
is present. **Proof they can fail** — I flipped the helper to `includeSamples: true`:

```
FAILED | 0 passed (22 steps) | 1 failed (4 steps)
  threads includeSamples false into the workers/sagas/triggers/streams scaffolder => FAILED
```

All four go red. File restored; tree clean.

The first attempt at this box asserted that the *E2E suite definition* contained `--no-samples` —
which would still pass if threading broke. I rejected it and required the above.

---

### #1022 — three boxes

**4. Validates config-declared resources against the running AppHost, missing reported by name**

New injected `AspireAppHostDoctorInspector`. Test:
`plugin doctor reports configured resources missing from the running AppHost by name`.

This one shipped **two** false positives before it was right, both caught by CI and both fixed:
- it errored when the `aspire` CLI was absent (`Deno.errors.NotFound`, deno-only lane);
- it errored on a healthy project because `configuredResourceNames` read `config.databases` as a
  name record when the schema is `{ active, config: DatabaseConfig[] }` — inventing a resource
  literally called `config`.

**5. Config zod parse failures reported as named field errors**

```
plugin doctor reports visible validation issues by field ... ok
```

**6. Distinguishes "no AppHost running" from "AppHost running but unhealthy"**

Three arms, not two — the missing third being what caused the first false positive:

| Condition | Status |
| --- | --- |
| Aspire CLI absent / cannot observe | `warning` (`apphost:inspection-unavailable`) |
| AppHost inspected, not running | `warning` |
| AppHost running, resource missing or unhealthy | `error` |

Tests: `plugin doctor distinguishes an absent AppHost from unhealthy resources`,
`plugin doctor reports a running but unhealthy AppHost resource`,
`plugin doctor warns and exits zero when Aspire inspection is unavailable`.

**On your specific re-check — "a check that can actually fail":**
`plugin doctor exits non-zero when generated registries are absent` loads the **real** workers
adapter (`rootDir` → `plugins/workers/`, `doctor: './src/adapter/plugin.ts'`) and asserts the output
contains `generated job registry exists` — the name of the **plugin-contributed** `DoctorCheckSpec`,
not a CLI-side generic — with `exitCode 1`. I checked this specifically, because a suite where every
check returns `ok: true` would not have fixed #1022.

Corroborated on a real running AppHost in the `scaffold-runtime` lane, where the plugin-contributed
checks report real runtime truth:

```
workers  healthy  generated job registry exists            .netscript/generated/plugin-workers/job-registry.ts
workers  healthy  every declared job is registered         2 declared job(s) present in handler and definition maps
sagas    healthy  every declared saga is registered        1 declared saga(s) present in the runtime map
```

---

## Gate sweep on the rebased branch

| Gate | Result |
| --- | --- |
| `scaffold-runtime (aspire + docker + postgres)` | **SUCCESS** |
| `scaffold-static (deno-only)` | **SUCCESS** |
| `check-test`, `code-quality`, `quality`, `surface-diff`, `deps-report` | SUCCESS |
| `scaffold.plugins` E2E locally **with `aspire` removed from PATH** | `passed=16 failed=0` |
| plugins + aspire + plugin-adapter suites, post-rebase | 83 passed, 0 failed |
| `deno task quality:scan` | `ok=true findings=0` |
| `deno task arch:check` | no `FAIL` in any package |
| new `deno-lint-ignore` / `as unknown as` / `@ts-ignore` | **0** |
