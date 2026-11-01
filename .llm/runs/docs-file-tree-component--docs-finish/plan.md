# Plan & Design — READY FOR REVIEW

Keep HTML-contained alerts as blockquotes with a warning. Recognize a title only from parsed strong/text/strong inline tokens. Preserve existing callout rendering and Markdown twins.

One implementation slice: renderer and regression fixtures, proved by source-format tests, scoped check/lint/format wrappers, site verify, carrier checks and independent evaluation.

Risks: HTML tags do not affect Markdown token levels; retain container state across html_block tokens. Escaped Markdown delimiters must be interpreted by the parser. No new dependencies or public API. PLAN-EVAL: N/A, owner supplied precise correction and acceptance.
