# RFC-5 source extract — LSP base protocol + lifecycle (3.17, with 3.18 delta)

Group: `lambda-lsp`. Faithful extract, no analysis. Base protocol + lifecycle only; language
features (hover, completion, …) deliberately omitted.

Sources (fetched 2026-08-20):

- <https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/>
  (rendered page)
- Raw spec source for the same page (used because the rendered fetch over-summarized the wire
  shapes):
  <https://raw.githubusercontent.com/microsoft/language-server-protocol/gh-pages/_specifications/lsp/3.17/specification.md>
- Included fragments, fetched raw from the same repo/branch (`gh-pages`), because the rendered page
  inlines them via Jekyll `{% include %}`:
  - `_specifications/lsp/3.17/general/initialize.md`
  - `_specifications/lsp/3.17/types/workDoneProgress.md`
  - `_specifications/lsp/3.17/types/partialResults.md`
  - `_includes/messages/3.17/{initialized,shutdown,exit,setTrace,registerCapability}.md`
- 3.18 (in-development) source checked for base-protocol delta:
  <https://raw.githubusercontent.com/microsoft/language-server-protocol/gh-pages/_specifications/lsp/3.18/specification.md>

3.18 delta on the base protocol: the header/content wording is identical; the only textual change
is that 3.18 cites "JSON-RPC 2.0" explicitly where 3.17 links "JSON-RPC", and 3.18 adds
`types/patterns.md`, `types/stringValue.md` to the basic-JSON-structures includes. 3.17 is quoted
below.

---

## 1. Framing — Header Part

> "The base protocol consists of a header and a content part (comparable to HTTP). The header and
> content part are separated by a '\r\n'."

> "The header part consists of header fields. Each header field is comprised of a name and a value,
> separated by ': ' (a colon and a space). The structure of header fields conforms to the HTTP
> semantic [RFC7230 §3.2]. Each header field is terminated by '\r\n'. Considering the last header
> field and the overall header itself are each terminated with '\r\n', and that at least one header
> is mandatory, this means that two '\r\n' sequences always immediately precede the content part of
> a message."

| Header Field Name | Value Type | Description |
|:------------------|:-----------|:------------|
| Content-Length    | number     | The length of the content part in bytes. This header is required. |
| Content-Type      | string     | The mime type of the content part. Defaults to application/vscode-jsonrpc; charset=utf-8 |

> "The header part is encoded using the 'ascii' encoding. This includes the '\r\n' separating the
> header and content part."

## 2. Content Part

> "Contains the actual content of the message. The content part of a message uses JSON-RPC to
> describe requests, responses and notifications. The content part is encoded using the charset
> provided in the Content-Type field. It defaults to `utf-8`, which is the only encoding supported
> right now. If a server or client receives a header with a different encoding than `utf-8` it
> should respond with an error."

> "(Prior versions of the protocol used the string constant `utf8` which is not a correct encoding
> constant according to specification.) For backwards compatibility it is highly recommended that a
> client and a server treat the string `utf8` as `utf-8`."

Example (verbatim):

```
Content-Length: ...\r\n
\r\n
{
	"jsonrpc": "2.0",
	"id": 1,
	"method": "textDocument/completion",
	"params": {
		...
	}
}
```

## 3. Base Types

```typescript
/** Defines an integer number in the range of -2^31 to 2^31 - 1. */
export type integer = number;

/** Defines an unsigned integer number in the range of 0 to 2^31 - 1. */
export type uinteger = number;

/** Defines a decimal number. */
export type decimal = number;

/** The LSP any type. @since 3.17.0 */
export type LSPAny = LSPObject | LSPArray | string | integer | uinteger |
	decimal | boolean | null;

/** LSP object definition. @since 3.17.0 */
export type LSPObject = { [key: string]: LSPAny };

/** LSP arrays. @since 3.17.0 */
export type LSPArray = LSPAny[];
```

## 4. Message shapes

> "A general message as defined by JSON-RPC. The language server protocol always uses "2.0" as the
> `jsonrpc` version."

```typescript
interface Message {
	jsonrpc: string;
}
```

> "A request message to describe a request between the client and the server. Every processed
> request must send a response back to the sender of the request."

```typescript
interface RequestMessage extends Message {
	/** The request id. */
	id: integer | string;
	/** The method to be invoked. */
	method: string;
	/** The method's params. */
	params?: array | object;
}
```

> "A Response Message sent as a result of a request. If a request doesn't provide a result value the
> receiver of a request still needs to return a response message to conform to the JSON-RPC
> specification. The result property of the ResponseMessage should be set to `null` in this case to
> signal a successful request."

```typescript
interface ResponseMessage extends Message {
	/** The request id. */
	id: integer | string | null;
	/**
	 * The result of a request. This member is REQUIRED on success.
	 * This member MUST NOT exist if there was an error invoking the method.
	 */
	result?: LSPAny;
	/** The error object in case a request fails. */
	error?: ResponseError;
}

interface ResponseError {
	/** A number indicating the error type that occurred. */
	code: integer;
	/** A string providing a short description of the error. */
	message: string;
	/**
	 * A primitive or structured value that contains additional
	 * information about the error. Can be omitted.
	 */
	data?: LSPAny;
}
```

> "A notification message. A processed notification message must not send a response back. They work
> like events."

```typescript
interface NotificationMessage extends Message {
	/** The method to be invoked. */
	method: string;
	/** The notification's params. */
	params?: array | object;
}
```

## 5. ErrorCodes (full namespace, verbatim)

```typescript
export namespace ErrorCodes {
	// Defined by JSON-RPC
	export const ParseError: integer = -32700;
	export const InvalidRequest: integer = -32600;
	export const MethodNotFound: integer = -32601;
	export const InvalidParams: integer = -32602;
	export const InternalError: integer = -32603;

	/**
	 * This is the start range of JSON-RPC reserved error codes.
	 * It doesn't denote a real error code. No LSP error codes should
	 * be defined between the start and end range. For backwards
	 * compatibility the `ServerNotInitialized` and the `UnknownErrorCode`
	 * are left in the range.
	 * @since 3.16.0
	 */
	export const jsonrpcReservedErrorRangeStart: integer = -32099;
	/** @deprecated use jsonrpcReservedErrorRangeStart */
	export const serverErrorStart: integer = jsonrpcReservedErrorRangeStart;

	/**
	 * Error code indicating that a server received a notification or
	 * request before the server received the `initialize` request.
	 */
	export const ServerNotInitialized: integer = -32002;
	export const UnknownErrorCode: integer = -32001;

	/** @since 3.16.0 */
	export const jsonrpcReservedErrorRangeEnd = -32000;
	/** @deprecated use jsonrpcReservedErrorRangeEnd */
	export const serverErrorEnd: integer = jsonrpcReservedErrorRangeEnd;

	/** @since 3.16.0 */
	export const lspReservedErrorRangeStart: integer = -32899;

	/**
	 * A request failed but it was syntactically correct, e.g the
	 * method name was known and the parameters were valid. The error
	 * message should contain human readable information about why
	 * the request failed.
	 * @since 3.17.0
	 */
	export const RequestFailed: integer = -32803;

	/**
	 * The server cancelled the request. This error code should
	 * only be used for requests that explicitly support being
	 * server cancellable.
	 * @since 3.17.0
	 */
	export const ServerCancelled: integer = -32802;

	/**
	 * The server detected that the content of a document got
	 * modified outside normal conditions. A server should
	 * NOT send this error code if it detects a content change
	 * in its unprocessed messages. The result even computed
	 * on an older state might still be useful for the client.
	 *
	 * If a client decides that a result is not of any use anymore
	 * the client should cancel the request.
	 */
	export const ContentModified: integer = -32801;

	/**
	 * The client has canceled a request and a server has detected
	 * the cancel.
	 */
	export const RequestCancelled: integer = -32800;

	/** @since 3.16.0 */
	export const lspReservedErrorRangeEnd: integer = -32800;
}
```

## 6. `$/` namespace convention

> "Notifications and requests whose methods start with '$/' are messages which are protocol
> implementation dependent and might not be implementable in all clients or servers. For example if
> the server implementation uses a single threaded synchronous programming language then there is
> little a server can do to react to a `$/cancelRequest` notification. If a server or client
> receives notifications starting with '$/' it is free to ignore the notification. If a server or
> client receives a request starting with '$/' it must error the request with error code
> `MethodNotFound` (e.g. `-32601`)."

## 7. Cancellation — `$/cancelRequest` (bidirectional)

_Notification_:
- method: `'$/cancelRequest'`
- params: `CancelParams`

```typescript
interface CancelParams {
	/** The request id to cancel. */
	id: integer | string;
}
```

> "A request that got canceled still needs to return from the server and send a response back. It
> can not be left open / hanging. This is in line with the JSON-RPC protocol that requires that every
> request sends a response back. In addition it allows for returning partial results on cancel. If
> the request returns an error response on cancellation it is advised to set the error code to
> `ErrorCodes.RequestCancelled`."

## 8. Progress — `$/progress` (bidirectional, since 3.15.0)

> "The base protocol offers also support to report progress in a generic fashion. This mechanism can
> be used to report any kind of progress including work done progress (usually used to report
> progress in the user interface using a progress bar) and partial result progress to support
> streaming of results."

_Notification_:
- method: `'$/progress'`
- params: `ProgressParams`

```typescript
type ProgressToken = integer | string;

interface ProgressParams<T> {
	/** The progress token provided by the client or server. */
	token: ProgressToken;
	/** The progress data. */
	value: T;
}
```

> "Progress is reported against a token. The token is different than the request ID which allows to
> report progress out of band and also for notification."

### 8.1 Work done progress payloads

```typescript
export interface WorkDoneProgressBegin {
	kind: 'begin';
	title: string;             // mandatory title of the progress operation
	cancellable?: boolean;
	message?: string;
	percentage?: uinteger;     // "value 100 is considered 100%"
}

export interface WorkDoneProgressReport {
	kind: 'report';
	cancellable?: boolean;
	message?: string;
	percentage?: uinteger;
}

export interface WorkDoneProgressEnd {
	kind: 'end';
	message?: string;
}
```

Two ways to initiate (verbatim):

1. "by the sender of a request (mostly clients) using the predefined `workDoneToken` property in the
   requests parameter literal … client initiated progress."
2. "by a server using the request `window/workDoneProgress/create` … server initiated progress."

```typescript
export interface WorkDoneProgressParams {
	/** An optional token that a server can use to report work done progress. */
	workDoneToken?: ProgressToken;
}

export interface WorkDoneProgressOptions {
	workDoneProgress?: boolean;
}
```

Example client-initiated request param carrying the token, and the resulting `$/progress` params
(verbatim):

```json
{
	"textDocument": { "uri": "file:///folder/file.ts" },
	"position": { "line": 9, "character": 5 },
	"context": { "includeDeclaration": true },
	// The token used to report work done progress.
	"workDoneToken": "1d546990-40a3-4b77-b134-46622995f6ae"
}
```

```json
{
	"token": "1d546990-40a3-4b77-b134-46622995f6ae",
	"value": {
		"kind": "begin",
		"title": "Finding references for A#foo",
		"cancellable": false,
		"message": "Processing file X.ts",
		"percentage": 0
	}
}
```

> "The token received via the `workDoneToken` property in a request's param literal is only valid as
> long as the request has not send a response back. Canceling work done progress is done by simply
> canceling the corresponding request."

> "There is no specific client capability signaling whether a client will send a progress token per
> request. … So the capability is signal on every request instance by the presence of a
> `workDoneToken` property."

Server-initiated: "Servers can also initiate progress reporting using the
`window/workDoneProgress/create` request. … The token provided in the create request should only be
used once (e.g. only one begin, many report and one end notification should be sent to it)." Gated
on client capability `window.workDoneProgress`.

### 8.2 Partial result progress (streaming), since 3.15.0

> "Partial results are also reported using the generic `$/progress` notification. The value payload
> of a partial result progress notification is in most cases the same as the final result. …
> Whether a client accepts partial result notifications for a request is signaled by adding a
> `partialResultToken` to the request parameter."

```json
{
	"textDocument": { "uri": "file:///folder/file.ts" },
	"position": { "line": 9, "character": 5 },
	"context": { "includeDeclaration": true },
	"workDoneToken": "1d546990-40a3-4b77-b134-46622995f6ae",
	"partialResultToken": "5f6f349e-4f81-4a3b-afff-ee04bff96804"
}
```

> "If a server reports partial result via a corresponding `$/progress`, the whole result must be
> reported using n `$/progress` notifications. Each of the n `$/progress` notification appends items
> to the result. The final response has to be empty in terms of result values. This avoids confusion
> about how the final result should be interpreted, e.g. as another partial result or as a replacing
> result."

> "If the response errors the provided partial results should be treated as follows: the `code`
> equals to `RequestCancelled`: the client is free to use the provided results but should make clear
> that the request got canceled and may be incomplete. In all other cases the provided partial
> results shouldn't be used."

## 9. Capability negotiation pattern

> "Not every language server can support all features defined by the protocol. LSP therefore
> provides 'capabilities'. A capability groups a set of language features. A development tool and the
> language server announce their supported features using capabilities. As an example, a server
> announces that it can handle the `textDocument/hover` request, but it might not handle the
> `workspace/symbol` request. …"

> "The set of capabilities is exchanged between the client and server during the initialize request."

Message documentation convention (each message is documented with): a header; optional _Client
capability_ section ("includes the client capabilities property path and JSON structure"); optional
_Server Capability_ section — "Clients should ignore server capabilities they don't understand (e.g.
the initialize request shouldn't fail in this case)"; optional _Registration Options_ section; a
_Request_ section (method string + params TypeScript interface, plus whether it supports work done
progress and partial result progress); a _Response_ section (result, optional partial result,
error.data).

Also: "In general, the language server protocol supports JSON-RPC messages, however the base
protocol defined here uses a convention such that the parameters passed to request/notification
messages should be of `object` type (if passed at all). However, this does not disallow using
`Array` parameter types in custom messages."

And: "The protocol currently assumes that one server serves one tool. There is currently no support
in the protocol to share one server between different tools."

## 10. Ordering rules

> "Responses to requests should be sent in roughly the same order as the requests appear on the
> server or client side. So for example if a server receives a `textDocument/completion` request and
> then a `textDocument/signatureHelp` request it will usually first return the response for the
> `textDocument/completion` and then the response for `textDocument/signatureHelp`."

> "However, the server may decide to use a parallel execution strategy and may wish to return
> responses in a different order than the requests were received. The server may do so as long as
> this reordering doesn't affect the correctness of the responses. For example, reordering the
> result of `textDocument/completion` and `textDocument/signatureHelp` is allowed, as each of these
> requests usually won't affect the output of the other. On the other hand, the server most likely
> should not reorder `textDocument/definition` and `textDocument/rename` requests, since executing
> the latter may affect the result of the former."

---

## 11. Lifecycle

> "The current protocol specification defines that the lifecycle of a server is managed by the
> client (e.g. a tool like VS Code or Emacs). It is up to the client to decide when to start
> (process-wise) and when to shutdown a server."

Lifecycle message set (in spec order): `initialize`, `initialized`, `client/registerCapability`,
`client/unregisterCapability`, `$/setTrace`, `$/logTrace`, `shutdown`, `exit`.

### 11.1 `initialize` (client → server, request)

> "The initialize request is sent as the first request from the client to the server. If the server
> receives a request or notification before the `initialize` request it should act as follows:
> * For a request the response should be an error with `code: -32002`. The message can be picked by
>   the server.
> * Notifications should be dropped, except for the exit notification. This will allow the exit of a
>   server without an initialize request."

> "Until the server has responded to the `initialize` request with an `InitializeResult`, the client
> must not send any additional requests or notifications to the server. In addition the server is
> not allowed to send any requests or notifications to the client until it has responded with an
> `InitializeResult`, with the exception that during the `initialize` request the server is allowed
> to send the notifications `window/showMessage`, `window/logMessage` and `telemetry/event` as well
> as the `window/showMessageRequest` request to the client. In case the client sets up a progress
> token in the initialize params (e.g. property `workDoneToken`) the server is also allowed to use
> that token (and only that token) using the `$/progress` notification sent from the server to the
> client."

> "The `initialize` request may only be sent once."

_Request_: method `'initialize'`, params `InitializeParams`:

```typescript
interface InitializeParams extends WorkDoneProgressParams {
	/**
	 * The process Id of the parent process that started the server. Is null if
	 * the process has not been started by another process. If the parent
	 * process is not alive then the server should exit (see exit notification)
	 * its process.
	 */
	processId: integer | null;

	/** Information about the client. @since 3.15.0 */
	clientInfo?: {
		name: string;
		version?: string;
	};

	/**
	 * The locale the client is currently showing the user interface in. …
	 * Uses IETF language tags as the value's syntax.
	 * @since 3.16.0
	 */
	locale?: string;

	/** The rootPath of the workspace. Is null if no folder is open.
	 *  @deprecated in favour of `rootUri`. */
	rootPath?: string | null;

	/** The rootUri of the workspace. Is null if no folder is open. If both
	 *  `rootPath` and `rootUri` are set `rootUri` wins.
	 *  @deprecated in favour of `workspaceFolders` */
	rootUri: DocumentUri | null;

	/** User provided initialization options. */
	initializationOptions?: LSPAny;

	/** The capabilities provided by the client (editor or tool) */
	capabilities: ClientCapabilities;

	/** The initial trace setting. If omitted trace is disabled ('off'). */
	trace?: TraceValue;

	/**
	 * The workspace folders configured in the client when the server starts.
	 * This property is only available if the client supports workspace folders.
	 * It can be `null` if the client supports workspace folders but none are
	 * configured.
	 * @since 3.6.0
	 */
	workspaceFolders?: WorkspaceFolder[] | null;
}
```

### 11.2 `ClientCapabilities` — top-level skeleton

(The full 3.17 interface is ~250 lines; the top-level grouping and the negotiation-relevant leaves
are reproduced. Per-feature sub-capability interfaces such as `WorkspaceEditClientCapabilities` are
named but not expanded.)

```typescript
interface ClientCapabilities {
	/** Workspace specific client capabilities. */
	workspace?: {
		applyEdit?: boolean;                       // supports 'workspace/applyEdit'
		workspaceEdit?: WorkspaceEditClientCapabilities;
		didChangeConfiguration?: DidChangeConfigurationClientCapabilities;
		didChangeWatchedFiles?: DidChangeWatchedFilesClientCapabilities;
		symbol?: WorkspaceSymbolClientCapabilities;
		executeCommand?: ExecuteCommandClientCapabilities;
		// … workspaceFolders, configuration, semanticTokens, codeLens,
		//   fileOperations { didCreate, willCreate, didRename, willRename,
		//                    didDelete, willDelete: boolean }, …
		inlineValue?: InlineValueWorkspaceClientCapabilities;   // @since 3.17.0
		inlayHint?: InlayHintWorkspaceClientCapabilities;       // @since 3.17.0
		diagnostics?: DiagnosticWorkspaceClientCapabilities;    // @since 3.17.0
	};

	/** Text document specific client capabilities. */
	textDocument?: TextDocumentClientCapabilities;

	/** Capabilities specific to the notebook document support. @since 3.17.0 */
	notebookDocument?: NotebookDocumentClientCapabilities;

	/** Window specific client capabilities. */
	window?: {
		/**
		 * It indicates whether the client supports server initiated
		 * progress using the `window/workDoneProgress/create` request.
		 * … If set servers are allowed to report a `workDoneProgress`
		 * property in the request specific server capabilities.
		 * @since 3.15.0
		 */
		workDoneProgress?: boolean;
		showMessage?: ShowMessageRequestClientCapabilities;   // @since 3.16.0
		showDocument?: ShowDocumentClientCapabilities;        // @since 3.16.0
	};

	/** General client capabilities. @since 3.16.0 */
	general?: {
		/**
		 * Client capability that signals how the client handles stale requests
		 * (e.g. a request for which the client will not process the response
		 * anymore since the information is outdated).
		 * @since 3.17.0
		 */
		staleRequestSupport?: {
			/** The client will actively cancel the request. */
			cancel: boolean;
			/**
			 * The list of requests for which the client will retry the request
			 * if it receives a response with error code `ContentModified`
			 */
			retryOnContentModified: string[];
		};
		regularExpressions?: RegularExpressionsClientCapabilities;  // @since 3.16.0
		markdown?: MarkdownClientCapabilities;                      // @since 3.16.0
		/**
		 * The position encodings supported by the client. Client and server
		 * have to agree on the same position encoding to ensure that offsets
		 * … are interpreted the same on both side.
		 *
		 * To keep the protocol backwards compatible the following applies: if
		 * the value 'utf-16' is missing from the array of position encodings
		 * servers can assume that the client supports UTF-16. UTF-16 is
		 * therefore a mandatory encoding.
		 *
		 * If omitted it defaults to ['utf-16'].
		 * @since 3.17.0
		 */
		positionEncodings?: PositionEncodingKind[];
	};

	/** Experimental client capabilities. */
	experimental?: LSPAny;
}
```

### 11.3 `InitializeResult` / init error

```typescript
interface InitializeResult {
	/** The capabilities the language server provides. */
	capabilities: ServerCapabilities;

	/** Information about the server. @since 3.15.0 */
	serverInfo?: {
		name: string;
		version?: string;
	};
}
```

```typescript
/** Known error codes for an `InitializeErrorCodes`; */
export namespace InitializeErrorCodes {
	/**
	 * If the protocol version provided by the client can't be handled by
	 * the server.
	 * @deprecated This initialize error got replaced by client capabilities.
	 * There is no version handshake in version 3.0x
	 */
	export const unknownProtocolVersion: 1 = 1;
}
export type InitializeErrorCodes = 1;
```

```typescript
interface InitializeError {
	/**
	 * Indicates whether the client execute the following retry logic:
	 * (1) show the message provided by the ResponseError to the user
	 * (2) user selects retry or cancel
	 * (3) if user selected retry the initialize method is sent again.
	 */
	retry: boolean;
}
```

### 11.4 `ServerCapabilities` — shape and vocabulary

The pattern throughout is `<feature>Provider?: boolean | <Feature>Options | <Feature>RegistrationOptions`.

```typescript
interface ServerCapabilities {
	/**
	 * The position encoding the server picked from the encodings offered
	 * by the client via the client capability `general.positionEncodings`.
	 * If the client didn't provide any position encodings the only valid
	 * value that a server can return is 'utf-16'. If omitted it defaults
	 * to 'utf-16'.
	 * @since 3.17.0
	 */
	positionEncoding?: PositionEncodingKind;

	/**
	 * Defines how text documents are synced. Is either a detailed structure
	 * defining each notification or for backwards compatibility the
	 * TextDocumentSyncKind number. If omitted it defaults to
	 * `TextDocumentSyncKind.None`.
	 */
	textDocumentSync?: TextDocumentSyncOptions | TextDocumentSyncKind;

	/** @since 3.17.0 */
	notebookDocumentSync?: NotebookDocumentSyncOptions
		| NotebookDocumentSyncRegistrationOptions;

	completionProvider?: CompletionOptions;
	hoverProvider?: boolean | HoverOptions;
	signatureHelpProvider?: SignatureHelpOptions;
	declarationProvider?: boolean | DeclarationOptions | DeclarationRegistrationOptions;
	definitionProvider?: boolean | DefinitionOptions;
	typeDefinitionProvider?: boolean | TypeDefinitionOptions | …;
	implementationProvider?: boolean | ImplementationOptions | …;
	referencesProvider?: boolean | ReferenceOptions;
	documentHighlightProvider?: boolean | DocumentHighlightOptions;
	documentSymbolProvider?: boolean | DocumentSymbolOptions;
	codeActionProvider?: boolean | CodeActionOptions;
	codeLensProvider?: CodeLensOptions;
	documentLinkProvider?: DocumentLinkOptions;
	colorProvider?: boolean | DocumentColorOptions | …;
	documentFormattingProvider?: boolean | DocumentFormattingOptions;
	documentRangeFormattingProvider?: boolean | DocumentRangeFormattingOptions;
	documentOnTypeFormattingProvider?: DocumentOnTypeFormattingOptions;
	renameProvider?: boolean | RenameOptions;
	foldingRangeProvider?: boolean | FoldingRangeOptions | …;
	executeCommandProvider?: ExecuteCommandOptions;
	selectionRangeProvider?: boolean | SelectionRangeOptions | …;
	linkedEditingRangeProvider?: boolean | LinkedEditingRangeOptions | …;
	callHierarchyProvider?: boolean | CallHierarchyOptions | …;
	semanticTokensProvider?: SemanticTokensOptions | …;
	monikerProvider?: boolean | MonikerOptions | MonikerRegistrationOptions;
	typeHierarchyProvider?: boolean | TypeHierarchyOptions | …;
	inlineValueProvider?: boolean | InlineValueOptions | …;
	inlayHintProvider?: boolean | InlayHintOptions | …;
	diagnosticProvider?: DiagnosticOptions | DiagnosticRegistrationOptions;
	workspaceSymbolProvider?: boolean | WorkspaceSymbolOptions;

	workspace?: { /* workspaceFolders, fileOperations */ };

	experimental?: LSPAny;
}
```

### 11.5 `initialized` (client → server, notification)

> "The initialized notification is sent from the client to the server after the client received the
> result of the `initialize` request but before the client is sending any other request or
> notification to the server. The server can use the `initialized` notification, for example, to
> dynamically register capabilities. The `initialized` notification may only be sent once."

method: `'initialized'`; params:

```typescript
interface InitializedParams {
}
```

### 11.6 `shutdown` (client → server, request)

> "The shutdown request is sent from the client to the server. It asks the server to shut down, but
> to not exit (otherwise the response might not be delivered correctly to the client). There is a
> separate exit notification that asks the server to exit. Clients must not send any notifications
> other than `exit` or requests to a server to which they have sent a shutdown request. Clients
> should also wait with sending the `exit` notification until they have received a response from the
> `shutdown` request."

> "If a server receives requests after a shutdown request those requests should error with
> `InvalidRequest`."

_Request_: method `'shutdown'`, params: none.
_Response_: result `null`; "error: code and message set in case an exception happens during shutdown
request."

### 11.7 `exit` (client → server, notification)

> "A notification to ask the server to exit its process. The server should exit with `success` code
> 0 if the shutdown request has been received before; otherwise with `error` code 1."

method: `'exit'`; params: none.

### 11.8 `$/setTrace` (client → server, notification)

> "A notification that should be used by the client to modify the trace setting of the server."

method: `'$/setTrace'`; params:

```typescript
interface SetTraceParams {
	/** The new value that should be assigned to the trace setting. */
	value: TraceValue;
}
```

(Companion `$/logTrace` is server → client in the same lifecycle group.)

### 11.9 Dynamic registration — `client/registerCapability` (server → client, request)

> "The `client/registerCapability` request is sent from the server to the client to register for a
> new capability on the client side. Not all clients need to support dynamic capability
> registration. A client opts in via the `dynamicRegistration` property on the specific client
> capabilities. A client can even provide dynamic registration for capability A but not for
> capability B."

> "Server must not register the same capability both statically through the initialize result and
> dynamically for the same document selector. If a server wants to support both static and dynamic
> registration it needs to check the client capability in the initialize request and only register
> the capability statically if the client doesn't support dynamic registration for that capability."

_Request_: method `'client/registerCapability'`, params `RegistrationParams`:

```typescript
/** General parameters to register for a capability. */
export interface Registration {
	/**
	 * The id used to register the request. The id can be used to deregister
	 * the request again.
	 */
	id: string;
	/** The method / capability to register for. */
	method: string;
	/** Options necessary for the registration. */
	registerOptions?: LSPAny;
}

export interface RegistrationParams {
	registrations: Registration[];
}
```

Example JSON-RPC message (verbatim, "only details shown"):

```json
{
	"method": "client/registerCapability",
	"params": {
		"registrations": [
			{
				"id": "79eee87c-c409-4664-8102-e03263673f6f",
				"method": "textDocument/willSaveWaitUntil",
				"registerOptions": {
					"documentSelector": [
						{ "language": "javascript" }
					]
				}
			}
		]
	}
}
```

_Response_: "result: void. error: code and message set in case an exception happens during the
request."

```typescript
/** Static registration options to be returned in the initialize request. */
export interface StaticRegistrationOptions {
	/**
	 * The id used to register the request. The id can be used to deregister
	 * the request again. See also Registration#id.
	 */
	id?: string;
}

/** General text document registration options. */
export interface TextDocumentRegistrationOptions {
	/**
	 * A document selector to identify the scope of the registration. If set to
	 * null the document selector provided on the client side will be used.
	 */
	documentSelector: DocumentSelector | null;
}
```
