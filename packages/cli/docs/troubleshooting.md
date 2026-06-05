# Troubleshooting

## Project Root Not Found

Commands that modify an existing workspace need a NetScript project root. Run the command from the
workspace directory or pass the relevant project-root option.

## Database Tooling Fails

Database commands may call external tooling. Confirm that the generated workspace has dependencies
installed, the database is reachable, and required environment variables are set.

## Windows Deployment Fails

Deployment commands require a Windows target environment and the configured service-management
tooling. Check the deployment manifest, generated service names, and process permissions first.

## Generated Files Are Not Updated

Commands preserve files unless the command supports and receives an overwrite flag. Re-run with the
appropriate overwrite option when you want generated files replaced.

## Maintainer Command Used In A Regular Workspace

`netscript-dev` expects repository-local package sources and tooling. Use `netscript` for normal
project workspaces.
