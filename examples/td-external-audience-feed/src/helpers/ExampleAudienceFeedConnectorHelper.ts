import * as _ from "lodash";

import {
    IExampleAudienceFeedPayloadCustomAudience,
    IExampleAudienceFeedPayloadEmail,
} from "../interfaces/IExampleAudienceFeedConnector";

// import { addEmailsInCustomAudience } from '../services/ExampleAudienceFeed';
import { core } from '@mediarithmics/plugins-nodejs-sdk';
// import { obfuscateString } from "@mediarithmics/plugins-nodejs-sdk/lib/mediarithmics";

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

/* 
function retryPromiseFactory<T>(
  mainPromiseGen: () => Promise<T>,
  instanceContext: IExampleAudienceFeedConnectorConnectorInstanceContext,
  logger: winston.LoggerInstance
): Promise<RetryResultWrapper<T>> {
  return new Promise((resolve, reject) => {
    const operation = retry.operation({ retries: instanceContext.technicalConfiguration.max_retry });
    operation.attempt(async (attempt: string) => {
      try {
        logger.debug(`Trying to call for the ${attempt}th time`);
        const response = await mainPromiseGen();
        logger.debug(`Successfully push Emails!`);
        resolve({ attempt: attempt, data: response });
      } catch (err) {
        if (operation.retry(err)) {
          logger.error(`Got an error: ${err.message}`);
          return;
        }
        reject(operation.mainError());
      }
    });
  }); */