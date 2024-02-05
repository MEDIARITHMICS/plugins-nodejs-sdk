import express from 'express';
import jsesc from 'jsesc';
import _ from 'lodash';

import { DisplayAd, DisplayAdResponse } from '../../../api/core/creative/index';
import { PluginProperty, PluginPropertyResponse } from '../../../api/core/plugin/PluginPropertyInterface';
import { BasePlugin, PropertiesWrapper } from '../../common/BasePlugin';
import { generateEncodedClickUrl } from '../utils/index';
import { AdRendererPluginResponse, AdRendererRequest, ClickUrlInfo } from './AdRendererInterface';

export class AdRendererBaseInstanceContext {
  properties: PropertiesWrapper;
  displayAd: DisplayAd;
}

export abstract class AdRendererBasePlugin<T extends AdRendererBaseInstanceContext> extends BasePlugin<T> {
  displayContextHeader = 'x-mics-display-context';

  constructor(enableThrottling = false) {
    super(enableThrottling);

    this.initAdContentsRoute();
    this.setErrorHandler();
  }

  // Helper to fetch the Display Ad resource with caching
  async fetchDisplayAd(displayAdId: string, forceReload = false): Promise<DisplayAd> {
    const response = await super.requestGatewayHelper<DisplayAdResponse>({
      method: 'GET',
      url: `${this.outboundPlatformUrl}/v1/creatives/${displayAdId}`,
      qs: { 'force-reload': forceReload },
    });

    this.logger.debug(`Fetched Creative: ${displayAdId} - ${JSON.stringify(response.data)}`);

    if (response.data.type !== 'DISPLAY_AD') {
      throw new Error(`crid: ${displayAdId} - When fetching DisplayAd, another creative type was returned!`);
    }

    return response.data;
  }

  // Helper to fetch the Display Ad properties resource with caching
  async fetchDisplayAdProperties(displayAdId: string, forceReload = false): Promise<PluginProperty[]> {
    const creativePropertyResponse = await super.requestGatewayHelper<PluginPropertyResponse>({
      method: 'GET',
      url: `${this.outboundPlatformUrl}/v1/creatives/${displayAdId}/renderer_properties`,
      qs: { 'force-reload': forceReload },
    });

    this.logger.debug(`Fetched Creative Properties: ${displayAdId} - ${JSON.stringify(creativePropertyResponse.data)}`);

    return creativePropertyResponse.data;
  }

  // Method to build an instance context

  getEncodedClickUrl(redirectUrls: ClickUrlInfo[]) {
    return generateEncodedClickUrl(redirectUrls);
  }

  // To be overriden to get a custom behavior
  protected async instanceContextBuilder(creativeId: string, forceReload = false): Promise<T> {
    const displayAdP = this.fetchDisplayAd(creativeId, forceReload);
    const displayAdPropsP = this.fetchDisplayAdProperties(creativeId, forceReload);

    const results = await Promise.all([displayAdP, displayAdPropsP]);

    const displayAd = results[0];
    const displayAdProps = results[1];

    const context = {
      displayAd: displayAd,
      properties: new PropertiesWrapper(displayAdProps),
    } as T;

    return Promise.resolve(context);
  }

  protected abstract onAdContents(request: AdRendererRequest, instanceContext: T): Promise<AdRendererPluginResponse>;

  protected async getInstanceContext(creativeId: string, forceReload: boolean): Promise<T> {
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

  private initAdContentsRoute(): void {
    this.app.post(
      '/v1/ad_contents',
      this.asyncMiddleware(async (req: express.Request, res: express.Response) => {
        if (!this.httpIsReady()) {
          const msg = {
            error: 'Plugin not initialized',
          };
          this.logger.error('POST /v1/ad_contents : %s', JSON.stringify(msg));
          return res.status(500).json(msg);
        } else if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: 'Missing request body',
          };
          this.logger.error('POST /v1/ad_contents : %s', JSON.stringify(msg));
          return res.status(500).json(msg);
        } else {
          this.logger.debug(`POST /v1/ad_contents ${JSON.stringify(req.body)}`);

          const adRendererRequest = req.body as AdRendererRequest;

          if (!this.onAdContents) {
            this.logger.error('POST /v1/ad_contents: No AdContents listener registered!');
            const msg = {
              error: 'No AdContents listener registered!',
            };
            return res.status(500).json(msg);
          }

          // We flush the Plugin Gateway cache during previews
          const forceReload = adRendererRequest.context === 'PREVIEW' || adRendererRequest.context === 'STAGE';

          const instanceContext: T = await this.getInstanceContext(adRendererRequest.creative_id, forceReload);

          const adRendererResponse = await this.onAdContents(adRendererRequest, instanceContext);

          return res
            .header(this.displayContextHeader, jsesc(adRendererResponse.displayContext as string, { json: true }))
            .status(200)
            .send(adRendererResponse.html);
        }
      }),
    );
  }
}
