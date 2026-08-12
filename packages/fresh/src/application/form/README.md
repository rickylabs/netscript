# `@netscript/fresh/form`

Server-first form helpers for Fresh routes. The form surface normalizes submitted values, builds
field descriptors, protects submissions with CSRF and idempotency tokens, and keeps the no-JS path
and progressively enhanced island path on the same state contract.

This is a Runtime/Behavior subpath of `@netscript/fresh` with a browser-facing seam. Route handlers
own validation and reply decisions; UI components consume the resolved form state and descriptor
props.

## Install

```json
{
  "imports": {
    "@netscript/fresh": "jsr:@netscript/fresh"
  }
}
```

Then import from the form subpath:

```ts
import { Form } from '@netscript/fresh/form';
```

## Quick Start

Resolve form state in a route and render the managed form element with native controls:

```tsx
import {
  createEmptyFormErrors,
  Form,
  generateCsrfToken,
  resolveRuntimeFormState,
} from '@netscript/fresh/form';

type ContactValues = {
  email: string;
  message: string;
};

const initialValues: ContactValues = {
  email: '',
  message: '',
};

export default function ContactPage() {
  const state = resolveRuntimeFormState<ContactValues>(undefined, {
    id: 'contact-form',
    action: '/contact',
    initialValues,
    csrfToken: generateCsrfToken(),
  });
  const email = state.fields.email;

  return (
    <Form state={state}>
      <label {...email.labelProps}>Email</label>
      <input {...email.controlProps({ type: 'email', autocomplete: 'email' })} />
      {email.error && <p {...email.errorProps}>{email.error}</p>}
      <button type='submit' name='__intent__' value='submit'>
        Send
      </button>
    </Form>
  );
}

const emptyErrors = createEmptyFormErrors<ContactValues>();
```

The route action should parse `FormData`, verify the submitted CSRF token against the cookie token,
normalize values with `formDataToRawValues()` and `normalizeFormValues()`, and return a
`replyFor<TValues>()` result for the next render.

## Redirect navigation

Managed forms inherit Fresh client navigation by default. Keep that default—or select it explicitly
with `strategy={{ navigation: 'client' }}`—when the POST response renders managed validation state,
updates a compatible partial, or redirects to a page that Fresh can revive safely.

Choose document navigation when a successful mutation redirects to a new full-document destination:

```tsx
<Form state={state} strategy={{ navigation: 'document' }}>
  <button type='submit'>Create channel</button>
</Form>;
```

The document strategy reliably overrides an inherited `<body f-client-nav>` opt-in. Callers do not
need to pass or understand Fresh's raw transport attribute. Because it selects native browser
submission for that form, use the default client strategy when invalid POST responses must update
managed form state without a document reload.

## Entry Points

The `./form` subpath exports these groups:

- State: `resolveFormState`, `resolveRuntimeFormState`, `FormState`, `RuntimeFormState`.
- Rendering: `Form`, `FormRegion`, `FormContent`, `FormProps`, `FormRegionProps`.
- Submission replies: `replyFor`, `FormSubmissionResult`, result init/result types.
- Field descriptors: `FieldDescriptor`, `CollectionDescriptor`, generated prop types.
- Pipeline: `formDataToRawValues`, `normalizeFormValues`.
- Errors: `createEmptyFormErrors`, `toFormErrors`, `firstFieldError`.
- Intents: `submitIntent`, `collectionIntent`, `parseFormIntent`, `applyIntentOperation`.
- CSRF and idempotency: token helpers, cookie helpers, and field-name constants.
- Progressive enhancement: `createFormEnhancementSnapshot`, `useFormEnhancement`,
  `applyCollectionStrategy`.
- Pagination: `resolvePagination`, `buildPaginationState`.

## Required Permissions

The form subpath does not open files, read environment variables, start network clients, or access
KV. Runtime route handlers may still need application-specific permissions for their own database or
HTTP work.

Type-check commands that touch `@netscript/fresh` should include `--unstable-kv` because sibling
Fresh streaming exports expose KV-aware types.

## Architecture Notes

Forms are HTML-first. The server renders the initial form state and accepts plain browser
submissions. `useFormEnhancement()` upgrades the same state snapshot on the client, adds pending
state, and submits through Fresh client navigation when requested.

The UI seam is value-level. `FieldDescriptor.controlProps()` emits platform attributes, ARIA
metadata, and `data-field-*` state hooks. Design-system components such as `@netscript/fresh-ui`
should narrow and spread those props; `@netscript/fresh/form` does not import presentation packages.

Schema adapters validate through Standard Schema when possible. Vendor-specific adapters can pair
that validation path with a `SchemaIntrospector<TSchema, TValues>` for conservative HTML constraints
and default values. The form surface owns those contracts and does not re-export upstream schema
packages.

## See Also

- [Form getting started](../../../docs/form/getting-started.md)
- [Form architecture](../../../docs/form/architecture.md)
- [Fresh UI recipe](../../../docs/form/fresh-ui-recipe.md)
