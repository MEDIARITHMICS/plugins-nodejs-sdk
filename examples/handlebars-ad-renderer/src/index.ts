import {
  core, extra
} from "@mediarithmics/plugins-nodejs-sdk";

function adContentsHandler(
  adRenderRequest: core.AdRendererRequest,
  instanceContext: core.AdRendererRecoTemplateInstanceContext
): Promise<string> {
  this.logger.debug(
    `Fetching User Campaign with campaignId: ${adRenderRequest.campaign_id} - userCampaignId: ${adRenderRequest.user_campaign_id}`
  );

    return plugin
    .fetchUserCampaign(
      adRenderRequest.campaign_id,
      adRenderRequest.user_campaign_id
    )
    .catch(this.userCampaignFetchErrorHandler)
    .then((userCampaign: UserCampaignResource) => {
      this.logger.debug(
        `Received UserCampaign: ${JSON.stringify(userCampaign)}`
      );

      this.logger.debug(
        `using user agent id: ${userCampaign.user_agent_ids[0]}`
      );
    
      return plugin
        .fetchRecommendations(instanceContext, userCampaign.user_agent_ids[0])
        .then((recommendations: Array<ItemProposal>) => {
          const engine = plugin.engineBuilder(adRenderRequest, instanceContext);

          const properties: HandlebarsEngineContext = {
            request: adRenderRequest,
            creative: {
              properties: instanceContext.creative,
              click_url: instanceContext.creative_click_url
            },
            recommendations: recommendations,
            clickableContents: []
          };

          const template = engine.compile(instanceContext.template);

          this.logger.debug(
            `Loading template with properties: ${JSON.stringify(
              properties,
              null,
              4
            )}`
          );

          const html = template(properties); //fill the properties

          return JSON.stringify({
            html: html,
            displayContext: {
              $clickable_contents: properties.clickableContents
            }
          });
        });
    });
}

// All the magic is here
const plugin = new extra.HandlebarsAdRendererPlugin(
  (
    request: core.AdRendererRequest,
    instanceContext: extra.AdRendererHandlebarsTemplateInstanceContext
  ) => new extra.HandlebarsEngine(request.click_urls).engine
);

plugin.start();
