import { core } from '@mediarithmics/plugins-nodejs-sdk';
import * as winston from 'winston';

export type ExampleAudienceFeedContext = {
  test: string;
} & core.AudienceFeedConnectorBaseInstanceContext;

export type BatchLine = {
  uuid: string;
  user_list: number;
};

export class LoggerWrapper {
  public static logger: winston.Logger;
}

const CONFIG_FILE_NAME = 'configuration';

// Beware as this is a singleton
export class ExampleAudienceFeed extends core.BatchedAudienceFeedConnectorBasePlugin<BatchLine> {
  constructor() {
    super();
    LoggerWrapper.logger = this.logger;
    // This is only for test in production you don't want debug by default
    LoggerWrapper.logger.level = 'debug';
  }

  protected async instanceContextBuilder(feedId: string) {
    const baseInstanceContext = await super.instanceContextBuilder(feedId);

    // How to check realm configuration, it will automatically throw an error
    // this.checkUserAgentIdentifierRealm('api:xxx', '1', { realmType: 'WEB_DOMAIN', sld_name: 'test.com' });

    // If you need to check a property in an enum/union type/...
    // throw new core.InvalidPropertyValueError(feedId, 'my_property', 'TATO', ['TOTO', 'TATA']);

    const configFile = this.fetchConfigurationFile(CONFIG_FILE_NAME)
      .then((file) => {
        // throw new core.MissingConfigurationPropertyError(feedId, 'config_option');
      })
      .catch((error) => {
        const message = `Error fetching config file ${CONFIG_FILE_NAME}`;
        LoggerWrapper.logger.error(message, error);
        // For error on file download, use FileDownloadError as it will generate a generic message to the end user
        throw new core.FileDownloadError(feedId, CONFIG_FILE_NAME);
      });

    // If you want a customized message for the end user you can use AudienceFeedInstanceContextError
    // throw new core.AudienceFeedInstanceContextError('Example public message');

    return {
      test: 'test',
      ...baseInstanceContext,
    };
  }

  protected onExternalSegmentCreation(
    request: core.ExternalSegmentCreationRequest,
    instanceContext: ExampleAudienceFeedContext,
  ): Promise<core.ExternalSegmentCreationPluginResponse> {
    const response: core.ExternalSegmentCreationPluginResponse = {
      status: 'ok',
      message: 'test_creation',
      visibility: 'PUBLIC',
    };
    return Promise.resolve(response);
  }
  protected onExternalSegmentConnection(
    request: core.ExternalSegmentConnectionRequest,
    instanceContext: ExampleAudienceFeedContext,
  ): Promise<core.ExternalSegmentConnectionPluginResponse> {
    const response: core.ExternalSegmentConnectionPluginResponse = {
      status: 'ok',
      message: 'test_connection',
    };
    return Promise.resolve(response);
  }
  protected onUserSegmentUpdate(
    request: core.UserSegmentUpdateRequest,
    instanceContext: ExampleAudienceFeedContext,
  ): Promise<core.BatchedUserSegmentUpdatePluginResponse<BatchLine>> {
    const data: core.UserSegmentUpdatePluginBatchDeliveryResponseData<BatchLine>[] = request.user_identifiers.flatMap(
      (id) => {
        switch (id.type) {
          case 'USER_POINT':
            return [
              {
                type: 'BATCH_DELIVERY',
                content: { uuid: (id as core.UserPointIdentifierInfo).user_point_id, user_list: 123 },
                grouping_key: request.operation,
              },
            ];
          default:
            return [];
        }
      },
    );

    const stats: core.UserSegmentUpdatePluginResponseStats[] = request.user_identifiers
      .filter((i: core.UserIdentifierInfo): i is core.UserPointIdentifierInfo => i.type === 'USER_POINT')
      .map((up): core.UserSegmentUpdatePluginResponseStats => {
        return {
          identifier: up.user_point_id,
          sync_result: 'PROCESSED',
        };
      });

    const response: core.BatchedUserSegmentUpdatePluginResponse<BatchLine> = {
      status: 'ok',
      message: 'test_update',
      data,
      stats,
    };

    return Promise.resolve(response);
  }

  protected onBatchUpdate(
    request: core.BatchUpdateRequest<core.AudienceFeedBatchContext, BatchLine>,
    instanceContext: ExampleAudienceFeedContext,
  ): Promise<core.BatchUpdatePluginResponse> {
    const response: core.BatchUpdatePluginResponse = {
      status: 'OK',
      message: 'test_batch_update',
      sent_items_in_success: request.batch_content.length,
      sent_items_in_error: 0,
    };
    return Promise.resolve(response);
  }

  protected onTroubleshoot(
    request: core.TroubleshootActionFetchDestinationAudience,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentTroubleshootResponse> {
    switch (request.action) {
      case 'FETCH_DESTINATION_AUDIENCE':
        // here make your external call to fetch the audience
        return Promise.resolve({ id: '1', name: 'myExternalAudience' })
          .then((destinationAudience) => {
            return {
              status: 'ok',
              message: 'Here is the destination audience!',
              data: destinationAudience,
            } as core.ExternalSegmentTroubleshootResponse;
          })
          .catch((error) => {
            LoggerWrapper.logger.error('Error while fetching destination audience', error);
            return { status: 'error', message: 'Destination audience not found!' };
          });
      default:
        return Promise.resolve({ status: 'not_implemented' });
    }
  }

  protected onAuthenticationStatus(
    request: core.ExternalSegmentAuthenticationStatusRequest,
  ): Promise<core.ExternalSegmentAuthenticationStatusResponse> {
    return Promise.resolve({ status: 'authenticated' });
  }


  protected onDynamicPropertyValues(
    request: core.ExternalSegmentDynamicPropertyValuesRequest
  ): Promise<core.ExternalSegmentDynamicPropertyValuesResponse> {
    return Promise.resolve({
      status: 'ok',
      data:[]
    });
  }
}
