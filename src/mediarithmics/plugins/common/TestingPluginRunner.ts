/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-empty-function */

import { Server } from 'http';

import { BasePlugin } from './BasePlugin';

export class TestingPluginRunner {
  plugin: BasePlugin;
  server: Server;

  constructor(plugin: BasePlugin, transport?: sinon.SinonStub) {
    this.plugin = plugin;

    if (transport) {
      // @ts-ignore
      this.plugin._transport = transport;
    }
  }

  // Start a server serving the plugin app
  // A port can be provided to run the server on it
  start() {}
}
