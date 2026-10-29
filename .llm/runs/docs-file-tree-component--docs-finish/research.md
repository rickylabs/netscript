# Findings

PR #2469 remains open at the supplied head. No orchid-triage duplicate report exists on #2470. markdownAlerts currently runs before inline parsing, checks only open.level, and uses a regex for bold titles. Existing tests cover lists and blockquotes, but no HTML containers or escaped delimiters.

Memory consulted: prior docs-site MCP, build, fixture, carrier and browser notes. RTK is absent on this worker; use native commands and structured wrappers.
