import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useState } from 'preact/hooks';
import { RadioGroup } from '../../packages/fresh-ui/registry/components/ui/radio-group.tsx';
import { InputGroup } from '../../packages/fresh-ui/registry/components/ui/input-group.tsx';
import { InputOTP } from '../../packages/fresh-ui/registry/components/ui/input-otp.tsx';
import { Slider } from '../../packages/fresh-ui/registry/components/ui/slider.tsx';

/** Forms expose visible submitted/requested values so browser proofs observe real behavior. */
export function Forms() {
  const [submitted, setSubmitted] = useState('');
  const [requested, setRequested] = useState('');
  const [otpRequest, setOtpRequest] = useState('');
  const [searches, setSearches] = useState(0);
  const options = [{ value: 'free', label: 'Free' }, {
    value: 'disabled',
    label: 'Unavailable',
    disabled: true,
  }, { value: 'pro', label: 'Pro' }];
  return (
    <section aria-label='Form components' id='forms'>
      <h2>Form components</h2>
      <form
        id='radio-form'
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get('plan')));
        }}
      >
        <RadioGroup name='plan' legend='Plan' options={options} defaultValue='free' required />
        <Button type='submit'>Submit radio</Button>
        <output aria-label='Submitted plan'>{submitted}</output>
      </form>
      <RadioGroup
        name='controlled-plan'
        legend='Fixed plan'
        options={options}
        value='free'
        onValueChange={setRequested}
      />
      <output aria-label='Requested plan'>{requested}</output>
      <InputGroup
        aria-label='Search field'
        align='inline-end'
        control={<input aria-label='Site search' type='text' />}
        addon={<Button type='button' onClick={() => setSearches(searches + 1)}>Run search</Button>}
      />
      <output aria-label='Search count'>{searches}</output>
      <InputGroup state='disabled' control={<input aria-label='Disabled search' />} />
      <form
        id='otp-form'
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get('otp')));
        }}
      >
        <InputOTP label='Verification code' name='otp' length={6} groups={2} required />
        <Button type='submit'>Verify code</Button>
        <output aria-label='Submitted code'>{submitted}</output>
      </form>
      <InputOTP label='Fixed code' length={4} value='12' onValueChange={setOtpRequest} />
      <output aria-label='Requested code'>{otpRequest}</output>
      <InputOTP label='Disabled code' disabled />
      <Slider label='Volume' name='volume' min={0} max={100} step={5} defaultValues={[40]} value />
      <Slider
        label='Price'
        labels={['Minimum price', 'Maximum price']}
        name='price'
        thumbs={2}
        step={10}
        defaultValues={[20, 80]}
        value
      />
      <Slider label='Vertical volume' orientation='vertical' step={10} defaultValues={[40]} />
      <Slider label='Fixed volume' values={[40]} />
      <Slider label='Disabled volume' disabled />
      <RadioGroup
        name='invalid-plan'
        legend='Invalid plan'
        state='invalid'
        options={options}
        aria-describedby='plan-error'
      />
      <p id='plan-error'>Choose a plan before continuing.</p>
      <InputGroup
        state='invalid'
        control={
          <input aria-label='Invalid search' aria-invalid='true' aria-describedby='search-error' />
        }
      />
      <p id='search-error'>Enter a search term.</p>
    </section>
  );
}
