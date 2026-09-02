# Implementation brief

Publish the existing Fresh manifest resolver, discovery function, synchronous writer, and their
five manifest types from `@netscript/fresh/vite`. Add a CLI scaffold adapter that delegates to
those public functions, returns Fresh-owned discovery metadata, and exposes generated source for
content comparison. Test the public entrypoint and adapter with temporary filesystem fixtures,
including route-contract sidecar discovery. Do not start a server, call the adapter from a command,
export page-module rewriting, or touch any product path outside Slice B's six-file ceiling.
