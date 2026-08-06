# W5-A preflight — first-party contract metadata and agent reference

Observed on 2026-08-06 before dispatch:

- First-party contract routes generally provide mechanical method/path metadata without the concise
  human/agent summaries and natural tags that oRPC/OpenAPI can emit.
- #1137's ratified design sources require one all-first-party slice rather than piecemeal package
  enrichment.
- #1138 requires a focused agent-facing tool reference, one cross-link from the existing Scalar/
  OpenAPI how-to, every status of the single live mapping, inputs, failure envelopes, and
  `excludeServices` behavior.

## Required supervisor mission

1. Derive the exhaustive first-party route inventory from live contract modules and generated
   OpenAPI output. Do not maintain a second handwritten route list.
2. Add concise action/outcome summaries to every first-party `.route()` call and natural tags only
   where they improve real grouping. Review prose for specificity, duplication, and misleading
   claims; do not generate “METHOD path” paraphrases.
3. Add a deterministic guard proving every first-party route has a non-empty useful summary and that
   generated OpenAPI preserves it; include missing/empty/mechanical negatives.
4. Inspect the exact shipped introspection tool contracts and status mapping with `deno doc` and
   live source. Write the agent-facing reference for tool names, inputs, outputs/statuses, failure
   envelopes, and service exclusion without restating implementation internals.
5. Add the single “for agents” cross-link at the existing OpenAPI/Scalar how-to and link the
   reference into canonical task/navigation surfaces.
6. Run scoped contract/service tests and wrappers, public doc lint, package quality, serial publish
   dry-run for every touched publish root, generated OpenAPI assertions, docs links/accuracy/build,
   and source/reference alignment.
7. Open a draft PR with `Closes #1137` and `Closes #1138` only after both gate rows have exhaustive
   current-head evidence; leave it at `status:impl-eval` for separate Qwen evaluation.

Coverage is all first-party routes and all live mapping statuses. Sampling a few packages or copying
stale design names is not acceptance.
