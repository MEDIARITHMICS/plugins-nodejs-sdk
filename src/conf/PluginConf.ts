export class PluginConf {
  constructor(private env: NodeJS.ProcessEnv = process.env) {
  }

  readonly gatewayHost = this.env.GATEWAY_HOST || 'plugin-gateway.platform';
  readonly gatewayPort = parseInt(this.env.GATEWAY_PORT || '8080');
  readonly outboundPlatformUrl = `http://${this.gatewayHost}:${this.gatewayPort}`;
  readonly proxyHost = this.env.EXTERNAL_SERVICE_PROXY_HOST || 'plugin-gateway.platform';
  readonly proxyPort = parseInt(this.env.EXTERNAL_SERVICE_PROXY_PORT || '8081');
  readonly proxyUrl = `http://${this.proxyHost}:${this.proxyPort}`;
  readonly pluginPort = this.env.PLUGIN_PORT ? parseInt(this.env.PLUGIN_PORT) : undefined;
}
