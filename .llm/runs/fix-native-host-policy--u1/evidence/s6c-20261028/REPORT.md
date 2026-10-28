# S6c streams TLS: Windows source gate complete

One new shipping owner, `plugins/streams/services/src/service-tls_test.ts`: **182/220 lines**,
8659 bytes, SHA256 `057a02e7b7ba39504cbaeef0a6d5fd61c339a9523015900a19d0b689ecebc241`.
`source.final-2.ts` is the exact final copy; `source-2.diff` contains its complete addition.
All115 protected bindings match, including the294-line runtime fixture and256-line runtime test.
All three public test PEM constant declarations match the qualified workers source byte-for-byte.
No existing source, production, configuration, permission, lock, debt or shared helper changed.

Installed NetScript MCP guidance and audited native ServeOptions.tls/listener behavior were used.
The accepted inline ECDSA P-256/SHA256 test material retains127.0.0.1 IP-SAN/serverAuth and validity
through2036-10-25 (CA2036-10-26); no generation, file-based certificate read or trust-store change.

## Actual final behavior

The native explicit-CA client completes HTTPS anonymous401, credentialed PUT201, POST204 and GET200.
The front returns the expected20 UTF8 bytes of `tls-before|tls-after`; direct loopback HTTP upstream
returns200 and identical bytes. Every response body is consumed before assertion.

The fresh default-CA client uses the same live endpoint and valid credential. Actual rejection:

```text
TypeError: fetch failed
cause Error: error sending request for url (https://127.0.0.1:53088/v1/stream/s6c-dffe293f-15bd-4748-8ac5-a661c26ce247?offset=-1): client error (Connect): invalid peer certificate: UnknownIssuer
```

Auth counts are **[4,4,5]**: no raw-route authentication occurs for the TLS refusal; the original
trusted client then succeeds again with unchanged bytes. Both clients close before two awaited
native stop calls. Actual upstream54157 and front53088 both rebind. Exactly one final success marker
prints after cleanup. The unexpected-response branch cancels its body and fails; no generic fetch
failure, timeout, permission failure or non-Error/noncertificate cause is accepted as TLS proof.

## Actual gates and preserved failures

- Final `gates-2/`: **7 passed / 0 failed / 0 ignored**,10,984ms. Every test retains its sanitizers.
- Six selected files pass types/lint/fmt with no dropped selection, diagnostics or findings.
- New-owner quality: zero findings, zero allowances. Canonical source remains182 lines.
- Final proof:115/115 protected hashes and3/3 exact PEM copies. Both attempts together have
  **30 captured child results settled** and **12 owned paths verified absent**; all pipes fit32KiB.
  Twenty native addon comparisons match the original Windows hashes. These runtime-fixture children
  needed no deadline kill; the separate frozen S4 watchdog/output controls still ran as before.
- First actual owner180 lines and **6 passed / 1 failed / 0 ignored** remain in `source.final.ts`,
  `source-proof.json` and `gates/`. Its top-level `/certificate/i` assertion saw only `fetch failed`.
  Root explicitly authorized the narrow Error.cause correction; `FIRST_FAILURE.md` preserves the
  failure and authority. The original source/proof hashes remain ae076838.../bc1ecbfd... unchanged.
- A later evidence-only PowerShell JSON-array count mistake produced10 instead of20 comparisons
  and an audit exit1, retained in `final-verification.json`. The native JSON reader in
  `verify-final.ts` verified20/20 in `final-verification-2.json`; no test or source rerun followed it.

Raw commands/statuses are in each `gates*/execution.json`; `gate-hashes.json` binds all final gate
reports, TLS child result, complete source and diff. Final source proof SHA256:
`4ca2f76994f3a0585ec979ed4756a54632a00dd5901d858c5381d90552f1a49e`.
Final source diff SHA256: `eb6f5edf043016226d657c3cb7e4cfc5683ed0941f21009dea900fc5d20615e7`.
TLS child result SHA256: `963e1bf3c6216180ce3bf7f62fabcbc9f53cc80ee05e7a5a01033012ef1abdb0`.

Windows TLS qualification only. No exclusive ambient-trust isolation, health/metadata/CORS security,
whole-architecture, Linux, independent IMPL or full-U1 claim. No architecture repeat, checkpoint,
push or further slice application. Root reads this complete source/evidence before checkpoint.
