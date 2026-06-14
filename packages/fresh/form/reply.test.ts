import { createEmptyFormErrors, type FormFieldErrors, type FormValues } from './mod.ts';
import type { FormSubmissionResult } from './types.ts';
import { replyFor } from './reply.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

interface DemoValues extends FormValues {
  name: string;
  email?: string;
  role?: string;
}

interface DemoOutput {
  id: number;
}

function createDemoValues(): DemoValues {
  return {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'admin',
  };
}

function createDemoFieldErrors(): FormFieldErrors<DemoValues> {
  return {
    _form: [],
    name: ['Name is required'],
    email: ['Email is invalid'],
  };
}

function assertReadonlyArrayClone(
  actual: readonly string[],
  expected: readonly string[],
  message: string,
): void {
  assert(Array.isArray(actual), `${message}: expected array`);
  assert(actual !== expected, `${message}: expected cloned array reference`);
  assert(
    actual.length === expected.length &&
      actual.every((entry, index) => entry === expected[index]),
    `${message}: expected array contents to match`,
  );
}

function assertBaseShape(
  result: FormSubmissionResult<DemoValues, DemoOutput>,
  expectedStatus: FormSubmissionResult<DemoValues, DemoOutput>['status'],
): void {
  assert(result.status === expectedStatus, `Expected status ${expectedStatus}`);
  assert(result.values.name === 'Ada Lovelace', 'Expected values.name to be preserved');
  assert(result.submissionId === 'submission-1', 'Expected submissionId to be preserved');
  assert(result.csrfToken === 'csrf-token-1', 'Expected csrfToken to be preserved');
  assert(
    result.intent?.type === 'submit',
    'Expected intent.type to be preserved as submit',
  );
}

Deno.test('reply.initial creates the canonical initial submission result', () => {
  const result = replyFor<DemoValues>().initial({
    values: createDemoValues(),
    initialValues: {
      name: 'Ada',
      email: 'ada@old.example.com',
    },
    intent: { type: 'submit' },
    submissionId: 'submission-1',
    csrfToken: 'csrf-token-1',
  });

  assert(result.status === 'initial', 'Expected initial status');
  assert(result.values.name === 'Ada Lovelace', 'Expected values to be preserved');
  assert(result.initialValues.name === 'Ada', 'Expected initialValues to be preserved');
  assert(result.fieldErrors._form.length === 0, 'Expected empty fieldErrors._form');
  assert(result.formErrors.length === 0, 'Expected empty formErrors');
  assert(result.intent?.type === 'submit', 'Expected intent to be preserved');
  assert(result.submissionId === 'submission-1', 'Expected submissionId to be preserved');
  assert(result.csrfToken === 'csrf-token-1', 'Expected csrfToken to be preserved');
});

Deno.test('reply.invalid preserves values and field errors', () => {
  const fieldErrors = createDemoFieldErrors();
  fieldErrors._form = ['Please correct the highlighted fields'];

  const result = replyFor<DemoValues>().invalid({
    values: createDemoValues(),
    initialValues: {
      name: 'Ada',
      email: 'ada@old.example.com',
    },
    intent: { type: 'submit' },
    submissionId: 'submission-1',
    csrfToken: 'csrf-token-1',
    fieldErrors,
    formErrors: ['Validation failed'],
  });

  assertBaseShape(result, 'invalid');
  assert(result.initialValues.name === 'Ada', 'Expected initialValues to be preserved');
  assert(result.fieldErrors.name?.[0] === 'Name is required', 'Expected field error for name');
  assert(result.fieldErrors.email?.[0] === 'Email is invalid', 'Expected field error for email');
  assert(
    result.fieldErrors._form[0] === 'Please correct the highlighted fields',
    'Expected _form field errors to be preserved',
  );
  assert(result.formErrors[0] === 'Validation failed', 'Expected formErrors to be preserved');
});

Deno.test('reply.success stores output and optional success message', () => {
  const result = replyFor<DemoValues, DemoOutput>().success({
    values: createDemoValues(),
    initialValues: {
      name: 'Ada',
      email: 'ada@old.example.com',
    },
    intent: { type: 'submit' },
    submissionId: 'submission-1',
    csrfToken: 'csrf-token-1',
    output: { id: 42 },
    message: 'User created successfully',
    nextValues: {
      name: 'Grace Hopper',
    },
  });

  assertBaseShape(result, 'success');
  assert(result.output.id === 42, 'Expected output.id to be preserved');
  assert(result.message === 'User created successfully', 'Expected message to be preserved');
  assert(
    result.nextValues?.name === 'Grace Hopper',
    'Expected nextValues to be preserved',
  );
  assert(result.formErrors.length === 0, 'Expected success formErrors to be empty');
  assert(result.fieldErrors._form.length === 0, 'Expected success fieldErrors._form to be empty');
});

Deno.test('reply.error creates canonical error result with form errors', () => {
  const result = replyFor<DemoValues>().error({
    values: createDemoValues(),
    initialValues: {
      name: 'Ada',
      email: 'ada@old.example.com',
    },
    intent: { type: 'submit' },
    submissionId: 'submission-1',
    csrfToken: 'csrf-token-1',
    formErrors: ['Unexpected backend failure'],
  });

  assertBaseShape(result, 'error');
  assert(
    result.formErrors[0] === 'Unexpected backend failure',
    'Expected formErrors to be preserved',
  );
  assert(result.fieldErrors._form.length === 0, 'Expected fieldErrors._form to remain empty');
});

Deno.test('reply.redirect creates canonical redirect result with location and status', () => {
  const result = replyFor<DemoValues>().redirect({
    values: createDemoValues(),
    initialValues: {
      name: 'Ada',
      email: 'ada@old.example.com',
    },
    intent: { type: 'submit' },
    submissionId: 'submission-1',
    csrfToken: 'csrf-token-1',
    location: '/dashboard/users/42',
    status: 307,
  });

  assertBaseShape(result as FormSubmissionResult<DemoValues, DemoOutput>, 'redirect');
  assert(result.location === '/dashboard/users/42', 'Expected redirect location');
  assert(result.redirectStatus === 307, 'Expected redirect status');
  assert(result.formErrors.length === 0, 'Expected redirect formErrors to be empty');
  assert(result.fieldErrors._form.length === 0, 'Expected redirect fieldErrors._form to be empty');
});

Deno.test('reply helpers defensively clone array inputs', () => {
  const formErrors = ['Mutable form error'];
  const fieldErrors = createDemoFieldErrors();

  const result = replyFor<DemoValues>().invalid({
    values: createDemoValues(),
    initialValues: {
      name: 'Ada',
    },
    intent: { type: 'submit' },
    submissionId: 'submission-1',
    csrfToken: 'csrf-token-1',
    fieldErrors,
    formErrors,
  });

  formErrors.push('Late mutation');
  fieldErrors.name?.push('Late field mutation');
  fieldErrors._form.push('Late _form mutation');

  assertReadonlyArrayClone(
    result.formErrors,
    ['Mutable form error'],
    'Expected formErrors clone',
  );
  assertReadonlyArrayClone(
    result.fieldErrors.name ?? [],
    ['Name is required'],
    'Expected name field error clone',
  );
  assertReadonlyArrayClone(
    result.fieldErrors._form,
    [],
    'Expected _form field error clone',
  );
});

Deno.test('reply helpers default csrfToken to empty string when omitted', () => {
  const result = replyFor<DemoValues>().initial({
    values: createDemoValues(),
    initialValues: {},
    intent: null,
    submissionId: 'submission-1',
  });

  assert(result.csrfToken === '', 'Expected default csrfToken to be empty string');
});

Deno.test('reply.redirect defaults redirect status to 303', () => {
  const result = replyFor<DemoValues>().redirect({
    values: createDemoValues(),
    initialValues: {
      name: 'Ada',
      email: 'ada@old.example.com',
    },
    intent: { type: 'submit' },
    submissionId: 'submission-1',
    csrfToken: 'csrf-token-1',
    location: '/dashboard/users/42',
  });

  assert(result.redirectStatus === 303, 'Expected default redirect status to be 303');
});

Deno.test('reply.invalid normalizes omitted formErrors to an empty array', () => {
  const result = replyFor<DemoValues>().invalid({
    values: createDemoValues(),
    initialValues: {},
    intent: { type: 'submit' },
    submissionId: 'submission-1',
    csrfToken: 'csrf-token-1',
    fieldErrors: createEmptyFormErrors<DemoValues>(),
  });

  assert(result.formErrors.length === 0, 'Expected formErrors to default to empty array');
  assert(result.fieldErrors._form.length === 0, 'Expected _form to remain empty');
});
