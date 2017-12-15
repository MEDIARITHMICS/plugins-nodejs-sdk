import * as express from "express";
import * as _ from "lodash";
import * as cache from "memory-cache";

import {
  BasePlugin,
  PluginProperty,
  AudienceFeedConnectorBaseInstanceContext,
  AudienceFeed,
  UserSegmentUpdateRequest,
  ExternalSegmentCreationRequest,
  ExternalSegmentConnectionRequest,
  ExternalSegmentCreationPluginResponse,
  ExternalSegmentConnectionPluginResponse,
  UserSegmentUpdatePluginResponse,
  AudienceFeedConnectorPluginResponse
} from "../../../index";

export abstract class AudienceFeedConnectorBasePlugin extends BasePlugin {
  instanceContext: Promise<AudienceFeedConnectorBaseInstanceContext>;

  async fetchAudienceFeed(feedId: string): Promise<AudienceFeed> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/audience_segment_external_feeds/${feedId}`
    );
    this.logger.debug(
      `Fetched External Feed: ${feedId} - ${JSON.stringify(response.data)}`
    );
    return response.data;
  }

  async fetchAudienceFeedProperties(feedId: string): Promise<PluginProperty[]> {
    const response = await super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/audience_segment_external_feeds/${feedId}/properties`
    );
    this.logger.debug(
      `Fetched External Feed Properties: ${feedId} - ${JSON.stringify(
        response.data
      )}`
    );
    return response.data;
  }

  // Method to build an instance context
  // To be overriden to get a cutom behavior
  // This is a default provided implementation
  protected async instanceContextBuilder(
    feedId: string
  ): Promise<AudienceFeedConnectorBaseInstanceContext> {
    const audienceFeedP = this.fetchAudienceFeed(feedId);
    const audienceFeedPropsP = this.fetchAudienceFeedProperties(feedId);

    const results = await Promise.all([audienceFeedP, audienceFeedPropsP]);

    const audienceFeed = results[0];
    const audienceFeedProps = results[1];

    const context: AudienceFeedConnectorBaseInstanceContext = {
      feed: audienceFeed,
      feedProperties: audienceFeedProps
    };

    return context;
  }

  protected abstract onExternalSegmentCreation(
    request: ExternalSegmentCreationRequest,
    instanceContext: AudienceFeedConnectorBaseInstanceContext
  ): Promise<ExternalSegmentCreationPluginResponse>;

  protected abstract onExternalSegmentConnection(
    request: ExternalSegmentConnectionRequest,
    instanceContext: AudienceFeedConnectorBaseInstanceContext
  ): Promise<ExternalSegmentConnectionPluginResponse>;

  protected abstract onUserSegmentUpdate(
    request: UserSegmentUpdateRequest,
    instanceContext: AudienceFeedConnectorBaseInstanceContext
  ): Promise<UserSegmentUpdatePluginResponse>;

  private emptyBodyFilter(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (!req.body || _.isEmpty(req.body)) {
      const msg = {
        error: "Missing request body"
      };
      this.logger.error(
        `POST /v1/${req.url} : %s`,
        JSON.stringify(msg)
      );
      res.status(500).json(msg);
    } else {
      next();
    }
  }

  private async getInstanceContext(
    feedId: string
  ): Promise<AudienceFeedConnectorBaseInstanceContext> {
    if (!this.pluginCache.get(feedId)) {
      this.pluginCache.put(
        feedId,
        this.instanceContextBuilder(feedId),
        this.INSTANCE_CONTEXT_CACHE_EXPIRATION
      );
    }

    return this.pluginCache.get(feedId);
  }

  private initExternalSegmentCreation(): void {
    this.app.post(
      "/v1/external_segment_creation",
      this.emptyBodyFilter,
      async (req: express.Request, res: express.Response) => {
        try {
          this.logger.debug(
            `POST /v1/external_segment_creation ${JSON.stringify(req.body)}`
          );

          const request = req.body as ExternalSegmentCreationRequest;

          if (!this.onExternalSegmentCreation) {
            throw new Error("No External Segment Creation listener registered!");
          }

          const instanceContext = await this.getInstanceContext(
            request.feed_id
          );

          const response = await this.onExternalSegmentCreation(
            request,
            instanceContext
          );

          this.logger.debug(`Returning: ${JSON.stringify(response)}`);

          const pluginResponse: AudienceFeedConnectorPluginResponse = {
            status: response.status
          };

          if (response.message) {
            pluginResponse.message = response.message;
          }

          return res.status(200).send(JSON.stringify(pluginResponse));
        } catch (error) {
          this.logger.error(
            `Something bad happened : ${error.message} - ${error.stack}`
          );
          return res.status(500).send(error.message + "\n" + error.stack);
        }
      }
    );
  }

  private initExternalSegmentConnection(): void {
    this.app.post(
      "/v1/external_segment_connection",
      this.emptyBodyFilter,
      async (req: express.Request, res: express.Response) => {
        try {
          this.logger.debug(
            `POST /v1/external_segment_connection ${JSON.stringify(req.body)}`
          );

          const request = req.body as ExternalSegmentConnectionRequest;

          if (!this.onExternalSegmentConnection) {
            throw new Error("No External Segment Connection listener registered!");
          }

          const instanceContext = await this.getInstanceContext(
            request.feed_id
          );

          const response = await this.onExternalSegmentConnection(
            request,
            instanceContext
          );

          this.logger.debug(`Returning: ${JSON.stringify(response)}`);

          const pluginResponse: AudienceFeedConnectorPluginResponse = {
            status: response.status
          };

          if (response.message) {
            pluginResponse.message = response.message;
          }

          return res.status(200).send(JSON.stringify(pluginResponse));
        } catch (error) {
          this.logger.error(
            `Something bad happened : ${error.message} - ${error.stack}`
          );
          return res.status(500).send(error.message + "\n" + error.stack);
        }
      }
    );
  }

  private initUserSegmentUpdate(): void {
    this.app.post(
      "/v1/user_segment_update",
      this.emptyBodyFilter,
      async (req: express.Request, res: express.Response) => {
        try {
          this.logger.debug(
            `POST /v1/user_segment_update ${JSON.stringify(req.body)}`
          );

          const request = req.body as UserSegmentUpdateRequest;

          if (!this.onUserSegmentUpdate) {
            throw new Error("No User Segment Update listener registered!");
          }

          const instanceContext = await this.getInstanceContext(
            request.feed_id
          );

          const response = await this.onUserSegmentUpdate(
            request,
            instanceContext
          );

          this.logger.debug(`Returning: ${JSON.stringify(response)}`);

          const pluginResponse: AudienceFeedConnectorPluginResponse = {
            status: response.status
          };

          if (response.nextMsgDelayInMs) {
            res.set(
              "x-mics-next-msg-delay",
              response.nextMsgDelayInMs.toString()
            );
          }

          if (response.message) {
            pluginResponse.message = response.message;
          }

          return res.status(200).send(JSON.stringify(pluginResponse));
        } catch (error) {
          this.logger.error(
            `Something bad happened : ${error.message} - ${error.stack}`
          );
          return res.status(500).send(error.message + "\n" + error.stack);
        }
      }
    );
  }

  constructor() {
    super();

    this.initExternalSegmentCreation();
    this.initExternalSegmentConnection();
    this.initUserSegmentUpdate();
  }
}
