# Current implementation CI evidence

Head: 6a8a4de3e00d09237e0b3bbc1664f9a7c40afbe7.

[Runtime workflow](https://github.com/rickylabs/netscript/actions/runs/37679143081): scaffold-static, Docker/Postgres scaffold-runtime, SQLite scaffold-runtime and lane visibility all succeeded. Local Docker unavailability is not a required owner decision because the authoritative runtime gate ran in CI.

[Core CI](https://github.com/rickylabs/netscript/actions/runs/37678538059): current quality failure is audit-critical, GHSA-jqcg-44mw-7w3h in the existing proxy-addr dependency. Worker wrappers and code-quality pass.

[Upstream advisory](https://github.com/jshttp/proxy-addr/security/advisories/GHSA-jqcg-44mw-7w3h) identifies the patched release. An isolated native Deno resolution produced the patched entry; no application API change or audit bypass is proposed.
