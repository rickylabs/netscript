# ffi-interop — raw source extracts (RFC-5)

Group: `ffi-interop`. Focus: **guest → host callback direction** (how a guest task calls back
into a host-provided API), marshalling limits, thread-safety constraints.
All fetches performed 2026-08-20.

---

## 1. Bootsharp (C# / .NET wasm ↔ JS host)

### 1.1 Source: https://bootsharp.com/ and https://bootsharp.com/guide/ (fetched 2026-08-20)

- "Bootsharp streamlines the integration of .NET C# apps and libraries into web projects."
- Positioning: "enables high-level interoperation between C# and TypeScript, so each layer can be
  developed within its optimal environment" — as opposed to Blazor bringing the whole web platform
  into .NET.
- Installed as a NuGet package; "automatically generates JavaScript bindings and type declarations
  when you provide C# interfaces describing export and import API surfaces."
- Ships as a standard ES module with a `package.json`.

Consumer-side workflow sample (from the guide index):

```typescript
// Import compiled C# solution
import bootsharp, { Backend, Frontend } from "backend";

// Initialize WASM module
await bootsharp.boot();

// Subscribe to C# events
Frontend.onUserChanged.subscribe(updateUserUI);

// Invoke C# methods
Backend.addUser({ name: "Carl" });
```

Feature list: interface-based interop; automatic binding generation; export/import bindings via
static methods **or** interfaces; event subscriptions from C# to JavaScript; automatic bundling on
publish.

Sitemap (https://bootsharp.com/sitemap.xml, fetched 2026-08-20) — 26 URLs. Guide pages:
`/guide/`, `getting-started`, `build-config`, `declarations`, `renaming`, `serialization`,
`sideloading`, `specialization`, `interop-instances`, `interop-modules`, `llvm`,
`extensions/dependency-injection`, `extensions/file-system`.
API pages: classes `CancellationToken`, `Collection`, `Dictionary`, `Event`, `List`; interfaces
`EventBroadcaster`, `EventSubscriber`; type aliases `BinaryResource`, `BootManifest`, `BootOptions`,
`BootResources`, `EventOptions`; variable `default`.

### 1.2 Source: https://bootsharp.com/guide/getting-started (fetched 2026-08-20)

Project file:

```xml
<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
        <TargetFramework>net10.0</TargetFramework>
        <RuntimeIdentifier>browser-wasm</RuntimeIdentifier>
    </PropertyGroup>
    <ItemGroup>
        <PackageReference Include="Bootsharp" Version="*-*"/>
    </ItemGroup>
</Project>
```

**The `[Import]` direction (C# calling a JS host function) — the citizenship-relevant half:**

```csharp
using System;
using Bootsharp;

public static partial class Program
{
    [Export]
    public static event Action<string>? OnMainInvoked;

    public static void Main()
    {
        OnMainInvoked?.Invoke($"Hello {GetFrontendName()}, .NET here!");
    }

    [Import]
    public static partial string GetFrontendName();

    [Export]
    public static string GetBackendName() => Environment.Version;
}
```

Notes on the shape: `[Import]` is applied to a `static partial` method with **no body** — the
source generator emits the body that calls out to JS. `[Export]` marks C# members (methods and
`event`s) callable/subscribable from JS.

JS host side (Node / Deno / Bun), showing that **host functions are supplied by assignment onto the
generated namespace object, before `boot()`**:

```javascript
import bootsharp, { Program } from "./bin/bootsharp/index.mjs";
Program.getFrontendName = () => process.version;
Program.onMainInvoked.subscribe(console.log);
await bootsharp.boot();
console.log(`Hello ${Program.getBackendName()}!`);
```

Naming convention: C# `GetFrontendName` → JS `getFrontendName` (camelCase); C# `OnMainInvoked`
event → JS `onMainInvoked` with `.subscribe(...)`.

The same page links: Introduction, Type Declarations (`/guide/declarations`), Interop Modules
(`/guide/interop-modules`), Interop Instances (`/guide/interop-instances`), Renaming,
Specialization, Build Configuration, Sideloading, NativeAOT-LLVM, Dependency Injection, File System.

### 1.3 Source: https://bootsharp.com/guide/interop-modules (fetched 2026-08-20)

- "Instead of manually authoring a binding for each member, let Bootsharp generate them
  automatically using the `[Import]` and `[Export]` **assembly** attributes."
- **Imported modules (JS → C#, i.e. C# calling out to the host) must be interfaces.** Bootsharp
  generates the C# implementation that communicates with JavaScript.

```csharp
interface IFrontend
{
    bool IsMuted { get; set; }
}

[assembly: Import(typeof(IFrontend))]
```

Generated TypeScript specification (what the host must implement):

```typescript
export namespace Frontend {
    export let isMuted: boolean;
}
```

"The JavaScript side provides the actual implementation matching this spec."

- **Exported modules can be either interfaces or non-static classes.**

```csharp
public interface IBackend
{
    event Action<Data> OnDataChanged;
    Data? Current { get; set; }
    void AddData(Data data);
}

[assembly: Export(typeof(IBackend))]
```

Generated TypeScript spec:

```typescript
export namespace Backend {
    export const onDataChanged: EventSubscriber<[data: Data]>;
    export let current: Data | undefined;
    export function addData(data: Data): void;
}
```

- Event direction rule (verbatim-ish): "Imported module events work the other way around: declare a
  real C# event on the interface, and Bootsharp will generate a JavaScript `EventBroadcaster` plus a
  regular subscribable event on the generated C# implementation."
  → i.e. **exported event = JS gets `EventSubscriber`; imported event = JS gets `EventBroadcaster`
  and C# gets a subscribable event.**
- Generated implementations can be auto-injected/initialized via Bootsharp's DI extension.

### 1.4 Source: https://bootsharp.com/guide/interop-instances (fetched 2026-08-20)

- When mutable types (classes or interfaces) cross the boundary: "Instead of serializing and
  copying it by value, Bootsharp will instead generate an instance binding and pass it by
  reference."
- C# objects exported to JS: JS get/set of properties triggers the real C# getters/setters. JS
  objects imported into C#: C# property accessors delegate to JavaScript. Method calls traverse in
  both directions.
- Limit (verbatim): "Only user types are subject to instance binding. BCL types are ignored to
  prevent leaking the entire .NET runtime into the generated interop layer."
- The page does **not** document disposal / lifetime / explicit cleanup for interop instances.

### 1.5 Source: https://bootsharp.com/guide/serialization (fetched 2026-08-20)

- Uses "a custom efficient binary serialization format" — **not JSON**. De-/serialization is
  automatic on both C# and JS sides; no generator hints or `[MarshallAs]` attributes required.
- Natively supported (in-memory marshalled) types:

| C# | JavaScript | Task support | Array support |
|---|---|---|---|
| bool | boolean | yes | no |
| byte | number | yes | yes |
| char | string | yes | no |
| string | string | yes | yes |
| int | number | yes | yes |
| long | BigInt | yes | no |
| float | Number | yes | no |
| DateTime | Date | yes | no |

- Rule: "Only types with immutable semantics (structs, records, and read-only collections) are
  subject to serialization." Mutable types are passed by reference as interop instances (see 1.4).
- Enums: marshalled as numbers, with name↔index mappings generated on the JS side.
- Dictionaries: marshalled as ES6 `Map`.
- Any `IReadOnlyList` / `IReadOnlyDictionary` / `IReadOnlyCollection`-compatible interface marshals
  as plain arrays or maps.
- Not addressed on that page: custom serializers, source-generated contexts, byte-array specifics,
  performance numbers.

### 1.6 Source: https://bootsharp.com/guide/declarations (fetched 2026-08-20)

- "One `.g.d.mts` file is emitted per C# namespace, colocated with the matching `.g.mjs` binding."
- Exported methods → namespace-wrapped TS functions.
- **Imported methods → emitted as properties that must be assigned before runtime initialization**
  (matches the `Program.getFrontendName = () => ...` pattern before `boot()`).
- Overloads: JS has none, so Bootsharp disambiguates — the overload with the fewest parameters keeps
  the original name; others get suffixes derived from parameter names (e.g. `WithInfo`,
  `WithProgress`).
- Generics: only a single type parameter constrained to user types expands into concrete overloads
  suffixed `Of...` (e.g. `createShapeOfCircle`).
- C# default arguments → optional TS parameters (`?:`).
- Properties: exported → TS variables; imported → accessor pairs requiring pre-boot assignment.
- Events: exported → `EventSubscriber` objects; imported → `EventBroadcaster` objects.
- Delegates: become TS function-type aliases, incl. `System.Action` / `System.Func` variants.
- XML doc comments mirror into the TS declarations.
- Nullability forms: nullable **argument** → `| undefined`; nullable **property** → `?`; nullable
  **return** → `| null`; nullable collection element / dictionary value → `| null`.
- Module organization: C# namespaces map to module paths, dots → separators, kebab-cased. Members
  without a namespace land in the default `index` module.

### 1.7 Failed / unavailable Bootsharp URLs

- `https://bootsharp.com/guide/interop.html` — 404
- `https://bootsharp.com/guide/interop` — 404
- `https://bootsharp.com/guide/emit-prefs` — 404 (page appears renamed; not in current sitemap)
- `https://raw.githubusercontent.com/elringus/bootsharp/main/README.md` — fetched but contains only
  badges + a pointer to https://bootsharp.com/guide (no protocol content).
- `elringus/bootsharp` via GitHub MCP — access denied (session limited to `rickylabs/netscript`).

---

## 2. wasmbuild + wasm-bindgen host imports (Rust wasm → JS host)

### 2.1 Source: https://github.com/denoland/wasmbuild and raw README (fetched 2026-08-20)

- "A build tool to generate wasm-bindgen glue code for Deno and the browser."
- Scaffold: `deno run -A jsr:@deno/wasmbuild new`
- `deno.json` task wiring:

```json
{
  "tasks": {
    "wasmbuild": "deno run -A @deno/wasmbuild"
  }
}
```

- Build: `deno task wasmbuild`. Generated bindings land at `./lib/<crate-name>.js`:

```javascript
import { add } from "./lib/rs_lib.js";
console.log(add(1, 1));
```

- CLI flags: `--debug` (unoptimized), `--inline` (embeds the Wasm module; for browser/Node
  environments lacking Wasm import capability), `--project <name>` / `-p <name>` (target a crate in
  a workspace), `--out <dir>` (default `./lib`), `--js-ext <ext>` (default `js`), `--all-features`,
  `--no-default-features`, `--features "..."`, `--skip-opt` (bypass `wasm-opt`), `--check`
  (validates that the checked-in output is up to date — CI gate).
- Compatibility: Deno 2.1+ (2.1.5+ when published to JSR).
- The README does not state a pinned wasm-bindgen version or discuss JS snippets.

### 2.2 wasm-bindgen: the JS-import direction

Source: https://wasm-bindgen.github.io/wasm-bindgen/reference/attributes/on-js-imports/index.html
(fetched 2026-08-20) — "This section enumerates the attributes available for customizing bindings
for JavaScript functions and classes imported into Rust within an `extern \"C\" { ... }` block."

Attribute inventory, from
https://raw.githubusercontent.com/wasm-bindgen/wasm-bindgen/main/guide/src/SUMMARY.md
(fetched 2026-08-20), section "On JavaScript Imports":

`catch`, `constructor`, `extends`, `generic_per_mono`, `getter`/`setter`, `final`,
`indexing_getter`/`indexing_setter`/`indexing_deleter`, `js_class`, `js_name`, `js_namespace`,
`method`, `module`, `raw_module`, `no_deref`, `no_upcast`, `no_promising`, `reexport`,
`slice_to_array`, `static_method_of`, `structural`, `typescript_type`, `variadic`,
`vendor_prefix`.

Supported-types sub-pages listed in SUMMARY.md: imported JavaScript types, exported Rust types,
enums, `JsValue`, `js-sys`, `Box<[T]>` and `Vec<T>`, pointers and `NonNull<T>`, numeric types,
`bool`, `char`, string variants, number slices, `Result<T, E>`.

#### 2.2.1 `module = "blah"` — verbatim
Source: https://raw.githubusercontent.com/wasm-bindgen/wasm-bindgen/main/guide/src/reference/attributes/on-js-imports/module.md (fetched 2026-08-20)

> The `module` attributes configures the module from which items are imported. For example,
>
> ```rust
> #[wasm_bindgen(module = "wu/tang/clan")]
> extern "C" {
>     type ThirtySixChambers;
> }
> ```
>
> generates JavaScript import glue like:
>
> ```js
> import { ThirtySixChambers } from "wu/tang/clan";
> ```
>
> If a `module` attribute is not present, then the global scope is used instead. For example,
>
> ```rust
> #[wasm_bindgen]
> extern "C" {
>     fn illmatic() -> u32;
> }
> ```
>
> generates JavaScript import glue like:
>
> ```js
> let illmatic = this.illmatic;
> ```
>
> Note that if the string specified with `module` starts with `./`, `../`, or `/` then it's
> interpreted as a path to a local JS snippet. If this doesn't work for your use case you might be
> interested in the `raw_module` attribute.

#### 2.2.2 `catch` — verbatim
Source: https://raw.githubusercontent.com/wasm-bindgen/wasm-bindgen/main/guide/src/reference/attributes/on-js-imports/catch.md (fetched 2026-08-20)

> The `catch` attribute allows catching a JavaScript exception. This can be attached to any imported
> function or method, and the function must return a `Result` where the `Err` payload is a
> `JsValue`:
>
> ```rust
> #[wasm_bindgen]
> extern "C" {
>     // `catch` on a standalone function.
>     #[wasm_bindgen(catch)]
>     fn foo() -> Result<(), JsValue>;
>
>     // `catch` on a method.
>     type Zoidberg;
>     #[wasm_bindgen(catch, method)]
>     fn woop_woop_woop(this: &Zoidberg) -> Result<u32, JsValue>;
> }
> ```
>
> If calling the imported function throws an exception, then `Err` will be returned with the
> exception that was raised. Otherwise, `Ok` is returned with the result of the function.
>
> > By default `wasm-bindgen` will take no action when Wasm calls a JS function which ends up
> > throwing an exception. The Wasm spec right now doesn't support stack unwinding and as a result
> > Rust code **will not execute destructors**. This can unfortunately cause memory leaks in Rust
> > right now.
> >
> > This limitation is entirely avoided when building with `-Cpanic=unwind` and the `std` feature
> > enabled. Unexpected JS exceptions that would otherwise cause issues will result in a proper
> > unwind, with the JS exception propagated to the caller and destructors running correctly.

#### 2.2.3 `js_namespace` (search-result summary, source page:
https://wasm-bindgen.github.io/wasm-bindgen/reference/attributes/on-js-imports/js_namespace.html)

> The `js_namespace` attribute indicates that the JavaScript type is accessed through the given
> namespace. It can be applied to any import (function or type) and whenever the generated
> JavaScript attempts to reference a name (like a class or function name) it'll be accessed through
> this namespace. For example, the `WebAssembly.Module` APIs are all accessed through the
> `WebAssembly` namespace.

#### 2.2.4 JS snippets — the local host-API attach point
Source: https://wasm-bindgen.github.io/wasm-bindgen/reference/js-snippets.html (fetched 2026-08-20)

- Purpose: include JS code alongside Rust when `js-sys`/`web-sys` don't cover the need.
- `module` form:

```rust
#[wasm_bindgen(module = "/js/foo.js")]
extern "C" {
    fn add(a: u32, b: u32) -> u32;
}
```

  Path is "relative to the crate root (where `Cargo.toml` is located)"; the file is automatically
  included in the final output. The JS file must use ES module syntax:

```javascript
export function add(a, b) {
    return a + b;
}
```

- `inline_js` form (intended for macro authors; hand-written code should prefer `module`):

```rust
#[wasm_bindgen(inline_js = "export function add(a, b) { return a + b; }")]
extern "C" {
    fn add(a: u32, b: u32) -> u32;
}
```

  "the JS module is specified inline in the attribute itself, and no files are loaded from the
  filesystem."

- **Limitations (verbatim-ish):**
  - "Import statements are not supported in the JS file" currently.
  - Only `--target web` and the default bundler output work — **not** `--target nodejs` and **not**
    `--target no-modules`.
  - Paths must begin with `/` or be rooted at the crate root; relative `./` paths are not yet
    supported.

### 2.3 Failed URLs (wasm-bindgen)

- `https://rustwasm.github.io/wasm-bindgen/reference/attributes/on-js-imports/index.html` — 404
  (canonical host is now `wasm-bindgen.github.io`).
- `https://rustwasm.github.io/wasm-bindgen/reference/js-snippets.html` — 404 (same reason).
- `https://wasm-bindgen.github.io/wasm-bindgen/reference/types.html` — fetched, but the index page
  contains only the section intro (no table); the per-type sub-pages hold the actual mappings. Note
  from that intro: several JS types support generic parameters via type erasure, incl. `Array<T>`,
  `Promise<T>`, `Map<K, V>`.

---

## 3. Go js/wasm — `syscall/js`

### 3.1 Source: https://pkg.go.dev/syscall/js (fetched 2026-08-20)

**Types**
- `Value` — a JavaScript value; zero value is `undefined`. Equality via `Equal()`.
- `Func` — wraps a Go function for JavaScript invocation; requires explicit `Release()`.
- `Type` — enum: `TypeUndefined`, `TypeNull`, `TypeBoolean`, `TypeNumber`, `TypeString`,
  `TypeSymbol`, `TypeObject`, `TypeFunction`.
- `Error` — wraps a JavaScript error; implements `error`.
- `ValueError` — raised when a `Value` method is invoked on an incompatible type.

**Constructors**
- `Global() Value` — the JS global object (`window` or `global`).
- `Null() Value`, `Undefined() Value`
- `ValueOf(x any) Value`
- `FuncOf(fn func(this Value, args []Value) any) Func`

**`Value` methods**
- Property access: `Get(p string)`, `Set(p string, x any)`, `Delete(p string)`, `Index(i int)`,
  `SetIndex(i int, x any)`
- Conversion: `Bool()`, `Int()`, `Float()`, `String()`, `Type()`
- Checks: `IsUndefined()`, `IsNull()`, `IsNaN()`, `Truthy()`, `InstanceOf(t Value)`
- Invocation: `Call(m string, args ...any)`, `Invoke(args ...any)`, `New(args ...any)`
- Utility: `Length()`, `Equal(w Value)`

**Bulk data transfer**
- `CopyBytesToGo(dst []byte, src Value) int` — from `Uint8Array` / `Uint8ClampedArray`
- `CopyBytesToJS(dst Value, src []byte) int` — to `Uint8Array` / `Uint8ClampedArray`

**Go → JS type mapping table**

| Go type | JavaScript equivalent |
|---|---|
| `js.Value` | [its value] |
| `js.Func` | function |
| `nil` | null |
| `bool` | boolean |
| integer + float types | number |
| `string` | string |
| `[]interface{}` | new array |
| `map[string]interface{}` | new object |

### 3.2 Source: https://raw.githubusercontent.com/golang/go/master/src/syscall/js/func.go
(fetched 2026-08-20)

```go
type Func struct {
	Value  // the JavaScript function that invokes the Go function
	bubble *synctest.Bubble
	id     uint32
}

func FuncOf(fn func(this Value, args []Value) any) Func
```

`FuncOf` doc comments, verbatim:

> FuncOf returns a function to be used by JavaScript. The Go function fn is called with the value of
> JavaScript's "this" keyword and the arguments of the invocation.
>
> Invoking the wrapped Go function from JavaScript will pause the event loop and spawn a new
> goroutine. Other wrapped functions which are triggered during a call from Go to JavaScript get
> executed on the same goroutine.
>
> If one wrapped function blocks, JavaScript's event loop is blocked until that function returns.
> Calling any async JavaScript API, which requires the event loop, like fetch (http.Client), will
> cause an immediate deadlock. A blocking function should explicitly start a new goroutine.
>
> Func.Release must be called to free up resources when the function will not be invoked any more.

```go
func (c Func) Release()
```

> Release frees up resources allocated for the function. The function must not be invoked after
> calling Release. It is allowed to call Release while the function is still running.

### 3.3 Failed / low-yield URLs (Go)

- `https://go.dev/wiki/WebAssembly` — fetched successfully but contains only build/setup/size-
  optimization material; it explicitly defers to `https://pkg.go.dev/syscall/js` for the interop
  API. No `js.FuncOf` / `select{}` keep-alive / `Release()` guidance on that page.

---

## 4. Deno FFI callbacks (native library → Deno JS)

### 4.1 Source: https://docs.deno.com/runtime/fundamentals/ffi/ (fetched 2026-08-20)

Callback creation pattern (as documented):

```js
new Deno.UnsafeCallback(
  { parameters: ["i32"], result: "void" } as const,
  (value) => { console.log("Callback received:", value); },
);
```

- Callbacks are instances built from a signature object plus a handler function.
- They expose a `.pointer` property for passing into native functions.
- Must be explicitly closed with `callback.close()` when finished.
- "pass JavaScript functions as callbacks to native code"; native code invoking the pointer triggers
  the JS function.
- Security framing: "Native code runs outside of Deno's security sandbox"; FFI requires
  `--allow-ffi`; "Native libraries loaded via FFI have the same access level as the Deno process
  itself."
- This page does **not** cover `threadSafe`, `ref`/`unref`.

FFI type mapping table from that page:

| FFI Type | Deno | C | Rust |
|---|---|---|---|
| `i32` | number | int | i32 |
| `i64` | bigint | long long int | i64 |
| `f64` | number | double | f64 |
| `pointer` | object/null | void * | *mut c_void |
| `buffer` | TypedArray/null | uint8_t * | *mut u8 |
| `function` | object/null | void (*fun)() | Option<extern "C" fn()> |

### 4.2 Source: https://docs.deno.com/api/deno/~/Deno.UnsafeCallback (fetched 2026-08-20)

```typescript
new UnsafeCallback<Definition extends UnsafeCallbackDefinition>(
  definition: Definition,
  callback: UnsafeCallbackFunction<Definition["parameters"], Definition["result"]>,
)
```

**Properties (readonly)**
- `pointer: PointerObject<Definition>` — the memory address of the unsafe callback.
- `definition: Definition` — the callback's type signature.
- `callback: UnsafeCallbackFunction<...>` — the underlying JS function.

**Methods**
- `close(): void` — invalidates the C function pointer and stops event-loop wakeup behavior.
- `ref(): number` — increments the reference count and enables event-loop wakeup when called from a
  foreign thread.
- `unref(): number` — decrements the reference count (does **not** disable event-loop wakeup).
- `static threadSafe<Definition>(...): UnsafeCallback<Definition>` — creates a callback with `ref()`
  already called once.

**Thread-safety text, verbatim:**

> All `UnsafeCallback` are always thread safe in that they can be called from foreign threads without
> crashing. However, they do not wake up the Deno event loop by default.

Use `UnsafeCallback.threadSafe()` or manual `ref()` when the callback must "wake up the Deno event
loop when called from foreign threads." That also "keeps Deno's process from exiting while the
callback still exists and is not unref'ed." Call `unref()` to give up that process-keepalive while
preserving event-loop wakeup capability.

### 4.3 Source: https://docs.deno.com/api/deno/~/Deno.UnsafeCallbackDefinition (fetched 2026-08-20)

Related `ForeignFunction` fields:
- `parameters`: readonly array of `NativeType`
- `result`: a `NativeResultType`
- `nonblocking?`: boolean — run on a blocking thread pool, returning a Promise
- `name?`: symbol name (defaults to the key name)
- `optional?`: when true, `dlopen` does not fail if the symbol is missing

`NativeType` union members:
- `NativeNumberType`: `"u8" | "i8" | "u16" | "i16" | "u32" | "i32" | "f32" | "f64"`
- `NativeBigIntType`: `"u64" | "i64" | "usize" | "isize"`
- `NativeBooleanType`: `"bool"`
- `NativePointerType`: `"pointer"`
- `NativeBufferType`: `"buffer"`
- `NativeFunctionType`: `"function"`
- `NativeStructType`: `{ struct: readonly NativeType[] }`

`NativeResultType` = `NativeType` plus `NativeVoidType`: `"void"` (return position only).

---

## 5. Cross-source note on the guest→host callback primitive (collection, not analysis)

Shapes as documented by each source, for the analyst's convenience:

| Channel | Guest-side declaration of a host function | Host-side supply of the implementation | Explicit release |
|---|---|---|---|
| Bootsharp | `[Import] public static partial T Name(...);` or `[assembly: Import(typeof(IFace))]` on an interface | assign onto the generated namespace (`Program.getFrontendName = () => ...`) **before `boot()`** | not documented |
| wasm-bindgen | `extern "C" { fn name(..) -> T; }` inside `#[wasm_bindgen(module = "...")]` / `inline_js = "..."` / global scope | ES-module export in the named module, or the global scope | n/a (import side) |
| Go `syscall/js` | `js.Global().Get("name").Invoke(...)` / `.Call(m, ...)`; host-callable Go funcs via `js.FuncOf` | JS defines globals/objects reachable from `js.Global()` | `Func.Release()` required |
| Deno FFI | native code invokes a C function pointer | `new Deno.UnsafeCallback(def, fn)` → pass `.pointer` into the native lib | `callback.close()` required |
