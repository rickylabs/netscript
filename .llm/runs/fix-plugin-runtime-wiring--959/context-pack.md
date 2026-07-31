# Slice: plugin-runtime-wiring (beta.12)

Issues in this slice:

- **#959** — `fix(plugin)`: install/remove leaves contradictory state; `plugin sync` validates
  against the wrong resolution graph.
- **#962** — `fix(plugin)`: generated plugin runtimes do not opt into the KV backend the install
  selected.
- **#961** — `fix(scaffold)`: cache provider side-effect import missing, and the error does not
  name the fix.

## Shared-cause hypothesis

One defect class: **the generator knows the answer at generation time and emits glue that never
reaches its runtime.**

The plugin/scaffold generators hold the full install decision — the instance name, the package id,
the selected KV backend, the selected cache backend — and then emit artefacts that drop part of
that decision on the floor:

- the identity is split inconsistently across package refs / config manifest / runtime registry
  (#959),
- the selected KV backend never becomes the `import "@netscript/kv/redis"` side-effect the runtime
  requires (#962),
- the selected cache backend never becomes the `import "@netscript/sdk/cache"` side-effect the
  page loader requires (#961).

And the validator that should catch the gap (`plugin sync`) is checking a different graph
(root import map) than the one Deno resolves through (workspace members), so it produces false
negatives on real code and false positives on generated code.

Grounding already confirmed in-tree:

- `packages/kv/application/shared.ts:223` emits the good, exemplary error:
  ``Add `import '@netscript/kv/redis';` to your service entrypoint to opt-in.``
- `packages/sdk/src/cache/cache-provider.ts` holds the `setCacheProvider` error that #961 says
  fails to name its import; `packages/sdk/deno.json:10` already exports `./cache`.
- `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts` is where import-map validation
  and workspace mutation meet.

The failure mode this grouping exists to prevent is three separate patches to three symptoms.

## Corrective note

Per the harness rule: the issues are probably wrong in some way. Verify each framing against the
code before fixing, and correct the issue itself with `gh issue comment` where it is wrong.
