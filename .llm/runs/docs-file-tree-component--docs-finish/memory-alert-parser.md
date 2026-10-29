# Markdown alert parser

markdown-it emits empty text tokens around strong delimiters. Ignore only those empty text tokens when checking strong_open/text/strong_close. An inline code token in bold is intentionally not a title under #2470, so the old component-parity fixture must use plain text; separate regression cases prove code and emphasis remain in the body. Native MCP stdio find_guidance and search_docs succeeded before implementation.
