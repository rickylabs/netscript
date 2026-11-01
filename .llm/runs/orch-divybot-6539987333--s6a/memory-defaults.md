# New-app preset selection

Keep the low-level buildTokens and tokens init legacy default. Scaffold uses the legacy registry installer, so pass UI_DEFAULT_THEME=theme-studio-utility in write-app-files.ts. ui:init uses the v2 registry installer: choose that theme only if no components.json, tokens.config.json or assets/theme-preset.json exists. New preset copying includes correct token CSS and metadata without regenerating Figma values. Generated app HTML uses data-theme=studio and data-flavor=utility, not only data-theme=studio-utility.

Maintainer init rejects paths outside the monorepo; use the declared local scaffold scratch root and retain only compact evidence in Git.
