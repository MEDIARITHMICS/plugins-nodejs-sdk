import { core } from "@mediarithmics/plugins-nodejs-sdk";
import { IExampleAudienceFeedConnector } from "./interfaces/IExampleAudienceFeedConnector";
import { addEmailsInCustomAudience, createCustomAudience } from './services/ExampleAudienceFeed';

const API_KEY_PROPERTY_NAME: string = 'api-key';

export default class ExampleAudienceFeedConnector extends core.AudienceFeedConnectorBasePlugin {

    protected async instanceContextBuilder(feedId: string): Promise<IExampleAudienceFeedConnector> {

    try {
        const baseInstanceContext: core.AudienceFeedConnectorBaseInstanceContext = await super.instanceContextBuilder(feedId);
        const apiKey: string = this.getApiKey(baseInstanceContext, feedId)

        const context = {
            api_key: apiKey,
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
        instanceContext: ExampleAudienceFeedConnectorConnectorInstanceContext
    ): Promise<core.ExternalSegmentCreationPluginResponse> {
        try {
            this.logger.debug(`Feed ${request.feed_id} - Segment ${request.segment_id} - OnExternalSegmentCreation`);

            const segment: core.AudienceSegmentResource = await this.fetchAudienceSegment(request.feed_id);



              await Promise.all(instanceContext.apps.map(async (app: ICredentialsClientApp) => {
                this.logger.debug(`Email ${app.name} - Create custom audience`);
                const payload: ExampleAudienceFeedPayloadCustomAudience = buildCreateCustomAudiencePayload(instanceContext.batchAudienceName as string);
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