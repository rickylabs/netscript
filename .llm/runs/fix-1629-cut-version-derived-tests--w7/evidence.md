# Evidence — issue #1629

This file is append-only evidence for pre-fix discriminators, implementation gates, and the
disposable `0.0.7` release-cut rehearsal. Command output will be recorded untruncated.

## Pre-fix red — arbitrary coordinated bump

Disposable copy `/tmp/netscript-1629-prefix.6YQXIY/repo` at bootstrap commit `cb12adb29`:

```text
$ rtk proxy deno task release:cut -- 0.0.7 --dry-run
release:cut bumped 0.0.5 -> 0.0.7
Success Dry run complete
release:cut gate: deno ci --prod
release:cut dry-run complete; branch/commit/push/PR skipped.
exit: 0
```

The affected six-file test command exited 1:

```text
FAILED | 25 passed (50 steps) | 8 failed (5 steps) (5s)
error: Test failed
```

The version-derived discriminator failed on these exact pre-fix assertions:

```text
rejects a split root and subpath with every involved version
  actual: @netscript/fresh@0.0.7; expected substring: @netscript/fresh@0.0.5
fails closed on a non-exact closure member
  actual: non-exact version "^0.0.7"; expected substring: "^0.0.5"
generateAppDenoJson / rejects an incoherent resolver result before serializing the app manifest
  actual: @netscript/fresh@0.0.7; expected substring: @netscript/fresh@0.0.5
generateAppDenoJson / rejects a non-exact closure member at init
  actual: non-exact version "^0.0.7"; expected substring: "^0.0.5"
generated closure verifier rejects split JSR identities with version-bearing output
  actual: @netscript/fresh@0.0.7; expected substring: @netscript/fresh@0.0.5
generated closure verifier fails closed on a range pin
  actual: non-exact version "^0.0.7"; expected substring: "^0.0.5"
```

## Pre-fix red — unpublished resolution and strictness guard

The same bumped-copy command failed before the combined local-resolution/strictness path could
reach its missing-export guard:

```text
first-party control-plane modules are import-safe and preserve application barrels
  failed assertion: inspection.success
  cause: @netscript/plugin-ai@0.0.7 does not exist on JSR
installs the AI markdown registry closure into its generated namespace
  failed assertion: check.code === 0
  cause: @netscript/ai@0.0.7 does not exist on JSR
keeps the configured AI module resolvable across a forced reinstall
  failed assertion: loadRegisteredPlugins completes
  cause: @netscript/plugin-ai@0.0.7 does not exist on JSR
keeps the plugin-owned AI namespace configured in local-source installs
  failed assertion: check.code === 0
  cause: @netscript/fresh@0.0.7 does not exist on JSR
```

The strictness discriminator is ordered after local map construction. Pre-fix, the local-resolution
assertion above fails first. Post-fix, `cut-local imports fail closed when a first-party export
target is missing` reaches and requires `Deno.errors.NotFound`. Existing published-identity guards
continue to require thrown errors for non-exact and split JSR identities.

## Targeted green — version-derived assertions

```text
rejects a split root and subpath with every involved version ... ok
fails closed on a non-exact closure member ... ok
generated closure verifier rejects split JSR identities with version-bearing output ... ok
generated closure verifier fails closed on a range pin ... ok
generateAppDenoJson ... ok
```
