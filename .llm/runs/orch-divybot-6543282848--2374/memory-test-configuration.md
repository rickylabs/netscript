# Cross-package test configuration

CLI entrypoints explicitly use isolatedDeclarations:false; plugin tests inherit true. Directly importing the host generator into a plugin test exposes unrelated CLI constant TS9010 failures. Put generator/doctor integration coverage under the CLI feature's own directory (separate test file), while inspector/generator unit tests stay under plugin tests. Do not change compiler settings or use no-check as a positive verdict.
