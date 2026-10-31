# 2026-10-31 — Auth install topology

Auth plugin-owned scaffolding emits auth/plugin.ts, auth/mod.ts, auth/sdk-client.ts, not plugins/auth. Schema integration historically walked only plugins/<name>/database; local source-package fragments are needed for the better-auth negative control. Root SQL schema destination is database/postgres/schema/plugins/auth/auth.prisma.

DB-free init is `netscript-dev init <name> --path <within-checkout> --db none --ci --yes --no-git --editor none`. Do not use --no-aspire for plugin install proof: the existing install flow regenerates helpers and rejects missing Aspire files. Generating AppHost files does not start runtime resources.

Local init copies core packages, not the auth composing plugin. The emitted bare @netscript/plugin-auth import must resolve locally for generate runtime-schemas and doctor; do not hide this defect with test-only useLocalWorkspaceImports.
