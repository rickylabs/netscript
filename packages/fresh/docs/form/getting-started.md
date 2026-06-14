# Form Getting Started

`@netscript/fresh/form` provides the form runtime state that Fresh routes can render without
JavaScript and then enhance with an island when needed.

## Route Shape

A route normally has three steps:

1. Render an initial `RuntimeFormState` with `resolveRuntimeFormState()`.
2. On submit, read `FormData`, verify CSRF, parse intent data, validate values, and return a
   `replyFor<TValues>()` result.
3. Render the next `RuntimeFormState` from the reply result.

```tsx
import {
  Form,
  formDataToRawValues,
  type FormSubmissionResult,
  generateCsrfToken,
  normalizeFormValues,
  replyFor,
  resolveRuntimeFormState,
  verifyCsrfToken,
} from '@netscript/fresh/form';

type ProfileValues = {
  name: string;
  email: string;
};

const initialValues: ProfileValues = {
  name: '',
  email: '',
};

export function renderProfileForm(
  data?: Exclude<FormSubmissionResult<ProfileValues>, { status: 'redirect' }>,
) {
  const state = resolveRuntimeFormState<ProfileValues>(data, {
    id: 'profile-form',
    action: '/profile',
    initialValues,
    csrfToken: generateCsrfToken(),
  });

  return (
    <Form state={state}>
      <input {...state.fields.name.controlProps({ autocomplete: 'name' })} />
      <input {...state.fields.email.controlProps({ type: 'email', autocomplete: 'email' })} />
      <button type='submit'>Save</button>
    </Form>
  );
}

export async function handleProfileSubmit(request: Request) {
  const formData = await request.formData();
  const values = normalizeFormValues<ProfileValues>(formDataToRawValues(formData));
  const formToken = String(formData.get('__csrf__') ?? '');
  const cookieToken = request.headers.get('x-demo-csrf') ?? undefined;
  const reply = replyFor<ProfileValues>();

  if (!verifyCsrfToken(cookieToken, formToken)) {
    return reply.error({
      values,
      submissionId: crypto.randomUUID(),
      formErrors: ['The form expired. Reload and try again.'],
    });
  }

  return reply.success({
    values,
    submissionId: crypto.randomUUID(),
    output: { saved: true },
    message: 'Saved.',
  });
}
```

## Field Descriptors

`resolveRuntimeFormState()` builds a descriptor tree under `state.fields`. A descriptor exposes:

- stable `id`, `name`, and `formId` values,
- `value`, `initialValue`, `defaultValue`, and `dirty`,
- `errors`, first `error`, `invalid`, and `valid`,
- native constraint attributes derived from schema metadata,
- `labelProps`, `errorProps`, `descriptionProps`, and `controlProps()`.

Controls should spread `controlProps()` and pass element-specific overrides there. That keeps
framework-owned ARIA and `data-field-*` attributes in one place.

## Progressive Enhancement

Use `createFormEnhancementSnapshot()` on the server and `useFormEnhancement()` in an island. The
island passes the returned `formProps` into `<Form enhancement={enhancement}>`, reads `pending`, and
can call `submit(intent)` for collection actions.

The no-JS path stays authoritative. Enhancement must not introduce a separate validation or reply
contract.
