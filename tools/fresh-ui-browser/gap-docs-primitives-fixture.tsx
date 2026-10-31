import { useState } from 'preact/hooks';
import { Label } from '../../packages/fresh-ui/registry/components/ui/label.tsx';
import { Card } from '../../packages/fresh-ui/registry/components/ui/card.tsx';
import { Pagination } from '../../packages/fresh-ui/registry/components/ui/pagination.tsx';
import { Input } from '../../packages/fresh-ui/registry/components/ui/input.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';

export function DocsPrimitives() {
  const [actions, setActions] = useState(0), [disabledClicks, setDisabledClicks] = useState(0);
  return (
    <>
      <h2>Docs primitive components</h2>
      <section id='docs-labels' aria-label='Label examples'>
        <button type='button' id='before-doc-labels'>Before labels</button>
        <div id='docs-label-display'>
          <Label id='doc-email-label' for='doc-email' variant='eyebrow' state='invalid' required>
            Email address
          </Label>
          <Input
            id='doc-email'
            type='email'
            required
            aria-invalid='true'
            defaultValue='reader@example.test'
          />
          <Label for='doc-nickname' optional optionalText='(not required)'>Nickname</Label>
          <Input id='doc-nickname' />
          <Label for='doc-sr-label' srOnly>Hidden document label</Label>
          <Input id='doc-sr-label' />
          <Label for='doc-locked' state='disabled'>Locked field</Label>
          <Input id='doc-locked' disabled />
        </div>
        <button type='button' id='after-doc-labels'>After labels</button>
      </section>
      <section id='docs-card' aria-label='Rule card example'>
        <button type='button' id='before-doc-card'>Before card</button>
        <Card variant='rule' size='sm' interactive>
          <Card.Header>
            <Card.Title>Ship your first order</Card.Title>
            <Card.Description>
              Rule cards carry docs content with one quiet top rule.
            </Card.Description>
            <Card.Action>
              <Button variant='ghost' size='sm' onClick={() => setActions((n) => n + 1)}>
                Pin docs card
              </Button>
            </Card.Action>
          </Card.Header>
          <Card.Body>
            <a href='#read-card'>Read docs card</a>
          </Card.Body>
          <Card.Footer>
            <Button variant='outline' size='sm' onClick={() => setActions((n) => n + 1)}>
              Archive docs card
            </Button>
          </Card.Footer>
        </Card>
        <output aria-label='Docs card actions'>{actions}</output>
      </section>
      <section id='docs-card-default' aria-label='Default card example'>
        <Card>
          <Card.Header>
            <Card.Title>Order SO-10480</Card.Title>
            <Card.Description>Update shipping details and notify the customer.</Card.Description>
          </Card.Header>
          <Card.Body>Order summary</Card.Body>
          <Card.Footer>Edited two minutes ago</Card.Footer>
        </Card>
      </section>
      <section id='docs-pager' aria-label='Pager example'>
        <button type='button' id='before-doc-pager'>Before pager</button>
        <Pagination variant='pager' aria-label='Docs chapters'>
          <Pagination.Previous href='#previous-topic'>Telemetry and logging</Pagination.Previous>
          <Pagination.Next href='#next-topic'>Authentication</Pagination.Next>
        </Pagination>
      </section>
      <section id='docs-pages' aria-label='Numbered pagination example'>
        <button type='button' id='before-doc-pages'>Before page keys</button>
        <Pagination aria-label='Order pages'>
          <Pagination.Meta>Showing 1–20 of 80 orders</Pagination.Meta>
          <Pagination.Actions>
            <Pagination.Link href='#page-one' current aria-label='Page one'>1</Pagination.Link>
            <Pagination.Link
              href='#never-disabled'
              disabled
              aria-label='Unavailable page two'
              onClick={() => setDisabledClicks((n) => n + 1)}
            >
              2
            </Pagination.Link>
            <Pagination.Link
              href='#never-snapshot'
              state='disabled'
              aria-label='Unavailable page three'
              onClick={() => setDisabledClicks((n) => n + 1)}
            >
              3
            </Pagination.Link>
            <Pagination.Ellipsis />
            <Pagination.Link href='#page-four' type='next' aria-label='Page four'>
              Next
            </Pagination.Link>
          </Pagination.Actions>
        </Pagination>
        <button type='button' id='after-doc-pages'>After page keys</button>
        <output aria-label='Disabled page callbacks'>{disabledClicks}</output>
      </section>
    </>
  );
}
