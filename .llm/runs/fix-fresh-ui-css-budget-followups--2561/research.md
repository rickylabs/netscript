# Research

The merged #2558 head and the new #2561 issue are the current authority. #2412 has
unfinished theme/component phases with other owners; #2561 is the direct unclaimed
CSS-validation follow-up. No existing PR covers it.

Current CSS is 215981 raw / 26527 Deno gzip bytes. The fixed ceilings are 220000/27000;
there are 473 gzip bytes left. A planned, documented gzip ceiling of 28000 grants about
1.5 KB, without automatically rewarding file-count growth. The raw ceiling stays fixed.
Any later increase must name its issue, measured before/after cost and parity evidence.

The test's walk skip regex matches absolute paths, so a checkout inside a `theme`
directory falsely empties its source inventory. Filter the normalized repository-relative
registry path instead; prove it using the actual test copied into a theme-named checkout.

#2558's one-off rule comparator is retained in its run, but its baseline CSS and265HTML
specimens are private. Those exact inputs still exist locally. Promote the comparator
and commit a compact, provenance-hashed gzip fixture containing the original52CSS files,
base/Utility tokens and265specimens. Reuse the existing variant-parity.ts browser engine;
replay must work without old git history or regenerating old components.

Relevant existing memory: #2524 budget compressor differences, browser shared libraries,
fixture Deno config and validation duration notes. Deno2.9.7 and browser dependencies
remain installed. Browser evidence is Chromium153/Playwright1.63.0.
