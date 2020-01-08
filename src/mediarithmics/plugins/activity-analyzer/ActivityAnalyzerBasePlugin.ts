import * as express from 'express';
import * as _ from 'lodash';
import {BasePlugin, BasePluginProps, PropertiesWrapper} from '../common/BasePlugin';
import {ActivityAnalyzer, ActivityAnalyzerPluginResponse, ActivityAnalyzerRequest,} from './ActivityAnalyzerInterface';

export interface ActivityAnalyzerBaseInstanceContext {
  properties: PropertiesWrapper;
  activityAnalyzer: ActivityAnalyzer;
}

export abstract class ActivityAnalyzerPlugin extends BasePlugin {

  constructor(props?: BasePluginProps) {
    super(props);
    // We init the specific route to listen for activity analysis requests
    this.initActivityAnalysis();
    this.setErrorHandler();
  }

  // This is a default provided implementation
  protected async instanceContextBuilder(
    activityAnalyzerId: string
  ): Promise<ActivityAnalyzerBaseInstanceContext> {
    const [activityAnalyzer, activityAnalyzerProps] = await Promise.all([
      this.gatewaySdk.fetchActivityAnalyzer(activityAnalyzerId),
      this.gatewaySdk.fetchActivityAnalyzerProperties(activityAnalyzerId),
    ]);

    return {
      properties: new PropertiesWrapper(activityAnalyzerProps),
      activityAnalyzer: activityAnalyzer
    };
  }

  // To be overriden by the Plugin to get a custom behavior
  protected abstract onActivityAnalysis(
    request: ActivityAnalyzerRequest,
    instanceContext: ActivityAnalyzerBaseInstanceContext
  ): Promise<ActivityAnalyzerPluginResponse>;

  private initActivityAnalysis(): void {
    this.app.post(
      '/v1/activity_analysis',
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          if (!req.body || _.isEmpty(req.body)) {
            const msg = {
              error: 'Missing request body'
            };
            this.logger.error(
              'POST /v1/activity_analysis : %s',
              JSON.stringify(msg)
            );
            return res.status(500).json(msg);
          } else {
            this.logger.debug(
              `POST /v1/activity_analysis ${JSON.stringify(req.body)}`
            );

            const activityAnalyzerRequest = req.body as ActivityAnalyzerRequest;

            if (!this.onActivityAnalysis) {
              const errMsg = 'No Activity Analyzer listener registered!';
              this.logger.error(errMsg);
              return res.status(500).json({error: errMsg});
            }

            if (
              !this.pluginCache.get(
                activityAnalyzerRequest.activity_analyzer_id
              )
            ) {
              this.pluginCache.put(
                activityAnalyzerRequest.activity_analyzer_id,
                this.instanceContextBuilder(
                  activityAnalyzerRequest.activity_analyzer_id
                ),
                this.getInstanceContextCacheExpiration()
              );
            }

            const instanceContext: ActivityAnalyzerBaseInstanceContext = await this.pluginCache.get(
              activityAnalyzerRequest.activity_analyzer_id
            );

            const pluginResponse = await this.onActivityAnalysis(
              activityAnalyzerRequest,
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
