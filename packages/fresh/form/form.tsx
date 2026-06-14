import { SUBMISSION_ID_FIELD_NAME } from './idempotency.ts';
import type {
  FormElementProps,
  FormEnhancementSnapshot,
  FormEnhancementState,
  FormValues,
  RuntimeFormState,
} from './types.ts';

/** Renderable content accepted by form helper components. */
export type FormContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | readonly FormContent[];

/** Server or client snapshot state accepted by the managed form component. */
export type FormStateLike<TValues extends FormValues> =
  | RuntimeFormState<TValues>
  | FormEnhancementSnapshot<TValues>;

/** Props accepted by the managed form component. */
export interface FormProps<TValues extends FormValues> extends Partial<Record<string, unknown>> {
  /** Runtime form state produced by the server builder or enhancement snapshot. */
  readonly state: FormStateLike<TValues>;
  /** Optional progressive enhancement state to merge into the rendered form props. */
  readonly enhancement?: Pick<FormEnhancementState<TValues>, 'formProps'>;
  /** Form controls and content rendered inside the managed form element. */
  readonly children: FormContent;
  /** Optional override for framework-managed form attributes. */
  readonly formProps?: Partial<FormElementProps>;
}

/** Render a managed form element with submission and CSRF hidden inputs. */
export function Form<TValues extends FormValues>({
  state,
  enhancement,
  children,
  formProps: formPropOverrides,
  ...props
}: FormProps<TValues>): object {
  const formProps = {
    ...state.formProps,
    ...(enhancement?.formProps ?? {}),
    ...(formPropOverrides ?? {}),
    ...props,
  };

  return (
    <form {...formProps}>
      <input type='hidden' name={SUBMISSION_ID_FIELD_NAME} value={state.submissionId} />
      <input {...state.csrfInputProps} />
      {children}
    </form>
  );
}
