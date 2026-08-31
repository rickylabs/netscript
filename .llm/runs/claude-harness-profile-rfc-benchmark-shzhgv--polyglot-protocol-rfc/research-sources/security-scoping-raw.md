# RFC-5 Round 2 — Source Aggregation: `security-scoping`

Faithful collection only. No analysis, no recommendations. All fetches dated **2026-08-20**.
Extracts are quoted/paraphrased from the fetched page text; quotation marks mark verbatim source
wording.

---

## 1. AWS Lambda — per-invocation credential delivery via environment variables

### 1.1 Source: Lambda environment variables

- URL: https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
- Fetched: 2026-08-20

Framing statement:

> "The Lambda runtime makes environment variables available to your code and sets additional
> environment variables that contain information about the function and invocation request."

> "Environment variables are not evaluated before the function invocation. Any value you define is
> considered a literal string and not expanded."

Security note on user-set variables:

> "To increase security, we recommend that you use AWS Secrets Manager instead of environment
> variables to store database credentials and other sensitive information like API keys or
> authorization tokens."

Reserved runtime environment variables (section "Defined runtime environment variables"):

> "Lambda runtimes set several environment variables during initialization. Most of the environment
> variables provide information about the function or runtime. The keys for these environment
> variables are *reserved* and cannot be set in your function configuration."

Credential- and endpoint-relevant reserved variables, verbatim:

- `_HANDLER` – "The handler location configured on the function."
- `_X_AMZN_TRACE_ID` – "The X-Ray tracing header. **This environment variable changes with each
  invocation.**"
  - "This environment variable is not defined for OS-only runtimes (the `provided` runtime family).
    You can set `_X_AMZN_TRACE_ID` for custom runtimes using the `Lambda-Runtime-Trace-Id` response
    header from the Next invocation."
- `AWS_DEFAULT_REGION` – "The default AWS Region where the Lambda function is executed."
- `AWS_REGION` – "The AWS Region where the Lambda function is executed. If defined, this value
  overrides the `AWS_DEFAULT_REGION`."
- `AWS_EXECUTION_ENV` – "The runtime identifier, prefixed by `AWS_Lambda_` (for example,
  `AWS_Lambda_java8`)."
- `AWS_LAMBDA_FUNCTION_NAME` / `AWS_LAMBDA_FUNCTION_MEMORY_SIZE` / `AWS_LAMBDA_FUNCTION_VERSION`
- `AWS_LAMBDA_INITIALIZATION_TYPE` – "The initialization type of the function, which is `on-demand`,
  `provisioned-concurrency`, `snap-start`, or `lambda-managed-instances`."
- `AWS_LAMBDA_LOG_GROUP_NAME`, `AWS_LAMBDA_LOG_STREAM_NAME`
- **`AWS_ACCESS_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`** – "The
  access keys obtained from the function's execution role."
- **`AWS_LAMBDA_RUNTIME_API`** – "(Custom runtime) The host and port of the runtime API."
- `LAMBDA_TASK_ROOT` – "The path to your Lambda function code."
- `LAMBDA_RUNTIME_DIR` – "The path to runtime libraries."
- `AWS_LAMBDA_MAX_CONCURRENCY` – "(Lambda Managed Instances only) The maximum number of concurrent
  invocations Lambda will send to one execution environment."
- **`AWS_LAMBDA_METADATA_API`** – "The metadata endpoint server address in the format
  `{ipv4_address}:{port}` (for example, `169.254.100.1:9001`)."
- **`AWS_LAMBDA_METADATA_TOKEN`** – "A unique authentication token for the current execution
  environment used to authenticate requests to the metadata endpoint. **Lambda generates this token
  automatically at initialization.**"

Unreserved (extendable) variables include `LANG`, `PATH`, `LD_LIBRARY_PATH`, `NODE_PATH`,
`NODE_OPTIONS`, `PYTHONPATH`, `GEM_PATH`, `AWS_XRAY_CONTEXT_MISSING`, `AWS_XRAY_DAEMON_ADDRESS`,
`AWS_LAMBDA_DOTNET_PREJIT`, `TZ`.

Version locking:

> "You define environment variables on the unpublished version of your function. When you publish a
> version, the environment variables are locked for that version along with other version-specific
> configuration settings."

Limits: keys "start with a letter and are at least two characters", contain only letters/numbers/`_`,
must not be reserved, and "The total size of all environment variables doesn't exceed 4 KB."

At-rest handling: "Lambda stores environment variables securely by encrypting them at rest."

### 1.2 Source: Lambda execution role

- URL: https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html
- Fetched: 2026-08-20

> "A Lambda function's execution role is an AWS Identity and Access Management (IAM) role that
> grants the function permission to access AWS services and resources."

> "**Lambda automatically assumes your execution role when you invoke your function.** You should
> avoid manually calling `sts:AssumeRole` to assume the execution role in your function code. If
> your use case requires that the role assumes itself, you must include the role itself as a trusted
> principal in your role's trust policy."

> "In order for Lambda to properly assume your execution role, the role's trust policy must specify
> the Lambda service principal (`lambda.amazonaws.com`) as a trusted service."

Trust policy shape (verbatim example):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Default policy attached by console creation: `AWSLambdaBasicExecutionRole` ("gives your function
basic permissions to log events to Amazon CloudWatch Logs").

Least privilege:

> "When you first create an IAM role for your Lambda function during the development phase, you
> might sometimes grant permissions beyond what is required. Before publishing your function in the
> production environment, as a best practice, adjust the policy to include only the required
> permissions."

> "Use IAM Access Analyzer to help identify the required permissions for the IAM execution role
> policy. IAM Access Analyzer reviews your AWS CloudTrail logs over the date range that you specify
> and generates a policy template with only the permissions that the function used during that
> time."

**Note (faithfulness):** this page does not state an explicit credential TTL or rotation cadence; the
only rotation-relevant statement located in these two AWS pages is that the reserved credential
variables are "obtained from the function's execution role" and set by the runtime "during
initialization."

### 1.3 Source: container credential provider (`AWS_CONTAINER_CREDENTIALS_FULL_URI` pattern)

- URL: https://docs.aws.amazon.com/sdkref/latest/guide/feature-container-credentials.html
- Fetched: 2026-08-20

> "The container credential provider fetches credentials for customer's containerized application.
> This credential provider is useful for Amazon Elastic Container Service (Amazon ECS) and Amazon
> Elastic Kubernetes Service (Amazon EKS) customers. **SDKs attempt to load credentials from the
> specified HTTP endpoint through a GET request.**"

ECS path:

> "If you use Amazon ECS, we recommend you use a task IAM Role for improved credential isolation,
> authorization, and auditability. When configured, Amazon ECS sets the
> `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` environment variable that the SDKs and tools use to
> obtain credentials."

EKS path:

> "Both your Pod and an IAM role are associated with a Kubernetes service account to manage
> credentials for your applications. ... When configured, Amazon EKS sets the
> `AWS_CONTAINER_CREDENTIALS_FULL_URI` and `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE` environment
> variables that the SDKs and tools use to obtain credentials."

Setting definitions, verbatim:

- **`AWS_CONTAINER_CREDENTIALS_FULL_URI`** (environment variable) – "Specifies the full HTTP URL
  endpoint for the SDK to use when making a request for credentials. This includes both the scheme
  and the host." Default: None. Valid values: "Valid URI." — "This setting is an alternative to
  `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` and will only be used if
  `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` is not set."
  - Examples: `export AWS_CONTAINER_CREDENTIALS_FULL_URI=http://localhost/get-credentials` and
    `export AWS_CONTAINER_CREDENTIALS_FULL_URI=http://localhost:8080/get-credentials`
- **`AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`** – "Specifies the relative HTTP URL endpoint for the
  SDK to use when making a request for credentials. **The value is appended to the default Amazon ECS
  hostname of `169.254.170.2`.**" Example:
  `export AWS_CONTAINER_CREDENTIALS_RELATIVE_URI=/get-credentials?a=1`
- **`AWS_CONTAINER_AUTHORIZATION_TOKEN`** – "Specifies an authorization token in plain text. If this
  variable is set, the SDK will set the Authorization header on the HTTP request with the environment
  variable's value." — "This setting is an alternative to `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE`
  and will only be used if `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE` is not set." Example:
  `export AWS_CONTAINER_AUTHORIZATION_TOKEN="Basic abcd"`
- **`AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE`** – "Specifies an absolute file path to a file that
  contains the authorization token in plain text." Example:
  `export AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE=/path/to/token`

SnapStart interaction (repeated in the SDK support table for Java 1.x/2.x, .NET 3.x/4.x, Boto3):

> "When Lambda SnapStart is activated, `AWS_CONTAINER_CREDENTIALS_FULL_URI` and
> `AWS_CONTAINER_AUTHORIZATION_TOKEN` are automatically used for authentication."

**Note (faithfulness):** this page does not state explicit loopback/link-local host restrictions, the
JSON credential response body shape, or token-file re-read cadence; those were not present in the
fetched text.

### 1.4 Source: Lambda metadata endpoint (local HTTP endpoint + per-environment bearer token)

- URL: https://docs.aws.amazon.com/lambda/latest/dg/configuration-metadata-endpoint.html
- Fetched: 2026-08-20

> "The endpoint returns metadata in a simple JSON format through a localhost HTTP API within the
> execution environment and is accessible to both runtimes and extensions."

Environment variables:

> "Lambda automatically sets the following environment variables in every execution environment:
> `AWS_LAMBDA_METADATA_API` – The metadata server address in the format `{ipv4_address}:{port}` (for
> example, `169.254.100.1:9001`). `AWS_LAMBDA_METADATA_TOKEN` – A unique authentication token for the
> current execution environment. Lambda generates this token automatically at initialization. Include
> it in all metadata API requests."

Endpoint and request:

```
GET http://${AWS_LAMBDA_METADATA_API}/2026-01-15/metadata/execution-environment
```

> "Required headers: `Authorization` – The token value from the `AWS_LAMBDA_METADATA_TOKEN`
> environment variable with the Bearer scheme: `Bearer <token>`. **This token-based authentication
> provides defense in depth protection against Server-Side Request Forgery (SSRF) vulnerabilities.
> Each execution environment receives a unique, randomly generated token at initialization.**"

Raw usage example (verbatim):

```bash
# Variables are automatically set by Lambda
METADATA_ENDPOINT="http://${AWS_LAMBDA_METADATA_API}/2026-01-15/metadata/execution-environment"
RESPONSE=$(curl -s -H "Authorization: Bearer ${AWS_LAMBDA_METADATA_TOKEN}" "$METADATA_ENDPOINT")
AZ_ID=$(echo "$RESPONSE" | jq -r '.AvailabilityZoneID')
```

Response:

- Status `200 OK`, `Content-Type: application/json`,
  `Cache-Control: private, max-age=43200, immutable`
- Body: `{ "AvailabilityZoneID": "use1-az1" }`

> "The response is immutable within an execution environment. Clients should cache the response and
> respect the `Cache-Control` TTL. **For SnapStart functions, the TTL is reduced during
> initialization so that clients refresh metadata after restore when the execution environment might
> be in a different AZ.**"

> "Additional fields might be added to the response in future updates. Clients should ignore unknown
> fields and not fail if new fields appear."

Errors: `401 Unauthorized` ("The `Authorization` header is missing or contains an invalid token"),
`405 Method Not Allowed` ("Request method is not `GET`"), `500 Internal Server Error`.

---

## 2. Temporal — Activity Task Token and asynchronous completion

### 2.1 Source: Activity Execution / Task Token

- URL: https://docs.temporal.io/activity-execution
- Fetched: 2026-08-20

> A Task Token is "a unique identifier for an Activity Task Execution."

> "Asynchronous Activity Completion calls take either of the following as arguments: a Task Token,
> or an Activity Id, a Workflow Id, and optionally a Run Id."

Invalidation caveat, verbatim intent:

> Task Tokens can become invalidated upon Activity retry. When an Activity fails after transmitting
> its current Task Token to a remote service but before completing the async error, the remote
> service is left holding an obsolete token. Guidance: "you can provide the Activity Id and Workflow
> Id to the remote service instead of the Task Token."

**Note (faithfulness):** the page does **not** state what specific operations a Task Token
authorizes, nor does it tie heartbeating/timeouts to the token. That gap is explicit in the fetched
content.

### 2.2 Source: Go SDK asynchronous activity completion

- URL: https://docs.temporal.io/develop/go/asynchronous-activity-completion
- Fetched: 2026-08-20

Obtaining the token:

```go
activityInfo := activity.GetInfo(ctx)
taskToken := activityInfo.TaskToken
```

> The token is "the binary `TaskToken` field of the `ActivityInfo` struct". It "is then sent to the
> external system that will complete the Activity."

Signalling pending completion:

```go
return "", activity.ErrResultPending
```

> The Activity Function returns `activity.ErrResultPending` to indicate it is "completing in a way
> that identifies it as waiting to be completed by an external system".

Completing from the external system:

```go
temporalClient, err := client.Dial(client.Options{})
temporalClient.CompleteActivity(context.Background(), taskToken, result, nil)
```

Failing:

```go
client.CompleteActivity(context.Background(), taskToken, nil, err)
```

> "When an error is provided, the `result` parameter is ignored."

Authority statement present in the page: the token "serves as identifying information, enabling the
external system to complete the specific Activity Execution. It authorizes the `CompleteActivity`
call by linking it to the original Activity."

### 2.3 Source: TypeScript SDK asynchronous activity completion

- URL: https://docs.temporal.io/develop/typescript/asynchronous-activity-completion
- Fetched: 2026-08-20

- Token obtention: `const taskToken = activityInfo().taskToken;`
- Pending signal: throw `CompleteAsyncError()` — indicates the Activity Function is "waiting to be
  completed by an external system."
- Completion: `await client.activity.complete(taskToken, "Job's done!");`

> The documentation "does not contain statements describing the task token as an opaque binary
> identifier or detailing what permissions its holder possesses." It only explains that identifying
> information (either a task token or namespace/workflow/activity IDs) is "needed to complete the
> Activity Execution".

### 2.4 Source: Activity heartbeats / failure detection

- URL: https://docs.temporal.io/encyclopedia/detecting-activity-failures
- Fetched: 2026-08-20

> An Activity Heartbeat is "a ping from the Worker that is executing the Activity to the Temporal
> Service." It signals that "the Activity Execution is making progress and the Worker has not
> crashed."

> A Heartbeat Timeout is "the maximum time between Activity Heartbeats." When exceeded, "the Activity
> Task fails and a retry occurs if a Retry Policy dictates it."

> Heartbeats are "implemented within the Activity Definition" and "can be recorded as often as
> needed." Recommendation: heartbeat "on anything but the shortest Activity Execution."

> Custom progress information can be embedded; if an activity times out due to missed heartbeats,
> "the next Activity Task can access and continue with that payload."

> "Activity Cancellations are delivered to Activities from the Temporal Service when they Heartbeat.
> Activities that don't Heartbeat can't receive a Cancellation."

**Note (faithfulness):** this page does not mention task tokens, `RecordActivityHeartbeat`, or
`RecordActivityHeartbeatByID`.

---

## 3. Kubernetes — bound service account token projection

### 3.1 Source: Configure Service Accounts for Pods

- URL: https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/
- Fetched: 2026-08-20

> In Kubernetes v1.22 and later, API credentials are obtained directly using the **TokenRequest API**
> and are mounted into Pods using a **projected volume**. This replaces the older mechanism of
> automatically created long-term token Secrets.

Projected volume source (verbatim example):

```yaml
spec:
  volumes:
    - name: sa-token
      projected:
        sources:
          - serviceAccountToken:
              audience: api
              expirationSeconds: 3600
              path: token
```

Full pod example (verbatim):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: sa-token-test
spec:
  containers:
    - name: app
      image: nginx
      volumeMounts:
        - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
          name: sa-token
          readOnly: true
  serviceAccountName: build-robot
  volumes:
    - name: sa-token
      projected:
        sources:
          - serviceAccountToken:
              audience: api
              expirationSeconds: 3600
              path: token
```

Field semantics as fetched:

- **`audience`** — "Specifies the intended audience for the token." Default value: `api` (for the
  Kubernetes API server). "Can be customized for other use cases."
- **`expirationSeconds`** — "**Minimum value**: 600 seconds (10 minutes). **Default value**: 3600
  seconds (1 hour). Tokens obtained using TokenRequest have bounded lifetimes. The actual token
  duration might be shorter or longer than requested."
- **`path`** — where the token is mounted within the Pod; default `token`; token typically mounted at
  `/var/run/secrets/kubernetes.io/serviceaccount/token`.

Lifecycle:

- "The kubelet automatically handles token rotation. Tokens are refreshed before expiration to
  maintain continuous access."
- "Tokens are automatically invalidated when the Pod they are mounted into is deleted."
- "Tokens are also revoked when the associated ServiceAccount is deleted."
- "API credentials are revoked **60 seconds beyond** the `.metadata.deletionTimestamp` set on the Pod
  (typically the deletion request time plus the Pod's termination grace period)."

Node-bound tokens (v1.31+):

```bash
kubectl create token build-robot --bound-object-kind Node \
  --bound-object-name node-001 \
  --bound-object-uid 123...456
```

> "Token remains valid until it expires or the associated Node/ServiceAccount are deleted."

Stated rationale for preferring TokenRequest + projected volumes over long-lived Secrets: bounded,
time-limited lifetimes; automatic invalidation on Pod deletion; automatic rotation by kubelet;
limited token exposure.

### 3.2 Source: Managing Service Accounts (admin reference)

- URL: https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/
- Fetched: 2026-08-20

TokenRequest CLI surface:

```bash
kubectl create token <serviceaccount-name> [flags]
```

- `--audience` — intended audience (e.g. `https://my-service.example.com`)
- `--duration` — token expiration duration (default: 1 hour)
- `--bound-object-kind` — bind token to an API object type: `Pod`, `Secret`, or `Node`
- `--bound-object-name`, `--bound-object-uid`

Example:

```bash
kubectl create token my-sa --bound-object-kind="Pod" --bound-object-name="test-pod" \
  --audience="https://kubernetes.default.svc.cluster.local"
```

Binding targets and revocation, as fetched:

| Object type | Use case             | Revocation                          |
| ----------- | -------------------- | ----------------------------------- |
| `Pod`       | Container workloads  | Auto-revoked when Pod is deleted    |
| `Secret`    | Manual revocation    | Revoke by deleting the Secret object |
| `Node`      | Node-specific tokens (GA v1.33+) | Auto-revoked when Node is deleted |

Binding is stored as "extra private claims" in the JWT. Full example claim set (verbatim):

```json
{
  "aud": ["https://kubernetes.default.svc.cluster.local"],
  "exp": 1729605240,
  "iat": 1729601640,
  "iss": "https://my-cluster.example.com",
  "jti": "aed34954-b33a-4142-b1ec-389d6bbb4936",
  "kubernetes.io": {
    "namespace": "my-namespace",
    "node": { "name": "my-node", "uid": "646e7c5e-32d6-4d42-9dbd-e504e6cbe6b1" },
    "pod": { "name": "my-pod", "uid": "5e0bd49b-f040-43b0-99b7-22765a53f7f3" },
    "serviceaccount": {
      "name": "my-serviceaccount",
      "uid": "14ee3fa4-a7e2-420f-9f9a-dbc4507c3798"
    }
  },
  "nbf": 1729601640,
  "sub": "system:serviceaccount:my-namespace:my-serviceaccount"
}
```

API-server verification behavior:

- "The `kube-apiserver` extracts and verifies these private claims."
- "If the bound object no longer exists, authentication **fails**."
- "If the object is pending deletion (with `metadata.deletionTimestamp`), requests are rejected
  **60+ seconds** after the deletion timestamp."
- "The bound object's `metadata.uid` must match exactly."

Audience:

- "If no audience is specified when requesting a token, the token defaults to the cluster's API
  server audience. This is less secure for external services."

Expiration and refresh:

- Default duration: 1 hour (3600 seconds), configurable via `--duration`.
- `--service-account-extend-token-expiration`: "When this feature is enabled, tokens can be issued
  with longer lifespans" — "Reduces token refresh overhead for long-running workloads."
- **Kubelet refresh**: "The kubelet automatically refreshes tokens at **80% of the token's TTL**, OR
  **24 hours** (whichever comes first)." Worked examples given: 3600 s token → refresh at 2880 s;
  86400 s token → refresh at 19.2 h.

TokenReview verification:

```yaml
apiVersion: authentication.k8s.io/v1
kind: TokenReview
spec:
  token: <jwt-token-string>
```

Response carries extracted claims as user `extra`, e.g.
`authentication.kubernetes.io/pod-name`, `authentication.kubernetes.io/pod-uid`,
`authentication.kubernetes.io/node-name`.

Warnings, as fetched:

- Without audience binding: "Token is valid for any service that accepts it"; "No restriction to
  specific API consumer"; "Security risk in multi-tenant environments."
- Without object binding: "Token remains valid even after the Pod/Secret is deleted"; "Manual
  revocation not possible without token expiration."
- Offline JWT validation: can verify the signature using OpenID Discovery, but **cannot** verify
  whether the bound object still exists or whether the token is still not-before-time valid.
  "Recommendation: Always use TokenReview API for tokens with business-critical access, especially
  when bound to objects."

---

## 4. OAuth 2.0 Token Exchange — RFC 8693

- URL: https://datatracker.ietf.org/doc/html/rfc8693
- Fetched: 2026-08-20

Abstract (verbatim):

> "This specification defines a protocol for an HTTP- and JSON-based Security Token Service (STS) by
> defining how to request and obtain security tokens from OAuth 2.0 authorization servers, including
> security tokens employing impersonation and delegation."

Section 1.1 — delegation vs. impersonation, as fetched:

- **Impersonation**: "When principal A impersonates principal B, A receives all of B's rights within
  a defined context and becomes indistinguishable from B to external entities."
- **Delegation**: "Principal A retains its own identity while B's delegated rights are exercised by
  A, which acts as an agent for B on B's behalf."

Request parameters:

| Parameter              | Status      | Definition (as fetched)                                                                                    |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `grant_type`           | REQUIRED    | Value: `urn:ietf:params:oauth:grant-type:token-exchange`                                                     |
| `resource`             | OPTIONAL    | "A URI that indicates the target service or resource where the client intends to use the requested security token" |
| `audience`             | OPTIONAL    | "The logical name of the target service where the client intends to use the requested security token"       |
| `scope`                | OPTIONAL    | "A list of space-delimited, case-sensitive strings" specifying desired access scope                          |
| `requested_token_type` | OPTIONAL    | "An identifier for the type of the requested security token"                                                 |
| `subject_token`        | REQUIRED    | "A security token that represents the identity of the party on behalf of whom the request is being made"     |
| `subject_token_type`   | REQUIRED    | "An identifier that indicates the type of the security token in the subject_token parameter"                 |
| `actor_token`          | OPTIONAL    | "A security token that represents the identity of the acting party"                                          |
| `actor_token_type`     | CONDITIONAL | "An identifier that indicates the type of the security token in the actor_token parameter" (REQUIRED when `actor_token` present) |

Response parameters:

| Parameter           | Status      | Definition (as fetched)                                                                                          |
| ------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `access_token`      | REQUIRED    | "The security token issued by the authorization server in response to the token exchange request"                  |
| `issued_token_type` | REQUIRED    | "An identifier for the representation of the issued security token"                                                |
| `token_type`        | REQUIRED    | "A case-insensitive value specifying the method of using the access token issued"                                  |
| `expires_in`        | RECOMMENDED | "The validity lifetime, in seconds, of the token issued by the authorization server"                               |
| `scope`             | CONDITIONAL | REQUIRED if different from requested scope; OPTIONAL if identical                                                  |
| `refresh_token`     | OPTIONAL    | "A refresh token will typically not be issued when the exchange is of one temporary credential for a different temporary credential" |

JWT claims:

- **`act` (actor)**: "The act (actor) claim provides a means within a JWT to express that delegation
  has occurred and identify the acting party to whom authority has been delegated." Value is a JSON
  object of identity claims about the actor. Delegation chains are expressed through nested `act`
  claims, with "the outermost act claim represents the current actor while nested act claims
  represent prior actors."
- **`may_act` (authorized actor)**: "The may_act claim makes a statement that one party is authorized
  to become the actor and act on behalf of another party." Identifies eligible parties using a JSON
  object format with identity-only claims.

Token type identifier URIs:

- `urn:ietf:params:oauth:token-type:access_token` — "OAuth 2.0 access token from the authorization
  server"
- `urn:ietf:params:oauth:token-type:refresh_token` — "OAuth 2.0 refresh token from the authorization
  server"
- `urn:ietf:params:oauth:token-type:id_token` — "OpenID Connect ID Token"
- `urn:ietf:params:oauth:token-type:saml1` — "Base64url-encoded SAML 1.1 assertion"
- `urn:ietf:params:oauth:token-type:saml2` — "Base64url-encoded SAML 2.0 assertion"
- `urn:ietf:params:oauth:token-type:jwt` — "JWT format token"

---

## 5. Offline-attenuable capability tokens

### 5.1 Macaroons — original paper abstract

- URL: https://research.google/pubs/pub41892/
- Fetched: 2026-08-20
- Title: "Macaroons: Cookies with Contextual Caveats for Decentralized Authorization in the Cloud"

Abstract, as fetched:

> "Controlled sharing is fundamental to distributed systems; yet, on the Web, and in the Cloud,
> sharing is still based on rudimentary mechanisms."

> Macaroons are authorization credentials enabling decentralized delegation. They use chained MACs
> efficiently while embedding "caveats that attenuate and contextually confine when, where, by who,
> and for what purpose a target service should authorize requests."

> The work compares macaroons to alternative systems like cookies and SPKI/SDSI, evaluates a
> prototype, and demonstrates how they can strengthen mechanisms such as OAuth2.

### 5.2 Macaroons — corroborating summary from web search over the paper and derivative docs

- Search performed: 2026-08-20 (query on chained HMAC / third-party discharge)
- Result URLs surfaced (all reachable listings; PDF bodies not text-extractable in this environment):
  - https://www.ndss-symposium.org/ndss2014/ndss-2014-programme/macaroons-cookies-contextual-caveats-decentralized-authorization-cloud/
  - https://theory.stanford.edu/~ataly/Papers/macaroons.pdf
  - https://www.ndss-symposium.org/wp-content/uploads/2017/09/04_3_1.pdf
  - https://research.google/pubs/macaroons-cookies-with-contextual-caveats-for-decentralized-authorization-in-the-cloud/
  - https://docs.lightning.engineering/the-lightning-network/l402/macaroons

Extracts as returned:

> "Macaroons are authorization credentials whose efficiency and ease-of-deployment equal that of Web
> cookies, thanks to their chained-HMAC construction. Unlike cookies, macaroons support efficient,
> widely-applicable forms of decentralized delegation, with expressiveness that rivals
> public-key-based mechanisms like SPKI/SDSI."

> "Macaroons embed caveats that attenuate and contextually confine when, where, by who, and for what
> purpose a target service should authorize requests. Caveats are nested and chained HMACs, used to
> append restrictions to the cookies, restricting usage and marking the need for additional
> authentication proofs."

> "Macaroons are based on a construction that uses nested, chained MACs (e.g., HMACs) in a manner
> that is highly efficient, easy to deploy, and widely applicable."

> "Third-party caveats can be used to implement decentralized authorization using holder-of-key
> proofs from authentication servers."

Applied usage note (Lightning docs): "Together with preimages obtained through Lightning Network
payments, Macaroons form the basis of L402, which are used by Lightning Pool and Lightning Loop to
authenticate users."

### 5.3 Macaroons — reference implementation README (construction mechanics)

- URL: https://raw.githubusercontent.com/rescrv/libmacaroons/master/README
- Fetched: 2026-08-20

Root macaroon creation — requires three pieces of information: a secret key, a public identifier, and
a location hint.

> "We start with a secret" — it should be random and unpredictable. "The public portion tells us
> which secret we used to create the macaroon, but doesn't give anyone else a clue as to the contents
> of the secret."

> The location is "a hint to the user about where the macaroon is accepted for authorization," though
> the library assigns no special meaning to it.

First-party caveats and one-way attenuation:

> "A macaroon's caveats are constructed using chained HMAC functions, which makes it really easy to
> add a caveat, but impossible to remove a caveat."

Third-party caveats:

> The process involves generating a random "caveat_key," specifying a "predicate" to check, and
> sending these to the third party who returns an "identifier" for embedding in the macaroon.

Discharge macaroons:

> Third parties prove caveat satisfaction by issuing discharge macaroons — new macaroons the holder
> presents alongside the original.

Request preparation / binding:

> Before transmission, "the root macaroon is used to bind the discharge macaroons" through a
> preparation step that cryptographically ties them together, preventing misuse in other contexts.

Verification:

> Services verify using a verifier that checks exact caveats, evaluates general caveats via
> callbacks, and recursively validates discharge macaroons.

### 5.4 Biscuit tokens — specification

- URL: https://raw.githubusercontent.com/eclipse-biscuit/biscuit/main/SPECIFICATIONS.md
- Fetched: 2026-08-20
- (Note: `https://www.biscuitsec.org/docs/getting-started/introduction/` and
  `https://www.biscuitsec.org/docs/reference/specifications/` both returned HTTP 403 — see
  `failed_urls`.)

Cryptographic construction:

> Biscuit employs "public key cryptography operations: the initial creator of a token holds a secret
> key, and any authorizer for the token needs only to know the corresponding public key."

> The system uses a **chain of signatures** where each block contains serialized Datalog code, a
> subsequent public key, and a signature from the previous key. Supported algorithms include Ed25519
> (default) and ECDSA over secp256r1.

Block structure:

> "A Biscuit token is defined as a series of blocks. The first one, named 'authority block', contains
> rights given to the token holder."

> Subsequent blocks add restrictions through checks without removing prior blocks. Each block
> includes facts, rules, checks, and a symbol table. The authority block establishes initial
> permissions; later blocks only attenuate them.

Offline attenuation:

> The token holder can "at any time create a new token by adding a block with more checks, thus
> restricting the rights of the new token, but they cannot remove existing blocks without
> invalidating the signature."

> This append-only architecture prevents privilege escalation — new blocks narrow scope but cannot
> restore revoked capabilities.

Authorizer / Datalog:

> The authorizer is "the context in which a biscuit is evaluated. An authorizer may carry facts,
> rules, checks and policies."

> Checks must succeed for authorization; allow/deny policies determine the final decision. "An
> operation must comply with all checks in order to be allowed by the biscuit."

Third-party blocks:

> Third-party blocks enable trusted external parties to sign blocks without accessing the full token.
> They use isolated symbol and public key tables, starting from defaults rather than the token's
> existing tables.

Sealing:

> Sealed tokens prevent further attenuation. Instead of containing ephemeral private keys, they carry
> a final signature verifying the last block and its signature chain, making additional blocks
> impossible.

Revocation identifiers:

> "The revocation identifier for a block is its signature (as it uniquely identifies the block)
> serialized to a byte array."

> The system generates facts `revocation_id(<block_index>, <signature_bytes>)` enabling revocation
> list checks.

Expiration / TTL:

> Time-based restrictions are expressed through Datalog:
> `check if time($0), $0 < 2019-02-05T23:20:00Z` — validates against expiration dates using RFC 3339
> date values.

---

## Fetch ledger

Reachable (content extracted above):

1. https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
2. https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html
3. https://docs.aws.amazon.com/sdkref/latest/guide/feature-container-credentials.html
4. https://docs.aws.amazon.com/lambda/latest/dg/configuration-metadata-endpoint.html
5. https://docs.temporal.io/activity-execution
6. https://docs.temporal.io/develop/go/asynchronous-activity-completion
7. https://docs.temporal.io/develop/typescript/asynchronous-activity-completion
8. https://docs.temporal.io/encyclopedia/detecting-activity-failures
9. https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/
10. https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/
11. https://datatracker.ietf.org/doc/html/rfc8693
12. https://research.google/pubs/pub41892/
13. https://raw.githubusercontent.com/rescrv/libmacaroons/master/README
14. https://raw.githubusercontent.com/eclipse-biscuit/biscuit/main/SPECIFICATIONS.md

Unreachable / not extractable:

- https://www.biscuitsec.org/docs/getting-started/introduction/ — HTTP 403 Forbidden
- https://www.biscuitsec.org/docs/reference/specifications/ — HTTP 403 Forbidden
- https://theory.stanford.edu/~ataly/Papers/macaroons.pdf — fetched (700.7 KB PDF) but not
  text-extractable in this environment (no `poppler-utils` for page rendering); paper content is
  represented here only via the Google Research abstract page and the search-surfaced summary in
  §5.2, plus the reference-implementation README in §5.3.
