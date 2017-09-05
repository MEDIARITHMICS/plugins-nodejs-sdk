# Plugin SDK

This is the mediarithmics SDK for building plugins in Typescript or raw Node.js easily. As this package includes Typescript interfaces, we recommend that you use it with Typescript to ease your development.

It covers (as of v0.2.0):
- AdRenderer plugin
- Activity Analyzer plugin
- AdRenderer with recommendations and Handlebars support

Coming soon:
- Email Renderer
- Recommender
- Email Router
- Bid Optimizer

## Installation

This module is installed via npm:

```
npm install --save @mediarithmics/plugins-nodejs-sdk
```
## Concepts

### Overall mechanism

The NodeJS plugin SDK consists of a set of abstract class that you have to implement. Those class provides a lot of helpers to make your life easier when having to make calls to the mediarithmics plugin gateway and/or to retrieve data.

This SDK also integrate a lot of very useful Typescript interfaces that we highly recommend you to use.

In order to implement your own logic while building your plugin, you have to override the "main" processing function of the abstract class in your impementation.

This function to override depend on the Plugin type. Those are:

- onAdContents for AdRenderer plugins
- onActivityAnalysis for Activity Analyzer plugins

If you need a custom Instance Context (see below), you can also override the 'instanceContextBuilder' function of the abstract class.

Once you will have provided your own implementation of the abstract class, you'll have to instantiate it and to give this instance to a 'Runner' that will run it as a web server app.

### Request

A mediarithmics plugin is called by the mediarithmics platform wih a 'Request' that contains all the Data to process / evaluate. Each type of plugin, depending on its functional behavior, is receiving a different request payload.

The plugin SDK contains a typescript interface describing the format of the request for each supported plugin.

A request can be:
- An User activity to process
- An Ad creative to render (e.g. generate HTML/JS)
- An email to render (e.g. generate HTML/raw text)
- A Bid Request to evaluate (e.g. should I bid on it? And at which price?)

Please see the complete documentation for each Plugin Type [here.](https://developer.mediarithmics.com/)

### Instance Context

A plugin instance can have a configuration that will change the way it will process Requests. As a plugin will be called numerous time to process incoming Requests, its configuration must be cached and only refreshed periodically. This SDK is helping you to manage this cache by providing you an "Instance Context" that represents this cache.

A default "Instance Context" is automatically provided by the SDK for each plugin type but you can also provide your own "Instance Context Builder" that will be called periodically to rebuild the cache.

If you need to have a custom *Instance Context* format because you pre-calculate or charge in memory some values (ex: if you need to compile a Template / load in memory a statistic model / etc.), you can:
1. Override the default *Instance Context Builder* function of the Plugin class
2. If you are using Typescript, you can extends the Base Interface of the Instance Context of your plugin that is provided so that you can add your custom fields

Note: The plugin instance configuration can be done through the mediarithmics console UI or directly by API.

### Runners

The SDK provides 2 different runners:
- ProductionPluginRunner: you have to use this runner in your main JS file. This runner is creating a web server to host your plugin so that it can be called by the mediarithmics platform
- TestingPluginRunner: this is a Runner used to write tests for your plugins.

For details on how to use those 2 runners, please refer the examples code snippets provided with the SDK.

## Quickstart - Typescript

### SDK import

You have to import the 'core' module of the SDK in your code to access to the Abstract classes and Typescript interfaces. If you need some external integration, as the "Handlebar" templating system for example, you can also import the 'extra' package.

#### Example import
``` js
import { core } from "@mediarithmics/plugins-nodejs-sdk";
```

### Abstract class implementation

When implementing a plugin class, you need to give him the main 'processing' function that he will process every time a Request is being received.

#### AdRenderer example

``` js
export class MySimpleAdRenderer extends core.AdRendererBasePlugin<
  core.AdRendererBaseInstanceContext
> {
  protected async onAdContents(
    request: core.AdRendererRequest,
    instanceContext: core.AdRendererBaseInstanceContext
  ): Promise<core.AdRendererPluginResponse> {
    .....
  }
}
```

#### Activity Analyzer example

``` js
export class MyActivityAnalyzerPlugin extends core.ActivityAnalyzerPlugin {
  protected onActivityAnalysis(
    request: core.ActivityAnalyzerRequest,
    instanceContext: core.ActivityAnalyzerBaseInstanceContext
  ): Promise<core.ActivityAnalyzerPluginResponse> {
    ......
  }
}
```

### Plugin Runner for production

Once you have implemented your own Plugin class, you have to instantiate it and to provide the instance to a Plugin Runner. For Production use, here is how you need to do it:

#### Activity Analyzer example

``` js
const plugin = new MyActivityAnalyzerPlugin();
const runner = new core.ProductionPluginRunner(plugin);
runner.start();
```
#### AdRenderer example

``` js
const plugin = new MySimpleAdRenderer();
const runner = new core.ProductionPluginRunner(plugin);
runner.start();
```

### Plugin Testing

This SDK provides you a 'TestingPluginRunner' that you can use to mock the transport layer of the plugin (e.g. emulate its call to the platform) and which expose the plugin 'app' on which you can trigger fake calls to test your plugin logic.

The Plugin examples provided with the SDK are all tested and you can read their tests in order to build your own tests.

Testing Plugins is highly recommended.
