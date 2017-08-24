import { core, extra } from "@mediarithmics/plugins-nodejs-sdk";
import * as _ from "lodash";

// All the magic is here
const plugin = new extra.HandlebarsAdRendererPlugin();

async function adContentsHandler(
  adRenderRequest: core.AdRendererRequest,
  instanceContext: core.AdRendererRecoTemplateInstanceContext
): Promise<core.AdRendererPluginResponse> {
  plugin.logger.debug(
    `Fetching User Campaign with campaignId: ${adRenderRequest.campaign_id} - userCampaignId: ${adRenderRequest.user_campaign_id}`
  );

  const userCampaign: core.UserCampaignResource = await plugin.fetchUserCampaign(
    adRenderRequest.campaign_id,
    adRenderRequest.user_campaign_id
  );

  plugin.logger.debug(`Received UserCampaign: ${JSON.stringify(userCampaign)}`);
  plugin.logger.debug(`using user agent id: ${userCampaign.user_agent_ids[0]}`);

  const recommendations: Array<
    core.ItemProposal
  > = await plugin.fetchRecommendations(
    instanceContext,
    userCampaign.user_agent_ids[0]
  );

  const engine = plugin.getEngineBuilder();

  const properties: extra.HandleBarRootContext = {
    creative: {
      properties: instanceContext.creative,
      click_url: instanceContext.creative_click_url
    },
    recommendations: recommendations,
    clickableContents: [],
    redirectUrls: adRenderRequest.click_urls,
    request: adRenderRequest
  };

  plugin.logger.debug(
    `Loading template with properties: ${JSON.stringify(properties, null, 4)}`
  );

  plugin.logger.debug(`Loading the rootContext into the compiledTemplate`);
  const html = instanceContext.compiled_template(properties); //fill the properties
  plugin.logger.debug(`We got from handlebar: ${html}`);

  return {
    html: html,
    displayContext: {
      $clickable_contents: properties.clickableContents
    }
  };
}

const handlebarEngine: extra.HandlebarsEngine = new extra.HandlebarsEngine();
plugin.setTemplateEngineBuilder(handlebarEngine);

plugin.setInstanceContextBuilder((creativeId: string) => {
  const creativeP = plugin.fetchCreative(creativeId);
  const creativePropsP = plugin.fetchCreativeProperties(creativeId);

  return Promise.all([creativeP, creativePropsP]).then((value: Array<any>) => {
    const creative = value[0] as core.Creative;
    const creativeProperties = value[1] as Array<core.CreativeProperty>;

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
      plugin.logger.error("Ad layout undefined");
    }

    if (!urlProperty) {
      plugin.logger.error("url property is undefined");
    }

    return plugin
      .fetchTemplateProperties(
        creative.organisation_id,
        adLayoutProperty.value.id,
        adLayoutProperty.value.version
      )
      .then(templateProperties => {
        plugin.logger.info(
          "Loaded template properties %d %d => %j",
          adLayoutProperty.value.id,
          adLayoutProperty.value.version,
          JSON.stringify(templateProperties)
        );
        const templatePath = templateProperties.data.template;
        return plugin.fetchTemplateContent(templatePath).then(template => {
          plugin.logger.info(
            "Loaded template content %s => %j",
            templatePath,
            JSON.stringify(template)
          );

          plugin.getEngineBuilder().init();
          const compiledTemplate = plugin.getEngineBuilder().compile(template);

          const context: core.AdRendererRecoTemplateInstanceContext = {
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
            template: template,
            compiled_template: compiledTemplate
          };

          plugin.logger.debug(
            `Instance Context building is OVER\n\n\n==========================`
          );

          return context;
        });
      });
  });
});

plugin.setAdContentsHandler(adContentsHandler);

plugin.start();
