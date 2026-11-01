---
name: netscript-design
description: 'Choose a Fresh UI theme and build or customize NetScript UI with its design language, token compatibility contract, quality method and self-audit. Use for visual design, theme selection and on-theme components; not backend architecture or generic Deno tooling.'
---

<!-- Generated from https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/GUIDELINES.md; source SHA-256: 9f02cb226c3b914c3fb9d31ec738da8749691bf9bebefca4ed9fc5bc4be3416f. -->

# NetScript design

## Theme an app today

New Fresh apps start on **Studio Utility** (`studio-utility`): ink on neutral gray,
sharp corners, hairline rules and compact density. Preserve an app's chosen preset unless the
user asks to change it. Read [Theme your app](https://rickylabs.github.io/netscript/web-layer/how-to/theme-your-app/)
(MCP/local-doc slug: `web-layer/how-to/theme-your-app`) for current commands and app wiring.

Switch the whole app with `netscript ui:apply --preset <preset-id>`, for example
`netscript ui:apply --preset studio-cloud`. In a workspace, add `--app <name>`.
The command records the preset in `tokens.config.json`, rebuilds generated assets, keeps
the semantic override file and installs the registry-owned DESIGN.md/SKILL.md pair under
`.agents/skills/fresh-ui-theme-<preset-id>/` relative to the Fresh app. Read that pair first.
In a scaffolded workspace, select `apps/<app>/` (the app selected by `--app`) before resolving
these paths. The shared skill can live at the workspace root while the theme pair lives inside
the app. In a standalone Fresh app, resolve them from its root. Do not resolve app paths relative
to this SKILL.md.
Use `netscript init my-app --preset <preset-id>` to choose a preset at scaffold time.
`ui:add theme-<preset-id>` alone does not select the app's token preset.

The current tokens v2 IDs and document links below come from the theme registry. A design
language name such as `studio` is not a preset ID; use `studio-utility` or another
listed Studio flavor. `ns-one` preserves the earlier default.

| Preset ID | Installed pair (paths relative to the selected Fresh app) | Published source pair |
| --- | --- | --- |
| ns-one | `.agents/skills/fresh-ui-theme-ns-one/DESIGN.md` · `.agents/skills/fresh-ui-theme-ns-one/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/SKILL.md) |
| studio-utility | `.agents/skills/fresh-ui-theme-studio-utility/DESIGN.md` · `.agents/skills/fresh-ui-theme-studio-utility/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/SKILL.md) |
| studio-cloud | `.agents/skills/fresh-ui-theme-studio-cloud/DESIGN.md` · `.agents/skills/fresh-ui-theme-studio-cloud/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/SKILL.md) |
| studio-workshop | `.agents/skills/fresh-ui-theme-studio-workshop/DESIGN.md` · `.agents/skills/fresh-ui-theme-studio-workshop/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/SKILL.md) |
| studio-playful | `.agents/skills/fresh-ui-theme-studio-playful/DESIGN.md` · `.agents/skills/fresh-ui-theme-studio-playful/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/SKILL.md) |
| studio-ledger | `.agents/skills/fresh-ui-theme-studio-ledger/DESIGN.md` · `.agents/skills/fresh-ui-theme-studio-ledger/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/SKILL.md) |
| studio-atelier | `.agents/skills/fresh-ui-theme-studio-atelier/DESIGN.md` · `.agents/skills/fresh-ui-theme-studio-atelier/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/SKILL.md) |
| studio-signal | `.agents/skills/fresh-ui-theme-studio-signal/DESIGN.md` · `.agents/skills/fresh-ui-theme-studio-signal/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/studio/SKILL.md) |
| tonal | `.agents/skills/fresh-ui-theme-tonal/DESIGN.md` · `.agents/skills/fresh-ui-theme-tonal/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/tonal/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/tonal/SKILL.md) |
| bloom | `.agents/skills/fresh-ui-theme-bloom/DESIGN.md` · `.agents/skills/fresh-ui-theme-bloom/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/bloom/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/bloom/SKILL.md) |
| cupertino | `.agents/skills/fresh-ui-theme-cupertino/DESIGN.md` · `.agents/skills/fresh-ui-theme-cupertino/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/cupertino/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/cupertino/SKILL.md) |
| liquid | `.agents/skills/fresh-ui-theme-liquid/DESIGN.md` · `.agents/skills/fresh-ui-theme-liquid/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/liquid/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/liquid/SKILL.md) |
| fluent | `.agents/skills/fresh-ui-theme-fluent/DESIGN.md` · `.agents/skills/fresh-ui-theme-fluent/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/fluent/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/fluent/SKILL.md) |
| brutal | `.agents/skills/fresh-ui-theme-brutal/DESIGN.md` · `.agents/skills/fresh-ui-theme-brutal/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/brutal/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/brutal/SKILL.md) |
| filigrane | `.agents/skills/fresh-ui-theme-filigrane/DESIGN.md` · `.agents/skills/fresh-ui-theme-filigrane/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/filigrane/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/filigrane/SKILL.md) |
| terminal | `.agents/skills/fresh-ui-theme-terminal/DESIGN.md` · `.agents/skills/fresh-ui-theme-terminal/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/terminal/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/terminal/SKILL.md) |
| pixel | `.agents/skills/fresh-ui-theme-pixel/DESIGN.md` · `.agents/skills/fresh-ui-theme-pixel/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/pixel/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/pixel/SKILL.md) |
| tactile | `.agents/skills/fresh-ui-theme-tactile/DESIGN.md` · `.agents/skills/fresh-ui-theme-tactile/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/tactile/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/themes/tactile/SKILL.md) |
| ledger | `.agents/skills/fresh-ui-theme-ledger/DESIGN.md` · `.agents/skills/fresh-ui-theme-ledger/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/ledger/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/ledger/SKILL.md) |
| signal | `.agents/skills/fresh-ui-theme-signal/DESIGN.md` · `.agents/skills/fresh-ui-theme-signal/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/signal/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/signal/SKILL.md) |
| glass | `.agents/skills/fresh-ui-theme-glass/DESIGN.md` · `.agents/skills/fresh-ui-theme-glass/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/glass/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/glass/SKILL.md) |
| macos-27 | `.agents/skills/fresh-ui-theme-macos-27/DESIGN.md` · `.agents/skills/fresh-ui-theme-macos-27/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/macos-27/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/macos-27/SKILL.md) |
| apple-classic | `.agents/skills/fresh-ui-theme-apple-classic/DESIGN.md` · `.agents/skills/fresh-ui-theme-apple-classic/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/apple-classic/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/apple-classic/SKILL.md) |
| fluent-2-web | `.agents/skills/fresh-ui-theme-fluent-2-web/DESIGN.md` · `.agents/skills/fresh-ui-theme-fluent-2-web/SKILL.md` | [DESIGN.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/fluent-2-web/DESIGN.md) · [SKILL.md](https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/token-presets/fluent-2-web/SKILL.md) |

## Shared design rules

Use the [bundled canonical guidelines](references/GUIDELINES.md) for the shared rules. They are a
local snapshot of the design-system source. Their provisional/planned implementation notes
describe the original design plan; use Theme your app and the installed pair for current tokens
v2 behavior and CLI availability.

- **Choose a theme:** read §6 (theme catalogue) and §2.3 (preset design constraints), then the chosen
  theme's pair. Follow the user's goal and the current preset IDs above;
  the catalogue distinguishes faithful, inspired and own languages.
- **Build compatible UI:** read §1 (ownership), §2 (theme architecture) and §3 (compatibility
  contract), plus the chosen DESIGN.md and SKILL.md. Use semantic/component tokens and check
  light and dark schemes. Discover CLI/API operations through the installed NetScript tooling.
- **Check the result:** follow §4 (quality method), especially §4.5 (self-audit), and §5
  (anti-patterns). The chosen theme pair supplies the concrete visual rules and state coverage.
- **Create a theme:** follow §7 and the planned shipping boundary in §8; do not improvise a
  competing token contract.

## Theme specifications and procedures

`ui:apply` installs each preset's pair through its registry theme item. The local pair is the
source of truth for that app; this shared skill links to it without duplicating its contents.
When the pair is not installed, use the published preset links above. The eleven complete
design-language specifications are also listed below and linked by the
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
