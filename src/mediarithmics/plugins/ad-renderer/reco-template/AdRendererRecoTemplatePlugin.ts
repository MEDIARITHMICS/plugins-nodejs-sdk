import { ItemProposal, RecommenderResponse, UserCampaignResource, UserCampaignResponse } from '../../../index';
import { map } from '../../../utils';
import { AdRendererTemplateInstanceContext, AdRendererTemplatePlugin } from '../template/AdRendererTemplatePlugin';

export interface AdRendererRecoTemplateInstanceContext extends AdRendererTemplateInstanceContext {
  recommender_id?: string;
}

export abstract class AdRendererRecoTemplatePlugin extends AdRendererTemplatePlugin {
  constructor(enableThrottling = false) {
    super(enableThrottling);
  }

  /**
   * Helper to fetch the User Campaign
   * @param campaignId  The campaignId -> should come from the AdRendererRequest
   * @param userCampaignId  The userCampaignId -> should come from the AdRendererRequest
   * @returns       A Promise of the User Campaign
   */
  async fetchUserCampaign(campaignId: string, userCampaignId: string): Promise<UserCampaignResource> {
    let userCampaignResponse: UserCampaignResponse;
    try {
      userCampaignResponse = await super.requestGatewayHelper({
        method: 'GET',
        url: `${this.outboundPlatformUrl}/v1/display_campaigns/${campaignId}/user_campaigns/${userCampaignId}`,
      });
    } catch (e) {
      this.logger.error(
        `User campaign could not be fetched for: ${campaignId} - ${userCampaignId} Returning empty user campaign Error: ${
          (e as Error).stack ? ((e as Error).stack as string) : 'stack undefined'
        }`,
      );

      userCampaignResponse = {
        status: 'ok',
        data: {
          user_account_id: 'null',
          user_agent_ids: ['null'],
          databag: '',
          user_identifiers: [],
        },
      };
    }

    return userCampaignResponse.data;
  }

  /**
   * Helper to fetch the User recommendations
   * @param instanceContext  The instanceContext -> contains the recommender_id of the creative
   * @param userAgentId  The userAgentId as a string -> should come from the AdRendererRequest (recommended) or from the UserCampaign
   * @returns       A Promise of the Recommendations
   */
  async fetchRecommendations(
    instanceContext: AdRendererRecoTemplateInstanceContext,
    userAgentId: string,
  ): Promise<Array<ItemProposal>> {
    // Without any recommender, we return an empty array
    if (!instanceContext.recommender_id) {
      return Promise.resolve([]);
    }

    const url = `${this.outboundPlatformUrl}/v1/recommenders/${instanceContext.recommender_id}/recommendations`;

    const body = {
      recommender_id: instanceContext.recommender_id,
      input_data: {
        user_agent_id: userAgentId,
      },
    };

    this.logger.debug(`POST: ${url} - ${JSON.stringify(body)}`);

    const response: RecommenderResponse = await super.requestGatewayHelper({ method: 'POST', url, body });

    this.logger.debug(`Recommender ${instanceContext.recommender_id} response : ${JSON.stringify(response)}`);

    return response.data.proposals;
  }

  protected async instanceContextBuilder(creativeId: string) {
    const baseInstanceContext = await super.instanceContextBuilder(creativeId);

    const recommenderProperty = baseInstanceContext.properties.findStringProperty('recommender_id');

    const context: AdRendererRecoTemplateInstanceContext = {
      ...baseInstanceContext,
      recommender_id: map(recommenderProperty, (p) => p.value.value),
    };

    return context;
  }
}
