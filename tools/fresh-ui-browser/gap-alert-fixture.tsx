import { useState } from 'preact/hooks';
import { Alert } from '../../packages/fresh-ui/registry/components/ui/alert.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';

export function Alerts() {
  const [open, setOpen] = useState(true);
  const [requests, setRequests] = useState(0);
  const [actions, setActions] = useState(0);
  return (
    <section aria-label='Alert components'>
      <h2>Alert components</h2>
      <Button type='button' id='before-alert'>Before alerts</Button>
      <div id='alert-dismiss'>
        <Alert
          title='Review changes'
          description='Your settings need attention.'
          close
          closeLabel='Dismiss review'
          onOpenChange={() => setRequests((n) => n + 1)}
          action={
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setActions((n) => n + 1)}
            >
              Review alert
            </Button>
          }
        />
      </div>
      <Button type='button' id='after-alert'>After alerts</Button>
      <output aria-label='Alert requests'>{requests}</output>
      <output aria-label='Alert actions'>{actions}</output>
      <div id='alert-controlled'>
        <Alert
          title='Controlled notice'
          open={open}
          defaultOpen={false}
          close
          closeLabel='Dismiss controlled'
          onOpenChange={() => setRequests((n) => n + 1)}
        />
      </div>
      <Button type='button' id='toggle-alert' onClick={() => setOpen(!open)}>
        Toggle controlled notice
      </Button>
      <div id='alert-hidden'>
        <Alert
          defaultOpen={false}
          close
          title='Initially hidden'
          action={<Button type='button'>Hidden action</Button>}
        />
      </div>
      <div id='alert-localized'>
        <Alert title={false} toneLabel='Hinweis' description='Localized feedback' />
      </div>
      <div id='alert-variants'>
        {(['neutral', 'info', 'success', 'warning', 'destructive', 'important'] as const).flatMap((
          variant,
        ) =>
          (['subtle', 'strong'] as const).map((emphasis) => (
            <Alert
              key={`${variant}-${emphasis}`}
              variant={variant}
              emphasis={emphasis}
              description='Review the updated settings before continuing.'
              action={<Button variant='ghost' size='sm'>View settings</Button>}
              close
            />
          ))
        )}
      </div>
    </section>
  );
}
