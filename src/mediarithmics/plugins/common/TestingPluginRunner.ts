import { Server } from 'http';

import { BasePlugin } from './BasePlugin';

export class TestingPluginRunner {
  plugin: BasePlugin;
  server: Server;

  constructor(plugin: BasePlugin, transport?: any) {
    this.plugin = plugin;

    if (transport) {
      this.plugin._transport = transport;
    }
  }

  // Start a server serving the plugin app
  // A port can be provided to run the server on it
  start() {}
}
