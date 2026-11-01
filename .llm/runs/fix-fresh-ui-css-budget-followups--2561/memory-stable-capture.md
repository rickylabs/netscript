# Stable browser capture and complete proof

One repeated, unchanged replay had zero style/rule differences but 151 text pixels in the
last native popover varied in one image. Awaiting font readiness and animation frames, then
requiring two consecutive identical PNGs fixes the paint race without a pixel tolerance.
Bounded instability still fails; the final positive replay and deliberate Card paint mutation
both ran through this capture path. No production CSS was changed.

The replay manifest pins all original properties and597000comparisons per scene. Require
exactly light/dark ×390/1280 and265specimens; a passing summary cannot hide an empty or
narrowed sampler. Browser types resolve with tools/fresh-ui-browser/docs.deno.json and its
explicit installed Node types. Node-only browser regressions use .browser.mjs, not .test.mjs.
