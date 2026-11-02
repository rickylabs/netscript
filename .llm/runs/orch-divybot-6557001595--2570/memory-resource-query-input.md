# Resource generation provenance

Init can supply required pagination arguments that public procedure selection cannot
infer. Preserve explicit generated arguments in loader-only optional queryInput
metadata. Body hashes do not authenticate marker values: recover only when the
current selected client/procedure regenerates the entire loader byte for byte.
Old strict schema-1 readers conflict safely on the optional extension. Never weaken
reconciliation or use force to hide a changed generated loader. Regression coverage:
public/features/root/public-command-tree_test.ts and
public/features/generate/resource/generate-resource_test.ts beneath packages/cli/src.

The original scaffold inventory omitted kernel/templates/app/*_test.ts,
kernel/application/ui/page/{web-scaffold,app-navigation}_test.ts and the public root
command tree. Keep s5-test-inventory.json as the expanded 51-file inventory.
