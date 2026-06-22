# W2 Restructure Drift

- `how-to/add-a-plugin` and `how-to/author-a-plugin` are cross-cutting plugin-system guides. W2
  places them under `Orchestration & Runtime` because the reader action is runtime contribution
  wiring: plugin manifests become generated registry entries and AppHost resources.
- `how-to/graceful-shutdown` crosses service lifecycle and runtime operations. W2 places it under
  `Orchestration & Runtime` because the reader is managing process lifecycle and shutdown behavior,
  not defining a service contract.
- `reference/plugin-auth` and `reference/plugin-auth-core` remain in the Identity & Access pillar
  because their public surface is auth-specific, even though their package names use the plugin
  vocabulary.
