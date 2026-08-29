# RFC-5 source extract — AWS Lambda custom Runtime API (bootstrap contract)

Group: `lambda-lsp`. Faithful extract, no analysis.

Sources (fetched 2026-08-20):

- <https://docs.aws.amazon.com/lambda/latest/dg/runtimes-api.html> — "Using the Lambda
  runtime API for custom runtimes"
- <https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html> — "Building a custom
  runtime for AWS Lambda" (linked from the API page as the bootstrap contract)
- <https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime>
  — "Defined runtime environment variables" (linked from runtimes-custom for the full env list)

Not found in primary docs: a `/runtime/restore/next` (SnapStart restore) endpoint. The SnapStart
runtime-hooks page (`snapstart-runtime-hooks.html`) documents only Java/Python/.NET language hooks
and names no Runtime API path. Recorded as absent rather than invented.

---

## 1. API surface and versioning

> "AWS Lambda provides an HTTP API for custom runtimes to receive invocation events from Lambda and
> send response data back within the Lambda execution environment."

> "The OpenAPI specification for the runtime API version **2018-06-01** is available in
> runtime-api.zip"

> "To create an API request URL, runtimes get the API endpoint from the `AWS_LAMBDA_RUNTIME_API`
> environment variable, add the API version, and add the desired resource path."

Example request (verbatim):

```
curl "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/next"
```

So the URL template is: `http://{AWS_LAMBDA_RUNTIME_API}/{api-version}/{resource-path}`, where
`api-version` = `2018-06-01`. Transport is plain HTTP/1.1 over a loopback host:port; no TLS, no
auth token on the runtime API itself.

Concurrency note (verbatim):

> "Lambda Managed Instances use the same runtime API as Lambda (default) functions. The key
> difference is that Managed Instances can accept concurrent `/next` and `/response` requests up to
> the configured `AWS_LAMBDA_MAX_CONCURRENCY` limit. This enables multiple invocations to be
> processed simultaneously within a single execution environment."

## 2. Endpoint inventory (the triad + init error)

| # | Purpose | Path (after `/2018-06-01`) | Method |
|---|---------|----------------------------|--------|
| 1 | Next invocation | `/runtime/invocation/next` | GET |
| 2 | Invocation response | `/runtime/invocation/{AwsRequestId}/response` | POST |
| 3 | Initialization error | `/runtime/init/error` | POST |
| 4 | Invocation error | `/runtime/invocation/{AwsRequestId}/error` | POST |

### 2.1 Next invocation — GET `/runtime/invocation/next`

> "The runtime sends this message to Lambda to request an invocation event. The response body
> contains the payload from the invocation, which is a JSON document that contains event data from
> the function trigger. The response headers contain additional data about the invocation."

**Response headers** (verbatim list, with the doc's example values):

- `Lambda-Runtime-Aws-Request-Id` – "The request ID, which identifies the request that triggered
  the function invocation." e.g. `8476a536-e9f4-11e8-9739-2dfe598c3fcd`.
- `Lambda-Runtime-Deadline-Ms` – "The date that the function times out in Unix time milliseconds."
  e.g. `1542409706888`.
- `Lambda-Runtime-Invoked-Function-Arn` – "The ARN of the Lambda function, version, or alias that's
  specified in the invocation." e.g. `arn:aws:lambda:us-east-2:123456789012:function:custom-runtime`.
- `Lambda-Runtime-Trace-Id` – "The AWS X-Ray tracing header." e.g.
  `Root=1-5bef4de7-ad49b0e87f6ef6c87fc2e700;Parent=9a9197af755a6419;Sampled=1`.
- `Lambda-Runtime-Client-Context` – "For invocations from the AWS Mobile SDK, data about the client
  application and device."
- `Lambda-Runtime-Cognito-Identity` – "For invocations from the AWS Mobile SDK, data about the
  Amazon Cognito identity provider."

**Long-poll contract** (verbatim):

> "Do not set a timeout on the `GET` request as the response may be delayed. Between when Lambda
> bootstraps the runtime and when the runtime has an event to return, the runtime process might be
> frozen for several seconds."

> "The request ID tracks the invocation within Lambda. Use it to specify the invocation when you
> send the response."

> "The tracing header contains the trace ID, parent ID, and sampling decision. If the request is
> sampled, the request was sampled by Lambda or an upstream service. The runtime should set the
> `_X_AMZN_TRACE_ID` with the value of the header. The X-Ray SDK reads this to get the IDs and
> determine whether to trace the request."

### 2.2 Invocation response — POST `/runtime/invocation/{AwsRequestId}/response`

> "After the function has run to completion, the runtime sends an invocation response to Lambda. For
> synchronous invocations, Lambda sends the response to the client."

Example success request (verbatim):

```
REQUEST_ID=156cb537-e2d4-11e8-9b34-d36013741fb9
curl "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/$REQUEST_ID/response"  -d "SUCCESS"
```

The body is the raw function response payload (opaque bytes; no envelope). Correlation is by the
request id embedded in the *path*, not in the body.

### 2.3 Initialization error — POST `/runtime/init/error`

> "If the function returns an error or the runtime encounters an error during initialization, the
> runtime uses this method to report the error to Lambda."

**Headers**

`Lambda-Runtime-Function-Error-Type` – "Error type that the runtime encountered. Required: no."

> "This header consists of a string value. Lambda accepts any string, but we recommend a format of
> `<category.reason>`. For example:
> + Runtime.NoSuchHandler
> + Runtime.APIKeyNotFound
> + Runtime.ConfigInvalid
> + Runtime.UnknownReason"

**Body parameters** — `ErrorRequest`, "Information about the error. Required: no." JSON object:

```
{
      errorMessage: string (text description of the error),
      errorType: string,
      stackTrace: array of strings
}
```

> "Note that Lambda accepts any value for `errorType`."

Example function error object:

```json
{
      "errorMessage" : "Error parsing event data.",
      "errorType" : "InvalidEventDataException",
      "stackTrace": [ ]
}
```

**Response body parameters**

- `StatusResponse` – "String. Status information, sent with 202 response codes."
- `ErrorResponse` – "Additional error information, sent with the error response codes.
  ErrorResponse contains an error type and an error message."

**Response codes** (init error): 202 Accepted; 403 Forbidden; 500 – "Container error.
Non-recoverable state. Runtime should exit promptly."

Example initialization error request (verbatim):

```
ERROR="{\"errorMessage\" : \"Failed to load function.\", \"errorType\" : \"InvalidFunctionException\"}"
curl "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/init/error" -d "$ERROR" --header "Lambda-Runtime-Function-Error-Type: Unhandled"
```

### 2.4 Invocation error — POST `/runtime/invocation/{AwsRequestId}/error`

Same header (`Lambda-Runtime-Function-Error-Type`), same `ErrorRequest` body shape
(`errorMessage` / `errorType` / `stackTrace`), same response body parameters as init error.

**Response codes** (invocation error): 202 Accepted; 400 Bad Request; 403 Forbidden; 500 –
"Container error. Non-recoverable state. Runtime should exit promptly."

Example error request (verbatim):

```
REQUEST_ID=156cb537-e2d4-11e8-9b34-d36013741fb9
ERROR="{\"errorMessage\" : \"Error parsing event data.\", \"errorType\" : \"InvalidEventDataException\"}"
curl "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/$REQUEST_ID/error" -d "$ERROR" --header "Lambda-Runtime-Function-Error-Type: Unhandled"
```

---

## 3. The bootstrap contract (runtimes-custom.html)

> "You can implement an AWS Lambda runtime in any programming language. A runtime is a program that
> runs a Lambda function's handler method when the function is invoked. You can include the runtime
> in your function's deployment package or distribute it in a layer. When you create the Lambda
> function, choose an OS-only runtime (the `provided` runtime family)."

> "Custom runtimes must complete certain initialization and processing tasks. A runtime runs the
> function's setup code, reads the handler name from an environment variable, and reads invocation
> events from the Lambda runtime API. The runtime passes the event data to the function handler, and
> posts the response from the handler back to Lambda."

### 3.1 Entrypoint

> "A custom runtime's entry point is an executable file named `bootstrap`. The bootstrap file can be
> the runtime, or it can invoke another file that creates the runtime. If the root of your
> deployment package doesn't contain a file named `bootstrap`, Lambda looks for the file in the
> function's layers. If the `bootstrap` file doesn't exist or isn't executable, your function
> returns a `Runtime.InvalidEntrypoint` error upon invocation."

Example bootstrap (verbatim):

```sh
#!/bin/sh
    cd $LAMBDA_TASK_ROOT
    ./node-v11.1.0-linux-x64/bin/node runtime.js
```

### 3.2 Initialization tasks

> "The initialization tasks run once per instance of the function to prepare the environment to
> handle invocations."

- **Retrieve settings** – "Read environment variables to get details about the function and
  environment."
  - `_HANDLER` – "The location to the handler, from the function's configuration. The standard
    format is `{file}.{method}`, where `file` is the name of the file without an extension, and
    `method` is the name of a method or function that's defined in the file."
  - `LAMBDA_TASK_ROOT` – "The directory that contains the function code."
  - `AWS_LAMBDA_RUNTIME_API` – "The host and port of the runtime API."
- **Initialize the function** – "Load the handler file and run any global or static code that it
  contains. Functions should create static resources like SDK clients and database connections once,
  and reuse them for multiple invocations."
- **Handle errors** – "If an error occurs, call the initialization error API and exit immediately."

> "Initialization counts towards billed execution time and timeout."

Example log line:

```
REPORT RequestId: f8ac1208... Init Duration: 48.26 ms   Duration: 237.17 ms   Billed Duration: 300 ms   Memory Size: 128 MB   Max Memory Used: 26 MB
```

### 3.3 Processing tasks (the loop), in order

> "After completing initialization tasks, the runtime processes incoming events in a loop. In your
> runtime code, perform the following steps in order."

1. **Get an event** – "Call the next invocation API to get the next event. The response body
   contains the event data. Response headers contain the request ID and other information."
2. **Propagate the tracing header** – "Get the X-Ray tracing header from the `Lambda-Runtime-Trace-Id`
   header in the API response. Set the `_X_AMZN_TRACE_ID` environment variable locally with the same
   value. The X-Ray SDK uses this value to connect trace data between services."
3. **Create a context object** – "Create an object with context information from environment
   variables and headers in the API response."
4. **Invoke the function handler** – "Pass the event and context object to the handler."
5. **Handle the response** – "Call the invocation response API to post the response from the
   handler."
6. **Handle errors** – "If an error occurs, call the invocation error API."
7. **Cleanup** – "Release unused resources, send data to other services, or perform additional tasks
   before getting the next event."

### 3.4 Response streaming variant

> "For response streaming functions, the `response` and `error` endpoints have slightly modified
> behavior that lets the runtime stream partial responses to the client and return payloads in
> chunks."

- `/runtime/invocation/AwsRequestId/response` – "Propagates the `Content-Type` header from the
  runtime to send to the client. Lambda returns the response payload in chunks by using HTTP/1.1
  chunked transfer encoding. To stream the response to Lambda, the runtime must:
  + Set the `Lambda-Runtime-Function-Response-Mode` HTTP header to `streaming`.
  + Set the `Transfer-Encoding` header to `chunked`.
  + Write the response conforming to the HTTP/1.1 chunked transfer encoding specification.
  + Close the underlying connection after it has successfully written the response."
- `/runtime/invocation/AwsRequestId/error` – "The runtime can use this endpoint to report function
  or runtime errors to Lambda, which also accepts the `Transfer-Encoding` header. This endpoint can
  only be called before the runtime begins sending an invocation response."
- Midstream errors: "the runtime can optionally attach HTTP trailing headers named
  `Lambda-Runtime-Function-Error-Type` and `Lambda-Runtime-Function-Error-Body`. Lambda treats this
  as a successful response and forwards the error metadata that the runtime provides to the client."
  - Note: "To attach trailing headers, the runtime must set the `Trailer` header value at the
    beginning of the HTTP request. This is a requirement of the HTTP/1.1 chunked transfer encoding
    specification."
  - `Lambda-Runtime-Function-Error-Body` – "Base64-encoded information about the error."

### 3.5 Concurrent-invocation variant (Managed Instances)

Custom runtime "must":

- "**Support concurrent `/next` requests** – The runtime can make multiple simultaneous calls to the
  next invocation API, up to the limit specified by the `AWS_LAMBDA_MAX_CONCURRENCY` environment
  variable."
- "**Handle concurrent `/response` requests** – Multiple invocations can call the invocation response
  API simultaneously."
- "**Implement thread-safe request handling** – Ensure that concurrent invocations don't interfere
  with each other by properly managing shared resources and state."
- "**Use unique request IDs** – Track each invocation separately using the
  `Lambda-Runtime-Aws-Request-Id` header to match responses with their corresponding requests."

Implementation pattern (verbatim steps):

1. "**Read the concurrency limit** – At initialization, read the `AWS_LAMBDA_MAX_CONCURRENCY`
   environment variable to determine how many concurrent invocations to support."
2. "**Create worker pool** – Initialize a pool of workers (threads, processes, or async tasks) equal
   to the concurrency limit."
3. "**Worker processing loop** – Each worker independently: Calls `/runtime/invocation/next` to get
   an invocation event; Invokes the function handler with the event data; Posts the response to
   `/runtime/invocation/AwsRequestId/response`; Repeats the loop."

Additional considerations: "**Logging format** – Managed Instances only support JSON log format.
Ensure your runtime respects the `AWS_LAMBDA_LOG_FORMAT` environment variable and only uses JSON
format." and "**Shared resources** – Be cautious when using shared resources like the `/tmp`
directory with concurrent invocations."

---

## 4. Defined runtime environment variables (config surface)

Reserved (verbatim, "The keys for these environment variables are *reserved* and cannot be set in
your function configuration"):

- `_HANDLER` – "The handler location configured on the function."
- `_X_AMZN_TRACE_ID` – "The X-Ray tracing header. This environment variable changes with each
  invocation." — "This environment variable is not defined for OS-only runtimes (the `provided`
  runtime family). You can set `_X_AMZN_TRACE_ID` for custom runtimes using the
  `Lambda-Runtime-Trace-Id` response header from the Next invocation."
- `AWS_DEFAULT_REGION` – "The default AWS Region where the Lambda function is executed."
- `AWS_REGION` – "The AWS Region where the Lambda function is executed. If defined, this value
  overrides the `AWS_DEFAULT_REGION`."
- `AWS_EXECUTION_ENV` – "The runtime identifier, prefixed by `AWS_Lambda_` (for example,
  `AWS_Lambda_java8`). This environment variable is not defined for OS-only runtimes."
- `AWS_LAMBDA_FUNCTION_NAME` – "The name of the function."
- `AWS_LAMBDA_FUNCTION_MEMORY_SIZE` – "The amount of memory available to the function in MB."
- `AWS_LAMBDA_FUNCTION_VERSION` – "The version of the function being executed."
- `AWS_LAMBDA_INITIALIZATION_TYPE` – "The initialization type of the function, which is `on-demand`,
  `provisioned-concurrency`, `snap-start`, or `lambda-managed-instances`."
- `AWS_LAMBDA_LOG_GROUP_NAME`, `AWS_LAMBDA_LOG_STREAM_NAME` – "The name of the Amazon CloudWatch
  Logs group and stream for the function." (not available in SnapStart functions)
- `AWS_ACCESS_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` – "The access
  keys obtained from the function's execution role."
- `AWS_LAMBDA_RUNTIME_API` – "(Custom runtime) The host and port of the runtime API."
- `LAMBDA_TASK_ROOT` – "The path to your Lambda function code."
- `LAMBDA_RUNTIME_DIR` – "The path to runtime libraries."
- `AWS_LAMBDA_MAX_CONCURRENCY` – "(Lambda Managed Instances only) The maximum number of concurrent
  invocations Lambda will send to one execution environment."
- `AWS_LAMBDA_METADATA_API` – "The metadata endpoint server address in the format
  `{ipv4_address}:{port}` (for example, `169.254.100.1:9001`)."
- `AWS_LAMBDA_METADATA_TOKEN` – "A unique authentication token for the current execution environment
  used to authenticate requests to the metadata endpoint. Lambda generates this token automatically
  at initialization."

Unreserved (extendable in function configuration): `LANG` (`en_US.UTF-8`), `PATH`
(`/usr/local/bin:/usr/bin/:/bin:/opt/bin`), `LD_LIBRARY_PATH`
(`/var/lang/lib:/lib64:/usr/lib64:$LAMBDA_RUNTIME_DIR:$LAMBDA_RUNTIME_DIR/lib:$LAMBDA_TASK_ROOT:$LAMBDA_TASK_ROOT/lib:/opt/lib`),
`NODE_PATH`, `NODE_OPTIONS`, `PYTHONPATH` (`$LAMBDA_RUNTIME_DIR`), `GEM_PATH`,
`AWS_XRAY_CONTEXT_MISSING` (`LOG_ERROR`), `AWS_XRAY_DAEMON_ADDRESS`, `AWS_LAMBDA_DOTNET_PREJIT`
(`always` | `never` | `provisioned-concurrency`), `TZ` (`:UTC`).

Also referenced by name in the Managed Instances section: `AWS_LAMBDA_LOG_FORMAT` (log format the
runtime must respect).
