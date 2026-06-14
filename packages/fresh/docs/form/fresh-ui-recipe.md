# Fresh UI Form Recipe

Fresh forms and Fresh UI components compose through field descriptors. The form package emits
platform attributes; Fresh UI renders labels, help text, errors, and controls.

## Field Mapping

| Form descriptor             | Fresh UI usage                                 |
| --------------------------- | ---------------------------------------------- |
| `field.id`                  | Control `id` and label target                  |
| `field.name`                | Submitted control name                         |
| `field.error`               | `FormField error` or inline error text         |
| `field.required`            | Required indicator and native `required` prop  |
| `field.descriptionProps.id` | Help text id referenced by `aria-describedby`  |
| `field.errorProps.id`       | Error text id referenced by `aria-describedby` |
| `field.controlProps()`      | Props narrowed by Fresh UI control helpers     |

## Example

```tsx
import { Form, type RuntimeFormState } from '@netscript/fresh/form';
import { getInputProps } from '../components/ui/control-props.ts';
import { FormField } from '../components/ui/form-field.tsx';

export function ProfileForm({ state }: { state: RuntimeFormState<{ email: string }> }) {
  const email = state.fields.email;

  return (
    <Form state={state}>
      <FormField
        name={email.id}
        label='Email'
        required={email.required}
        error={email.error}
        helpText='Used for account notifications.'
      >
        <input {...getInputProps(email.controlProps({ type: 'email' }))} />
      </FormField>
      <button type='submit'>Save</button>
    </Form>
  );
}
```

The imports above assume the Fresh UI registry files have been copied into the application. The
source registry files live at `packages/fresh-ui/registry/components/ui/`.

`FormField` currently targets labels with its `name` prop. When the submitted field name and DOM id
differ, pass `name={field.id}` until the optional `htmlFor` seam lands.

## State Hooks

The descriptor emits stable state hooks:

- `data-field-path`
- `data-field-invalid`
- `data-field-dirty`
- `data-form-id`

Fresh UI styles may select these attributes directly or map them into component-specific state. The
form package does not prescribe classes.
