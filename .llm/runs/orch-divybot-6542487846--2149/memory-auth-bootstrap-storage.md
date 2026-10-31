# Auth bootstrap must follow selected storage

Setting RequiresDb:false removes the SQL URI from auth's Aspire resource even when the project has PostgreSQL. Calling ctx.db.getClient unconditionally in plugins/auth/services/src/main.ts then crashes at startup with a missing connection string. A KV-only project's SQL seam returning{} hides this bug; use a throwing SQL collaborator in real bootstrap tests. Resolve via the same canonical backend/appsettings/env precedence used by backend-registry construction. Only better-auth requests SQL and configures service DB context. KV and hosted WorkOS bootstrap without SQL, including on SQL-enabled projects.

Actual proof: full SQLite runtime at3b219fd passes113 gates; PostgreSQL fails runtime.aspire-start, auth Finished. Runtime startup error is a product dependency failure, not a reason to widen timeouts or retry. Keep raw CI artifacts private and public proof linked by job URL.
