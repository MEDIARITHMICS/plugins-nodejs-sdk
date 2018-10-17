import { core } from "@mediarithmics/plugins-nodejs-sdk";
import { IExampleAudienceFeedConnector } from "./interfaces/IExampleAudienceFeedConnector";
import { addEmailsInCustomAudience, createCustomAudience } from './services/ExampleAudienceFeed';
import { ITechnicalConfiguration } from './interfaces/IMics';


const API_KEY_PROPERTY_NAME: string = 'api-key';
const TECHNICAL_CONFIGURATION_FILE_NAME = 'technical-configuration';
const EXAMPLEAUDIENCEFEED_AUDIENCE_ID_PROPERTY_NAME = 'exampleaudiencefeed_audience_id';
const EXAMPLEAUDIENCEFEED_AUDIENCE_NAME_PROPERTY_NAME = 'exampleaudiencefeed_audience_name';

export default class ExampleAudienceFeedConnector extends core.AudienceFeedConnectorBasePlugin {

    protected async instanceContextBuilder(feedId: string): Promise<IExampleAudienceFeedConnector> {

    try {
        const baseInstanceContext: core.AudienceFeedConnectorBaseInstanceContext = await super.instanceContextBuilder(feedId);
        const apiKey: string = this.getApiKey(baseInstanceContext, feedId)
        const exampleAudienceFeedAudienceId: string = this.getExampleAudienceFeedAudienceId(baseInstanceContext, feedId);
        const exampleAudienceFeedAudienceName: string = this.getExampleAudienceFeedAudienceName(baseInstanceContext, feedId);

        const context = {
            api_key: apiKey,
            audience_feed_id: exampleAudienceFeedAudienceId,
            audience_feed_name: exampleAudienceFeedAudienceName,
            ...baseInstanceContext
        };

        return context;

    } catch (e) {
        this.logger.error(`Something bad happened in instanceContextBuilder | ${e}`);
        throw (e);
      }
    }

    protected async onExternalSegmentCreation(
        request: core.ExternalSegmentCreationRequest,
        instanceContext: IExampleAudienceFeedConnector
    ): Promise<core.ExternalSegmentCreationPluginResponse> {
        try {
            this.logger.debug(`Feed ${request.feed_id} - Segment ${request.segment_id} - OnExternalSegmentCreation`);

            const segment: core.AudienceSegmentResource = await this.fetchAudienceSegment(request.feed_id);



              await Promise.all(instanceContext.apps.map(async (app: ICredentialsClientApp) => {
                this.logger.debug(`Create custom audience`);
                const payload: ExampleAudienceFeedPayloadCustomAudience = buildCreateCustomAudiencePayload(instanceContext.ExampleAudienceFeedAudienceName as string);
                await createCustomAudience(instanceContext, payload, this.logger);
              }));

            return {
                status: 'ok'
            } as core.ExternalSegmentCreationPluginResponse;
      
        } catch (e) {
            return {
              status: e.status || 'error',
              message: e.message || e
            };
        }
    }

    protected async onExternalSegmentConnection(
        request: core.ExternalSegmentConnectionRequest,
        instanceContext: ExampleAudienceFeedConnectorConnectorInstanceContext
    ): Promise<core.ExternalSegmentConnectionPluginResponse> {
        try{
            return {
                status: 'ok'
            } as core.ExternalSegmentConnectionPluginResponse;
        }catch (e) {
            return {
              status: e.status || 'error',
              message: e.message || e
            };
        }
    }

    protected async onUserSegmentUpdate(
        request: core.UserSegmentUpdateRequest,
        instanceContext: ExampleAudienceFeedConnectorConnectorInstanceContext
    ): Promise<core.UserSegmentUpdatePluginResponse> {
        try{
            return {
                status: 'ok'
            } as core.UserSegmentUpdatePluginResponse;
        } catch (e) {
            return {
              status: e.status || 'error',
              message: e.message || e
            };
        }
    }







    
  private async getTechnicalConfiguration(feedId: string): Promise<ITechnicalConfiguration> {
    const technicalConfigurationFile = await this.fetchConfigurationFile(TECHNICAL_CONFIGURATION_FILE_NAME);

    if (!technicalConfigurationFile) {
      throw new Error(`Feed: ${feedId} - Error in file fetch ${TECHNICAL_CONFIGURATION_FILE_NAME}`);
    }

    this.logger.debug('Log technical file :', JSON.stringify(technicalConfigurationFile.toString()));
    const technicalConfiguration: ITechnicalConfiguration = JSON.parse(technicalConfigurationFile.toString());

    if (!technicalConfiguration.mics_api_version) {
      throw new Error(`Feed: ${feedId} - Missing configuration object: mics_api_version`);
    }
    if (!technicalConfiguration.mics_api_endpoint) {
      throw new Error(`Feed: ${feedId} - Missing configuration object: mics_api_endpoint`);
    }
    return technicalConfiguration;
  }




    
  private getExampleAudienceFeedAudienceId(
    baseInstanceContext: core.AudienceFeedConnectorBaseInstanceContext,
    feedId: string
  ): string {
    const exampleAudienceFeedAudienceId = baseInstanceContext.feedProperties.find(property => {
      return property.technical_name == EXAMPLEAUDIENCEFEED_AUDIENCE_ID_PROPERTY_NAME;
    }) as core.StringProperty;

    if (!exampleAudienceFeedAudienceId || !exampleAudienceFeedAudienceId.value || exampleAudienceFeedAudienceId.value.value === undefined) {
      throw new Error(`Feed: ${feedId} - Missing ${EXAMPLEAUDIENCEFEED_AUDIENCE_ID_PROPERTY_NAME} property`);
    }

    return exampleAudienceFeedAudienceId.value.value as string;
  }

  private getExampleAudienceFeedAudienceName(
    baseInstanceContext: core.AudienceFeedConnectorBaseInstanceContext,
    feedId: string
  ): string {
    const exampleAudienceFeedAudienceName = baseInstanceContext.feedProperties.find(property => {
      return property.technical_name == EXAMPLEAUDIENCEFEED_AUDIENCE_NAME_PROPERTY_NAME;
    }) as core.StringProperty;
    if (!exampleAudienceFeedAudienceName || !exampleAudienceFeedAudienceName.value || exampleAudienceFeedAudienceName.value.value === undefined) {
      throw new Error(`Feed: ${feedId} - Missing ${EXAMPLEAUDIENCEFEED_AUDIENCE_NAME_PROPERTY_NAME} property`);
    }
    return exampleAudienceFeedAudienceName.value.value as string;
  }


    private getApiKey(
        baseInstanceContext: core.AudienceFeedConnectorBaseInstanceContext,
        feedId: string
    ): string {
        const apiKey = baseInstanceContext.feedProperties.findStringProperty(API_KEY_PROPERTY_NAME);
        if (!apiKey || !apiKey.value || apiKey.value.value === undefined) {
            throw new Error(`Feed: ${feedId} - Missing ${API_KEY_PROPERTY_NAME} property`);
        }
        return apiKey.value.value as string;
    }

}