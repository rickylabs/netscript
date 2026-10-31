# Installed preview availability

Preset membership in tokens.json does not imply static preview CSS was installed. Default app builds emit five core files; --previews/theme-previews is optional. Vite's lazy import.meta.glob on /static/presets/*.css supplies exact installed filesystem keys without a failed HTTP probe. HTTP URLs omit static/. Real Vite 7.2.2 SSR probe returned no keys without previews and the exact installed key with one.
