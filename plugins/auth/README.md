# @netscript/plugin-auth

`@netscript/plugin-auth` provides the first-party auth plugin shell and the unified auth oRPC
service for NetScript applications.

The service exposes the AS1 auth contract v1 under `/v1/auth`:

- `signin`
- `callback`
- `signout`
- `session`
- `me`

Auth v1 uses one active backend per app. Select it with `NETSCRIPT_AUTH_BACKEND`:

```bash
NETSCRIPT_AUTH_BACKEND=kv-oauth
```

Supported backend names are `kv-oauth`, `workos`, and `better-auth`. The `kv-oauth` backend owns the
full OAuth redirect flow in this slice. WorkOS and better-auth are wired for real request/session
authentication through their AS2 backend ports; interactive operations they do not expose are
reported as typed auth provider errors.

This package is MIT licensed.
