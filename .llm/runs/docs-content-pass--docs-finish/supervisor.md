# Content integration finish

Assigned Codex implementation, feature tier, high effort. Baseline d26a3c5d9 on docs/content-pass; merge current main after #2469 lands, using a merge commit.

Writable surface: docs/site authored content (excluding comparisons rewrite, which follows), documentation navigation/rendering checks when content requires updates, .llm/tools/docs generator/check policies only for source alignment, generated CLI/MCP carriers, and this run directory. Renderer run may receive its final evidence reconciliation. No framework behavior changes.

Independent evaluator: Gemini 4 Argon high through native agy read-only plan mode; owner override because Claude is at its weekly limit. No self-certification.
