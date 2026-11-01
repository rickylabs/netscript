# 2026-10-31 — Local install must launch local service exports

ensureLocalPluginImports registered composing-plugin aliases, but local appsettings still used the generic JSR /services entrypoint. Doctor then fetches published metadata and Aspire starts the published release instead of the branch. The local installer now uses the package export map's ./services target as its service entrypoint, after root import reconciliation. Public/JSR installs retain exact published pins. This is essential for a truthful local-source capstone and avoids temporary test-only rewrites of generated helpers.
