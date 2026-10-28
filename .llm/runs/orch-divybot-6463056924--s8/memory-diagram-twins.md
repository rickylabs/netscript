# Diagram image markup feeds Markdown twins

`docs/site/_plugins/ai-tooling.ts` figureMd reads figure img src/alt. Inline SVG alone is omitted. When theming via inline SVG, retain a twin-readable source img (visually hidden) and independently accessible SVG; verify generated .md contains the image and alt. Mermaid SVG sources are generated from _diagrams and protected by diagrams:check. Use unique inline SVG IDs: all existing generated diagrams start with my-svg.

Component links using the Lume url filter already carry the project base before AI twins run. absoluteUrl must recognize that prefix; otherwise the home twin gets /netscript/netscript/ links. B3 acceptance checks the complete built twin, not only the image URL. Rebuild before no-JavaScript verification so the current fallback message is included.
