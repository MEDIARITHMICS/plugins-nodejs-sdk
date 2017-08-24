import * as _ from "lodash";

import { AdRendererRequest } from "../../core/interfaces/mediarithmics/api/AdRendererRequestInterface";
import { Creative } from "../../core/interfaces/mediarithmics/api/CreativeInterface";
import { CreativeProperty } from "../../core/interfaces/mediarithmics/api/CreativePropertyInterface";

import { AdRendererBaseInstanceContext } from "../../core/interfaces/mediarithmics/plugin/InstanceContextInterface";

import { AdRendererBasePlugin } from "../../core/class/mediarithmics/AdRendererBasePlugin";
import {
  UserCampaignResource
} from "../../core/interfaces/mediarithmics/api/UserCampaignInterface";
import { ItemProposal } from "../../core/interfaces/mediarithmics/api/RecommenderInterface";
import { AdRendererRecoTemplateInstanceContext } from "../../core/index";
import { AdRendererRecoTemplatePlugin } from "../../core/class/mediarithmics/AdRendererRecoTemplatePlugin";


export type HandlebarsAdsContentBuilder = (
  request: AdRendererRequest,
  instanceContext: AdRendererRecoTemplateInstanceContext
) => Promise<string>;

export type HandlebarsEngineBuilder = (
  request: AdRendererRequest,
  instanceContext: AdRendererRecoTemplateInstanceContext
) => typeof Handlebars;

export class HandlebarsAdRendererPlugin extends AdRendererRecoTemplatePlugin {

  constructor() {
    super();

    // Default Instance context builder
    this.setInstanceContextBuilder((creativeId: string) => {
      console.warn(`You are using the default InstanceContectBuilder of HandlebarsAdRendererPlugin
      Is it really what you want to do?
      `)
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
              template: template
              };

            return context;
          });
        });
      });
    });
  }
}
