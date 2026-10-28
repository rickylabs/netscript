# Keep documentation compilation batched

`compileSnippetAnalysis` must pass every synthetic entrypoint to one `deno check`. Splitting
normal checks per fence repeats Deno graph loading and type checking dozens of times, and also
changes error attribution: a graph failure without a TS code can borrow a different fence's
known-error budget. The processRunner port tests invocation count and fallback behavior.

Use bounded per-fence probes only after corpus timeout; an interrupted check must not spawn new
work. Mark the corpus incomplete even when diagnostic probes succeed. Keep the source list once
in diagnostics. Existing real compiler tests verify later-fence errors and colored source mapping.

Compare main and repaired compiler on the same merged corpus and warm cache. Host-specific
absolute timings vary; paired warm runs measured about 11 seconds for snippets and 22 for README
fences here, with the repaired median within 3% of main. Never run lock-mutating gates concurrently.
