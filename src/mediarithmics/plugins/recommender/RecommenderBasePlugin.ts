import * as express from 'express';
import * as _ from 'lodash';

import {BasePlugin, BasePluginProps, PropertiesWrapper} from '../common/BasePlugin';

import {RecommendationsWrapper} from '../../api/datamart';

import {RecommenderRequest} from '../../api/plugin/recommender/RecommenderRequestInterface';

export interface RecommenderBaseInstanceContext {
  properties: PropertiesWrapper;
}

export interface RecommenderPluginResponse extends RecommendationsWrapper {
}

export abstract class RecommenderPlugin extends BasePlugin {
  instanceContext: Promise<RecommenderBaseInstanceContext>;

  constructor(props?: BasePluginProps) {
    super(props);
    // We init the specific route to listen for activity analysis requests
    this.initRecommendationRequest();
    this.setErrorHandler();
  }

  // This is a default provided implementation
  protected async instanceContextBuilder(
    recommenderId: string
  ): Promise<RecommenderBaseInstanceContext> {

    const recommenderProps = await this.gatewaySdk.fetchRecommenderProperties(
      recommenderId
    );

    const context: RecommenderBaseInstanceContext = {
      properties: new PropertiesWrapper(recommenderProps)
    };

    return context;
  }

  // To be overriden by the Plugin to get a custom behavior
  protected abstract onRecommendationRequest(
    request: RecommenderRequest,
    instanceContext: RecommenderBaseInstanceContext
  ): Promise<RecommenderPluginResponse>;

  private initRecommendationRequest(): void {
    this.app.post(
      '/v1/recommendations',
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          if (!req.body || _.isEmpty(req.body)) {
            const msg = {
              error: 'Missing request body'
            };
            this.logger.error(
              'POST /v1/recommendations : %s',
              JSON.stringify(msg)
            );
            return res.status(500).json(msg);
          } else {
            this.logger.debug(
              `POST /v1/recommendations ${JSON.stringify(req.body)}`
            );

            const recommenderRequest = req.body as RecommenderRequest;

            if (!this.onRecommendationRequest) {
              const errMsg = 'No Recommendation request listener registered!';
              this.logger.error(errMsg);
              return res.status(500).json({error: errMsg});
            }

            if (
              !this.pluginCache.get(
                recommenderRequest.recommender_id
              )
            ) {
              this.pluginCache.put(
                recommenderRequest.recommender_id,
                this.instanceContextBuilder(
                  recommenderRequest.recommender_id
                ),
                this.getInstanceContextCacheExpiration()
              );
            }

            const instanceContext: RecommenderBaseInstanceContext = await this.pluginCache.get(
              recommenderRequest.recommender_id
            );

            const pluginResponse = await this.onRecommendationRequest(
              recommenderRequest,
              instanceContext
            );

            this.logger.debug(`Returning: ${JSON.stringify(pluginResponse)}`);
            return res.status(200).send(JSON.stringify(pluginResponse));
          }
        }
      )
    );
  }
}
