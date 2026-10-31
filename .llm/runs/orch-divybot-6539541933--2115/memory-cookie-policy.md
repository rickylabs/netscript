# Cookie policy memory — 2026-10-31

All Request-based cookie reads in auth-kv-oauth flow.ts call parseCookieHeader; backend.authenticate and sessions.getSession use AuthnRequest.cookie supplied by the host. @std/http 1.1.4 getCookies does not decode percent escapes and throws on an empty name beginning with equals, so it is not a compatible replacement. Use --no-lock for exploratory deno info to avoid adding an unversioned import mapping. The exploratory info mapping was inspected and restored; no lock change is required.
