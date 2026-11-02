# Findings at baseline

- plugin-reference-reconciler.ts already adds persisted declaration consumers to Apps and Services.
  First-party workers/streams manifests only declare officialSource, so consumer apps remain empty.
- generate-register-apps.ts emits plugin/service discovery using getResourceEndpoint and the same
  three Vite/server variables, but reference lists are read during generation rather than startup.
- plugins/workers/cli.ts only exports an adapter callable. The executable composition is under
  plugins/workers/src/cli/composition/main.ts; running the exported entrypoint does nothing.
- The host already has createInstalledRuntimeRegistryGenerator and shares it across generate and
  doctor. Installation should call that producer rather than invent a workers special case.
- Worker doctor remediation uses package version metadata but ignores local-source workspaces.
- Docker topology diagnosis already detects remote endpoints and loopback binding mismatches;
  both are warnings and should become actionable errors for unsupported topology.
