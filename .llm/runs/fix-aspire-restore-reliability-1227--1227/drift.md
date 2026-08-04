# Drift

## Workflow validator substitution

`actionlint` is not installed in the local environment. The three changed workflows were parsed
with `@std/yaml`, and a focused policy regression asserts the exact cache action/path/key count in
every runtime workflow. GitHub Actions remains the semantic workflow validator in the pre-merge gate.
