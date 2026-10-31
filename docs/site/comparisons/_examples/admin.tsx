/** @jsxImportSource preact */
import { definePage } from '@netscript/fresh/builders';
import type { RuntimeFormState } from '@netscript/fresh/form';
import { z } from 'zod';

const Invite = z.object({ email: z.string().email() });
function InviteForm(form: RuntimeFormState<z.input<typeof Invite>>) {
  const email = form.fields.email;
  return (
    <form {...form.formProps}>
      <input {...form.csrfInputProps} />
      <label {...email.labelProps}>Team member email</label>
      <input {...email.controlProps({ type: 'email' })} role={undefined} />
      {email.error && <p {...email.errorProps}>{email.error}</p>}
      {form.formErrors.map((message) => <p key={message}>{message}</p>)}
      <button type='submit'>Invite</button>
    </form>
  );
}

// Application port: bind to the generated BFF's typed session client on the server.
export function invitePage(
  inviteMember: (email: string, request: Request) => Promise<{ id: string }>,
) {
  return definePage()
    .withForm('invite', InviteForm, {
      schema: Invite,
      initial: () => ({ email: '' }),
      mutate: (input, context) => inviteMember(input.email, context.req),
      redirectTo: () => '/members',
      spanName: 'admin.invite',
    })
    .build('/members/invite');
}
