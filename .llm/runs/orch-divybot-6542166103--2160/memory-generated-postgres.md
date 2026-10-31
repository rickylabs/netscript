# Generated PostgreSQL projection assertions

Real PostgreSQL conformance comes from tests/fixtures/transition-store/
postgres-conformance.ts.template, rendered by provider-fixture.ts. It is not a .ts
file and the live wrapper skips without COMMAND_POSTGRES_SOCKET, so local suite
success does not execute its inner assertions. A projection-format change must
update both first/recovered and second-transition row assertions in that template.
The versioned row now preserves business status as well as count in both stages.
