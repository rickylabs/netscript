# Root discovery reaches mutation consumers

inspectSagasProject feeds sagaPaths in local-runtime-backend.ts, used by update-saga and remove-saga. Expanding discovery to a shared root config makes it dangerous to treat configIds as independently owned files. Root-declared ids must refuse both commands before any writes/deletes and give manual-edit remediation, even when a matching companion exists. Regression assertions compare the entire source map, not just root file existence.
