---
layout: layouts/base.vto
title: Server-validated forms
templateEngine: [vento, md]
order: 5
---

# Server-validated forms

A form is a round trip, and the round trip is where the work is. The browser posts, the server
parses, a schema validates, and — when validation fails — the same page has to come back with the
user's values still in the inputs, the right message under the right field, and a CSRF token that is
still valid for the retry. None of that is hard. All of it is repetitive, and every hand-written copy
gets a slightly different subset of it right.

`definePage().withForm(id, Component, config)` declares that round trip once. You supply a Zod
schema, a `mutate` function, and a component; the builder installs the handler, the validation
pipeline, the CSRF cookie, and the state your component renders from. This page is about what that
one call actually installs, what the component receives, and where the guarantees stop.

The builder-chain overview lives in [Pages and the define-page builder](/web-layer/builders/); this
page assumes it.

## What bare Fresh makes you write

Fresh 2 hands you a `Request` and a render function. Everything between them is yours. A minimal
server-validated contact form is roughly this:

```tsx
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

Four costs are worth naming, because they are the ones the builder removes.

**The error shape is invented per form.** `Record<string, string[]>` is a choice you made in this
file. Nothing ties it to `ContactSchema`, so renaming a schema field leaves the error lookup keyed on
a string that no longer exists — and the field silently stops showing messages.

**Every field re-derives its own accessibility wiring.** `id`, `for`, `aria-invalid`,
`aria-describedby`, and the matching `id` on the error paragraph are five facts that must agree, per
field, by hand. The schema already knows the field is required and has a length bound; the markup
does not, so `minLength` and `required` get typed in a second time or omitted.

**CSRF is entirely yours.** Generate a token, set a cookie, render a hidden input, read both back on
POST, compare them — in every form, consistently, including the failure copy.

**Repeatable fields are a hand-rolled encoding.** Three line items means `items[0].productId`,
`items[1].productId`, and a scheme for adding and removing rows that survives a failed validation
round trip without shuffling the wrong row away.

## One call, four installs

`withForm(id, Component, formConfig)` is not a layer with extras. Reading
`builders/define-page/builder/mod.tsx`, one call appends **four** things to the page config:

| What | Where it lands |
| --- | --- |
| A **layer** whose loader builds the form state | `config.layers` — rendered under the layer id, like any other region |
| A **method handler** at `formConfig.method ?? 'POST'` | `config.handlers[method]` |
| A **CSRF header resolver** that sets the cookie from the rendered token | `config.headers` — skipped entirely when `csrf: false` |
| The form descriptor itself | `config.form = { id, config }` |

So the page keeps its other layers, its layout, and its route contract; the form is one more region
that happens to own a method.

```tsx
// routes/contact.tsx
import { definePage } from '@app/utils.ts';
import { z } from 'zod';
import { contactsClient } from '@app/lib/api-clients.ts';
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

`definePage` comes from `@app/utils.ts`, not straight from `@netscript/fresh/builders` — the
scaffold's wrapper binds the app's `State` type, the same rule every other page follows.

Two inference sites carry the whole chain: `schema` types `mutate`'s input, and `mutate`'s return
type flows into `redirectTo`, `onSuccess`, and `invalidate` as `NoInfer<TOutput>` — so those three
consume the mutation result without widening it.

## The submission pipeline

The handler `withForm` installs runs a fixed sequence, from
`builders/define-page/builder/form-support.ts`. Each named stage is wrapped in a span called
`{spanName}.{phase}`, where `spanName` defaults to `form.{id}`:

1. **`parse`** — `await ctx.req.formData()`.
2. **Normalize.** `parseFormSubmission` turns the payload into a nested object (dotted paths and
   bracket indices), lifts the intent, collection keys, submission id, and CSRF token out of it,
   strips those framework fields from the values, converts empty strings to `undefined`, and runs
   `schema.safeParse`.
3. **CSRF verify** — unless `csrf: false`. A mismatch returns immediately with the form-level message
   `Your form session expired. Reload the page and try again.` and no mutation runs.
4. **`intent`** — if the payload carries a non-`submit` intent *and* the config supplies `onIntent`,
   the intent handler runs and the request returns here. The schema has already been evaluated
   during parsing, but this branch returns before the validation result is enforced.
5. **Validation gate.** On failure the reply carries the submitted values plus `fieldErrors` and
   `formErrors`. Still no mutation.
6. **`mutate`** — with the parsed `z.output` of your schema.
7. **`invalidate`** — awaited before any response is produced, so a redirect never races the cache
   drop.
8. **`redirect`** or **`onSuccess`.** `redirectTo` wins when both are present. A returned string
   becomes a 303 with `Cache-Control: no-store, no-cache, must-revalidate`; a returned `Response`
   passes through with those same headers forced on. Otherwise `onSuccess` may return
   `{ message, nextValues }`.
9. **Throw** — logged, emitted as a `{spanName}.mutate.error` span, and normalized into a
   form-level error reply rather than a 500.

The layer loader then runs on the *rendered* side of both requests. On a GET it merges the schema's
defaults with your `initial()`; on a POST it recognises the handler's reply structurally and rebuilds
state from it. That is the whole "values survive a failed submit" mechanism — there is no session
storage and no flash cookie involved.

## `RuntimeFormState`: the props contract

Your component's props type is `RuntimeFormState<TValues>` — importable from
`@netscript/fresh/builders` or `@netscript/fresh/form`. Sixteen readonly members, grouped by what
they are for:

| Group | Members |
| --- | --- |
| Identity | `id`, `action`, `method`, `submissionId` |
| Values | `values`, `initialValues` |
| Errors | `fieldErrors`, `formErrors`, `hasErrors` |
| Submission | `submitted`, `intent` |
| Markup | `fields`, `constraints`, `formProps`, `csrfInputProps`, `csrfToken` |

`action` is the current pathname, so the form posts to the page that rendered it. `initialValues` is
what `dirty` is computed against, and it is *rebased* after a successful submit — the values that
just saved become the new baseline. `submitted` is true on any render that followed a submission,
including an intent round trip.

Note what is **not** there. `RuntimeFormState` exposes no success flag and no success message today:
`onSuccess` may return a `message`, and the reply carries it, but `resolveRuntimeFormState` does not
copy `message`, `status`, or `output` into the component's props. What *does* survive is
`nextValues`, which rebases the rendered values after a success. For visible success feedback, redirect
or use an application-owned channel. Pending state is likewise absent — that is a client concern and
belongs to `useFormEnhancement`.

## Fields, constraints, and the markup they generate

`state.fields` is a `FieldDescriptorMap<TValues>` — one descriptor per schema field, addressed the
same way the values are. Each descriptor carries the resolved facts (`value`, `initialValue`,
`errors`, `error`, `invalid`, `required`, `dirty`, `constraints`) and four prop bags:

- `labelProps` → `{ for }`
- `errorProps` → `{ id, role: 'alert', 'aria-live': 'polite' }`
- `descriptionProps` → `{ id }`
- `controlProps(overrides?)` → the control's `id`, `name`, `form`, current value as `defaultValue`
  (or `defaultChecked` for booleans), `aria-invalid` / `aria-describedby` / `aria-required` derived
  from the live error state, the HTML constraints below, and `data-field-*` diagnostic markers.

`controlProps` is a **method**, not a property — it takes optional overrides and merges them, so
`controlProps({ type: 'email' })` is how the input type gets in.

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
<code>role?: AriaRole</code> — so <code>&lt;input {...field.controlProps()} /&gt;</code> fails
<code>deno check</code> on that one property. Adding <code>role={undefined}</code> after the spread
satisfies it, and naming the props individually always works. <code>@netscript/fresh-ui</code> ships
narrowing helpers for exactly this reason — <code>getInputProps</code>,
<code>getSelectProps</code>, and <code>getTextareaProps</code> in
<code>registry/components/ui/control-props.ts</code> — which take a descriptor and return a bag typed
for the element. Prefer those when the registry component is already in your app.
{{ /comp }}

### What the schema actually contributes

`constraints` is derived from the Zod schema by walking it once, so the HTML attributes and the
server validator read from a single definition. The derivation is **partial today**. Against Zod
4.4.3 it emits:

| Schema | Derived constraint |
| --- | --- |
| any field | `required` — `true`, or `false` for `.optional()` |
| `z.string().min(n)` / `.max(n)` | `minLength` / `maxLength` |
| `z.string().url()` | `pattern` |
| `z.array(...).min(n)` / `.max(n)` | `minItems` / `maxItems` (plus per-item constraints under `field[0]`) |

and it emits **nothing** for `z.string().regex(...)`, `z.number().min()`, `.max()`, or
`.multipleOf()`. Zod 4 reports those as `string_format:regex`, `greater_than`, `less_than`, and
`multiple_of` checks, which the extractor does not read. Server-side validation still enforces every
one of them — only the rendered attributes are missing, so a number field will not carry `min`/`max`
until you pass them through `controlProps({ min: 1, max: 99 })` yourself.

One more boundary in the same area: `formProps` sets `noValidate: true`. The framework owns error
presentation, so the browser's native constraint UI is off by default. The constraint attributes
still render and still reach assistive technology through `aria-required`; they just do not trigger
the browser's own validation bubbles unless you override `noValidate`.

## Repeatable fields: collections and intents

A schema field typed as an array gets a `CollectionDescriptor` merged into its descriptor —
`list`, `length`, `minItems`/`maxItems`, collection-level errors, and four button builders.

```tsx
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

Each button builder returns `IntentButtonProps`: a `type='submit'` button carrying
`name='__intent__'`, a JSON-encoded intent as its value, and `formNoValidate: true` so adding a row
does not trip validation on the rows already there. On the server, `applyIntentOperation` performs
the array edit and `applyCollectionKeyOperation` maintains the per-item keys, so removing row 1 does
not renumber row 2 into row 1's identity — that is what `item.keyInputProps` round-trips.

{{ comp callout { type: "important", title: "Intent buttons need onIntent" } }}
The handler only takes the intent branch when the config supplies <code>onIntent</code>. Without it,
an "Add line" click is an ordinary submit: validation runs and, if it passes, so does your
<code>mutate</code>. Supply <code>onIntent</code> whenever you render intent buttons.
{{ /comp }}

`onIntent` receives the parsed intent, the values with the operation already applied, and the form
context; it returns `{ values, fieldErrors?, formErrors? }`. Returning no errors re-renders the form
with the new row and no mutation. A malformed or unmatched collection target is a deliberate no-op
rather than a throw.

## CSRF

The default (`csrf: true`) is a double-submit cookie. The header resolver installed by `withForm`
sets `ns_form_csrf` from whatever token the rendered state carries — `httpOnly`, `SameSite=Lax`,
path `/`, and `Secure` only when the request URL is `https:`. The token also renders as a hidden
`__csrf__` input via `csrfInputProps`. On POST the two are compared with a constant-time equality
check; a missing, empty, or mismatched pair fails.

`csrf: false` removes three things at once: token generation in the layer loader, the header resolver
in the builder, and the verification branch in the handler. It is the right switch for a form whose
handler is protected some other way, and the wrong one for anything a browser session can reach.

The module's own comment describes this as a baseline "intentionally explicit and easy to replace
after a future security review" — the token is a `crypto.randomUUID()` with no expiry and no binding
to a user session. Treat it as request-forgery protection, not as authentication.

## Idempotency: an id, not a guarantee

Every rendered form carries `submissionId` through a hidden `__submission_id__` field, and the
handler reuses the submitted id when one arrives. So a retried POST is identifiable as the *same*
submission — but nothing in `@netscript/fresh` stores or compares those ids. Deduplication is your
`mutate`'s job: pass `ctx.form.submissionId` to a write that treats it as an idempotency key. The
field name is stable so a later runtime can add storage without changing page contracts.

## Progressive enhancement

The server round trip works with JavaScript disabled. `useFormEnhancement` layers client behaviour on
top of it without replacing it:

```tsx
import { createFormEnhancementSnapshot, Form, useFormEnhancement } from '@netscript/fresh/form';
```

`createFormEnhancementSnapshot(state)` produces a serializable snapshot you can pass into an island;
`useFormEnhancement(snapshot, options)` returns `{ pending, formProps, fieldErrors, formErrors,
collectionStrategies, submit }`. Its `formProps` add Fresh's `f-client-nav` / `f-partial` attributes
plus the submit, blur, and input handlers — so `validate: 'onBlur'` or `'onChange'` runs your schema
client-side before the network, focusing the first invalid control by default.

The managed `Form` component renders the hidden submission-id and CSRF inputs for you and accepts an
`enhancement` prop to merge those props in:

```tsx
const formOverrides = { class: 'stack' };

<Form state={state} formProps={formOverrides}>
  {/* fields */}
</Form>;
```

`Form`'s `state` prop is a `FormStateLike` — a `RuntimeFormState` or a `FormEnhancementSnapshot`. Its
`formProps` override bag types `onSubmit`, `onBlurCapture`, `onInputCapture`, and `ref` as `never`,
so passing one is a compile error rather than a silent override of the enhancement wiring.

`FormRegion` wraps content in a Fresh partial boundary (`name`, `mode` of `'replace' | 'prepend' |
'append'`) so an enhanced submission can repaint one region instead of the page. The partial route on
the other end is covered in [Partials](/web-layer/partials/).

## Server round trip or island mutation

The tutorials use both, and the split is not about complexity — it is about what the interaction
*is*.

**Use `withForm` when the submission is a page event.** The storefront's checkout, an account
settings page, anything that creates a record and then navigates. You get server validation, error
round-tripping, CSRF, and a working form without JavaScript, and the response is allowed to be a
redirect.

**Use an island mutation when the submission is a widget event.** The live dashboard's inline status
change: the user stays on the page, the change should feel instant, and what needs updating
afterwards is a query cache rather than a document. `useIslandMutation` with the SDK's
`mutationOptions()` gives you the typed write and the cache key from the same contract — see
[The query bridge](/web-layer/query-bridge/).

The two are not exclusive. A `withForm` page enhanced with `useFormEnhancement` and a `FormRegion`
submits without a navigation while keeping the no-JavaScript path intact; that is usually a better
first move than reaching for an island.

## The narrower helper surface

`@netscript/fresh/form` also ships an older, smaller state model: `FormState<TValues>` — just
`values` and `errors` — built by `resolveFormState(data, initialValues)`. It exists for routes that
hand-roll their handler and want only the values/errors preservation, and the module's own comment
frames it as the interim surface alongside the richer runtime model.

Keep the two straight: `FormState` has no `fields`, no `constraints`, no `formProps`, and no
`submissionId`, so it is **not** accepted by `Form` — `<Form state={resolveFormState(...)}>` fails
`deno check`. If you are building the form by hand and want `Form`, you want a `RuntimeFormState`,
which means you want `withForm`.

For a hand-rolled handler the parsing primitives are public: `formDataToRawValues` (dotted paths and
bracket indices → nested object), `normalizeFormValues` (empty strings → `undefined`),
`createStandardSchemaAdapter` (any Standard Schema v1 validator → a `FormSchemaAdapter` with
`parse`, `safeParse`, `getConstraints`, `getDefaults`), and `toFormErrors` / `createEmptyFormErrors`
/ `firstFieldError` for the error map.

## What to watch for

- **`controlProps()` is a call.** Spreading the method itself renders nothing useful and type-checks
  as a function — see the caution above for the `role` boundary that comes with the spread.
- **Number and regex constraints are not derived.** Server validation still enforces them; pass the
  attributes through `controlProps(overrides)` if the markup needs them.
- **`redirectTo` shadows `onSuccess`.** If both are set, `onSuccess` never runs.
- **`invalidate` runs before the response.** A slow invalidation is latency the user sees.
- **Intent buttons are inert without `onIntent`** — and worse than inert: they submit.
- **Two forms on one page collide on the method slot.** Each `withForm` writes
  `handlers[method]`, so a second `POST` form silently replaces the first one's handler — both
  regions still render, but only the last one can receive a submission. Give them different methods,
  different routes, or one form with intents.

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
| `FormStateLike<TValues>` | `RuntimeFormState` or `FormEnhancementSnapshot` — what `Form` accepts. |
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

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Pages and the define-page builder", body: "withForm in the context of the full chain.", href: "/web-layer/builders/" },
  { title: "Request-scoped resources", body: "Load once, read from the form layer and every other region.", href: "/web-layer/resources/" },
  { title: "The query bridge", body: "The island-mutation half of the decision above.", href: "/web-layer/query-bridge/" },
  { title: "Partials", body: "The partial route a FormRegion submission targets.", href: "/web-layer/partials/" },
  { title: "Build a server-validated form", body: "The task-shaped walkthrough.", href: "/web-layer/how-to/build-a-server-validated-form/" },
  { title: "Storefront tutorial", body: "The checkout page where this decision first bites.", href: "/tutorials/storefront/06-storefront-ui/" }
] }) }}

See the [Web Layer overview](/web-layer/) for the full pillar map.
