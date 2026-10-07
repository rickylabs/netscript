# Research

Issue #2066 inspected live. Current main baseline `872df8e21e0a8bf06cd0796c7808068dd67e2c4e`. MCP `find_guidance` consulted before design; use existing package boundaries and native Deno/Web Platform APIs.

Scope: Propagate handler AbortSignal and deadlineAt through worker timeout, shutdown drain and local cancellation.

Design evidence: Required handler signal, compatible dispatch input, isolated owned controller, injected clock, first-cause DOMException, bounded grace, full Deno path wiring and explicit local Worker.cancel
