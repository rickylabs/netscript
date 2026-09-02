# Implementation brief

Implement issue `#1467` on `feat/sdk-locale-contribution` from baseline `77ad823dc`.

- Consume the existing RFC 0001 descriptor seam; do not alter it.
- Add a public, explicitly composed locale factory under `@netscript/sdk/client`.
- Own `accept-language`, optional typed locale context, and a partitioned cache law.
- Pin direct/query/generated typing, composition order, retry, cancellation, cache-key identity, and
  redaction with focused tests.
- Document both auth-shaped and non-auth contribution use.
- Stay outside trace/observability/transport-policy/concurrent-issue surfaces.
- Preserve `deno.lock`; run every gate and carrier command named in the owner brief with real output.
- Push only with
  `git push origin HEAD:refs/heads/feat/sdk-locale-contribution` and open the final non-draft PR with
  all required labels and milestone in the same GitHub action. Use no closing keyword.

