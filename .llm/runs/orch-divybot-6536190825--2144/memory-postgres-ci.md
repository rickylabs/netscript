# PostgreSQL CI comparison

command-postgres.yml runs on worker changes even while a PR is draft, unlike the main CI matrix. Its latest prior main run also fails the generated saga provider fixture. Before blaming a worker change, compare the full child fixture failure, not only the generic workflow result. workflow_dispatch is available to verify current main independently. Keep remote logs temporary because they contain environment paths; preserve public run links and a sanitized failure summary in the run record.
