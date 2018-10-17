import { core } from '@mediarithmics/plugins-nodejs-sdk';
import { Subject } from "rxjs/index";



// Lesquels sont utiles à chaque fois?
export interface IExampleAudienceFeedConnectorConnectorInstanceContext extends core.AudienceFeedConnectorBaseInstanceContext {
  technicalConfiguration: ITechnicalConfiguration;
  exampleApiKey: string;
  micsApiToken: string;
}

export interface ITechnicalConfiguration {
  web_domain: string[];
  mics_api_version: string;
  mics_api_endpoint: string;
}