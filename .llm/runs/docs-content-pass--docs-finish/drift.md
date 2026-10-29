# Drift

- Independent content preparation proceeds while renderer CI runs; landing order remains renderer → content → comparisons.
- Native git is required for creating the owner-prescribed sibling worktree: the worker git shim rewrites worktree destinations beneath the assignment directory and its narrow remote refspec rejects tracking non-main branches. No history was rewritten.
- RTK absent; native commands and structured gate wrappers used.
