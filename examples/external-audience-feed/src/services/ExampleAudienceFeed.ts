import * as rp from 'request-promise-native';
import * as winston from 'winston';

import {
  IExampleAudienceFeedConnectorConnectorInstanceContext
} from '../interfaces/IMics';
import { request } from 'http';
import { IExampleAudienceFeedPayloadCustomAudience, IExampleCreateCustomAudienceResponse, IExampleAudienceFeedPayloadPushUser, IExampleAudienceFeedPayloadUserId, IExampleAudienceFeedCreateCustomAudienceResponse } from '../interfaces/IExampleAudienceFeedConnector';

const PROXY_URL: string = 'http://plugin-gateway.platform:8081';
const EXAMPLE_URL: string = 'http://api.exampleaudiencefeed.com';

export async function createCustomAudience(
  instanceContext: IExampleAudienceFeedConnectorConnectorInstanceContext,
  payload: IExampleAudienceFeedPayloadCustomAudience,
  logger: winston.LoggerInstance,
): Promise<IExampleAudienceFeedCreateCustomAudienceResponse> {
  try {
    logger.debug(`Create audience -> ${EXAMPLE_URL}/v1/audience_segment_external_feeds/}`);
    const options: rp.OptionsWithUri = {
      method: 'POST',
      uri: `${EXAMPLE_URL}/v1/audience_segment_external_feeds/`,
      json: true,
      headers: { 'X-Authorization': instanceContext.exampleApiKey },
      body: payload
    };
    return await rp(options);
  } catch (e) {
    throw(e);
  }
}

export async function getAllSegments(
  id: string
) {
  try{
    const options: rp.OptionsWithUri = {
      method: "GET",
      uri: `${EXAMPLE_URL}/v1/external_segment_connection/${id}`,
      json: true
    };
    return await rp(options);
  } catch (e) {
    throw(e);
  }
}

export async function pushEmailsAudience(
  instanceContext: IExampleAudienceFeedConnectorConnectorInstanceContext,
  id: string,
  payload: string,
  logger: winston.LoggerInstance,
): Promise<any> {
  try {
    logger.debug(`Example Audience Feed call -> ${EXAMPLE_URL}/audiences/${id}`)
    const options: rp.OptionsWithUri = {
      method: 'POST',
      uri: `${EXAMPLE_URL}/v1/user_segment_update/${id}`,
      json: true,
      headers: { 'X-Authorization': instanceContext.exampleApiKey },
      body: payload,
      // proxy: PROXY_URL,
    };
    return await rp(options);
  } catch (e) {
    throw (e);
  }
}