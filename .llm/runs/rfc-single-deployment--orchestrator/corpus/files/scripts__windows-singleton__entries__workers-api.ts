import { createPluginServiceContext } from '../../../services/_shared/plugin-service-context.ts';
import createWorkersService from 'jsr:@netscript/plugin-workers@0.0.1-beta.9/services';

await createWorkersService(await createPluginServiceContext('workers'));
