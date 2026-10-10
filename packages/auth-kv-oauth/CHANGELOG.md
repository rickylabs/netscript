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
