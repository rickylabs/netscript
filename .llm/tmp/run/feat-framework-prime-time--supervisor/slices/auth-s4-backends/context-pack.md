# Auth S4 Backends Context Pack

## Scope

Implement S4 backend wrap-don't-reinvent and crypto security changes across `packages/auth-workos`, `packages/auth-better-auth`, and the crypto/error surface of `packages/plugin-auth-core`.

## Current State

- Branch: `feat/prime-time/auth-s4-backends`.
- Base tip observed: `54d6550a`.
- Required explicit push refspec: `git push origin HEAD:refs/heads/feat/prime-time/auth-s4-backends`.
- Dirty files present before implementation: `.llm/tmp/run/openhands/**/request.md` entries; do not touch.

## Implementation Notes

- Shared crypto should use WebCrypto verification rather than manual signature equality.
- The previous nonce in backend tokens was not verified; S4 removes decorative entropy by signing only the session id payload.
- `AuthBackendOperationUnsupportedError` should be single-sourced from `plugin-auth-core`.

