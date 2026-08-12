# Research — exact canary plugin install

## Re-baseline

The worktree and `origin/main` both resolve to `3c9dc1f3907c605d2d30d76f5a20ade1e4754736` at bootstrap. The branch is clean and has no upstream by design.

## Findings

1. `resolvePluginPackageSpec` accepts only `@scope/package`; its regex rejects both exact spellings before validation.
2. `ResolvedPluginPackageSpec` has no requested-version field, so `FetchJsrPluginValidator` cannot distinguish explicit exact input from unversioned input.
3. The validator currently selects the CLI release when published, otherwise package metadata `latest`; this is correct only for unversioned requests.
4. `resolvePluginDescriptorBeforePlanning` builds its dispatch source from the validated descriptor version, so preserving the requested version in validation carries it into plugin-owned scaffold dispatch.
5. Appsettings service commands already receive descriptor `packageSpecifier` plus `version` and therefore become exact when validation is exact.
6. `ensureRootImportsForPluginKind` currently derives first-party plugin imports from the CLI release, so an explicit version can still be lost in generated `deno.json`; the install flow must pass the validated package identity/version into that mutation.
7. The decisive control is requested `0.0.6-canary.2` versus stable `latest: 0.0.5`.

## JSR surface scan

This change adds no export, entrypoint, dependency, JSDoc surface, permission, or publish-file change. It changes internal parsing and version selection only. Existing `@netscript/cli` JSR/debt posture remains unchanged; the required package gates and quality gate will verify no regression.

## Open questions

None. The issue fixes the accepted spellings and exact-preservation contract.

