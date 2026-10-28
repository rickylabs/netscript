# SAME-session integration integrated-six-gates part7
HEAD88ae6fcacd36573b2f2f6244f4bebc31e49fc5e5; ordered full-content fragment.


## FULL .llm/runs/fix-security-db--integration-20261028/evidence/combined-qualification.json
Raw SHA256:729267e19b74f050875cdf6e1c9c54623708cd9d86a8a94a2d880e9375c5fb15; rawBytes:1790
{
  "qualifiedSourceHead": "c243d31535027addc034c99e170cb43d2faf475a",
  "exactSevenOriginBytes": true,
  "gates": [
    {
      "name": "db-owning",
      "outcome": "PASS",
      "exitCode": 0,
      "durationMs": 1038
    },
    {
      "name": "db-check",
      "outcome": "PASS",
      "exitCode": 0,
      "durationMs": 771
    },
    {
      "name": "db-lint-canonical",
      "outcome": "PASS",
      "exitCode": 0,
      "durationMs": 181
    },
    {
      "name": "db-fmt",
      "outcome": "PASS",
      "exitCode": 0,
      "durationMs": 269
    },
    {
      "name": "audit-critical",
      "outcome": "PASS",
      "exitCode": 0,
      "durationMs": 908
    },
    {
      "name": "arch-check",
      "outcome": "PASS",
      "exitCode": 0,
      "durationMs": 22409
    }
  ],
  "dbOwning": {
    "passed": 6,
    "failed": 0,
    "ignored": 0,
    "totalResults": 6,
    "uniqueFailures": 0
  },
  "staticSelection": 2,
  "criticalAudit": "47lower findings;0critical; native exit0",
  "coldIdentities": [
    "db-alignment sdk-fresh identities=@tanstack/db@0.13.0_typescript@7.0.2",
    "db-alignment fresh-only identities=@tanstack/db@0.13.0_typescript@7.0.2",
    "db-alignment PASS"
  ],
  "compositeNativeStdoutBytes": 48308,
  "compositeNativeStderrBytes": 1744,
  "fullNativeCompositeTextCaptured": true,
  "cleanup": {
    "at": "2026-10-28T04:37:31.4962392Z",
    "ownedTempEntries": 0,
    "rootPackageJsonExists": false,
    "ownedNativeProcessesObserved": 0,
    "observation": "Win32_Process deno.exe filtered by exact worktree command line after all gate runners settled"
  },
  "lintRulesExact": true,
  "oldLintExclusionReceiptPreservedInDbLeaf": true,
  "parentBaselineUnwaived": true,
  "noInference": true,
  "noIndependentIntegrationVerdictYet": true
}

## FULL .llm/runs/fix-security-db--integration-20261028/evidence/db-owning.json
Raw SHA256:5c26794b1c53b87dba62713d74145a90f1ca57da18fe04475908349c0737f14d; rawBytes:417
{
  "schemaVersion": 1,
  "command": [
    "deno",
    "test",
    "--reporter=tap",
    "--cached-only",
    "--frozen",
    "--check",
    "--allow-all",
    "--sanitize-ops",
    "--sanitize-resources",
    "--trace-leaks",
    ".llm/tools/deps/check-db-alignment_test.ts"
  ],
  "cwd": "C:\\Users\\ericc\\source\\repos\\netscript-better-auth-security-008",
  "exitCode": 0,
  "durationMs": 866,
  "summary": {
    "passed": 6,
    "failed": 0,
    "ignored": 0,
    "totalResults": 6,
    "uniqueFailures": 0
  },
  "failures": []
}

## FULL .llm/runs/fix-security-db--integration-20261028/evidence/db-check.json
Raw SHA256:5a58378425da72fed87e7cd843813d4cf14c95e8988939307060be80852dd49b; rawBytes:337
{
  "source": {
    "mode": "selection",
    "cwd": "C:\\Users\\ericc\\source\\repos\\netscript-better-auth-security-008"
  },
  "command": "deno check --unstable-kv --cached-only --frozen <files>",
  "selection": {
    "filesSelected": 2,
    "batches": 1,
    "failedBatches": 0
  },
  "summary": {
    "totalOccurrences": 0,
    "uniqueOccurrences": 0,
    "uniqueCodes": 0,
    "uniquePaths": 0
  },
  "groups": []
}

## FULL .llm/runs/fix-security-db--integration-20261028/evidence/db-lint-canonical.json
Raw SHA256:67b5e4e9a6361e7f2790563106bbc093f46630e73d376731fdc7ed164cd9f3da; rawBytes:362
{
  "source": {
    "mode": "command",
    "cwd": "C:\\Users\\ericc\\source\\repos\\netscript-better-auth-security-008",
    "exitCode": 0
  },
  "selection": {
    "filesSelected": 2,
    "batches": 1,
    "failedBatches": 0
  },
  "coverage": {
    "filesSelected": 2,
    "filesProcessed": 2,
    "droppedFiles": [],
    "refusals": []
  },
  "summary": {
    "totalOccurrences": 0,
    "uniqueOccurrences": 0,
    "uniqueRules": 0,
    "uniquePaths": 0
  },
  "groups": []
}

## FULL .llm/runs/fix-security-db--integration-20261028/evidence/db-fmt.json
Raw SHA256:391ff91f31530e33acae0bb50c860506ab8c315d003327eaccc84725124d7de6; rawBytes:311
{
  "command": "deno fmt --check",
  "cwd": "C:\\Users\\ericc\\source\\repos\\netscript-better-auth-security-008",
  "mode": "check",
  "summary": {
    "filesSelected": 2,
    "batches": 1,
    "failedBatches": 0,
    "findings": 0,
    "ignoredFindings": 0
  },
  "coverage": {
    "filesSelected": 2,
    "filesProcessed": 2,
    "droppedFiles": [],
    "refusals": []
  },
  "findings": []
}

## FULL .llm/runs/fix-security-db--integration-20261028/evidence/audit-critical.receipt.json
Raw SHA256:e74ff897c21a2a9d90633ad5a9ebc0ab08ad24c7e930fc1e2fff2cfdf2ec9e4f; rawBytes:925
{
  "outcome": "PASS",
  "startedAt": "2026-10-28T04:35:31.962Z",
  "finishedAt": "2026-10-28T04:35:32.870Z",
  "durationMs": 908,
  "exitCode": 0,
  "stdout": {
    "bytes": 75,
    "sha256": "ad243fc31fc43a63836efa8f029ab1a206d535634583e2a9d20c05857f679492",
    "tail": "[Decoded string block1; full text follows]",
    "truncated": false
  },
  "stderr": {
    "bytes": 48,
    "sha256": "f07abc59413789c36d5deaadbe14116f18ba430d5c11b91a4c1e6619774681c9",
    "tail": "[Decoded string block2; full text follows]",
    "truncated": false
  },
  "gateId": "audit-critical",
  "gitHead": "c243d31535027addc034c99e170cb43d2faf475a",
  "args": [
    "task",
    "audit:critical"
  ],
  "timeoutMs": 120000,
  "runner": "/root/service_qualification_sol",
  "capture": "Canonical runProcess with1MiB stream tail; full bytes/hash always retained; actual truncation flag authoritative"
}

### Decoded string block1; long lines partitioned without omitted characters
Found 47 vulnerabilities
Severity: 4 low, 23 moderate, 20 high, 0 critical


### Decoded string block2; long lines partitioned without omitted characters
Task audit:critical deno audit --level critical


## FULL .llm/runs/fix-security-db--integration-20261028/evidence/lint-canonical-rules.json
Raw SHA256:6719ae56409be666c395e987e248958bd4af54efa9e3f23d6575c4362fcb9c0a; rawBytes:185
{
  "lint": {
    "rules": {
      "tags": [
        "recommended",
        "jsr"
      ],
      "include": [
        "no-process-global",
        "no-node-globals"
      ]
    }
  }
}

## FULL .llm/runs/fix-security-db--integration-20261028/evidence/cleanup.json
Raw SHA256:baca7b916fadf9ac9d2ff511fee373d58afa4a341e1f5ece54d265f9435096cc; rawBytes:273
{
  "at": "2026-10-28T04:37:31.4962392Z",
  "ownedTempEntries": 0,
  "rootPackageJsonExists": false,
  "ownedNativeProcessesObserved": 0,
  "observation": "Win32_Process deno.exe filtered by exact worktree command line after all gate runners settled"
}

