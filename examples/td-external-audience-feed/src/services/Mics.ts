import * as rp from "request-promise-native";
import * as winston from "winston";

import { IExampleAudienceFeedConnectorConnectorInstanceContext } from '../interfaces/IMics';
import { core } from '@mediarithmics/plugins-nodejs-sdk';

export class MicsAPIService {

  static async updateProperty(
    property: { value: string, type: string },
    request: core.ExternalSegmentCreationRequest,
    instanceContext: IExampleAudienceFeedConnectorConnectorInstanceContext,
    logger: winston.LoggerInstance,
  ): Promise<any> {

    try {

      logger.debug(`Call API - ${instanceContext.technicalConfiguration.mics_api_endpoint}/${instanceContext.technicalConfiguration.mics_api_version}/audience_segments/${request.segment_id}/external_feeds/${request.feed_id}/properties/technical_name=${property.type}`);

      const options: rp.OptionsWithUri = {
        method: 'PUT',
        uri: `${instanceContext.technicalConfiguration.mics_api_endpoint}/${instanceContext.technicalConfiguration.mics_api_version}/audience_segments/${request.segment_id}/external_feeds/${request.feed_id}/properties/technical_name=${property.type}`,
        body: { value: { value: property.value } },
        headers: { Authorization: instanceContext.micsApiToken },
        json: true
      };

      logger.debug(`Feed ${request.feed_id} - Segment ${request.segment_id} - Datamart ${request.datamart_id} | Trying to update ${property.type}`);

      const response = await rp(options);
      return response.data;
    } catch (e) {
      logger.error(`Feed ${request.feed_id} -  Segment ${request.segment_id} -  Datamart ${request.datamart_id} - Something bad happen when update property ${property.type} | ${e}`);
      throw e;
    }

  }
}