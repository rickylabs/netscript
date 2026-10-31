# Research

Re-baselined against current main `4e018ad0bab9b9b90daf4764a035fd3ff879b9fa`. Issue #1491 has five acceptance boxes; no covering PR exists (the search hit #1651 concerns plugin CLI contributions). No orchid-triage report exists at intake.

NetScript MCP `find_guidance` then `search_docs` consulted. The installed prose corpus returns broad guidance but lacks a command guide; the authoritative current tree provides the actual command reference. `deno doc packages/service/commands.ts` and `deno doc packages/service/commands-relay.ts` confirm that both surfaces are subpaths of service, not standalone command/relay packages. Public service, database and workers references checked. Type-resolution warnings from deno doc are not compilation evidence.

The executor owns one interactive transaction over a bound business client, audit, outbox and receipt completion. It never retries the handler. Identity includes command version, scope, selected input, actor kind/subject and expectedVersion; transport correlation/trace/scheme are excluded. The application enforces expected version in its atomic update. The memory testing store is published but is simulation, not a production provider.

Relay construction starts no loop. Existing scheduling calls drainOnce; stop waits for active/queued work. Publication precedes live-token settlement; an uncertain settlement must not be manually released. Raw relay store has claim/markPublished/release, no inspection/reconciliation service. Reconciliation therefore uses consumer-owned inspection and downstream receipts, plus same-key command replay for lost responses; do not invent an export.

The outbound-webhooks recipe already integrates the command outbox with the checked worker sink. Link it from command/relay docs and link back; inbound verification remains separate. #1364 is closed and observations were routed to #1381 per owner.

Tier-1 snippet compilation is a fixed list in .llm/tools/docs/snippet-policy.ts. New pages must join that list or their fences are merely counted. Modules are isolated per fence and use a synthetic external consumer config derived from public export maps and declared dependencies; no private import is needed. Add only the relevant pages, with self-contained fences. Also execute the deterministic memory example to substantiate transactional, replay and rollback claims.
