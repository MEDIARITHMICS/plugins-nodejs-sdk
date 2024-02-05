import express from 'express';
import _ from 'lodash';

import { PluginProperty, PluginPropertyResponse } from '../../api/core/plugin/PluginPropertyInterface';
import { Catalog, CatalogResponse, RecommendationsWrapper } from '../../api/datamart';
import { RecommenderRequest } from '../../api/plugin/recommender/RecommenderRequestInterface';
import { BasePlugin, PropertiesWrapper } from '../common/BasePlugin';

export interface RecommenderBaseInstanceContext {
  properties: PropertiesWrapper;
}

export abstract class RecommenderPlugin extends BasePlugin<RecommenderBaseInstanceContext> {
  instanceContext: Promise<RecommenderBaseInstanceContext>;

  constructor() {
    super();

    // We init the specific route to listen for activity analysis requests
    this.initRecommendationRequest();
    this.setErrorHandler();
  }

  // Helper to fetch the activity analyzer resource with caching
  async fetchRecommenderCatalogs(recommenderId: string): Promise<Catalog[]> {
    const recommenderCatalogsResponse = await super.requestGatewayHelper<CatalogResponse>({
      method: 'GET',
      url: `${this.outboundPlatformUrl}/v1/recommenders/${recommenderId}/catalogs`,
    });
    this.logger.debug(
      `Fetched recommender catalogs: ${recommenderId} - ${JSON.stringify(recommenderCatalogsResponse.data)}`,
    );
    return recommenderCatalogsResponse.data;
  }

  // Method to build an instance context
  // To be overriden to get a cutom behavior

  // Helper to fetch the activity analyzer resource with caching
  async fetchRecommenderProperties(recommenderId: string): Promise<PluginProperty[]> {
    const recommenderPropertyResponse = await super.requestGatewayHelper<PluginPropertyResponse>({
      method: 'GET',
      url: `${this.outboundPlatformUrl}/v1/recommenders/${recommenderId}/properties`,
    });
    this.logger.debug(
      `Fetched recommender Properties: ${recommenderId} - ${JSON.stringify(recommenderPropertyResponse.data)}`,
    );
    return recommenderPropertyResponse.data;
  }

  // Method to process an Activity Analysis

  // This is a default provided implementation
  protected async instanceContextBuilder(recommenderId: string): Promise<RecommenderBaseInstanceContext> {
    const recommenderProps = await this.fetchRecommenderProperties(recommenderId);

    const context: RecommenderBaseInstanceContext = {
      properties: new PropertiesWrapper(recommenderProps),
    };

    return context;
  }

  protected async getInstanceContext(recommenderId: string): Promise<RecommenderBaseInstanceContext | null> {
    if (!this.pluginCache.get(recommenderId)) {
      void this.pluginCache.put(
        recommenderId,
        this.instanceContextBuilder(recommenderId).catch((err) => {
          this.logger.error(`Error while caching instance context: ${(err as Error).message}`);
          this.pluginCache.del(recommenderId);
          throw err;
        }),
        this.getInstanceContextCacheExpiration(),
      );
    }
    return this.pluginCache.get(recommenderId);
  }

  // To be overriden by the Plugin to get a custom behavior
  protected abstract onRecommendationRequest(
    request: RecommenderRequest,
    instanceContext: RecommenderBaseInstanceContext | null,
  ): Promise<RecommendationsWrapper>;

  private initRecommendationRequest(): void {
    this.app.post(
      '/v1/recommendations',
      this.asyncMiddleware(async (req: express.Request, res: express.Response) => {
        if (!this.httpIsReady()) {
          const msg = {
            error: 'Plugin not initialized',
          };
          this.logger.error('POST /v1/recommendations : %s', JSON.stringify(msg));
          return res.status(500).json(msg);
        } else if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: 'Missing request body',
          };
          this.logger.error('POST /v1/recommendations : %s', JSON.stringify(msg));
          return res.status(500).json(msg);
        } else {
          this.logger.debug(`POST /v1/recommendations ${JSON.stringify(req.body)}`);

          const recommenderRequest = req.body as RecommenderRequest;

          if (!this.onRecommendationRequest) {
            const errMsg = 'No Recommendation request listener registered!';
            this.logger.error(errMsg);
            return res.status(500).json({ error: errMsg });
          }

          const instanceContext: RecommenderBaseInstanceContext | null = await this.getInstanceContext(
            recommenderRequest.recommender_id,
          );

          const pluginResponse = await this.onRecommendationRequest(recommenderRequest, instanceContext);

          this.logger.debug(`Returning: ${JSON.stringify(pluginResponse)}`);
          return res.status(200).send(JSON.stringify(pluginResponse));
        }
      }),
    );
  }
}
