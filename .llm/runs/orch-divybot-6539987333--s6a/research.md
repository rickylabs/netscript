# Research

Baseline c6bce8f contains S1b token roles and S3 component contracts. No existing PR covers #2419. Previous S3 evidence records a 188-case actual-component render harness in tools/fresh-ui-browser. Registry styles still use offset button shadows, legacy radii and secondary as info. Studio Utility has Figma-owned radius/control=0, radius/card=0, radius/badge=2, separate typography, focus, status and syntax roles. State opacity tokens are percentages (38/8/12), requiring division by 100 for CSS opacity.

The token build adapter currently defaults to ns-one. Preserve that low-level compatibility default and explicitly select Studio Utility at new-app initialization; existing app configuration/migration remains authoritative. Scoped Utility styles must not alter existing NS One apps or the gap components in #2488. Generated registry embeddings and CLI carriers are publication inputs.

Architecture: CLI is archetype 6; Fresh UI is archetype 4 with existing contract surface. No new runtime abstraction, dependency, public CLI flag or token value is needed. JSR surface scan: component interfaces remain explicit, assets are embedded TS, no import attributes in publishable sources; templates retain app JSON imports. Run the package audit and release preflight.
