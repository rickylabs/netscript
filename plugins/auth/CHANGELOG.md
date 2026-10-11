# Changelog

## Unreleased — 0.0.8

- `AuthServiceApp` now aliases `Readonly<ServiceApp>` so its methods match the service runtime.
  `fetch` narrows from `(Request | string | URL, RequestInit?)` to `(Request, ServiceEnvironment?)`.
  Pass a `Request` to `fetch`; pass socket metadata as the second argument. For a URL/string and
  optional `RequestInit`, use `request(input, init, env)` instead. This is a public TypeScript
  signature correction; callers using the former `fetch` type must migrate. The previous type
  described `request` semantics rather than the actual `fetch` runtime.
