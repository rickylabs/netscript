import type { RuntimeFormState } from './mod.ts';

type ElementAssignableFormValues = {
  email: string;
  country: string;
  biography: string;
};

function renderControls(state: RuntimeFormState<ElementAssignableFormValues>) {
  return (
    <>
      <input {...state.fields.email.controlProps({ type: 'email' })} />
      <select {...state.fields.country.controlProps()} />
      <textarea {...state.fields.biography.controlProps()} />
    </>
  );
}

Deno.test('controlProps is assignable to intrinsic form controls', () => {
  if (typeof renderControls !== 'function') {
    throw new Error('Expected the intrinsic control render fixture to be defined');
  }
});
