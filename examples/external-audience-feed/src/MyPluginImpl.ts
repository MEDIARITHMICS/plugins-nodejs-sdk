import { IExampleAudienceFeedConnector } from "./interfaces/IExampleAudienceFeedConnector";
import { core } from "@mediarithmics/plugins-nodejs-sdk";

const API_KEY_PROPERTY_NAME: string = 'api-key';

export default class ExampleAudienceFeedConnector extends core.AudienceFeedConnectorBasePlugin {

    protected async instanceContextBuilder(feedId: string): Promise<IExampleAudienceFeedConnector> {

        
        const baseInstanceContext: core.AudienceFeedConnectorBaseInstanceContext = await super.instanceContextBuilder(feedId);
        const apiKey = this.getApiKey(baseInstanceContext, feedId)

        return {
            ...baseInstanceContext,
            apiKey
        };

    }

    protected async onExternalSegmentCreation(
        request: core.ExternalSegmentCreationRequest,
        instanceContext: any
    ): Promise<core.ExternalSegmentCreationPluginResponse> {
        try {
            // request.feed_id
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
        instanceContext: any
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
        instanceContext: any
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