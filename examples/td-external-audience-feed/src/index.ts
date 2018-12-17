import ExampleAudienceFeedConnector from "./MyPluginImpl";
import { core } from "@mediarithmics/plugins-nodejs-sdk";


const plugin = new ExampleAudienceFeedConnector();
const runner = new core.ProductionPluginRunner(plugin);

runner.start();