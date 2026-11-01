# Atomic watch regression boundary

Public async memory watchers queue events synchronously but resume consumers on
a later microtask. A public-only reader-after-watch test passes even before
#2267, hiding partial notification state. Interpose the registered key/prefix
handler, capture ordinary `get` promises synchronously there, and assert their
snapshots outside the callback; callback exceptions are deliberately swallowed.
Use original production-file negative controls to prove each new test detects it.
