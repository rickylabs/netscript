# Evidence preparation failure retained

prepare-gates.ts wrote the exact eight-file/two-owner gate driver, then failed before writing
protected-bindings.json because owners existed only inside the generated script string:

```text
error: Uncaught (in promise) ReferenceError: owners is not defined
    at file:///C:/Users/ericc/source/repos/netscript-native-host-policy-008/.llm/tmp/native-host-policy-u1-s6f-astra-20261028/prepare-gates.ts:11:144
    at Array.find (<anonymous>)
    at file:///C:/Users/ericc/source/repos/netscript-native-host-policy-008/.llm/tmp/native-host-policy-u1-s6f-astra-20261028/prepare-gates.ts:11:123
```

PowerShell continued to the subsequent gate-driver command; this is not a successful preparation
receipt. Gate driver/source/argv are unaffected. Original preparation script is preserved. Separate
prepare-bindings.ts writes the reviewed369 protected rows plus the sole fixture exception using
the previously verified370-row root proposal baseline. No shipping source or permissions changed
to repair this evidence-only error, and it does not warrant repeating already valid native gates.
