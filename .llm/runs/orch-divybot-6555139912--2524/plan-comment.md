Plan & Design — READY FOR REVIEW

Plan commit: e5fa3660df2dc84325e28a33b0512474a4926a6f.

The existing Utility selector will be shared using native CSS nesting so its specificity, aliases, declarations, and rule order remain intact. The QueryResult source is already shared after #2503; regression tests will compare both real generator outputs against it. Raw and gzip CSS budgets will run in the existing Fresh UI package CI suite beside the publish budget.

Evidence and acceptance gates: `.llm/runs/orch-divybot-6555139912--2524/plan.md`. Mandatory independent implementation review remains pending. No labels per owner instruction; Refs #2524.
