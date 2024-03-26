import { core } from '@mediarithmics/plugins-nodejs-sdk';
import { MyComputedField } from './MyComputedField';

// All the magic is here
const plugin = new MyComputedField();
const runner = new core.ProductionPluginRunner(plugin);

runner.start();
