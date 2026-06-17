// Runtime seam tests split from ../define-page.test.tsx.
import { definePage } from '../mod.ts';
import { CSRF_COOKIE_NAME } from '../../../form/mod.ts';
import type { RuntimeFormState } from '../../../form/runtime/types.ts';
import type { FormSubmissionResult } from '../../../form/runtime/types.ts';
import { render as renderToString } from 'preact-render-to-string';
import { z } from 'zod';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createRequestContext(overrides: Partial<{
  data: unknown;
  params: Record<string, string | undefined>;
  req: Request;
  url: URL;
}> = {}) {
  return {
    url: overrides.url ?? new URL('http://localhost/dashboard/users'),
    req: overrides.req ??
      new Request(overrides.url?.toString() ?? 'http://localhost/dashboard/users'),
    params: overrides.params ?? {},
    state: { requestId: 'req-1' },
    isPartial: false,
    data: overrides.data,
  };
}

Deno.test('definePage withForm resolves initial layer props and sets the CSRF cookie on GET', async () => {
  type UserFormValues = { name?: string };

  function UserForm(_props: RuntimeFormState<UserFormValues>) {
    return <form />;
  }

  let snapshot: RuntimeFormState<UserFormValues> | undefined;

  const route = definePage<{ requestId: string }>()
    .withForm('form', UserForm, {
      schema: z.object({
        name: z.string().optional(),
      }),
      initial: () => ({ name: 'Ada' }),
      mutate: () => ({ id: 1 }),
    })
    .withLayout((slots, { layerData }) => {
      snapshot = layerData.form;
      return <main>{slots.form()}</main>;
    })
    .build();

  assert(route.handler?.GET, 'Expected generated GET handler for withForm page');

  const response = await route.handler.GET({
    ...createRequestContext(),
    render(body: unknown, init?: ResponseInit) {
      return new Response(renderToString(body as Parameters<typeof renderToString>[0]), init);
    },
  });

  assert(response instanceof Response, 'Expected GET handler to return a Response');
  assert(snapshot, 'Expected withForm layer data to be captured');
  assert(snapshot.action === '/dashboard/users', `Unexpected form action: ${snapshot.action}`);
  assert(snapshot.method === 'POST', `Unexpected form method: ${snapshot.method}`);
  assert(
    snapshot.values.name === 'Ada',
    `Unexpected initial form value: ${String(snapshot.values.name)}`,
  );
  assert(snapshot.formProps.noValidate, 'Expected runtime form state to enable noValidate');
  assert(
    snapshot.fields.name.id === 'form-name',
    `Unexpected field id: ${snapshot.fields.name.id}`,
  );
  assert(
    snapshot.fields.name.controlProps().defaultValue === 'Ada',
    'Expected field descriptor control props to expose the initial value',
  );
  assert(
    typeof snapshot.submissionId === 'string' && snapshot.submissionId.length > 0,
    'Expected submissionId to be generated',
  );
  assert(
    typeof snapshot.csrfInputProps.value === 'string' && snapshot.csrfInputProps.value.length > 0,
    'Expected csrf input props to be generated',
  );

  const setCookie = response.headers.get('set-cookie') ?? response.headers.get('Set-Cookie');
  assert(!!setCookie, 'Expected withForm GET handler to emit a CSRF cookie');
  assert(
    setCookie.includes(`${CSRF_COOKIE_NAME}=${snapshot.csrfInputProps.value}`),
    `Expected CSRF cookie to match snapshot token, received: ${String(setCookie)}`,
  );
});

Deno.test('definePage withForm returns invalid data when schema validation fails', async () => {
  const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
  });
  let mutateCalled = false;

  function UserForm(_props: RuntimeFormState<z.input<typeof schema>>) {
    return <form />;
  }

  const route = definePage<{ requestId: string }>()
    .withForm('form', UserForm, {
      schema,
      csrf: false,
      mutate: () => {
        mutateCalled = true;
        return { id: 1 };
      },
    })
    .build();

  assert(route.handler?.POST, 'Expected POST handler for withForm page');

  const formData = new FormData();
  formData.set('name', 'A');

  const result = await route.handler.POST(
    createRequestContext({
      req: new Request('http://localhost/dashboard/users', {
        method: 'POST',
        body: formData,
      }),
    }),
  );

  assert(!(result instanceof Response), 'Expected invalid form post to return data');
  assert(!mutateCalled, 'Expected mutate handler to be skipped on invalid input');

  const data = result.data as FormSubmissionResult<z.input<typeof schema>, { id: number }>;
  assert(data.status === 'invalid', `Expected invalid status, received: ${data.status}`);
  assert(
    data.fieldErrors.name?.[0] === 'Name must be at least 2 characters',
    `Unexpected field error: ${String(data.fieldErrors.name?.[0])}`,
  );
});

Deno.test('definePage withForm ignores malformed ctx.data that only partially resembles a form result', async () => {
  type UserFormValues = { name?: string };

  function UserForm(_props: RuntimeFormState<UserFormValues>) {
    return <form />;
  }

  let snapshot: RuntimeFormState<UserFormValues> | undefined;

  const route = definePage<{ requestId: string }>()
    .withForm('form', UserForm, {
      schema: z.object({
        name: z.string().optional(),
      }),
      initial: () => ({ name: 'Ada' }),
      mutate: () => ({ id: 1 }),
    })
    .withLayout((slots, { layerData }) => {
      snapshot = layerData.form;
      return <main>{slots.form()}</main>;
    })
    .build();

  await route.page(createRequestContext({
    data: {
      status: 'initial',
      submissionId: 'sub-pretender',
    },
  }));

  assert(snapshot, 'Expected withForm layer data to be captured');
  assert(snapshot.values.name === 'Ada', 'Expected malformed ctx.data to be ignored');
});

Deno.test('definePage withForm redirects after a successful submit', async () => {
  const schema = z.object({
    name: z.string().min(1),
  });
  let seenName: string | undefined;

  function UserForm(_props: RuntimeFormState<z.input<typeof schema>>) {
    return <form />;
  }

  const route = definePage<{ requestId: string }>()
    .withForm('form', UserForm, {
      schema,
      csrf: false,
      mutate: (input) => {
        seenName = input.name;
        return { id: 42 };
      },
      redirectTo: (result) => `/dashboard/users/${result.id}`,
    })
    .build();

  assert(route.handler?.POST, 'Expected POST handler for withForm page');

  const formData = new FormData();
  formData.set('name', 'Ada');

  const response = await route.handler.POST(
    createRequestContext({
      req: new Request('http://localhost/dashboard/users', {
        method: 'POST',
        body: formData,
      }),
    }),
  );

  assert(response instanceof Response, 'Expected redirecting submit to return a Response');
  assert(
    seenName === 'Ada',
    `Expected parsed input to reach mutate, received: ${String(seenName)}`,
  );
  assert(response.status === 303, `Unexpected redirect status: ${response.status}`);
  assert(
    response.headers.get('location') === '/dashboard/users/42',
    `Unexpected redirect location: ${String(response.headers.get('location'))}`,
  );
  assert(
    response.headers.get('Cache-Control') === 'no-store, no-cache, must-revalidate',
    'Expected no-store cache control on redirect',
  );
  assert(response.headers.get('Pragma') === 'no-cache', 'Expected no-cache pragma on redirect');
});

Deno.test('definePage withForm logs the original mutate error before normalizing it', async () => {
  const schema = z.object({
    name: z.string().min(1),
  });

  function UserForm(_props: RuntimeFormState<z.input<typeof schema>>) {
    return <form />;
  }

  const route = definePage<{ requestId: string }>()
    .withForm('form', UserForm, {
      schema,
      csrf: false,
      mutate: () => {
        throw new Error('Mutation exploded');
      },
    })
    .build();

  assert(route.handler?.POST, 'Expected POST handler for withForm page');

  const formData = new FormData();
  formData.set('name', 'Ada');

  const originalConsoleError = console.error;
  const errors: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    errors.push(args);
  };

  try {
    const result = await route.handler.POST(
      createRequestContext({
        req: new Request('http://localhost/dashboard/users', {
          method: 'POST',
          body: formData,
        }),
      }),
    );

    assert(!(result instanceof Response), 'Expected erroring submit to return normalized data');
    const data = result.data as FormSubmissionResult<z.input<typeof schema>, never>;
    assert(data.status === 'error', `Expected error status, received: ${data.status}`);
    assert(data.formErrors[0] === 'Mutation exploded', 'Expected normalized error message');
  } finally {
    console.error = originalConsoleError;
  }

  assert(errors.length === 1, `Expected a single logged error, received ${errors.length}`);
  assert(
    String(errors[0]?.[0]).includes('withForm submit failed'),
    `Unexpected log prefix: ${String(errors[0]?.[0])}`,
  );
  const context = errors[0]?.[1] as { error?: { message?: string } } | undefined;
  assert(
    context?.error?.message === 'Mutation exploded',
    `Expected original error to be logged, received: ${String(context?.error?.message)}`,
  );
});

Deno.test('definePage withForm applies collection intents before returning runtime state', async () => {
  const schema = z.object({
    items: z.array(
      z.object({
        label: z.string().min(1),
        quantity: z.string().regex(/^[1-9][0-9]*$/),
      }),
    ).min(1),
  });

  function CollectionForm(_props: RuntimeFormState<z.input<typeof schema>>) {
    return <form />;
  }

  let snapshot: RuntimeFormState<z.input<typeof schema>> | undefined;

  const route = definePage<{ requestId: string }>()
    .withForm('form', CollectionForm, {
      schema,
      csrf: false,
      initial: () => ({
        items: [{ label: 'Widget', quantity: '1' }],
      }),
      onIntent: (_intent, values) => ({ values }),
      mutate: () => ({ ok: true }),
    })
    .withLayout((slots, { layerData }) => {
      snapshot = layerData.form;
      return <main>{slots.form()}</main>;
    })
    .build();

  assert(route.handler?.POST, 'Expected POST handler for collection-intent form');

  const formData = new FormData();
  formData.set('items[0].label', 'Widget');
  formData.set('items[0].quantity', '1');
  formData.set(
    '__intent__',
    JSON.stringify({
      type: 'collection:add',
      payload: {
        name: 'items',
        defaultValue: { label: '', quantity: '1' },
      },
    }),
  );

  const result = await route.handler.POST(
    createRequestContext({
      req: new Request('http://localhost/dashboard/framework/forms', {
        method: 'POST',
        body: formData,
      }),
    }),
  );

  assert(!(result instanceof Response), 'Expected collection intent to return data');
  const data = result.data as FormSubmissionResult<z.input<typeof schema>, { ok: boolean }>;
  assert(data.status === 'initial', `Expected initial intent reply, received: ${data.status}`);
  assert(
    data.values.items.length === 2,
    `Expected a second item after intent, received: ${data.values.items.length}`,
  );
  assert(data.values.items[1]?.quantity === '1', 'Expected default quantity to be preserved');

  await route.page(createRequestContext({ data }));

  assert(snapshot, 'Expected runtime form state after the intent round-trip');
  const items = snapshot.fields.items;
  assert(
    items.length === 2,
    `Expected 2 collection rows, received: ${items.length}`,
  );
  assert(
    items.list[1]?.fields.quantity.controlProps({ type: 'number' }).defaultValue ===
      '1',
    'Expected runtime field descriptors to expose the added row',
  );
});
