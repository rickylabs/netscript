# Migration and install proof

Plugin manifest withMigrations previously had no consumer. SQL CHECK delivery now follows *.migration.sql sidecars installed beside Prisma fragments; database migration tooling appends them before deploy with immutable path/hash markers. Prisma 7.10 migrate diff requires a loaded datasource config even for --from-empty: otherwise schema-engine rejects missing --datasource and CLI can exit zero without output. Pass --config and require the --output artifact. Isolate real proof in its own createdb/dropdb database.

CLI imports under database isolatedDeclarations settings expose unrelated legacy CLI constants; installation probe runs in a separate CLI-configured subprocess. Split reviewed fixture SQL only after removing line comments (its first comment contains a semicolon).
