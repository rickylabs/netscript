# Dependency wrappers that ship

consumer-tools.json registers .llm/tools/deps/outdated.ts and why.ts as consumer files. Editing either changes agent-tools.generated.ts and its hash, and importing an unregistered helper breaks consumers. Repo-only npm project selection belongs in standalone-deps.ts routed by root task strings; keep shipped generic wrappers byte-identical unless deliberately changing the consumer contract. Census is read-only and must not start npm.
