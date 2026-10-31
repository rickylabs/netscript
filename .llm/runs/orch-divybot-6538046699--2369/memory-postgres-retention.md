# PostgreSQL retention validation

The installed-schema outer test also runs the nine retention conformance cases using its generated client. Set SAGA_COMMAND_EVIDENCE to a private prefix to retain actual child test output; SAGA_COMMAND_TEST_FILTER runs one retention case on fresh-install mode for guard controls. Standalone consumers importing workspace APIs need the full locked workspace import map/catalog, as used by the existing saga provider fixture; published fallbacks otherwise resolve fresh Fedify versions and fail frozen-fixture validation.

Native test invocation: COMMAND_POSTGRES_BIN=<native bin> bash .llm/tools/command-postgres-conformance.sh (full suite), or use an isolated native socket server with the structured wrapper on packages/database/tests/saga-command-postgres_test.ts. SQL-sidecar install proof uses its own createdb/dropdb database. No Docker or Aspire is needed for these tests.

Replay DELETE compares PostgreSQL envelope::text, preserving numeric precision for database-owned JSON integers above JavaScript safe integer range. Primary-key cursors are required for progress across retained pages.
