# Shipped CSS budget recipe

The52 non-theme registry CSS files total270183raw/27152gzip bytes at baseline6a1d84a,
using Deno2.9.7 CompressionStream('gzip') in sorted registry-key order with newline
separators. Python gzip uses a different compressor/result (26908baseline): do not use
its size to select the platform budget. Candidate215981raw/26527gzip; ceilings220000/
27000 independently reject the old payload. Six files with one Utility scope remain
unchanged;46 files consolidate528 root-selector occurrences into54.

The budget test verifies nonempty source inventory, identical shipped keys and exact
source/carrier bytes. Its negative control copies the unchanged test into an isolated
fixture with original52CSS files and matching embedded payload; raw and gzip steps both
fail. Give that fixture its own deno.json because root excludes .llm/tmp from tests.
