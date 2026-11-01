# Workers publishability audit

`audit-jsr-package.ts --root plugins/workers --text`: exit 0; dry-run OK. Existing export map unchanged (14 entrypoints); no new public types or dependencies. The audit reports three existing directory-cardinality warnings and a slow-type warning whose text is the publish progress banner “Checking for slow types in the public API...”. No publish or package-version change was performed.
