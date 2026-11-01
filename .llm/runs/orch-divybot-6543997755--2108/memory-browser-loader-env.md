# Browser loader environment during scaffold tests

On a host with an installed test browser but privately extracted shared libraries, put the loader environment in a private browser launcher and pass its executable through NETSCRIPT_E2E_BROWSER_EXECUTABLE. Do not put LD_LIBRARY_PATH on the parent Deno test: public CLI formatting subprocesses intentionally have narrow executable permissions, and Deno rejects spawning those with an injected loader environment. The browser launcher scopes the library path to Chrome alone. Keep all launcher/library paths outside public evidence.

TMPDIR may be mounted noexec: executable launchers must live in the project runs directory, while temporary data stays in TMPDIR. Same-source generated-browser-conformance rerun then passed all3 tests with the positive flow and both controls intact.
