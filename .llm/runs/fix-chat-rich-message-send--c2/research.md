# Research

Issue #2068 inspected live. Current main baseline `8aad14940c52cd3a4db7efa57d56d50ae131df6c`. MCP `find_guidance` consulted before design; use existing package boundaries and native Deno/Web Platform APIs.

Scope: Fresh AI send retains full native UI/Model messages, data and linked cancellation with one physical subscription.

Design evidence: One documented owning rich send-input structural union separated from reduced rendering projection; direct unchanged forwarding to existing native transport and existing hub retained, native compile/identity/actual HTTP+SSE proof, no dependency or upstream export changes
