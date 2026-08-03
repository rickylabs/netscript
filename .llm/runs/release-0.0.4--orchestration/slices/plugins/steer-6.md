# BLOCKING #3 — `configuredResourceNames` reads `databases` with the wrong shape and fails a healthy project

`scaffold-static` and `runtime.flow-b-fixture` are both **green** now. One red left, in the runtime
lane, and it is a false positive from Slice 2.

## The failure

`behavior.plugins-health`, `scaffold-runtime` on `a304925c6`:

```
Error: Plugin doctor failed: apphost.
apphost  error  AppHost resource config  Configured resource "config" is missing from the running AppHost.
```

**Every other check in that run is healthy** — all six plugins, every registry, every job and saga
assertion. The project is fine. Doctor invented the failure.

## The cause — precise, do not re-derive

```ts
function configuredResourceNames(config: NetScriptConfig): readonly string[] {
  return [...new Set([
    ...Object.keys(config.services ?? {}),
    ...Object.keys(config.apps ?? {}),
    ...Object.keys(config.databases ?? {}),   // ← wrong shape
  ])].sort();
}
```

`services` and `apps` genuinely are name records:

```ts
services: z.record(z.string(), ServiceConfigSchema).optional(),
apps:     z.record(z.string(), AppConfigSchema).optional(),
```

`databases` is **not**:

```ts
databases: z.object({
  active: z.enum([...]).optional(),
  config: z.array(DatabaseConfigSchema),
}),
```

So `Object.keys(config.databases)` returns `['active', 'config']` — the schema's own field names — and
the doctor then asserts that an AppHost resource literally called `config` exists. It never could.

## Required

1. Read database names from `config.databases.config` (the array), using each entry's actual name
   field — not from the section's object keys. Read `DatabaseConfigSchema` and use the real field;
   do not guess it.
2. Add a test with a realistic config whose `databases` section has `{ active, config: [...] }` and
   assert the doctor does **not** invent an `active` or `config` resource. That test is the whole
   point — this bug is a shape assumption, and only a realistic-shape fixture catches it.

## Read this part — it is the reason we are on the third iteration

Three times now this check has failed by treating *absence of correct information* as *evidence of a
broken project*: it errored when Aspire was not installed, and now it errors on a config section it
mis-parsed. #1022 was filed because doctor reported **healthy without evidence**. A doctor that
reports **broken without evidence** is the same defect wearing the opposite sign, and it is worse in
one way: it will train people to ignore it.

So apply this rule to the AppHost check generally: **only assert that a resource is missing when you
are confident the name you are checking is genuinely an AppHost resource name.** If a config entry
cannot be mapped to a resource identity with confidence, it must not produce an `error` — leave it
unchecked or report it as a `warning` naming what could not be mapped.

Concretely, prefer the identity you already trust: `appsettings.json` resource keys — the same
installed-key inventory `plugin-reference-reconciler.ts` builds — are known AppHost resource names.
Config sections are a weaker source. If mapping a section is not reliable, drop it from the check
rather than shipping another false positive.

## Scope

Do **not** expand the AppHost checks. Fix the shape bug, apply the confidence rule, add the test.
If you conclude that a correct config→AppHost name mapping is genuinely bigger than this slice, say
so plainly and I will cut the config-derived half of that acceptance box to 0.0.5 — that is a real
option and a better outcome than a fourth false positive. **Do not silently narrow it yourself.**

## Verification

This gate only runs in `scaffold.runtime`, not `scaffold.plugins`. Either run
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` locally, or state plainly that you
did not and let CI prove it. The machine is shared — `/home/codex/repos/ns004-sagas` has a live slice
and its own containers; leave them alone and always pass `--cleanup`.

Commit, push, report the hash.
