import { core } from "@mediarithmics/plugins-nodejs-sdk"; // import core sdk
import {
  IExampleAudienceFeedConnector,
  IExampleAudienceFeedPayloadCustomAudience,
  IExampleAudienceFeedCreateCustomAudienceResponse,
} from "./interfaces/IExampleAudienceFeedConnector"; // import connections
import { IExampleAudienceFeedConnectorConnectorInstanceContext } from "./interfaces/IMics";
import {
  createCustomAudience,
  pushEmailsAudience,
  getAllSegments
} from "./services/ExampleAudienceFeed"; // import dedicated functions

// creating const to use
const API_KEY_PROPERTY_NAME: string = "api-key"; // API key from external platform
// const TECHNICAL_CONFIGURATION_FILE_NAME = 'technical-configuration'; // technical configuration
const EXAMPLEAUDIENCEFEED_AUDIENCE_ID_PROPERTY_ID =
  "exampleaudiencefeed_audience_id"; // id assigned by mics to the audience
const EXAMPLEAUDIENCEFEED_AUDIENCE_NAME_PROPERTY_NAME =
  "exampleaudiencefeed_audience_name"; // name of this audience

export default class ExampleAudienceFeedConnector extends core.AudienceFeedConnectorBasePlugin {
  // connection to the mics audiences
  protected async instanceContextBuilder(
    feed_id: string
  ): Promise<IExampleAudienceFeedConnector> {
    try {
      const baseInstanceContext: core.AudienceFeedConnectorBaseInstanceContext = await super.instanceContextBuilder(
        feed_id
      );

      const apiKey: string = this.getApiKey(baseInstanceContext, feed_id);
      const exampleAudienceFeedAudienceId: string = this.getExampleAudienceFeedAudienceId(
        baseInstanceContext,
        feed_id
      );
      const exampleAudienceFeedAudienceName: string = this.getExampleAudienceFeedAudienceName(
        baseInstanceContext,
        feed_id
      );

      const context = {
        exampleApiKey: apiKey,
        audience_feed_id: exampleAudienceFeedAudienceId,
        audience_feed_name: exampleAudienceFeedAudienceName,
        ...baseInstanceContext
      };
      return context;
    } catch (e) {
      this.logger.error(
        `Something bad happened in instanceContextBuilder | ${e}`
      );
      throw e;
    }
  }

  // Creation of an external segment
  protected async onExternalSegmentCreation(
    request: core.ExternalSegmentCreationRequest,
    instanceContext: IExampleAudienceFeedConnectorConnectorInstanceContext
  ): Promise<core.ExternalSegmentCreationPluginResponse> {
    try {
      this.logger.debug(
        `Feed ${request.feed_id} - Segment ${
          request.segment_id
        } - OnExternalSegmentCreation`
      );
      const payload: IExampleAudienceFeedPayloadCustomAudience = {
        audienceId: request.feed_id
      };
      const exampleAudienceFeedResponse: IExampleAudienceFeedCreateCustomAudienceResponse = await createCustomAudience(
        instanceContext,
        payload,
        this.logger
      ); instanceContext.audience_feed_id = exampleAudienceFeedResponse.results.audienceId;
      if (!instanceContext.audience_feed_id) {
        throw new Error(`AudienceId empty`);
      }
      return {
        status: "ok"
      };
    }  catch (e) {
      return {
        status: e.status || "error",
        message: e.message || e
      };
     } 
  
  }

  protected async onExternalSegmentConnection(
    request: core.ExternalSegmentConnectionRequest,
    instanceContext: IExampleAudienceFeedConnectorConnectorInstanceContext
  ): Promise<core.ExternalSegmentConnectionPluginResponse> {
    if (!instanceContext.audience_feed_id) throw new Error(`AudienceId empty`);
    try {
      const payload = "mics@dev.com";
      const id = instanceContext.audience_feed_id;
      await getAllSegments(id);
      this.logger.debug(`Audience Id Saved on creation : ${request.feed_id}`);

      // call http avec fonction en entrée email et audienceId  et call sur la route dans la doc
      //fonction unique "OnUserCreation"
      await pushEmailsAudience(instanceContext, id, payload, this.logger);
      return {
        audienceId: "1234",
        status: "ok"
      } as core.ExternalSegmentConnectionPluginResponse;
    } catch (e) {
      return {
        status: e.status || "external_segment_not_ready_yet", // external segment not yet ready  => search error in SDK
        message: e.message || e
      };
    }
  }

  protected async onUserSegmentUpdate(
    request: core.UserSegmentUpdateRequest,
    instanceContext: IExampleAudienceFeedConnectorConnectorInstanceContext
  ): Promise<core.UserSegmentUpdatePluginResponse> {
    try {
      if (!instanceContext.audience_feed_id)
        throw new Error(`Can't find Audience ID`);
      const identifiersEmail: core.UserEmailIdentifierInfo[] = <
        core.UserEmailIdentifierInfo[]
      >request.user_identifiers.filter(
        (identifier: core.UserIdentifierInfo) =>
          (identifier.type = "USER_EMAIL")
      );

      if (identifiersEmail.length > 0) {
        const payload = identifiersEmail[0].hash;
      }
      const id = instanceContext.audience_feed_id;
      
      await getAllSegments(id);
      const payload = "mics@dev.com";
      this.logger.debug(`Audience Id Saved on creation : ${request.feed_id}`);
      await pushEmailsAudience(instanceContext, id, payload, this.logger);
      return {
        status: "ok"
      } as core.UserSegmentUpdatePluginResponse;
    } catch (e) {
      return {
        status: e.status || "error",
        message: e.message || e
      };
    }
  }

  private getExampleAudienceFeedAudienceId(
    baseInstanceContext: core.AudienceFeedConnectorBaseInstanceContext,
    feed_id: string
  ): string {
    const exampleAudienceFeedAudienceId = baseInstanceContext.feedProperties.findStringProperty(
      EXAMPLEAUDIENCEFEED_AUDIENCE_ID_PROPERTY_ID
    );
    if (
      !exampleAudienceFeedAudienceId ||
      !exampleAudienceFeedAudienceId.value ||
      exampleAudienceFeedAudienceId.value.value === undefined
    ) {
      throw new Error(
        `Feed: ${feed_id} - Missing ${EXAMPLEAUDIENCEFEED_AUDIENCE_ID_PROPERTY_ID} property`
      );
    }
    return exampleAudienceFeedAudienceId.value.value as string;
  }

  private getExampleAudienceFeedAudienceName(
    baseInstanceContext: core.AudienceFeedConnectorBaseInstanceContext,
    feed_id: string
  ): string {
    const exampleAudienceFeedAudienceName = baseInstanceContext.feedProperties.findStringProperty(
      EXAMPLEAUDIENCEFEED_AUDIENCE_NAME_PROPERTY_NAME
    );
    if (
      !exampleAudienceFeedAudienceName ||
      !exampleAudienceFeedAudienceName.value ||
      exampleAudienceFeedAudienceName.value.value === undefined
    ) {
      throw new Error(
        `Feed: ${feed_id} - Missing ${EXAMPLEAUDIENCEFEED_AUDIENCE_NAME_PROPERTY_NAME} property`
      );
    }
    return exampleAudienceFeedAudienceName.value.value as string;
  }

  private getApiKey(
    baseInstanceContext: core.AudienceFeedConnectorBaseInstanceContext,
    feed_id: string
  ): string {
    const apiKey = baseInstanceContext.feedProperties.findStringProperty(
      API_KEY_PROPERTY_NAME
    );
    if (!apiKey || !apiKey.value || apiKey.value.value === undefined) {
      throw new Error(
        `Feed: ${feed_id} - Missing ${API_KEY_PROPERTY_NAME} property`
      );
    }
    return apiKey.value.value as string;
  }
}
