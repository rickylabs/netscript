---
layout: layouts/base.vto
title: Server-validated forms
templateEngine: [vento, md]
order: 5
---

# Server-validated forms

This page explains what `definePage().withForm(id, Component, config)` installs on a page, what your
form component receives, and where the guarantees stop. You supply a Zod schema, a `mutate`
function and a component; the builder adds the handler, the validation pipeline, the CSRF cookie and
the state your component renders from. The page assumes you know the builder chain from
[Pages and the define-page builder](/web-layer/builders/).

## What bare Fresh makes you write

Fresh 2 gives you a `Request` and a render function, and everything between them is yours. A minimal
server-validated contact form looks like this:

```tsx no-check:counter-example intentionally omits bare Fresh setup
// routes/contact.tsx — bare Fresh
export const handler = define.handlers({
  GET(_ctx) {
    return { data: { values: { email: '', message: '' }, errors: {} } };
  },
  async POST(ctx) {
    const formData = await ctx.req.formData();
    const values = {
      email: String(formData.get('email') ?? ''),
      message: String(formData.get('message') ?? ''),
    };

    const parsed = ContactSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        (errors[key] ??= []).push(issue.message);
      }
      return { data: { values, errors } };
    }

    await createContact(parsed.data);
    return new Response(null, { status: 303, headers: { location: '/contact/thanks' } });
  },
});

export default define.page<typeof handler>(({ data }) => (
  <form method='post'>
    <label for='email'>Email</label>
    <input
      id='email'
      name='email'
      type='email'
      value={data.values.email}
      aria-invalid={data.errors.email ? true : undefined}
      aria-describedby={data.errors.email ? 'email-error' : undefined}
    />
    {data.errors.email ? <p id='email-error' role='alert'>{data.errors.email[0]}</p> : null}
    {/* …and the same six lines again for every other field */}
    <button type='submit'>Send</button>
  </form>
));
```

The builder removes four costs from that code:

- **An error shape per form.** `Record<string, string[]>` is a choice made in this file. Nothing ties
  it to `ContactSchema`, so renaming a schema field leaves the error lookup keyed on a missing string,
  and the field stops showing messages.
- **Accessibility wiring per field.** `id`, `for`, `aria-invalid`, `aria-describedby` and the error
  paragraph's `id` must agree by hand for every field. The schema knows the field is required and has
  a length bound; the markup does not, so `minLength` and `required` are typed a second time or
  omitted.
- **CSRF by hand.** Generate a token, set a cookie, render a hidden input, read both back on POST and
  compare them, consistently in every form.
- **Repeatable fields.** Three line items need `items[0].productId`, `items[1].productId` and a scheme
  for adding and removing rows that survives a failed validation round trip without dropping the
  wrong row.

## One call, four installs

One `withForm(id, Component, formConfig)` call appends four things to the page config:

| What | Where it lands |
| --- | --- |
| A **layer** whose loader builds the form state | `config.layers`, rendered under the layer id like any other region |
| A **method handler** at `formConfig.method ?? 'POST'` | `config.handlers[method]` |
| A **CSRF header resolver** that sets the cookie from the rendered token | `config.headers`, skipped when `csrf: false` |
| The form descriptor itself | `config.form = { id, config }` |

The page keeps its other layers, its layout and its route contract; the form is one more region that
owns a method.

```tsx
// routes/contact.tsx
import { definePage } from '@app/utils.ts';
import { z } from 'zod';
import { contactsClient } from '@app/lib/contacts.ts';
import ContactForm from './(_components)/ContactForm.tsx';

const ContactSchema = z.object({
  email: z.string().min(3).max(120),
  message: z.string().min(10),
});

export const contactPage = definePage()
  .withForm('contact', ContactForm, {
    schema: ContactSchema,
    initial: () => ({ email: '', message: '' }),
    mutate: async (input) => await contactsClient.create(input),
    invalidate: async () => await contactsClient.invalidateList(),
    redirectTo: (created) => `/contact/${created.id}`,
  })
  .build('/contact');

export default contactPage.default;
```

`definePage` comes from `@app/utils.ts`, not from `@netscript/fresh/builders`: the scaffold's wrapper
binds the app's `State` type, as on every other page.

Two inference sites carry the types. `schema` types `mutate`'s input, and `mutate`'s return type
flows into `redirectTo`, `onSuccess` and `invalidate` as `NoInfer<TOutput>`, so those three consume
the mutation result without widening it.

## The submission pipeline

The handler that `withForm` installs runs a fixed sequence. Each named stage runs in a span called
`{spanName}.{phase}`; `spanName` defaults to `form.{id}`.

1. **`parse`**: `await ctx.req.formData()`.
2. **Normalize.** `parseFormSubmission` turns the payload into a nested object (dotted paths and
   bracket indices), lifts out the intent, collection keys, submission id and CSRF token, strips
   those framework fields from the values, converts empty strings to `undefined`, and runs
   `schema.safeParse`.
3. **CSRF verify**, unless `csrf: false`. A mismatch returns at once with the form-level message
   `Your form session expired. Reload the page and try again.` and no mutation runs.
4. **`intent`**. If the payload carries a non-`submit` intent and the config supplies `onIntent`, the
   intent handler runs and the request returns here. The schema was already evaluated during
   parsing, but this branch returns before the validation result is enforced.
5. **Validation gate.** On failure the reply carries the submitted values plus `fieldErrors` and
   `formErrors`, and no mutation runs.
6. **`mutate`**, with the parsed `z.output` of your schema.
7. **`invalidate`**, awaited before any response is produced, so a redirect never races the cache
   drop.
8. **`redirect`** or **`onSuccess`.** `redirectTo` wins when both are present. A returned string
   becomes a 303 with `Cache-Control: no-store, no-cache, must-revalidate`; a returned `Response`
   passes through with those headers forced on. Otherwise `onSuccess` may return
   `{ message, nextValues }`.
9. **Throw.** An error is logged, emitted as a `{spanName}.mutate.error` span, and normalized into a
   form-level error reply instead of a 500.

The layer loader then runs on the rendered side of both requests. On a GET it merges the schema's
defaults with your `initial()`; on a POST it recognizes the handler's reply and rebuilds state from
it. That is how values survive a failed submit, with no session storage or flash cookie.

## `RuntimeFormState`: the props contract

Your component's props type is `RuntimeFormState<TValues>`, importable from
`@netscript/fresh/builders` or `@netscript/fresh/form`. Its sixteen readonly members group as
follows:

| Group | Members |
| --- | --- |
| Identity | `id`, `action`, `method`, `submissionId` |
| Values | `values`, `initialValues` |
| Errors | `fieldErrors`, `formErrors`, `hasErrors` |
| Submission | `submitted`, `intent` |
| Markup | `fields`, `constraints`, `formProps`, `csrfInputProps`, `csrfToken` |

`action` is the current pathname, so the form posts to the page that rendered it. `dirty` is computed
against `initialValues`, which is rebased after a successful submit: the values just saved become
the new baseline. `submitted` is true on any render that follows a submission, including an intent
round trip.

> [!NOTE]
> `RuntimeFormState` has no success flag, success message or pending state. `onSuccess` may return a
> `message` and the reply carries it, but `resolveRuntimeFormState` does not copy `message`, `status`
> or `output` into the props. Only `nextValues` survives, rebasing the rendered values after a
> success. For visible success feedback, redirect or use an application-owned channel. Pending state
> is a client concern handled by `useFormEnhancement`.

## Fields, constraints, and the markup they generate

`state.fields` is a `FieldDescriptorMap<TValues>`: one descriptor per schema field, addressed the
same way as the values. Each descriptor carries the resolved facts (`value`, `initialValue`,
`errors`, `error`, `invalid`, `required`, `dirty`, `constraints`) and four prop bags:

- `labelProps` → `{ for }`
- `errorProps` → `{ id, role: 'alert', 'aria-live': 'polite' }`
- `descriptionProps` → `{ id }`
- `controlProps(overrides?)` → the control's `id`, `name`, `form`, current value as `defaultValue`
  (or `defaultChecked` for booleans), `aria-invalid` / `aria-describedby` / `aria-required` derived
  from the live error state, the HTML constraints below, and `data-field-*` diagnostic markers.

`controlProps` is a method. It takes optional overrides and merges them, so
`controlProps({ type: 'email' })` sets the input type.

```tsx
// routes/contact/(_components)/ContactForm.tsx
import type { RuntimeFormState } from '@netscript/fresh/builders';

type ContactValues = { email: string; message: string };

export default function ContactForm(state: RuntimeFormState<ContactValues>) {
  const email = state.fields.email;

  return (
    <form {...state.formProps}>
      <input {...state.csrfInputProps} />

      <label {...email.labelProps}>Email</label>
      <input {...email.controlProps({ type: 'email' })} role={undefined} />
      {email.error ? <p {...email.errorProps}>{email.error}</p> : null}

      {state.formErrors.map((message) => <p key={message} role='alert'>{message}</p>)}
      <button type='submit'>Send</button>
    </form>
  );
}
```

{{ comp callout { type: "warning", title: "controlProps does not spread onto an intrinsic element as-is" } }}
<code>ControlProps</code> declares <code>role?: string</code>, while Preact's JSX types expect
<code>role?: AriaRole</code>, so <code>&lt;input {...field.controlProps()} /&gt;</code> fails
<code>deno check</code> on that property. Add <code>role={undefined}</code> after the spread, or name
the props individually. <code>@netscript/fresh-ui</code> ships narrowing helpers for this case:
<code>getInputProps</code>, <code>getSelectProps</code> and <code>getTextareaProps</code> in
<code>registry/components/ui/control-props.ts</code> take a descriptor and return a bag typed for the
element. Prefer them when the registry component is already in your app.
{{ /comp }}

### What the schema contributes

`constraints` comes from walking the Zod schema once, so the HTML attributes and the server
validator share one definition. The derivation is partial. Against Zod 4.4.3 it emits:

| Schema | Derived constraint |
| --- | --- |
| any field | `required`: `true`, or `false` for `.optional()` |
| `z.string().min(n)` / `.max(n)` | `minLength` / `maxLength` |
| `z.string().url()` | `pattern` |
| `z.array(...).min(n)` / `.max(n)` | `minItems` / `maxItems` (plus per-item constraints under `field[0]`) |

It emits nothing for `z.string().regex(...)`, `z.number().min()`, `.max()` or `.multipleOf()`. Zod 4
reports those as `string_format:regex`, `greater_than`, `less_than` and `multiple_of` checks, which
the extractor does not read. Server-side validation still enforces them; only the rendered
attributes are missing. A number field gets `min` and `max` only when you pass them yourself, for
example `controlProps({ min: 1, max: 99 })`.

`formProps` sets `noValidate: true` because the framework owns error presentation, so the browser's
native constraint UI is off. The constraint attributes still render and reach assistive technology
through `aria-required`, but they do not trigger the browser's validation bubbles unless you override
`noValidate`.

## Repeatable fields: collections and intents

A schema field typed as an array gets a `CollectionDescriptor` merged into its descriptor: `list`,
`length`, `minItems`/`maxItems`, collection-level errors and four button builders.

```tsx no-check:partial field-array fragment uses the surrounding form state
const lines = state.fields.items;

<fieldset>
  {lines.list.map((item) => (
    <div key={item.key}>
      <input {...item.keyInputProps} />
      <input {...item.fields.productId.controlProps()} role={undefined} />
      <button {...lines.removeButtonProps(item.index)}>Remove</button>
    </div>
  ))}
  <button {...lines.addButtonProps()}>Add line</button>
</fieldset>;
```

Each button builder returns `IntentButtonProps`: a `type='submit'` button with
`name='__intent__'`, a JSON-encoded intent as its value, and `formNoValidate: true`, so adding a row
does not trigger validation on the existing rows. On the server, `applyIntentOperation` performs the
array edit and `applyCollectionKeyOperation` maintains the per-item keys, so removing row 1 does not
give row 2 row 1's identity. `item.keyInputProps` round-trips those keys.

{{ comp callout { type: "important", title: "Intent buttons need onIntent" } }}
The handler takes the intent branch only when the config supplies <code>onIntent</code>. Without it,
an "Add line" click is an ordinary submit: validation runs and, if it passes, so does your
<code>mutate</code>. Supply <code>onIntent</code> whenever you render intent buttons.
{{ /comp }}

`onIntent` receives the parsed intent, the values with the operation applied, and the form context.
It returns `{ values, fieldErrors?, formErrors? }`. Returning no errors re-renders the form with the
new row and no mutation. A malformed or unmatched collection target is a deliberate no-op, not a
throw.

## CSRF

The default, `csrf: true`, is a double-submit cookie. The header resolver installed by `withForm`
sets `ns_form_csrf` from the token in the rendered state, with `httpOnly`, `SameSite=Lax`, path `/`,
and `Secure` only when the request URL is `https:`. The token also renders as a hidden `__csrf__`
input through `csrfInputProps`. On POST the two are compared in constant time; a missing, empty or
mismatched pair fails.

`csrf: false` removes token generation in the layer loader, the header resolver in the builder and
the verification branch in the handler. Use it only for a form whose handler is protected another
way, never for anything a browser session can reach.

> [!CAUTION]
> The token is a `crypto.randomUUID()` with no expiry and no binding to a user session. Treat it as
> request-forgery protection, not as authentication.

## Idempotency: an id, not a guarantee

Every rendered form carries `submissionId` in a hidden `__submission_id__` field, and the handler
reuses the submitted id when one arrives, so a retried POST is identifiable as the same submission.
Nothing in `@netscript/fresh` stores or compares those ids. Deduplication is your `mutate`'s job:
pass `ctx.form.submissionId` to a write that treats it as an idempotency key. The field name is
stable.

## Progressive enhancement

The server round trip works with JavaScript disabled. `useFormEnhancement` adds client behavior on
top of it without replacing it:

```tsx
import { createFormEnhancementSnapshot, Form, useFormEnhancement } from '@netscript/fresh/form';
```

`createFormEnhancementSnapshot(state)` produces a serializable snapshot you can pass to an island.
`useFormEnhancement(snapshot, options)` returns `{ pending, formProps, fieldErrors, formErrors,
collectionStrategies, submit }`. Its `formProps` add Fresh's `f-client-nav` and `f-partial`
attributes plus the submit, blur and input handlers, so `validate: 'onBlur'` or `'onChange'` runs
your schema in the browser before the request and, by default, focuses the first invalid control.

The managed `Form` component renders the hidden submission-id and CSRF inputs and accepts an
`enhancement` prop that merges those props in:

```tsx no-check:partial JSX fragment uses the surrounding form state
const formOverrides = { class: 'stack' };

<Form state={state} formProps={formOverrides}>
  {/* fields */}
</Form>;
```

`Form`'s `state` prop is a `FormStateLike`: a `RuntimeFormState` or a `FormEnhancementSnapshot`. Its
`formProps` override bag types `onSubmit`, `onBlurCapture`, `onInputCapture` and `ref` as `never`, so
passing one is a compile error instead of a silent override of the enhancement wiring.

`FormRegion` wraps content in a Fresh partial boundary (`name`, and a `mode` of
`'replace' | 'prepend' | 'append'`) so an enhanced submission can repaint one region instead of the
page. The partial route on the other end is covered in [Partials](/web-layer/partials/).

## Server round trip or island mutation

Choose by what the interaction is:

| Use | When the submission is | What you get |
| --- | --- | --- |
| `withForm` | A page event: a checkout, an account settings page, anything that creates a record and then navigates. | Server validation, error round trips, CSRF, a form that works without JavaScript, and a redirect response. |
| An island mutation | A widget event: an inline status change where the user stays on the page and a query cache, not the document, needs updating. | The typed write and the cache key from the same contract, through `useIslandMutation` and the SDK's `mutationOptions()`. See [The query bridge](/web-layer/query-bridge/). |

The two combine. A `withForm` page enhanced with `useFormEnhancement` and a `FormRegion` submits
without a navigation and keeps the no-JavaScript path. Try that before reaching for an island.

## The narrower helper surface

`@netscript/fresh/form` also ships an older, smaller state model: `FormState<TValues>`, with only
`values` and `errors`, built by `resolveFormState(data, initialValues)`. It serves routes that
hand-roll their handler and need only values and errors preserved.

`FormState` has no `fields`, `constraints`, `formProps` or `submissionId`, so `Form` does not accept
it: `<Form state={resolveFormState(...)}>` fails `deno check`. To use `Form`, you need a
`RuntimeFormState`, which means `withForm`.

For a hand-rolled handler the parsing primitives are public:

- `formDataToRawValues` turns dotted paths and bracket indices into a nested object.
- `normalizeFormValues` converts empty strings to `undefined`.
- `createStandardSchemaAdapter` turns any Standard Schema v1 validator into a `FormSchemaAdapter`
  with `parse`, `safeParse`, `getConstraints` and `getDefaults`.
- `toFormErrors`, `createEmptyFormErrors` and `firstFieldError` build and read the error map.

## What to watch for

- **`controlProps()` is a call.** Spreading the method itself renders nothing useful and type-checks
  as a function. The warning above covers the `role` mismatch that comes with the spread.
- **`invalidate` runs before the response.** A slow invalidation is latency the user sees.
- **Two forms on one page collide on the method slot.** Each `withForm` writes `handlers[method]`, so
  a second `POST` form replaces the first one's handler. Both regions still render, but only the last
  one receives submissions. Give them different methods, different routes, or use one form with
  intents.

## API summary

### Builder

| Symbol | Description |
| --- | --- |
| `definePage().withForm(id, Component, config)` | Install the form layer, method handler, CSRF header resolver, and form descriptor. |
| `FormConfig` | `schema`, `mutate`, and the optional `initial`, `onIntent`, `redirectTo`, `onSuccess`, `invalidate`, `csrf`, `method`, `spanName`. |
| `RuntimeFormState<TValues>` | The props your form component receives. |
| `FormSuccessMeta<TValues>` | `{ message?, nextValues? }` returned by `onSuccess`. |

### Components

| Symbol | Description |
| --- | --- |
| `Form` | Managed form element; renders the submission-id and CSRF hidden inputs. |
| `FormProps<TValues>` | `state`, `children`, optional `formProps` and `enhancement`. |
| `FormStateLike<TValues>` | What `Form` accepts: a `RuntimeFormState` or a `FormEnhancementSnapshot`. |
| `FormElementOverrideProps` | The open override bag, with the four runtime-owned handlers typed `never`. |
| `FormRegion` / `FormRegionProps` | Fresh partial boundary for form-driven region updates. |

### Field descriptors

| Symbol | Description |
| --- | --- |
| `FieldDescriptorMap<T>` | Descriptors keyed by value path; array fields also carry a `CollectionDescriptor`. |
| `FieldDescriptor<T>` | One field: resolved state plus `controlProps()`, `labelProps`, `errorProps`, `descriptionProps`. |
| `CollectionDescriptor<TItem>` | `list`, `length`, bounds, and the add/remove/reorder/duplicate button builders. |
| `CollectionItem<TItem>` | One row: `key`, `index`, `keyInputProps`, nested `fields`. |
| `FieldConstraints` | The derived HTML constraint bag. |

### Parsing, validation, and state

| Symbol | Description |
| --- | --- |
| `formDataToRawValues` | `FormData` → nested object, handling dotted paths and bracket indices. |
| `normalizeFormValues` | Recursively convert empty strings to `undefined`. |
| `createStandardSchemaAdapter` | Standard Schema v1 validator → `FormSchemaAdapter`. |
| `FormSchemaAdapter<TValues, TOutput>` | `parse`, `safeParse`, `getConstraints`, `getDefaults`. |
| `resolveFormState` / `FormState<TValues>` | The narrow `values` + `errors` model for hand-rolled handlers. |
| `toFormErrors` / `createEmptyFormErrors` / `firstFieldError` | The canonical `FormErrors` map and its helpers. |

### Intents, CSRF, and idempotency

| Symbol | Description |
| --- | --- |
| `parseFormIntent` / `submitIntent` / `collectionIntent` | Read and write the `__intent__` field. |
| `applyIntentOperation` | Apply a collection intent to submitted values. |
| `applyCollectionStrategy` | Attach `f-client-nav` / `f-partial` to intent button props. |
| `INTENT_FIELD_NAME` | `"__intent__"`. |
| `generateCsrfToken` / `readCsrfToken` / `setCsrfCookie` / `verifyCsrfToken` | The double-submit cookie helpers. |
| `CSRF_COOKIE_NAME` / `CSRF_FIELD_NAME` | `"ns_form_csrf"` / `"__csrf__"`. |
| `generateSubmissionId` / `getSubmissionHiddenInputProps` / `SUBMISSION_ID_FIELD_NAME` | The submission id and its hidden input. |

### Enhancement

| Symbol | Description |
| --- | --- |
| `createFormEnhancementSnapshot` | Serializable snapshot of runtime form state for an island. |
| `useFormEnhancement` | Client validation, pending state, and enhanced form props. |
| `FormEnhancementOptions<TValues>` | `partial`, `clientNav`, `validate`, `schema`, `focusOnError`, `collections`, submit callbacks. |
| `FormEnhancementState<TValues>` | `pending`, `formProps`, `fieldErrors`, `formErrors`, `collectionStrategies`, `submit()`. |

## Next steps

Follow [Build a server-validated form](/web-layer/how-to/build-a-server-validated-form/) to add a
form to a page. See also [Partials](/web-layer/partials/) for the route a `FormRegion` submission
targets, and the [storefront tutorial](/tutorials/storefront/06-storefront-ui/) for a checkout form.
