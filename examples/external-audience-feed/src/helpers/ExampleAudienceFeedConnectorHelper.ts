import * as _ from "lodash";
import {
    IExampleAudienceFeedPayloadCustomAudience,
    IExampleAudienceFeedPayloadEmail,
} from "../interfaces/IExampleAudienceFeedConnector";
import { core } from '@mediarithmics/plugins-nodejs-sdk';

export function buildCreateCustomAudiencePayload(
  exampleAudienceFeedAudienceId: string
): IExampleAudienceFeedPayloadCustomAudience {
  return {
    audienceId : exampleAudienceFeedAudienceId,
  }
}
export function buildPayLoadEmail(
  email: string,
  operation: core.UpdateType
): IExampleAudienceFeedPayloadEmail {
  return {
    email: email,
    action: (operation === 'UPSERT') ? 'add' : 'remove'
  }
}