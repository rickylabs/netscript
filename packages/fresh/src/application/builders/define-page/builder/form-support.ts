/** Form submission support for the page builder.
 *
 * @module
 */

import type { z } from 'zod';
import { applyCollectionKeyOperation, applyIntentOperation } from '../../../form/runtime/intent.ts';
import { generateSubmissionId } from '../../../form/runtime/idempotency.ts';
import { replyFor } from '../../../form/runtime/reply.ts';
import type { FormConfig } from '../../../form/runtime/config.ts';
import type { FormHandlerContext } from '../../../form/runtime/handler-context.ts';
import type {
  FormFieldErrors,
  FormIntent,
  FormIntentResult,
  FormSubmissionResult,
  FormValues,
} from '../../../form/runtime/types.ts';
import { emitFormError, withFormSpan } from '../../../form/runtime/telemetry.ts';
import { normalizeFormError } from '../../../form/validation/error-normalization.ts';
import { parseFormSubmission } from '../../../form/validation/pipeline.ts';
import { readCsrfToken, verifyCsrfToken } from '../../../form/validation/csrf.ts';
import type { AnyDefinePageTypeState, DefinePageMethodHandlerFor } from '../types.ts';
import type { FormSchemaInput } from './state.ts';
import type { createZodAdapter } from '../../../form/schema-adapter/entry.ts';

export function mergeInitialFormValues<TValues extends FormValues>(
  defaults: Partial<TValues>,
  initialValues: Partial<TValues> | undefined,
): Partial<TValues> {
  return {
    ...defaults,
    ...(initialValues ?? {}),
  };
}

export function createWithFormHandler<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean,
  TSchema extends z.ZodTypeAny,
  TOutput,
>(
  id: string,
  formConfig: FormConfig<TTypes, THasRoute, TSchema, TOutput>,
  adapter: ReturnType<typeof createZodAdapter<TSchema>>,
): DefinePageMethodHandlerFor<TTypes, THasRoute> {
  return async (ctx) => {
    const spanName = formConfig.spanName ?? `form.${id}`;
    const formData = await withFormSpan(
      spanName,
      'parse',
      {
        'form.id': id,
        'form.route': ctx.url.pathname,
        'form.method': formConfig.method ?? 'POST',
      },
      async () => await ctx.req.formData(),
    );
    const parsed = await parseFormSubmission<FormSchemaInput<TSchema>, z.output<TSchema>>(
      formData,
      adapter,
    );
    const initialValues = mergeInitialFormValues(
      adapter.getDefaults(),
      formConfig.initial ? await formConfig.initial(ctx) : undefined,
    );
    const submissionId = parsed.submissionId ?? generateSubmissionId();
    const cookieToken = readCsrfToken(ctx.req);
    const csrfToken = formConfig.csrf === false
      ? undefined
      : parsed.csrfToken || cookieToken || crypto.randomUUID();
    const reply = replyFor<FormSchemaInput<TSchema>, TOutput>();
    const formCtx = createFormHandlerContext<TTypes, THasRoute, TSchema, TOutput>(
      ctx,
      reply,
      formData,
      parsed.values,
      parsed.intent,
      submissionId,
      csrfToken,
    );

    if (formConfig.csrf !== false && !verifyCsrfToken(cookieToken, parsed.csrfToken)) {
      return {
        data: reply.error({
          values: parsed.values as FormSchemaInput<TSchema>,
          initialValues,
          intent: parsed.intent,
          submissionId,
          csrfToken,
          collectionKeys: parsed.collectionKeys,
          formErrors: ['Your form session expired. Reload the page and try again.'],
        }),
      };
    }

    if (parsed.intent && parsed.intent.type !== 'submit' && formConfig.onIntent) {
      const intentValues = applyIntentOperation(
        parsed.intent,
        parsed.values as FormSchemaInput<TSchema>,
      );
      const intentCollectionKeys = applyCollectionKeyOperation(
        parsed.intent,
        parsed.collectionKeys,
      );
      const intentResult = await withFormSpan(
        spanName,
        'intent',
        {
          'form.id': id,
          'form.intent': parsed.intent.type,
          'form.route': ctx.url.pathname,
        },
        async () => await formConfig.onIntent!(parsed.intent!, intentValues, formCtx),
      );

      return {
        data: createIntentReply(
          reply,
          intentCollectionKeys,
          submissionId,
          csrfToken,
          initialValues,
          parsed.intent,
          intentResult,
        ),
      };
    }

    const validationResult = parsed.result;

    if (!validationResult.success) {
      return {
        data: reply.invalid({
          values: parsed.values as FormSchemaInput<TSchema>,
          initialValues,
          intent: parsed.intent,
          submissionId,
          csrfToken,
          collectionKeys: parsed.collectionKeys,
          fieldErrors: validationResult.fieldErrors,
          formErrors: validationResult.formErrors,
        }),
      };
    }

    try {
      const output = await withFormSpan(
        spanName,
        'mutate',
        {
          'form.id': id,
          'form.route': ctx.url.pathname,
        },
        async () => await formConfig.mutate(validationResult.data, formCtx),
      );

      if (formConfig.invalidate) {
        await withFormSpan(
          spanName,
          'invalidate',
          {
            'form.id': id,
            'form.route': ctx.url.pathname,
          },
          async () => {
            await formConfig.invalidate!(output, formCtx);
          },
        );
      }

      if (formConfig.redirectTo) {
        const target = await withFormSpan(
          spanName,
          'redirect',
          {
            'form.id': id,
            'form.route': ctx.url.pathname,
          },
          async () => await formConfig.redirectTo!(output, formCtx),
        );

        return typeof target === 'string'
          ? createFormRedirectResponse(target)
          : ensureNoStoreHeaders(target);
      }

      const successMeta = formConfig.onSuccess
        ? await formConfig.onSuccess(output, formCtx)
        : undefined;

      return {
        data: reply.success({
          values: parsed.values as FormSchemaInput<TSchema>,
          initialValues,
          intent: parsed.intent,
          submissionId,
          csrfToken,
          collectionKeys: parsed.collectionKeys,
          output,
          message: successMeta?.message,
          nextValues: successMeta?.nextValues,
        }),
      };
    } catch (error: unknown) {
      console.error('withForm submit failed', {
        error: error instanceof Error ? error : new Error(String(error)),
      });

      await emitFormError(
        spanName,
        'mutate',
        {
          'form.id': id,
          'form.route': ctx.url.pathname,
          'form.method': formConfig.method ?? 'POST',
          'form.submission_id': submissionId,
        },
        error,
      );

      return {
        data: normalizeFormError(
          error,
          parsed.values as FormSchemaInput<TSchema>,
          submissionId,
          {
            csrfToken,
            initialValues,
            intent: parsed.intent,
            collectionKeys: parsed.collectionKeys,
          },
        ),
      };
    }
  };
}

function createFormHandlerContext<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean,
  TSchema extends z.ZodTypeAny,
  TOutput,
>(
  ctx: Parameters<DefinePageMethodHandlerFor<TTypes, THasRoute>>[0],
  reply: ReturnType<typeof replyFor<FormSchemaInput<TSchema>, TOutput>>,
  formData: FormData,
  values: Partial<FormSchemaInput<TSchema>>,
  intent: FormIntent | null,
  submissionId: string,
  csrfToken: string | undefined,
): FormHandlerContext<TTypes, THasRoute, FormSchemaInput<TSchema>, TOutput> {
  return ({
    ...ctx,
    form: {
      reply,
      intent,
      formData,
      submissionId,
      csrfToken,
      values,
    },
  } as unknown) as FormHandlerContext<TTypes, THasRoute, FormSchemaInput<TSchema>, TOutput>;
}

function createIntentReply<TValues extends FormValues, TOutput>(
  reply: ReturnType<typeof replyFor<TValues, TOutput>>,
  collectionKeys: import('../../../form/runtime/types.ts').CollectionKeyMap,
  submissionId: string,
  csrfToken: string | undefined,
  initialValues: Partial<TValues>,
  intent: FormHandlerContext<AnyDefinePageTypeState, boolean, TValues, TOutput>['form']['intent'],
  result: FormIntentResult<TValues>,
) {
  const fieldErrors = createIntentFieldErrors(result);
  const hasFieldErrors = Object.entries(fieldErrors).some(([field, messages]) => {
    if (field === '_form') {
      return false;
    }

    return Array.isArray(messages) && messages.length > 0;
  });
  const hasErrors = fieldErrors._form.length > 0 || hasFieldErrors;

  return hasErrors
    ? reply.invalid({
      values: result.values,
      initialValues,
      intent,
      submissionId,
      csrfToken,
      collectionKeys,
      fieldErrors,
      formErrors: fieldErrors._form,
    })
    : reply.initial({
      values: result.values,
      initialValues,
      intent,
      submissionId,
      csrfToken,
      collectionKeys,
    });
}

function createIntentFieldErrors<TValues extends FormValues>(
  result: FormIntentResult<TValues>,
): FormFieldErrors<TValues> {
  const fieldErrors = { _form: [...(result.formErrors ?? [])] } as FormFieldErrors<TValues>;

  for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
    if (Array.isArray(messages) && messages.length > 0) {
      fieldErrors[field as Extract<keyof TValues, string>] = [...messages] as FormFieldErrors<
        TValues
      >[Extract<keyof TValues, string>];
    }
  }

  return fieldErrors;
}

function createFormRedirectResponse(location: string, status = 303): Response {
  return new Response(null, {
    status,
    headers: new Headers({
      location,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    }),
  });
}

function ensureNoStoreHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.set('Pragma', 'no-cache');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function isWithFormResult<TValues extends FormValues, TOutput>(
  value: unknown,
): value is Exclude<
  FormSubmissionResult<TValues, TOutput>,
  { status: 'redirect' }
> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    status?: unknown;
    submissionId?: unknown;
    values?: unknown;
    initialValues?: unknown;
    fieldErrors?: unknown;
    formErrors?: unknown;
    collectionKeys?: unknown;
    csrfToken?: unknown;
  };

  return isWithFormStatus(candidate.status) &&
    typeof candidate.submissionId === 'string' &&
    isPlainObject(candidate.values) &&
    isPlainObject(candidate.initialValues) &&
    isPlainObject(candidate.fieldErrors) &&
    Array.isArray(candidate.formErrors) &&
    isPlainObject(candidate.collectionKeys) &&
    typeof candidate.csrfToken === 'string';
}

function isWithFormStatus(value: unknown): value is 'initial' | 'invalid' | 'success' | 'error' {
  return value === 'initial' || value === 'invalid' || value === 'success' || value === 'error';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
