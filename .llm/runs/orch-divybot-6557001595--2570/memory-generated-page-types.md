# Generated page layer props — 2026-11-01

Inline definePage().withLayer views need an explicitly annotated props contract;
otherwise the overload can infer EmptyRecord and reject the async loader as never.
Named view components with typed props infer correctly. Scaffold check must run
against actual emitted TS/TSX, not just the generator (templates are strings).

Current tokens v2 sets `data-scheme=light|dark`; `data-theme` remains the language.
A real no-db scaffold now renders the new pages with HTTP 200 in Chromium.
