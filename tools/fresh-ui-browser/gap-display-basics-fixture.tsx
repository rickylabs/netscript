import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useState } from 'preact/hooks';
import { Item } from '../../packages/fresh-ui/registry/components/ui/item.tsx';
import { Kbd } from '../../packages/fresh-ui/registry/components/ui/kbd.tsx';
import { Collapsible } from '../../packages/fresh-ui/registry/components/ui/collapsible.tsx';

export function DisplayBasics() {
  const [count, setCount] = useState(0), [requests, setRequests] = useState(0);
  const [controlled, setControlled] = useState(false);
  return (
    <>
      <h2>Data display basics</h2>
      <section aria-label='Item' id='display-item'>
        <Item.Group separators>
          <Item
            variant='outline'
            title={<a href='#order-42'>Order42</a>}
            description='Ready for review'
            media={<span aria-hidden='true'>▣</span>}
            chevron
            header='Recent order'
            footer='Updated today'
            actions={
              <Button variant='outline' size='sm' onClick={() => setCount(count + 1)}>
                Review order
              </Button>
            }
          />
          <Item title={<a href='#order-43'>Order43</a>} description='Next order' />
        </Item.Group>
        <output aria-label='Order reviews'>{count}</output>
      </section>
      <section aria-label='Keyboard notation' id='display-kbd'>
        <Button type='button' id='before-kbd'>Before notation</Button>
        <p>
          Press{' '}
          <Kbd.Group>
            <Kbd>Control</Kbd>
            <Kbd size='sm'>K</Kbd>
          </Kbd.Group>{' '}
          to search.
        </p>
        <p style={{ background: 'var(--ns-inverse)', padding: 'var(--ns-space-2)' }}>
          <Kbd variant='inverse'>Enter</Kbd>
        </p>
        <span id='unseparated-keys'>
          <Kbd.Group separator={false}>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </Kbd.Group>
        </span>
        <Button type='button' id='after-kbd'>After notation</Button>
      </section>
      <section aria-label='Native disclosure' id='display-disclosure'>
        <Collapsible label='Repository details'>
          <a href='#repository'>Open repository</a>
        </Collapsible>
        <Collapsible label='Unavailable details' disabled>
          <Button type='button'>Hidden action</Button>
        </Collapsible>
        <Collapsible
          label='Controlled details'
          open={controlled}
          onOpenChange={() => setRequests(requests + 1)}
        >
          <a href='#controlled-details'>Controlled content</a>
        </Collapsible>
        <output aria-label='Disclosure requests'>{requests}</output>
        <Button type='button' onClick={() => setControlled(!controlled)}>
          Set disclosure externally
        </Button>
        <Button type='button' id='after-disclosure'>After disclosure</Button>
      </section>
    </>
  );
}
