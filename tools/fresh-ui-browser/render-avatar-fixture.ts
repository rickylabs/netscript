/** Render the shipped Avatar for the browser's initial-document image fetch regression. */
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { Avatar } from '../../packages/fresh-ui/registry/components/ui/avatar.tsx';

console.log(render(Avatar({ name: 'Ada Lovelace', src: '/avatar-photo.svg' })));
