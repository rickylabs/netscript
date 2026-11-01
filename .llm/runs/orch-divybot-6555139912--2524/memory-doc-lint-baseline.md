# Existing full-export documentation findings

The optional structured full-export doc-lint on Fresh UI reports124findings
(96privateTypeRef,28missingJSDoc) at baseline6a1d84a. All16finding source files
are byte-identical in the CSS-budget patch; source hashes are in doc-lint-baseline.json.
No public types were changed. Native publish dry-run and JSRaudit pass with their
existing warnings. Keep this additional diagnostic separate from the owner-required
release preflight, scoped checks and check:* carrier suite; do not silently call it green.
