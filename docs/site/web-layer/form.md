---
layout: layouts/base.vto
title: Server-validated forms
templateEngine: [vento, md]
---

# Server-validated forms

The `@netscript/fresh` form surface lets a Fresh page own a form end to end: parse the
posted payload on the server, validate it against a schema, surface field-level and
form-level errors, and render the same managed `Form` component on both the initial GET
and the failed POST. Reach for it when a page mutates data and must round-trip submitted
values and errors without a client framework, while keeping CSRF protection and idempotent
submissions in place.

This entrypoint is intentionally narrow. It exposes the shipped helper surface used by
playground consumers and keeps deeper form internals out of the public package contract.

{{ comp callout { type: "note" } }}
The shipped `FormState` model is intentionally small. Richer runtime state — field
descriptors, collection intents, progressive enhancement — exists in the surface (for
example `RuntimeFormState` and `FormEnhancementSnapshot`) and is introduced incrementally.
Build server-validated forms on `resolveFormState` and `Form` today; adopt the richer
descriptors as your pages need them.
{{ /comp }}

## How the surface fits together

A server-validated form moves through three layers:

1. **Parse** the incoming `FormData` into a plain nested object with `formDataToRawValues`,
   then normalize empty strings to `undefined` with `normalizeFormValues`.
2. **Validate** the normalized values. A schema adapter such as the one returned by
   `createStandardSchemaAdapter` turns any Standard Schema v1 validator into a
   `FormSchemaAdapter`, whose `safeParse` returns a normalized success or failure result.
   On failure, errors flatten into the canonical `FormErrors` shape.
3. **Render** the managed `Form` component with the resolved `FormState`. On a GET request
   the state starts from your initial values; on a failed POST it preserves the submitted
   values and errors so the page re-renders with the user's input intact.

`resolveFormState` is the bridge between the route handler and the component: it inspects
the handler `data` and either preserves an existing `FormState` or builds a fresh one from
initial values.

## Defining and rendering a form

The `Form` component renders a managed `<form>` element with the submission and CSRF hidden
inputs already wired. It accepts a `state` (the resolved `FormState`-compatible value),
the form `children`, and optional `formProps` overrides. `formProps` is a
`FormElementOverrideProps` bag: an open attribute set (every field optional, plus an
`[attribute: string]: unknown` index signature) so you can forward `class`, standard `<form>`
attributes (`action`, `method`, `noValidate`, `id`), and any additional ARIA, `data-*`, or
framework attribute onto the rendered element — you style and configure the managed form the same
way you would a plain one. The four handler slots the managed runtime owns —
`onSubmit`, `onBlurCapture`, `onInputCapture`, and `ref` — are typed `never`, so passing one is a
compile-time error rather than a silent override of the progressive-enhancement wiring.

```tsx
import { Form, resolveFormState } from "@netscript/fresh/form";

interface ContactValues {
  email: string;
  message: string;
}

export default function ContactForm({ data }: { data: unknown }) {
  const state = resolveFormState<ContactValues>(data, {
    email: "",
    message: "",
  });

  return (
    <Form<ContactValues>
      state={state}
      formProps={ { action: "/contact", method: "POST" } }
    >
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" defaultValue={state.values.email} />

      <label htmlFor="message">Message</label>
      <textarea id="message" name="message">{state.values.message}</textarea>

      <button type="submit">Send</button>
    </Form>
  );
}
```

`FormState` exposes exactly two members: `values` (the current `Partial<TValues>`) and
`errors` (a `FormErrors<TValues>` map). To read the first message for a field, call
`firstFieldError(state.errors, "email")`.

## Validating on the server

On the server, parse and validate the payload, then return a `FormState` from the handler
so the page can re-render with errors. Build a `FormSchemaAdapter` from any Standard Schema
v1 schema with `createStandardSchemaAdapter`, and convert a thrown validation error into
the canonical `FormErrors` shape with `toFormErrors`.

```ts
import {
  createEmptyFormErrors,
  createStandardSchemaAdapter,
  formDataToRawValues,
  normalizeFormValues,
  toFormErrors,
} from "@netscript/fresh/form";
import type { FormState } from "@netscript/fresh/form";

interface ContactValues {
  email: string;
  message: string;
}

// `schema` is any Standard Schema v1 compatible validator.
const adapter = createStandardSchemaAdapter<typeof schema, ContactValues>(schema);

export async function handleContact(request: Request): Promise<FormState<ContactValues>> {
  const formData = await request.formData();
  const raw = formDataToRawValues(formData);
  const values = normalizeFormValues<ContactValues>(raw);

  const result = await adapter.safeParse(values);
  if (!result.success) {
    return {
      values,
      errors: toFormErrors<ContactValues>({
        flatten: () => ({
          fieldErrors: result.fieldErrors,
          formErrors: result.formErrors,
        }),
      }),
    };
  }

  // Run the mutation with the validated `result.data`, then redirect or return success.
  return { values, errors: createEmptyFormErrors<ContactValues>() };
}
```

`formDataToRawValues` understands dotted paths and bracket indices (`items[0].productId`
becomes `{ items: [{ productId: "value" }] }`), so nested values arrive in the shape your
schema expects. `normalizeFormValues` recursively converts empty strings to `undefined`
before validation runs.

## CSRF protection

The form surface carries a CSRF token between the GET that renders the form and the POST
that submits it. Generate a token with `generateCsrfToken`, persist it with `setCsrfCookie`
on the response headers, and on submission read the cookie token with `readCsrfToken` and
compare it to the submitted token with `verifyCsrfToken`.

```ts
import {
  generateCsrfToken,
  readCsrfToken,
  setCsrfCookie,
  verifyCsrfToken,
  CSRF_FIELD_NAME,
} from "@netscript/fresh/form";

// GET: issue a token and set the cookie.
const token = generateCsrfToken();
const headers = new Headers();
setCsrfCookie(headers, token, new URL(request.url));

// POST: verify the submitted token against the cookie.
const formData = await request.formData();
const submitted = formData.get(CSRF_FIELD_NAME)?.toString();
const cookieToken = readCsrfToken(request);
if (!verifyCsrfToken(cookieToken, submitted)) {
  // Reject the submission.
}
```

The cookie name is fixed as `CSRF_COOKIE_NAME` (`"ns_form_csrf"`) and the hidden field name
as `CSRF_FIELD_NAME` (`"__csrf__"`). The managed `Form` component renders that hidden CSRF
input for you when the state carries a token.

## Idempotent submissions

Each rendered form can round-trip a stable submission identifier so a retried POST is not
processed twice. `generateSubmissionId` creates the identifier, and
`getSubmissionHiddenInputProps` returns the hidden input props that carry it under
`SUBMISSION_ID_FIELD_NAME` (`"__submission_id__"`).

```ts
import {
  generateSubmissionId,
  getSubmissionHiddenInputProps,
} from "@netscript/fresh/form";

const submissionId = generateSubmissionId();
const hiddenProps = getSubmissionHiddenInputProps(submissionId);
```

## Partial form regions

`FormRegion` renders a Fresh partial boundary so a form-driven update can replace, prepend,
or append a region of the page without a full navigation. It accepts the partial `name`,
an optional `mode` (`"replace"`, `"prepend"`, or `"append"`), and `children`.

```tsx
import { FormRegion } from "@netscript/fresh/form";

<FormRegion name="contact-result" mode="replace">
  {/* Region content updated by the form submission. */}
</FormRegion>;
```

## API summary

### Components

| Symbol | Description |
| --- | --- |
| `Form` | Render a managed form element with submission and CSRF hidden inputs. |
| `FormRegion` | Render a Fresh partial boundary for form-driven updates. |
| `FormProps<TValues>` | Props accepted by the managed form component (`state`, `children`, `formProps`, `enhancement`). |
| `FormElementOverrideProps` | The open `formProps` override bag — optional `class` / `id` / `action` / `method` / `noValidate`, an arbitrary-attribute index signature, and `never`-typed `onSubmit` / `onBlurCapture` / `onInputCapture` / `ref` slots the runtime owns. |
| `FormRegionProps` | Props for the partial-region helper (`name`, `mode`, `children`). |

### Parsing and state

| Symbol | Description |
| --- | --- |
| `formDataToRawValues` | Parse a `FormData` instance into a nested object, handling dotted paths and bracket indices. |
| `normalizeFormValues` | Normalize raw values by converting empty strings to `undefined`. |
| `resolveFormState` | Resolve form state from route handler data, preserving submitted values and errors when present. |
| `FormState<TValues>` | Lightweight shipped form state: `values` and `errors`. |

### Validation

| Symbol | Description |
| --- | --- |
| `createStandardSchemaAdapter` | Create a `FormSchemaAdapter` from any Standard Schema v1 compatible schema. |
| `FormSchemaAdapter<TValues, TOutput>` | Validation boundary with `parse`, `safeParse`, `getConstraints`, and `getDefaults`. |
| `toFormErrors` | Convert a Zod-like validation error into the canonical `FormErrors<T>` shape. |
| `createEmptyFormErrors` | Create an empty form error map. |
| `firstFieldError` | Return the first error message for a field, if present. |
| `FormErrors<TValues>` | Field-level error map; the `_form` key stores form-wide errors. |

### CSRF and idempotency

| Symbol | Description |
| --- | --- |
| `generateCsrfToken` | Generate a new CSRF token for a rendered form. |
| `readCsrfToken` | Read the current CSRF token from a request cookie header. |
| `setCsrfCookie` | Set the CSRF cookie on response headers. |
| `verifyCsrfToken` | Verify that the submitted token matches the cookie token. |
| `CSRF_COOKIE_NAME` / `CSRF_FIELD_NAME` | Cookie and hidden-field names used for the token. |
| `generateSubmissionId` | Create a new form submission identifier. |
| `getSubmissionHiddenInputProps` | Return the hidden input props that carry an idempotent submission id. |
| `SUBMISSION_ID_FIELD_NAME` | Hidden field name used to round-trip the submission id. |

## Related

{{ comp.cardsGrid({ columns: 3, cards: [ { title: "The Fresh page model", body: "How a Fresh page is composed.", href: "/web-layer/server/" }, { title: "Pages and builders", body: "The define-page builder.", href: "/web-layer/builders/" }, { title: "Routing and route contracts", body: "Map requests to handlers.", href: "/web-layer/route/" }, { title: "Data loading and the query cache", body: "Load and cache server data.", href: "/web-layer/query/" }, { title: "Deferred and streaming UI", body: "Stream UI as data resolves.", href: "/web-layer/defer-streaming-ui/" }, { title: "Interactive islands", body: "Hydrate interactive regions.", href: "/web-layer/interactive/" } ] }) }}

- Pillar hub: [Web Layer](/web-layer/)
- Flagship tutorial: [Live dashboard](/tutorials/live-dashboard/)
- [Error handling and diagnostics](/web-layer/error/) · [Testing Fresh pages](/web-layer/testing/) · [Examples and sandbox](/web-layer/examples/)
