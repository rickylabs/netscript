# Research

Issue #2041 inspected live. Current main baseline `8aad14940c52cd3a4db7efa57d56d50ae131df6c`. MCP `find_guidance` consulted before design; use existing package boundaries and native Deno/Web Platform APIs.

Scope: Reconnect the existing SDK/Fresh native RPC channel after an actual document reload.

Design evidence: Capture native document epoch in the existing SDK default binding adapter; Fresh synchronously closes the retired logical port and upgrades a replacement behind one stable physical binding, with stale/final admission guards and strict actual CEF reload proof
