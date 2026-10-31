# Lesson — 2026-10-31

Treat a shared Cookie header as independently decodable values. A per-value URIError boundary protects neighboring application credentials while retaining the valid decoding contract. Choosing omission prevents a malformed session identifier from becoming a raw credential. Do not replace a published parser with @std/http until its decoding, malformed-name and duplicate behavior are compared.

Authentication coverage must honor the existing request port: this backend consumes AuthnRequest.cookie, whereas the interactive flow reads Request headers through its own shared parser. Document that boundary. For callbacks, omit txn from the regression URL to force the cookie fallback; otherwise a malformed-cookie regression may silently bypass the parser.

Revert only production parsing while retaining new tests. Five URIError regressions followed by a restored 55-test pass proves this fix matters without changing the contract or weakening assertions. Baseline documentation failures must remain visible and distinguished from successful package publication.
