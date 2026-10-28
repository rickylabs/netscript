---
name: netscript-design
description: 'Choose a Fresh UI theme and build or customize NetScript UI with its design language, token compatibility contract, quality method and self-audit. Use for visual design, theme selection and on-theme components; not backend architecture or generic Deno tooling.'
---

<!-- Generated from https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/GUIDELINES.md; source SHA-256: 8ebacc4c481b5b4edc416fb598714afc82e3b6d37113101185dd9c08d285dce8. -->

# NetScript design

Use the [bundled canonical guidelines](references/GUIDELINES.md) for the shared rules. They are a
local snapshot of the design-system source, not a second hand-maintained policy.

- **Choose a theme:** read §6 (theme catalogue) and §2.3 (supported presets), then the chosen
  theme's pair below. Follow the user's goal and the documented default/preset constraints;
  the catalogue distinguishes faithful, inspired and own languages.
- **Build compatible UI:** read §1 (ownership), §2 (theme architecture) and §3 (compatibility
  contract), plus the chosen DESIGN.md and SKILL.md. Keep provisional and planned capabilities
  distinct from installed framework behavior. Discover CLI/API operations through the installed
  NetScript tooling rather than assuming future registry commands already exist.
- **Check the result:** follow §4 (quality method), especially §4.5 (self-audit), and §5
  (anti-patterns). The chosen theme pair supplies the concrete visual rules and state coverage.
- **Create a theme:** follow §7 and the planned shipping boundary in §8; do not improvise a
  competing token contract.

## Theme specifications and procedures

If the chosen theme is installed under `.agents/skills/fresh-ui-theme-<id>/`, read that local
DESIGN.md/SKILL.md pair. Installing these pairs is registry-v2 work; this skill does not claim to
install them. Otherwise use the published sources below, also linked by the
[Design system gallery](https://rickylabs.github.io/netscript/design-system/).

| Theme | Specification | Agent procedure |
| --- | --- | --- |
| studio | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/SKILL.md) |
| tonal | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/tonal/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/tonal/SKILL.md) |
| bloom | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/bloom/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/bloom/SKILL.md) |
| cupertino | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/cupertino/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/cupertino/SKILL.md) |
| liquid | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/liquid/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/liquid/SKILL.md) |
| fluent | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/fluent/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/fluent/SKILL.md) |
| brutal | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/brutal/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/brutal/SKILL.md) |
| filigrane | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/filigrane/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/filigrane/SKILL.md) |
| terminal | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/terminal/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/terminal/SKILL.md) |
| pixel | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/pixel/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/pixel/SKILL.md) |
| tactile | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/tactile/DESIGN.md) | [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/tactile/SKILL.md) |
