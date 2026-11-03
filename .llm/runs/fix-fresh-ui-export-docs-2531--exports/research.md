# Research — current main

Baseline e7906c80e8177bcf2544b3ce3bff3481f4f6d9ff includes merged #2592. Tracker #2412
still has S3/S4/S5/S6/S7 cells open. Existing PRs own the showcase, Desktop/style continuation,
builder payload/routing, Figma generation and other follow-ups. #2531 has no existing PR or active
worker binding and is the independent public documentation/export boundary leaf selected here.

In-repo find_guidance consulted before implementation. Doctrine public-surface and harness
workflow read; Deno 2.9.7 public API inspection used before source reads.

Structured baseline doc-lint reproduces 124 combined diagnostics: 96 private references,
28 missing JSDoc. Interactive alone has 123 (96/27); JSON contributes one unsupported native
documentation finding. Per-entrypoint inspection additionally catches TokenPreset private exposure
in token-config.ts, masked in the combined graph by another entrypoint. Every entrypoint must pass
independently, not merely the combined count.

Namespace types reference private implementation functions with typeof; prop aliases reference
local exported hook/element types absent from the public entrypoint. Document those real public
types and use equivalent explicit namespace signatures rather than exposing implementation functions.

Metadata audit already exempts JSON module tags on current main, but validates only existence;
it does not reject malformed JSON. The doc wrapper still sends JSON through executable doc-lint.
Both boundaries need truthful data classification plus invalid/missing-data negative controls.
