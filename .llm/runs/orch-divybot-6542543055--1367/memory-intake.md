# Intake and environment

RTK is absent from PATH in this environment; use git/gh directly and repository structured Deno
wrappers. Deno 2.9.7, gh and Claude are available. NetScript MCP find_guidance(intent), then
search_docs(query), were consulted. No memory connector is exposed; existing tracked run memories
were read before code research. #2215 is merged partial baseline, not duplicate remaining work.

Generated AppHosts currently register plugins through CLI generate-register-plugins.ts, not
composeAppHost/StreamsAspireContribution. Changing only that contribution would leave generated
projects unchanged. Existing service storage-restart_test.ts is process-only; it does not use
Aspire resource restart. Use a real generated-project Aspire probe for acceptance.
