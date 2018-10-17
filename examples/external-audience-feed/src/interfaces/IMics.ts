import { core } from '@mediarithmics/plugins-nodejs-sdk';

// Lesquels sont utiles à chaque fois?
export interface ExampleAudienceFeedConnectorConnectorInstanceContext extends core.AudienceFeedConnectorBaseInstanceContext {
  technicalConfiguration: ITechnicalConfiguration;
  exampleApiKey: string;
  micsApiToken: string;
}

export interface ITechnicalConfiguration {
  web_domain: string[];
  mics_api_version: string;
  mics_api_endpoint: string;
}