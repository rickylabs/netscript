# Research

Baseline `4060d1e61da0a8324e77ed351b05a343d746a188` matches fetched main. No existing PR, issue-named branch, or orchid-triage comment covers this fix.

NetScript MCP `find_guidance(intent)` then `search_docs` identifies the auth backend as the integration adapter for AuthBackendPort. Public API inspected using `deno doc --filter parseCookieHeader`. The parser in src/cookies.ts directly decodes every value and throws URIError. flow.ts uses this parser for callback transaction-cookie fallback, getSessionId, and signOut. backend.ts uses AuthnRequest.cookie for authenticate and sessions.getSession, not a separate decoder; tests provide the public parser at that seam.

Inspected cached @std/http 1.1.4 getCookies: it returns raw values without percent decoding, and throws SyntaxError for an empty key starting with equals. Replacing the existing parser would change valid encoded-value semantics and malformed-name handling. Keep the existing public helper and scope the URIError boundary to each value. No Web Platform Cookie header parser is provided by Headers.

Archetype 2 integration; existing AuthBackendPort and KvOAuthStore ports remain unchanged. This is a bug fix within the existing structure, with no new layering, adapter, dependency, permission, runtime process, or debt. Doctrine axioms A6/A7 justify the existing helper's cookie decoding policy.

JSR planned surface scan: existing explicit ReadonlyMap<string,string> return, nine documented exports, README and package metadata, publish whitelist excluding tests; no new types, exports, or slow-type risks. Verify full export-map doc lint, audit, and member publish dry-run.
