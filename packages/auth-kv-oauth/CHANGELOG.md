# Changelog

## 0.0.8 canary (unreleased)

- **Breaking:** `KvOAuthErrorCode` removes `https_required` and adds `flow_https_required` and
  `cookie_https_required`. Update error switches and telemetry consumers to handle both codes;
  invalid cookie configuration still uses `configuration_error`.
- Proxy protocol headers are ignored by default. Opt into `trustProxyHeaders` only behind a proxy
  that replaces client headers and blocks direct service access. Top-level trust overrides
  `cookie.trustProxyHeaders` when supplied; otherwise the cookie option applies to both gates.
- `allowInsecureRequests` now relaxes only outbound OAuth HTTP. Local inbound HTTP needs
  `allowInsecureHttpRequests` and `cookie.allowInsecureDev` explicitly.
- Direct-TLS session refresh needs `cookie.secure: true` because `AuthnRequest` has no URL. The auth
  plugin exposes `NETSCRIPT_AUTH_COOKIE_SECURE=true` for this deployment mode. Automatic host TLS
  metadata and verified proxy hops/CIDRs remain deferred to
  [#2191](https://github.com/rickylabs/netscript/issues/2191).
- Export `presetProviderKind` from the root and providers entrypoints so configuration consumers
  share the shipped OAuth/OIDC preset policy. OAuth presets use explicit endpoints without issuer
  discovery.
- Auth cookies require `HttpOnly` (the public option accepts only `true` or omission) and HTTPS
  outside explicit `allowInsecureDev`, including custom cookie names. Untyped `httpOnly: false`
  overrides are refused. `__Host-` cookies still require `Path=/` and no `Domain` in development.
