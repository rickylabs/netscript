# Native host validation findings

S3 baseline memory: workers OpenAPI document returnsHTTP500 on exact main
6a71cd0599673d70cd6311de3bb20b2d6a9dde2c using the public legacy factory and owned KV.
The host-policy test compares legacy/factory parity; it does not assert a healthy document.
SDK describe/listJobs, REST, canonical/deprecated RPC, actual SSE and stream publication pass.
Missing guarded credentials still401 before OpenAPI handling. This inherited router defect is
not introduced or fixed by startup policy. No secret material is published in evidence.

Native auth defaults protect/api only. Raw streams hosts must explicitly selectprotect:['/']
or their intended prefix. All singular examples and the one host guide now say so; factories
forward native policy unchanged. Shared runtime sandbox flags are opt-in for DenoKV and native
self-signal only; negative permission controls and existing budgets remain unchanged. Checked
workers compiler consumers alone use30s after two isolated10s deadline failures.
