import { AdRendererBasePlugin, AdContentHandler } from "./AdRendererBasePlugin";
import { AdRendererRecoTemplateInstanceContext } from '../../interfaces/mediarithmics/plugin/InstanceContextInterface';
import {
  UserCampaignResource,
  ItemProposal
} from "../../interfaces/mediarithmics/api/UserCampaignInterface";
import * as _ from "lodash";
import { Creative } from "../../interfaces/mediarithmics/api/CreativeInterface";
import { CreativeProperty } from "../../interfaces/mediarithmics/api/CreativePropertyInterface";

export class AdRendererRecoTemplatePlugin extends AdRendererBasePlugin <
  AdRendererRecoTemplateInstanceContext
> {

  fetchTemplateContent(templatePath: string): Promise<any> {
    return super.requestGatewayHelper(
      "GET",
      `${this.outboundPlatformUrl}/v1/data_file/data?uri=${encodeURIComponent(
        templatePath
      )}`
    );
  }

  fetchTemplateProperties(
    organisationId: string,
    adLayoutId: string,
    versionId: string
  ): Promise<any> {
    return super.requestGatewayHelper(
      "GET",
      `${this
        .outboundPlatformUrl}/v1/ad_layouts/${adLayoutId}/versions/${versionId}?organisation_id=${organisationId}`
    );
  }

  fetchUserCampaign(
    campaignId: string,
    userCampaignId: string
  ): Promise<UserCampaignResource> {
    return super.requestGatewayHelper(
      "GET",
      `${this
        .outboundPlatformUrl}/v1/display_campaigns/${campaignId}/user_campaigns/${userCampaignId}`
    );
  }

  // If the timeline is not loading (shit happens), we fake it
  userCampaignFetchErrorHandler(error: Error) {
    this.logger.error(
      `Can't fecth userCampaign because of: ${error.message} - ${error.stack}`
    );
    const userCampaign = {
      status: "ok",
      data: {
        user_agent_id: "null"
      },
      count: 0
    };

    return JSON.stringify(userCampaign);
  }

  fetchRecommendations(
    instanceContext: AdRendererRecoTemplateInstanceContext,
    userAgentId: string
  ): Promise<Array<ItemProposal>> {
    const getRecommendations = (recommenderId: string) => {
      const uri = `${this
        .outboundPlatformUrl}/v1/recommenders/${recommenderId}/recommendations`;
      const body = JSON.stringify({
        recommender_id: recommenderId,
        input_data: {
          user_agent_id: userAgentId
        }
      });

      this.logger.error(`POST: ${uri} - ${body}`);

      return super.requestGatewayHelper("POST", uri, body).then(response => {
        this.logger.debug(
          `Recommender ${recommenderId} response : ${JSON.stringify(response)}`
        );
        return response.data.proposals as Array<ItemProposal>;
      });
    };

    const recommenderId = instanceContext.recommender_id
      ? instanceContext.recommender_id
      : null;
    return recommenderId
      ? getRecommendations(recommenderId)
      : Promise.resolve([]);
  }

  constructor(
    adContentsHandler: AdContentHandler<AdRendererRecoTemplateInstanceContext>,
  ) {
    // Set the AdContentsHandler
    super(adContentsHandler);

    // Default Instance context builder, as no engine is provided, the template is returned without any compilation
    this.setInstanceContextBuilder((creativeId: string) => {
      const creativeP = this.fetchCreative(creativeId);
      const creativePropsP = this.fetchCreativeProperties(creativeId);

      return Promise.all([
        creativeP,
        creativePropsP
      ]).then((value: Array<any>) => {
        const creative = value[0] as Creative;
        const creativeProperties = value[1] as Array<CreativeProperty>;

        const adLayoutProperty = _.find(
          creativeProperties,
          p => p.property_type === "AD_LAYOUT"
        );

        const urlProperty = _.find(
          creativeProperties,
          p => p.property_type === "URL"
        );

        const recommenderProperty = _.find(
          creativeProperties,
          p => p.technical_name === "recommender_id"
        );

        if (!adLayoutProperty) {
          this.logger.error("Ad layout undefined");
        }

        if (!urlProperty) {
          this.logger.error("url property is undefined");
        }

        return this.fetchTemplateProperties(
          creative.organisation_id,
          adLayoutProperty.value.id,
          adLayoutProperty.value.version
        ).then(templateProperties => {
          this.logger.info(
            "Loaded template properties %d %d => %j",
            adLayoutProperty.value.id,
            adLayoutProperty.value.version,
            JSON.stringify(templateProperties)
          );
          const templatePath = templateProperties.data.template;
          return this.fetchTemplateContent(templatePath).then(template => {
            this.logger.info(
              "Loaded template content %s => %j",
              templatePath,
              JSON.stringify(template)
            );

            const context: AdRendererRecoTemplateInstanceContext = {
              creative: creative,
              creativeProperties: creativeProperties,
              recommender_id: recommenderProperty
                ? recommenderProperty.value.value
                : null,
              creative_click_url: urlProperty.value.url
                ? urlProperty.value.url
                : null,
              ad_layout_id: adLayoutProperty.value.id
                ? adLayoutProperty.value.id
                : null,
              ad_layout_version: adLayoutProperty.value.version
                ? adLayoutProperty.value.version
                : null,
              compiled_template: template            };

            return context;
          });
        });
      });
    });
  }
}