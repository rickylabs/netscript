# Lume/Vento filter integration

A filter registered with an async callback but no async-mode registration can emit [object Promise] into rendered HTML. Existing source/rendered checks do not catch that sentinel. The Utility diagram filter therefore reads its small build-time SVG input synchronously and returns the transformed string. A real browser accessible-name assertion caught the missing visual even though axe alone passed. Keep built-twin/name assertions in the browser suite.
