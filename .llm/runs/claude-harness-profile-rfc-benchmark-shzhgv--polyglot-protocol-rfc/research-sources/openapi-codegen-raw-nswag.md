# RFC-5 source extract — NSwag CSharpClientGenerator (openapi-codegen group)

Fetch date: 2026-08-20

Sources:

- https://github.com/RicoSuter/NSwag/wiki/CSharpClientGenerator (wiki page; prose)
- https://raw.githubusercontent.com/RicoSuter/NSwag/master/src/NSwag.CodeGeneration.CSharp/CSharpClientGeneratorSettings.cs
- https://raw.githubusercontent.com/RicoSuter/NSwag/master/src/NSwag.CodeGeneration/ClientGeneratorBaseSettings.cs
- https://raw.githubusercontent.com/RicoSuter/NSwag/master/src/NSwag.CodeGeneration.CSharp/CSharpGeneratorBaseSettings.cs
- https://raw.githubusercontent.com/RicoSuter/NSwag/master/src/NSwag.CodeGeneration.CSharp/Templates/File.liquid
- https://raw.githubusercontent.com/RicoSuter/NSwag/master/src/NSwag.CodeGeneration.CSharp/Templates/Client.Class.liquid
- https://raw.githubusercontent.com/RicoSuter/NJsonSchema/master/src/NJsonSchema.CodeGeneration.CSharp/CSharpGeneratorSettings.cs

Status: NSwag + NJsonSchema are the **official** (single-maintainer, RicoSuter) .NET
OpenAPI→C# path. Both MIT.

---

## 1. What the wiki page states (paraphrase of https://github.com/RicoSuter/NSwag/wiki/CSharpClientGenerator)

- The generator lives in the NuGet package `NSwag.CodeGeneration.CSharp`; it generates
  "C# client code and DTO classes" from a Swagger/OpenAPI document, driven by
  `CSharpClientGeneratorSettings`.
- Required dependencies of the **generated** code:
  - .NET Standard 1.4+: `Newtonsoft.Json`, `System.Net.Http`, `System.ComponentModel.Annotations`
  - full .NET: `Newtonsoft.Json`, `System.Runtime.Serialization` (GAC),
    `System.ComponentModel.DataAnnotations` (GAC)
  - PCL 259: `Newtonsoft.Json`, `Microsoft.Net.Http`, `Portable.DataAnnotations`
- Generated client classes are `partial`; extension points are the partial methods
  `PrepareRequest()` / `ProcessResponse()` (or their `...Async` forms — see
  `GeneratePrepareRequestAndProcessResponseAsAsyncMethods` below).
- Custom base class via `ClientBaseClass`, with `UseHttpClientCreationMethod` letting the
  base class own HttpClient instantiation and `UseHttpRequestMessageCreationMethod` letting
  it own `HttpRequestMessage` creation.
- Setting `ConfigurationClass` generates constructors that accept a configuration object and
  forward it to the base-class constructor (requires `ClientBaseClass`).
- For DI: set `InjectHttpClient = true` and `UseBaseUrl = false`; the injected HttpClient's
  `BaseAddress` must end with a forward slash.

---

## 2. Config surface — `CSharpClientGeneratorSettings` (verbatim from source)

Constructor defaults:

```
ClassName = "{controller}Client";
GenerateExceptionClasses = true;
ExceptionClass = "ApiException";
ClientClassAccessModifier = "public";
ClientInterfaceAccessModifier = "public";
UseBaseUrl = true;
HttpClientType = "System.Net.Http.HttpClient";
WrapDtoExceptions = true;
DisposeHttpClient = true;
ParameterDateTimeFormat = "s";
ParameterDateFormat = "yyyy-MM-dd";
GenerateUpdateJsonSerializerSettingsMethod = true;
UseRequestAndResponseSerializationSettings = false;
QueryNullValue = "";
GenerateBaseUrlProperty = true;
ExposeJsonSerializerSettings = false;
InjectHttpClient = true;
ProtectedMethods = [];
```

Properties (doc comments verbatim):

| Property | Type | Doc |
| --- | --- | --- |
| `ClientBaseClass` | string | full name of the base class |
| `ClientBaseInterface` | string | full name of the base interface |
| `ConfigurationClass` | string | full name of the configuration class (`ClientBaseClass` must be set) |
| `GenerateExceptionClasses` | bool | whether to generate exception classes (default: true) |
| `ExceptionClass` | string | name of the exception class (supports the `'{controller}'` placeholder, default `'ApiException'`) |
| `InjectHttpClient` | bool | whether an HttpClient instance is injected into the client (default: true) |
| `DisposeHttpClient` | bool | whether to dispose the HttpClient (injected HttpClient is never disposed, default: true) |
| `ProtectedMethods` | string[] | list of methods with a protected access modifier ("classname.methodname") |
| `UseHttpClientCreationMethod` | bool | call `CreateHttpClientAsync` on the base class to create a new HttpClient instance (cannot be used when the HttpClient is injected) |
| `UseHttpRequestMessageCreationMethod` | bool | call `CreateHttpRequestMessageAsync` on the base class to create a new HttpRequestMethod |
| `WrapDtoExceptions` | bool | whether DTO exceptions are wrapped in a SwaggerException instance (default: true) |
| `ClientClassAccessModifier` | string | client class access modifier (default: public) |
| `ClientInterfaceAccessModifier` | string | client interface access modifier (default: public) |
| `UseBaseUrl` | bool | whether to use and expose the base URL (default: true) |
| `GenerateBaseUrlProperty` | bool | whether to generate the BaseUrl property, must be defined on the base class otherwise (default: true) |
| `GenerateSyncMethods` | bool | whether to generate synchronous methods (not recommended, default: false) |
| `HttpClientType` | string | HttpClient type used in generated code; default `System.Net.Http.HttpClient`; override type must have the same default HttpClient method signatures |
| `ParameterDateTimeFormat` | string | format for DateTime type method parameters (default: `"s"`) |
| `ParameterDateFormat` | string | format for Date type method parameters (default: `"yyyy-MM-dd"`) |
| `GenerateUpdateJsonSerializerSettingsMethod` | bool | generate the `UpdateJsonSerializerSettings` method (must be implemented in the base class otherwise, default: true) |
| `GeneratePrepareRequestAndProcessResponseAsAsyncMethods` | bool | if true, `PrepareRequestAsync`/`ProcessResponseAsync` must be implemented in the base or partial class; if false they are optional partial methods |
| `UseRequestAndResponseSerializationSettings` | bool | generate different request and response serialization settings (default: false) |
| `SerializeTypeInformation` | bool | serialize the type information in a `$type` property (not recommended, also sets `TypeNameHandling = Auto`) |
| `QueryNullValue` | string | null value used for query parameters which are null (default: `''`) |
| `ExposeJsonSerializerSettings` | bool | expose the JsonSerializerSettings property (default: false) |

## 3. `ClientGeneratorBaseSettings` (shared client-generation surface)

Constructor defaults:

```
GenerateClientClasses = true;
SuppressClientClassesOutput = false;
SuppressClientInterfacesOutput = false;
GenerateDtoTypes = true;
OperationNameGenerator = new MultipleClientsFromOperationIdOperationNameGenerator();
IncludedOperationIds = [];
ExcludedOperationIds = [];
ParameterNameGenerator = new DefaultParameterNameGenerator();
GenerateResponseClasses = true;
ResponseClass = "SwaggerResponse";
WrapResponseMethods = [];
ExcludedParameterNames = [];
```

Properties (doc comments verbatim):

- `ClassName` — class name of the service client or controller.
- `GenerateDtoTypes` (bool) — generate DTO classes (default: true).
- `GenerateClientInterfaces` (bool) — generate interfaces for the client classes (default: false).
- `SuppressClientInterfacesOutput` (bool) — suppress output of client interfaces (default: false).
- `GenerateClientClasses` (bool) — generate client types (default: true).
- `SuppressClientClassesOutput` (bool) — suppress output of client types (default: false).
- `OperationNameGenerator` (IOperationNameGenerator) — operation-name strategy. Default:
  `MultipleClientsFromOperationIdOperationNameGenerator` — i.e. **`operationId` is the
  authority for method/controller splitting**.
- `IncludedOperationIds` / `ExcludedOperationIds` (string[]) — operation filtering.
- `GenerateOptionalParameters` (bool) — reorder parameters (required first, optional at end)
  and generate optional parameters.
- `ParameterNameGenerator` (IParameterNameGenerator), `ExcludedParameterNames` (string[]).
- `WrapResponses` (bool) — wrap success responses to allow full response access.
- `WrapResponseMethods` (string[]) — methods where responses are wrapped
  ("ControllerName.MethodName", `WrapResponses` must be true).
- `GenerateResponseClasses` (bool) — generate the response classes (only needed when
  `WrapResponses == true`, default: true).
- `ResponseClass` (string) — name of the response class (supports `'{controller}'`).

`GenerateControllerName` verbatim:

```csharp
controllerName = controllerName.Replace('.', '_').Replace('-', '_');
return ClassName.Replace("{controller}", ConversionUtilities.ConvertToUpperCamelCase(controllerName, false));
```

## 4. `CSharpGeneratorBaseSettings` (type mapping at the operation boundary)

Constructor defaults:

```
CSharpGeneratorSettings = new CSharpGeneratorSettings { Namespace = "MyNamespace", SchemaType = SchemaType.Swagger2 };
ResponseArrayType      = "System.Collections.Generic.ICollection";
ResponseDictionaryType = "System.Collections.Generic.IDictionary";
ParameterArrayType      = "System.Collections.Generic.IEnumerable";
ParameterDictionaryType = "System.Collections.Generic.IDictionary";
AdditionalNamespaceUsages = [];
AdditionalContractNamespaceUsages = [];
```

Note: the default `SchemaType` is **Swagger2**, not OpenAPI 3 — a fidelity-relevant default.

---

## 5. Generated error typing — exact shapes (from `Templates/File.liquid`)

Emitted when `GenerateExceptionClasses` is true, once per name in `ExceptionClassNames`
(so `{controller}` placeholders can yield several). Non-nullable-reference-types variant:

```csharp
[System.CodeDom.Compiler.GeneratedCode("NSwag", "{{ ToolchainVersion }}")]
public partial class ApiException : System.Exception
{
    public int StatusCode { get; private set; }

    public string Response { get; private set; }

    public System.Collections.Generic.IReadOnlyDictionary<string, System.Collections.Generic.IEnumerable<string>> Headers { get; private set; }

    public ApiException(string message, int statusCode, string response,
        System.Collections.Generic.IReadOnlyDictionary<string, System.Collections.Generic.IEnumerable<string>> headers,
        System.Exception innerException)
        : base(message + "\n\nStatus: " + statusCode + "\nResponse: \n" +
               ((response == null) ? "(null)" : response.Substring(0, response.Length >= 512 ? 512 : response.Length)),
               innerException)
    {
        StatusCode = statusCode;
        Response = response;
        Headers = headers;
    }

    public override string ToString()
    {
        return string.Format("HTTP Response: \n\n{0}\n\n{1}", Response, base.ToString());
    }
}

[System.CodeDom.Compiler.GeneratedCode("NSwag", "{{ ToolchainVersion }}")]
public partial class ApiException<TResult> : ApiException
{
    public TResult Result { get; private set; }

    public ApiException(string message, int statusCode, string response,
        System.Collections.Generic.IReadOnlyDictionary<string, System.Collections.Generic.IEnumerable<string>> headers,
        TResult result, System.Exception innerException)
        : base(message, statusCode, response, headers, innerException)
    {
        Result = result;
    }
}
```

Key protocol-relevant facts:

- The error channel is **(message, int statusCode, raw response string, headers multimap,
  optional typed `TResult`, innerException)**. The typed payload rides on the generic
  subclass `ApiException<TResult>`; the untyped raw body is always preserved as a string.
- The exception message truncates the response body at **512 characters**.
- Headers are always `IReadOnlyDictionary<string, IEnumerable<string>>` (multimap).

Throw sites in `Client.Class.liquid` (verbatim fragments):

```
throw new {{ ExceptionClass }}("{{ operation.DefaultResponse.ExceptionDescription }}", status_, responseData_, headers_, null);
...
throw new {{ ExceptionClass }}("The HTTP status code of the response was not expected (" + status_ + ").", status_, responseData_, headers_, null);
```

Unknown-status handling, verbatim comment from the template:

```
If the success response has already been explicitely declared, there is no need for this default code (because handled above).
Otherwise, return default values on success because we don't want to throw on "unknown status code".
Success is always expected
```

with the guard `if (status_ == 200 || status_ == 204)` returning the default value, else
throwing `ExceptionClass`.

## 6. Response wrapping (`WrapResponses`) — exact shape

```csharp
public partial class SwaggerResponse
{
    public int StatusCode { get; private set; }
    public System.Collections.Generic.IReadOnlyDictionary<string, System.Collections.Generic.IEnumerable<string>> Headers { get; private set; }
    public SwaggerResponse(int statusCode, IReadOnlyDictionary<string, IEnumerable<string>> headers) { ... }
}

public partial class SwaggerResponse<TResult> : SwaggerResponse
{
    public TResult Result { get; private set; }
    public SwaggerResponse(int statusCode, IReadOnlyDictionary<string, IEnumerable<string>> headers, TResult result) : base(statusCode, headers) { ... }
}
```

Template note: response wrapping is skipped for file results —
`{% if operation.WrapResponse and operation.UnwrappedResultType != "FileResponse" %}`.

## 7. Binary / file handling — exact shapes

`FileParameter` (emitted when `RequiresFileParameterType`):

```csharp
public partial class FileParameter
{
    public FileParameter(System.IO.Stream data);
    public FileParameter(System.IO.Stream data, string fileName);
    public FileParameter(System.IO.Stream data, string fileName, string contentType);
    public System.IO.Stream Data { get; private set; }
    public string FileName { get; private set; }
    public string ContentType { get; private set; }
}
```

`FileResponse` (emitted when `GenerateFileResponseClass`):

```csharp
public partial class FileResponse : System.IDisposable
{
    public int StatusCode { get; private set; }
    public System.Collections.Generic.IReadOnlyDictionary<string, System.Collections.Generic.IEnumerable<string>> Headers { get; private set; }
    public System.IO.Stream Stream { get; private set; }
    public bool IsPartial { get { return StatusCode == 206; } }   // 206 Partial Content
    public FileResponse(int statusCode, IReadOnlyDictionary<string, IEnumerable<string>> headers,
                        System.IO.Stream stream, System.IDisposable client, System.IDisposable response);
    public void Dispose();   // disposes stream, then response, then client
}
```

Binary is therefore a **separate, non-JSON, stream-typed channel**: it bypasses the DTO
type system entirely and carries only status + headers + stream.

Also in `Client.Class.liquid`:

```csharp
protected struct ObjectResponseResult<T>
{
    public ObjectResponseResult(T responseObject, string responseText) { Object = responseObject; Text = responseText; }
    public T Object { get; }
    public string Text { get; }
}
```

i.e. deserialized object **and** original text are both kept.

## 8. DTO generation surface — `NJsonSchema.CodeGeneration.CSharp.CSharpGeneratorSettings`

Constructor defaults (verbatim):

```
AnyType = "object";
Namespace = "MyNamespace";
DateType = "System.DateTimeOffset";
DateTimeType = "System.DateTimeOffset";
TimeType = "System.TimeSpan";
TimeSpanType = "System.TimeSpan";
IntegerType = "int";
NumberType = "double";
NumberFloatType = "float";
NumberDoubleType = "double";
NumberDecimalType = "decimal";
ArrayType = "System.Collections.Generic.ICollection";
ArrayInstanceType = "System.Collections.ObjectModel.Collection";
ArrayBaseType = "System.Collections.ObjectModel.Collection";
DictionaryType = "System.Collections.Generic.IDictionary";
DictionaryInstanceType = "System.Collections.Generic.Dictionary";
DictionaryBaseType = "System.Collections.Generic.Dictionary";
ClassStyle = CSharpClassStyle.Poco;
JsonLibrary = CSharpJsonLibrary.NewtonsoftJson;
JsonPolymorphicSerializationStyle = CSharpJsonPolymorphicSerializationStyle.NJsonSchema;
RequiredPropertiesMustBeDefined = true;
GenerateDataAnnotations = true;
TypeAccessModifier = "public";
PropertySetterAccessModifier = "";
GenerateJsonMethods = false;
EnforceFlagEnums = false;
UseRequiredKeyword = false;
WriteAccessor = "set";
InlineNamedArrays = false;
InlineNamedDictionaries = false;
InlineNamedTuples = true;
SortConstructorParameters = true;
JsonLibraryVersion = 8.0m;   // System.Text.Json only
FieldNamePrefix = "_";
```

Selected doc comments verbatim (fidelity-relevant):

- `JsonLibrary` — "the CSharp JSON library to use (default: 'NewtonsoftJson',
  **'SystemTextJson' is experimental/not complete**)".
- `JsonPolymorphicSerializationStyle` — "(default: 'NJsonSchema', **'SystemTextJson' is
  experimental/not complete**)". This is the **discriminator** mechanism: by default
  polymorphism is handled by NJsonSchema's own converter (`JsonInheritanceConverter`),
  not by a standard .NET one.
- `SerializeTypeInformation` (on the client settings, §2) — "serialize the type information
  in a `$type` property (not recommended, also sets `TypeNameHandling = Auto`)".
- `RequiredPropertiesMustBeDefined` — "sets `Required.Always` when the property is required".
- `GenerateOptionalPropertiesAsNullable` (default false) and
  `GenerateNullableReferenceTypes` (default false) — nullability is **opt-in**; by default an
  optional schema property is not rendered nullable.
- `UseRequiredKeyword` (C# 11 `required`), `GenerateNativeRecords` (C# 9 records),
  `WriteAccessor` ('set' | 'init'), `GenerateImmutableArrayProperties` /
  `GenerateImmutableDictionaryProperties`.
- `HandleReferences` — "use preserve references handling (All) in the JSON serializer".
- `JsonConverters` (string[]) — custom Json.NET converter class names registered for both
  directions.
- `GenerateJsonMethods` — render `ToJson()`/`FromJson()`.
- `InlineNamedArrays` / `InlineNamedDictionaries` / `InlineNamedTuples` — whether a named
  ref to an array/dictionary/tuple becomes an inlined type or a class that *inherits* from
  the collection type. (Inheritance-from-collection is a known round-trip wart.)
- `RequiresJsonExceptionConverter` in `File.liquid` gates emission of a
  `JsonExceptionConverter` template — i.e. exception *DTOs* get a dedicated converter
  (this is what `WrapDtoExceptions` interacts with).

Fidelity notes visible in the source itself:

- `IntegerType` doc: "applies only to integer properties **without an explicit format**
  (e.g., not byte, long, or ulong)".
- Date and date-time both default to `DateTimeOffset`; `time` and `duration`-ish both map to
  `TimeSpan` — i.e. JSON Schema `format` distinctions collapse.
- There is **no union type**: `AnyType = "object"` is the fallback, so an unmodelled
  `oneOf`/`anyOf` degrades to `object`. Polymorphism is only expressible through the
  inheritance + discriminator path (`JsonPolymorphicSerializationStyle`).
