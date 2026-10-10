# Changelog

## Unreleased

- Export `presetProviderKind` from the root and providers entrypoints so configuration consumers
  share the shipped OAuth/OIDC preset policy. OAuth presets use explicit endpoints without issuer
  discovery.
