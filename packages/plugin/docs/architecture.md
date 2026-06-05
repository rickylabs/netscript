# Architecture

`@netscript/plugin` is an Arch-4 DSL/builder package. The DSL and manifest types live under
config/domain, CLI contracts under cli, SDK discovery under sdk, and diagnostics under diagnostics.

```
domain -> config -> cli/sdk/application -> adapters/testing/diagnostics
```
