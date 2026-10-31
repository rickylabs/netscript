# Research

Re-baselined against current main. MCP `find_guidance` then `search_docs` consulted.
Prior memory: generated carriers use canonical gen tasks; unchanged transports retained.
RTK is unavailable in this environment; raw focused commands are the fallback.
No orchid-triage comment exists. #2234 is merged but left manifest parity explicitly unmet;
no open PR covers this remaining change. Coordinator Step 0 evidence:
https://github.com/rickylabs/netscript/issues/2233#issuecomment-6535216808.

The shared carrier lives in MCP and is consumed through `@netscript/mcp/docs`.
CLI `DenoAgentDocsGenerator` decodes it, derives llms-full, generates project API docs,
and renders MANIFEST. `initAgent` installs the returned map through its filesystem port.
Historical rows confirmed against #2234 base: `Prose source commit`, `Prose extraction time`.
Sidecar deliberately contains only schema/version: never add aggregate digests there,
because independent page edits must still merge cleanly.

JSR surface scan: no exported signature or export-map change; private manifest rendering only.
Use Web Crypto SHA-256, no dependency or slow-type expansion. Existing CLI archetype 6
is retained (doctrine verdict: Keep); AP-2/AP-4/AP-6 risks avoided by extending existing adapter.
