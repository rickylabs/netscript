# Current facts

Baseline main eb9a129 includes merged #2520. #2409 is open with three acceptance boxes and no
comments or covering PR. #2407 is a merged removal workaround, not a generator fix. Tracker #2474
F1 lists this leaf; Fresh UI PR #2503 does not change the route generator/Vite files.

Consulted NetScript MCP find_guidance(intent), then search_docs(withRoute appRoutes generated binding).
Public docs describe three auto-binding forms and app-owned ui:add pages using appRoutes. Existing
rewriteWithRouteForm only detects the exact canonical string; any other existing .withRoute gets a
second binding. Both Vite hooks and the CLI use the same writeNetScriptPageModuleBindingsSync seam.
The existing scanner already reports hasWithRoute. Inline/withRoute conflict detection is separate.

Surface is the existing @netscript/fresh/vite generator (archetype 6 concern inside archetype 4 Fresh).
No public types/exports, dependencies or publish-file selectors change. JSR rubric: existing explicit
rewrite input/result types remain; no new slow types. Full package has inherited documented doclint
and facade debt; this leaf must not claim blanket zero-doclint readiness or close that debt.

RTK absent, gh available. Use direct focused inspection plus structured validation wrappers.
Owner's prior evaluator override continues: Claude Opus 5.5/high, separate session, read-only.
No expensive local runtime suite. Focused Vite dev/build hooks and disk pass prove source preservation.
