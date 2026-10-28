---
layout: layouts/base.vto
title: Build a server-validated form
description: Route-bound form state, server validation, mutation, and success handling in one typed page definition.
templateEngine: [vento, md]
order: 103
oldUrl: /how-to/build-a-server-validated-form/
---

# Build a server-validated form

This recipe adds a server-validated form to a Fresh page with `definePage().withForm()`. One typed
page definition carries the route-bound form state, server validation, the mutation, and a redirect
or same-page success.

## Prerequisites

- A Fresh route that can render a NetScript page definition.
- A schema object accepted by the form runtime.
- A server mutation that receives validated input.
- A component that receives `RuntimeFormState` props.

## Define the form

Call `withForm(id, component, config)` on the page builder. It registers a typed layer and a method
handler. The config takes `schema`, `initial`, `mutate`, `onIntent`, `redirectTo`, `onSuccess`,
`invalidate`, `csrf`, `method` and `spanName`.

```tsx
import { definePage } from '@netscript/fresh/builders';
import { z } from 'zod';

const ContactSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
});

function ContactForm(props: {
  values: Record<string, unknown>;
  errors?: Record<string, readonly string[]>;
  message?: string;
}) {
  return (
    <form method="post">
      <input name="email" value={String(props.values.email ?? '')} />
      <textarea name="message">{String(props.values.message ?? '')}</textarea>
      <button type="submit">Send</button>
    </form>
  );
}

export const contactPage = definePage()
  .withForm('contact', ContactForm, {
    schema: ContactSchema,
    method: 'POST',
    csrf: true,
    initial: () => ({ email: '', message: '' }),
    mutate: async (input) => {
      const ticket = await createSupportTicket(input);
      return { ticketId: ticket.id };
    },
    redirectTo: (output) => `/support/thanks?id=${output.ticketId}`,
    spanName: 'form.contact',
  })
  .build('/contact');
```

## Render validation errors

A failed validation re-renders the form layer and the mutation does not run. Render defensively:
read `values`, show field errors when present, and do not assume the mutation ran.

```tsx
function FieldError(props: { errors?: readonly string[] }) {
  if (!props.errors?.length) return null;
  return <p class="field-error">{props.errors[0]}</p>;
}
```

## Test the page definition

Keep one unit test on the builder chain so the method, schema and layer ids stay wired:

```ts
import { assertEquals } from '@std/assert';
import { contactPage } from './contact.page.tsx';

Deno.test('contact page registers the route pattern', () => {
  assertEquals(contactPage.routePattern, '/contact');
});
```

## Failure modes

- Missing `schema`: the form has no server validation boundary.
- `mutate` throws: the form runtime returns an error state instead of running `redirectTo`.
- `redirectTo` and `onSuccess` both exist: `redirectTo` takes precedence.

> [!CAUTION]
> CSRF protection is on by default. Disable it only for a route that has another verified
> protection.

The full submission pipeline and its edge cases are in
[Server-validated forms](/web-layer/form/#the-submission-pipeline).

## Next steps

Read [Server-validated forms](/web-layer/form/) to render fields with the generated `fields` props,
add repeatable rows, and enhance the form in the browser. See also
[Live dashboard, chapter 04](/tutorials/live-dashboard/04-definePage-QueryIsland/) and the
[`@netscript/fresh` reference](/reference/fresh/).
