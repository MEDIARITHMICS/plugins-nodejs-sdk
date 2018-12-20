import { core } from '@mediarithmics/plugins-nodejs-sdk';

export interface IExampleAudienceFeedConnectorConnectorInstanceContext extends core.AudienceFeedConnectorBaseInstanceContext {
  technicalConfiguration: ITechnicalConfiguration;
  exampleApiKey: string;
  micsApiToken: string;
  audienceFeedId?: string;
}

export interface ITechnicalConfiguration {
  web_domain: string[];
  mics_api_version: string;
  mics_api_endpoint: string;
  max_retry: string;
}