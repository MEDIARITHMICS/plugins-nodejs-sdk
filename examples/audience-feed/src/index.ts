import { core } from '@mediarithmics/plugins-nodejs-sdk';
import { ExampleAudienceFeed } from './ExampleAudienceFeed';

// All the magic is here
const plugin = new ExampleAudienceFeed();
const runner = new core.ProductionPluginRunner(plugin);
runner.start();
