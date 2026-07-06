# 219-fafix Notes

## Follow-up Candidate

The FA2 fix prevents the Deno decode-time crash by requesting `Accept-Encoding: identity` on the upstream durable-stream hop and then stripping any stale `content-encoding` response header before forwarding to the client.

If the durable-streams runtime still emits `content-encoding: gzip` for plain JSON when the request explicitly asks for `identity`, the runtime source should also be fixed so it either:

- does not send `content-encoding` for identity/plain bodies; or
- sends genuinely gzip-compressed bytes when it labels the response as gzip.

That investigation belongs outside this slice and should target the durable-streams runtime/plugin-streams-core owner rather than expanding the `@netscript/fresh/ai` patch.
