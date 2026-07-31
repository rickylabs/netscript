# Research — release specifier ranges (#973)

## Re-baseline

- Root release and all affected workspace members currently declare `0.0.1-beta.11`.
- The filed count is correct: 18 range-pinned occurrences across six plugin adapters, the contracts
  workspace generator, the Fresh UI registry manifest, the plugin skeleton template, and its
  embedded generated asset.
- The generated twin is now
  `packages/plugin/src/kernel/assets/embedded.generated.ts`; it is regenerated from the skeleton by
  `deno task gen:assets-barrel`.
- All six first-party plugins already receive `PLUGIN_PACKAGE_VERSION` from
  `deno task gen:publish-assets`. The CLI similarly derives `NETSCRIPT_RELEASE_VERSION` from its
  generated package metadata.
- Existing CLI code and tests establish an exact coordinated-release policy, not a consumer
  floor-range policy.

## Root cause

The remaining range literals bypassed the generated release-version sources, while the specifier
guard deliberately treated ranges as non-failing notes. That combination allowed every release cut
to preserve historically named prerelease floors.

## Decision

First-party framework source emits exact coordinated-release pins. The source values derive from
generated package metadata or `netscriptJsrSpecifier`; the guard rejects any literal range that
reappears.
