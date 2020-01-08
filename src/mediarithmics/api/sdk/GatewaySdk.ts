import {HttpClient} from './HttpClient';
import {
  ActivityAnalyzer,
  AdRendererRecoTemplateInstanceContext,
  AudienceSegmentExternalFeedResource,
  AudienceSegmentResource,
  BidOptimizer,
  Catalog,
  Creative,
  Credentials,
  DisplayAd,
  ItemProposal,
  PluginProperty,
  RecommendationsWrapper,
  UserCampaignResource
} from '../../index';
import * as winston from 'winston';
import {core} from '../../../index';

const mapData = <T = any>(_: core.DataResponse<T>): T => _.data;

export interface IAdRendererRecoSdk {
  fetchRecommendations: (instanceContext: AdRendererRecoTemplateInstanceContext, userAgentId: string) => Promise<Array<ItemProposal>>
  fetchUserCampaign: (campaignId: string, userCampaignId: string) => Promise<UserCampaignResource>
}

export interface IAudienceFeedConnectorSdk {
  fetchAudienceFeed: (feedId: string) => Promise<AudienceSegmentExternalFeedResource>
  fetchAudienceFeedProperties: (feedId: string) => Promise<PluginProperty[]>
  fetchAudienceSegment: (feedId: string) => Promise<AudienceSegmentResource>
}

export interface IBidOptimizerSdk {
  fetchBidOptimizer: (bidOptimizerId: string) => Promise<BidOptimizer>
  fetchBidOptimizerProperties: (bidOptimizerId: string) => Promise<PluginProperty[]>
}

export interface IActivityAnalyzerSdk {
  fetchActivityAnalyzer: (activityAnalyzerId: string) => Promise<ActivityAnalyzer>
  fetchActivityAnalyzerProperties: (activityAnalyzerId: string) => Promise<PluginProperty[]>
}

export interface IAdRendererSdk {
  fetchDisplayAd: (displayAdId: string, forceReload?: boolean) => Promise<DisplayAd>
  fetchDisplayAdProperties: (displayAdId: string, forceReload?: boolean) => Promise<PluginProperty[]>
}
// Merge this
export interface IEmailRendererSdk {
  fetchCreative: (id: string, forceReload?: boolean) => Promise<Creative>
  fetchCreativeProperties: (id: string, forceReload?: boolean) => Promise<PluginProperty[]>
}

export interface IEmailRouterSdk {
  fetchEmailRouterProperties: (id: string) => Promise<PluginProperty[]>
  sendEmail: <T>(emailData: any) => Promise<T>
}

export interface IRecommenderSdk {
  fetchRecommenderCatalogs: (recommenderId: string) => Promise<Catalog[]>
  fetchRecommenderProperties: (recommenderId: string) => Promise<PluginProperty[]>
}

export interface IBaseSdk {
  fetchConfigurationFile: (fileName: string) => Promise<Buffer>
  fetchDataFile: (uri: string) => Promise<Buffer>
}

export type IGatewaySdk = IAdRendererSdk
  & IAdRendererRecoSdk
  & IAudienceFeedConnectorSdk
  & IBidOptimizerSdk
  & IActivityAnalyzerSdk
  & IEmailRendererSdk
  & IEmailRouterSdk
  & IRecommenderSdk
  & IBaseSdk

export class GatewaySdk implements IGatewaySdk {

  constructor(
    baseURL: string,
    credentials: () => Credentials,
    private logger: () => winston.Logger,
    public client: HttpClient = new HttpClient(
      baseURL,
      logger,
      () => ({
        headers: {auth: {user: credentials().worker_id, pass: credentials().authentication_token, sendImmediately: true}}
      }),
    )
  ) {
  }

  readonly fetchActivityAnalyzer = async (activityAnalyzerId: string): Promise<ActivityAnalyzer> => {
    return this.client.get(`/v1/activity_analyzers/${activityAnalyzerId}`).then(mapData);
  };

  readonly fetchActivityAnalyzerProperties = async (activityAnalyzerId: string): Promise<PluginProperty[]> => {
    return this.client.get(`/v1/activity_analyzers/${activityAnalyzerId}/properties`).then(mapData);
  };

  readonly fetchDisplayAd = async (displayAdId: string, forceReload = false): Promise<DisplayAd> => {
    return this.client.get<core.DataResponse<DisplayAd>>(`/v1/creatives/${displayAdId}`, {qs: {'force-reload': forceReload}})
      .then(mapData)
      .then(_ => _.type === 'DISPLAY_AD' ? _ : Promise.reject(`crid: ${displayAdId} - When fetching DisplayAd, another creative type was returned!`));
  };

  readonly fetchDisplayAdProperties = async (displayAdId: string, forceReload = false): Promise<PluginProperty[]> => {
    return this.client.get(`/v1/creatives/${displayAdId}/renderer_properties`, {qs: {'force-reload': forceReload}}).then(mapData);
  };

  /**
   * Helper to fetch the User recommendations
   * @param instanceContext  The instanceContext -> contains the recommender_id of the creative
   * @param userAgentId  The userAgentId as a string -> should come from the AdRendererRequest (recommended) or from the UserCampaign
   * @returns       A Promise of the Recommendations
   */
  readonly fetchRecommendations = async (instanceContext: AdRendererRecoTemplateInstanceContext, userAgentId: string): Promise<Array<ItemProposal>> => {
    // Without any recommender, we return an empty array
    if (!instanceContext.recommender_id) {
      return Promise.resolve([]);
    }
    const body = {
      recommender_id: instanceContext.recommender_id,
      input_data: {
        user_agent_id: userAgentId
      }
    };
    return this.client.post<core.DataResponse<RecommendationsWrapper>>(`/v1/recommenders/${instanceContext.recommender_id}/recommendations`, {body})
      .then(mapData)
      .then(_ => _.proposals);
  };

  /**
   * Helper to fetch the User Campaign
   * @param campaignId  The campaignId -> should come from the AdRendererRequest
   * @param userCampaignId  The userCampaignId -> should come from the AdRendererRequest
   * @returns       A Promise of the User Campaign
   */
  readonly fetchUserCampaign = async (campaignId: string, userCampaignId: string): Promise<UserCampaignResource> => {
    return this.client.get<core.DataResponse<UserCampaignResource>>(`/v1/display_campaigns/${campaignId}/user_campaigns/${userCampaignId}`)
      .then(mapData)
      .catch(e => {
        this.logger().error(`User campaign could not be fetched for: ${campaignId} - ${userCampaignId} Returning empty user campaign Error: ${e.message} - ${e.stack}`);
        return {
          user_account_id: 'null',
          user_agent_ids: ['null'],
          databag: '',
          user_identifiers: []
        };
      });
  };

  readonly fetchAudienceFeed = async (feedId: string): Promise<AudienceSegmentExternalFeedResource> => {
    return this.client.get(`/v1/audience_segment_external_feeds/${feedId}`).then(mapData);
  };

  readonly fetchAudienceFeedProperties = async (feedId: string): Promise<PluginProperty[]> => {
    return this.client.get(`/v1/audience_segment_external_feeds/${feedId}/properties`).then(mapData);
  };

  readonly fetchAudienceSegment = async (feedId: string): Promise<AudienceSegmentResource> => {
    return this.client.get(`/v1/audience_segment_external_feeds/${feedId}/audience_segment`).then(mapData);
  };

  readonly fetchBidOptimizer = async (bidOptimizerId: string): Promise<BidOptimizer> => {
    return this.client.get(`/v1/bid_optimizers/${bidOptimizerId}`).then(mapData);
  };

  readonly fetchBidOptimizerProperties = async (bidOptimizerId: string): Promise<PluginProperty[]> => {
    return this.client.get(`/v1/bid_optimizers/${bidOptimizerId}/properties`).then(mapData);
  };

  readonly fetchConfigurationFile = async (fileName: string): Promise<Buffer> => {
    return this.client.get(`/v1/configuration/technical_name=${fileName}`, {isBinary: true});
  };

  readonly fetchDataFile = async (uri: string): Promise<Buffer> => {
    return this.client.get(`/v1/data_file/data`, {qs: {uri}, isBinary: true});
  };

  /**
   * Helper to fetch the creative resource with caching
   */
  readonly fetchCreative = async (id: string, forceReload = false): Promise<Creative> => {
    return this.client.get(`/v1/creatives/${id}`, {qs: {'force-reload': forceReload}}).then(mapData);
  };

  readonly fetchCreativeProperties = async (id: string, forceReload = false): Promise<PluginProperty[]> => {
    return this.client.get(`/v1/creatives/${id}/renderer_properties`, {qs: {'force-reload': forceReload}}).then(mapData);
  };

  readonly fetchEmailRouterProperties = async (id: string): Promise<PluginProperty[]> => {
    return this.client.get(`/v1/email_routers/${id}/properties`).then(mapData);
  };

  readonly sendEmail = async <T>(emailData: any): Promise<T> => {
    return this.client.post(`/v1/external_services/technical_name=mailjet/call`, {body: emailData});
  };

  // Helper to fetch the activity analyzer resource with caching
  readonly fetchRecommenderCatalogs = async (recommenderId: string): Promise<Catalog[]> => {
    return this.client.get(`/v1/recommenders/${recommenderId}/catalogs`).then(mapData);
  };

  // Helper to fetch the activity analyzer resource with caching
  readonly fetchRecommenderProperties = async (recommenderId: string): Promise<PluginProperty[]> => {
    return this.client.get(`/v1/recommenders/${recommenderId}/properties`).then(mapData);
  };
}