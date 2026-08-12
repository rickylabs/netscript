import { App } from 'fresh';
import { Partial } from 'fresh/runtime';
import { Form } from '../../../src/application/form/components/form.tsx';
import { replyFor } from '../../../src/application/form/runtime/reply.ts';
import { resolveRuntimeFormState } from '../../../src/application/form/runtime/state.ts';
import type { RuntimeFormState } from '../../../src/application/form/runtime/types.ts';

type FormValues = { readonly name?: string };

function DocumentRedirectForm(state: RuntimeFormState<FormValues>) {
  return (
    <Form state={state} strategy={{ navigation: 'document' }}>
      <label>
        Redirect name
        <input name='name' value={state.values.name ?? ''} />
      </label>
      <button type='submit'>Create redirect</button>
    </Form>
  );
}

function ClientValidationForm(state: RuntimeFormState<FormValues>) {
  return (
    <Form state={state}>
      <label>
        Validation name
        <input name='name' value={state.values.name ?? ''} />
      </label>
      {state.fieldErrors.name?.[0] && <p role='alert'>{state.fieldErrors.name[0]}</p>}
      <button type='submit'>Validate client</button>
    </Form>
  );
}

function page(validationState?: RuntimeFormState<FormValues>) {
  const documentState = resolveRuntimeFormState(undefined, {
    id: 'document-form',
    action: '/redirect',
  });
  const clientState = validationState ?? resolveRuntimeFormState(undefined, {
    id: 'client-form',
    action: '/validate',
  });

  return (
    <html>
      <body f-client-nav>
        <Partial name='managed-forms'>
          <main>
            <h1>Managed form navigation fixture</h1>
            <DocumentRedirectForm {...documentState} />
            <ClientValidationForm {...clientState} />
          </main>
        </Partial>
      </body>
    </html>
  );
}

/** Create the real Fresh app used by the managed-form browser contract test. */
export function createFormNavigationBrowserApp(): App<unknown> {
  const app = new App();

  app.get('/', (ctx) => ctx.render(page()));
  app.post('/validate', async (ctx) => {
    const values = Object.fromEntries(await ctx.req.formData()) as FormValues;
    const invalidState = resolveRuntimeFormState(
      replyFor<FormValues>().invalid({
        values,
        submissionId: 'invalid-browser-submission',
        csrfToken: '',
        fieldErrors: { name: ['Name is required'], _form: [] },
      }),
      {
        id: 'client-form',
        action: '/validate',
      },
    );
    return ctx.render(page(invalidState));
  });
  app.post('/redirect', (ctx) => ctx.redirect('/success', 303));
  app.get('/success', (ctx) =>
    ctx.render(
      <html>
        <body f-client-nav>
          <main>
            <h1>Redirect completed</h1>
          </main>
        </body>
      </html>,
    ));

  return app;
}

/** Fresh application exported for the Vite browser fixture. */
export const app: App<unknown> = createFormNavigationBrowserApp();
