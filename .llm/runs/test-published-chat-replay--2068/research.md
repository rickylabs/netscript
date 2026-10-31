# Research

Issue2068 is partly delivered. #2092/#2207/#2303/#2318 shipped in0.0.8. Coordinator Step0 requests only a cold-consumer check of persistence/native replay; EIS adoption and deleting its custom adapter remain external. Live claim/PR search found no competing owner. Therefore this leaf references2068 and does not close it.

Native deno doc of jsr:@netscript/fresh@0.0.8/ai confirms resolveChatSnapshot exposes nativeMessages and recommends seed+offset handoff. Inspected the existing native-chat-reader_test.ts and real HTTP integration fixtures as protocol authority. The supported stream fixture uses PUT creation, POST chunk append, JSON snapshot with Stream-Next-Offset/Stream-Up-To-Date, and SSE data/control frames. Public APIs perform actual HTTP IO; no internal persistence/replay function or source file is injected.

MCP find_guidance/search_docs were consulted first but returned no focused native replay seam. API research used a separate fresh documentation cache. Actual proof must use another initially empty DENO_DIR, a consumer outside the workspace, explicit standalone config and exact JSR0.0.8 import; module graph validation must reject any local framework alias. Existing local source tests alone are not published-consumer proof. Native deps:prod-install wrapper is available for frozen production install after the isolated lock is generated normally.

No package/plugin/route/UI source changes. Doctrine public-boundary rules apply to consumption but no published surface or new architecture debt is introduced. Framework JSR audit/dry-run N/A for run-only verification artifacts. No local scaffold.runtime or paid inference.
