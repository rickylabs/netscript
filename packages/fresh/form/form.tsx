import type { ComponentChildren, JSX } from 'preact';
import { SUBMISSION_ID_FIELD_NAME } from './idempotency.ts';
import type {
  FormEnhancementSnapshot,
  FormEnhancementState,
  FormValues,
  RuntimeFormState,
} from './types.ts';

type FormStateLike<TValues extends FormValues> =
  | RuntimeFormState<TValues>
  | FormEnhancementSnapshot<TValues>;

export interface FormProps<TValues extends FormValues>
  extends Omit<JSX.HTMLAttributes<HTMLFormElement>, 'action' | 'children' | 'id' | 'method'> {
  readonly state: FormStateLike<TValues>;
  readonly enhancement?: Pick<FormEnhancementState<TValues>, 'formProps'>;
  readonly children: ComponentChildren;
}

export function Form<TValues extends FormValues>({
  state,
  enhancement,
  children,
  ...props
}: FormProps<TValues>): JSX.Element {
  const formProps = {
    ...state.formProps,
    ...(enhancement?.formProps ?? {}),
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
