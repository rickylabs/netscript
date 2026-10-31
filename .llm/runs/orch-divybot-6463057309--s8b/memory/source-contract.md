# Design source contract

On main at 2560bf564, all eleven DESIGN.md files share version/name/description/colors/typography/rounded/spacing/components YAML groups; typography and component recipes are nested objects. Studio YAML represents Utility; other flavors are complete prose tables under H3 headings in ## Flavors. Never infer flavor values from Utility YAML. There is currently only one Fresh UI reference index and no legacy design pages to redirect. Lume exposes its configured Markdown engine as helpers.md to .page.ts generators, including markdown-it-anchor.
