import express from 'express';
import _ from 'lodash';

import { Creative, CreativeResponse } from '../../../api/core/creative';
import { PluginProperty, PluginPropertyResponse } from '../../../api/core/plugin/PluginPropertyInterface';
import { EmailRendererPluginResponse } from '../../../api/plugin/emailtemplaterenderer/EmailRendererPluginResponse';
import { EmailRenderRequest } from '../../../api/plugin/emailtemplaterenderer/EmailRendererRequestInterface';
import { BasePlugin, PropertiesWrapper } from '../../common';

export interface EmailRendererBaseInstanceContext {
  creative: Creative;
  properties: PropertiesWrapper;
}

export abstract class EmailRendererPlugin<
  T extends EmailRendererBaseInstanceContext = EmailRendererBaseInstanceContext,
> extends BasePlugin<T> {
  instanceContext: Promise<T>;

  constructor(enableThrottling = false) {
    super(enableThrottling);

    // We init the specific route to listen for email contents requests
    this.initEmailContents();
    this.setErrorHandler();
  }

  // Helper to fetch the creative resource with caching
  async fetchCreative(id: string, forceReload = false): Promise<Creative> {
    const response = await super.requestGatewayHelper<CreativeResponse>({
      method: 'GET',
      url: `${this.outboundPlatformUrl}/v1/creatives/${id}`,
      qs: { 'force-reload': forceReload },
    });
    this.logger.debug(`Fetched Creative: ${id} - ${JSON.stringify(response.data)}`);
    return response.data;
  }

  // Method to build an instance context
  // To be overriden to get a cutom behavior

  async fetchCreativeProperties(id: string, forceReload = false): Promise<PluginProperty[]> {
    const response = await super.requestGatewayHelper<PluginPropertyResponse>({
      method: 'GET',
      url: `${this.outboundPlatformUrl}/v1/creatives/${id}/renderer_properties`,
      qs: { 'force-reload': forceReload },
    });
    this.logger.debug(`Fetched Email Templates Properties: ${id} - ${JSON.stringify(response.data)}`);
    return response.data;
  }

  // Method to process an Activity Analysis

  // This is a default provided implementation
  protected async instanceContextBuilder(creativeId: string, forceReload = false): Promise<T> {
    const creativeP = this.fetchCreative(creativeId, forceReload);
    const creativePropsP = this.fetchCreativeProperties(creativeId, forceReload);

    const results = await Promise.all([creativeP, creativePropsP]);

    const creative = results[0];
    const creativeProps = results[1];

    const context = {
      creative: creative,
      properties: new PropertiesWrapper(creativeProps),
    } as T;

    return context;
  }

  protected async getInstanceContext(creativeId: string, forceReload = false): Promise<T> {
    if (!this.pluginCache.get(creativeId) || forceReload) {
      void this.pluginCache.put(
        creativeId,
        this.instanceContextBuilder(creativeId, forceReload).catch((err) => {
          this.logger.error(`Error while caching instance context: ${(err as Error).message}`);
          this.pluginCache.del(creativeId);
          throw err;
        }),
        this.getInstanceContextCacheExpiration(),
      );
    }
    return this.pluginCache.get(creativeId) as Promise<T>;
  }

  // To be overriden by the Plugin to get a custom behavior
  protected abstract onEmailContents(
    request: EmailRenderRequest,
    instanceContext: T,
  ): Promise<EmailRendererPluginResponse>;

  private initEmailContents(): void {
    this.app.post(
      '/v1/email_contents',
      this.asyncMiddleware(async (req: express.Request, res: express.Response) => {
        if (!this.httpIsReady()) {
          const msg = {
            error: 'Plugin not initialized',
          };
          this.logger.error('POST /v1/email_contents : %s', JSON.stringify(msg));
          return res.status(500).json(msg);
        } else if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: 'Missing request body',
          };
          this.logger.error('POST /v1/email_contents : %s', JSON.stringify(msg));
          return res.status(500).json(msg);
        } else {
          this.logger.debug(`POST /v1/email_contents ${JSON.stringify(req.body)}`);

          const emailRenderRequest = req.body as EmailRenderRequest;

          if (!this.onEmailContents) {
            const errMsg = 'No Email Renderer listener registered!';
            this.logger.error(errMsg);
            return res.status(500).send({ error: errMsg });
          }

          // We flush the Plugin Gateway cache during previews
          const forceReload = emailRenderRequest.context === 'PREVIEW' || emailRenderRequest.context === 'STAGE';

          const instanceContext = await this.getInstanceContext(emailRenderRequest.creative_id, forceReload);

          const response = await this.onEmailContents(emailRenderRequest, instanceContext);

          this.logger.debug(`Returning: ${JSON.stringify(response)}`);
          return res.status(200).send(JSON.stringify(response));
        }
      }),
    );
  }
}
