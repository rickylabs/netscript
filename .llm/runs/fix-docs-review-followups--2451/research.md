# Research

Main contains merged #2439 at f177c38. Random IDs occur in the diagram filter and tabbedCode template; afterRender has both page URL and DOM order and is the appropriate deterministic scope. Diagram source images must retain hidden/lazy and Markdown-twin semantics. Existing inline renderer can namespace the final SVG with a stable prefix without re-reading source assets. Lume lightningcss bundles CSS imports; copied styles currently bypass processing. Existing CSS source gates remain authoritative.

Pages build honors needs_pages, browser does not. Shared decide intentionally treats all non-PR events conservatively; preserve that default and opt Pages into its own complete push diff. Manual/release events still run. Existing source-only design test includes a fictional JSON source, so replace it with an actual source and separate synthetic config policy tests.
