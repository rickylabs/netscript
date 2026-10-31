# Environment

RTK is absent. Native git/gh/deno work. Feature matrix is resolved by deno task agentic:matrix --tier feature --json. Public run files must contain repo-relative paths and no evaluator session identity. Private evaluator streams belong in the project runs area outside the repository.

The repair checkout initially has no Git author configuration despite the dispatcher assumption. Use repository-local identity matching the authenticated GitHub account and the previous branch commit; do not change global config or add attribution footers.
