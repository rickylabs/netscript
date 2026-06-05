# @netscript/contracts Architecture

`@netscript/contracts` is the foundation package for NetScript package and plugin contracts.

The root export is intentionally narrow:

- base oRPC contract primitive;
- common error schemas and helpers;
- pagination schemas;
- result and schema primitive types;
- diagnostic inspection.

Richer helper APIs are split into named subexports:

- `@netscript/contracts/crud`
- `@netscript/contracts/query`
- `@netscript/contracts/transform`

This keeps the root package suitable for broad public consumption while allowing consumers to opt
into helper APIs that imply a specific implementation style.

The previous `@netscript/shared` name was retired because it described package placement instead of
package responsibility. The public responsibility is contracts.
