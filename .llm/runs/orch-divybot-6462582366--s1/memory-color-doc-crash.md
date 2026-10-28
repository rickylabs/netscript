# Color API inspection

Deno 2.9.7 `deno doc` on colorjs.io 0.5.2 overflows its stack. Use official Color.js docs and focused runtime inspection instead. Do not stage a crash dump; keep raw diagnostics outside the source tree. Style Dictionary 5.7.1 already depends on this Color.js version; use that exact version for conversion and interpolation.
