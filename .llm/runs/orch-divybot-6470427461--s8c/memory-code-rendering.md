# Build-time code frames and fixture data

Code frames are generated in _config.ts afterRender before search/twin extraction; Lume's code_highlight processor runs later on all pre code nodes. Build-time framing keeps filenames/language labels readable with JavaScript disabled and removes duplicate browser wrapping.

Vento filters cannot be parenthesized as `filename || (source |> codeFilename)`; assign the filtered result first. Large code snippets in component-call strings can trigger Vento function-tag parsing. Put gallery examples in frontmatter data and pass those fields to the component. Nested Markdown fence tests must retain the opening marker length (the chat-ui example uses four backticks around triple-backtick chart/stats samples).

Deno import-map npm subpath prefixes do not resolve an appended language segment here. Add exact highlight.js language entries at the existing pinned version; no dependency upgrade is needed. dotenv uses upstream INI grammar; jsonc uses upstream JSON with comment support.
