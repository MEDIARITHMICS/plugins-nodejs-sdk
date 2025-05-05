import { RealmFilter, isWebDomainRealmFilter } from '../../core/webdomain/UserAgentIdentifierRealmSelectionInterface';

export type AudienceFeedConnectorStatus = 'ok' | 'error' | 'retry' | 'no_eligible_identifier';
export declare type AudienceFeedConnectorConnectionStatus = 'ok' | 'error' | 'external_segment_not_ready_yet';
export declare type AudienceFeedConnectorTroubleshootStatus = 'ok' | 'error' | 'not_implemented';
export declare type AudienceFeedConnectorAuthenticationStatus =
  | 'authenticated'
  | 'not_authenticated'
  | 'error'
  | 'not_implemented';
export declare type AudienceFeedAuthenticationStatus = 'ok' | 'error' | 'not_implemented';
export declare type AudienceFeedConnectorDynamicPropertyValuesQueryStatus = 'ok' | 'error' | 'not_implemented';
export type AudienceFeedConnectorContentType = 'text/csv' | 'application/json' | 'text/plain';

export interface UserSegmentUpdatePluginResponse {
  status: AudienceFeedConnectorStatus;
  data?: UserSegmentUpdatePluginFileDeliveryResponseData[];
  stats?: UserSegmentUpdatePluginResponseStats[];
  message?: string;
  next_msg_delay_in_ms?: number;
}

export interface BatchedUserSegmentUpdatePluginResponse<T> {
  status: AudienceFeedConnectorStatus;
  data?: UserSegmentUpdatePluginBatchDeliveryResponseData<T>[];
  stats?: UserSegmentUpdatePluginResponseStats[];
  message?: string;
  next_msg_delay_in_ms?: number;
}

export type DeliveryType<T> =
  | UserSegmentUpdatePluginFileDeliveryResponseData
  | UserSegmentUpdatePluginBatchDeliveryResponseData<T>;

export interface UserSegmentUpdatePluginFileDeliveryResponseData
  extends UserSegmentUpdatePluginDeliveryContent<string> {
  type: 'FILE_DELIVERY';
  destination_token: string;
}

export interface UserSegmentUpdatePluginBatchDeliveryResponseData<T> extends UserSegmentUpdatePluginDeliveryContent<T> {
  type: 'BATCH_DELIVERY';
}

export interface UserSegmentUpdatePluginDeliveryContent<T> {
  content: T;
  grouping_key: string;
}

type SyncResult = 'PROCESSED' | 'SUCCESS' | 'REJECTED';

export interface UserSegmentUpdatePluginResponseStats {
  identifier: string;
  sync_result: SyncResult;
  tags?: AudienceFeedStatTag[];
}

export interface ExternalSegmentCreationPluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
  visibility?: Visibility;
}

export interface ExternalSegmentConnectionPluginResponse {
  status: AudienceFeedConnectorConnectionStatus;
  message?: string;
}

export interface ExternalSegmentTroubleshootResponse {
  status: AudienceFeedConnectorTroubleshootStatus;
  message?: string;
  data?: any;
}

export interface ExternalSegmentAuthenticationStatusQueryResponse {
  status: AudienceFeedConnectorAuthenticationStatus;
  message?: string;
  data?: {
    login_url?: string;
    [key: string]: any;
  };
}

export interface ExternalSegmentAuthenticationResponse {
  status: AudienceFeedAuthenticationStatus;
  message?: string;
}

export interface ExternalSegmentDynamicPropertyValuesQueryResponse {
  status: AudienceFeedConnectorDynamicPropertyValuesQueryStatus;
  message?: string;
  data?: {
    property_technical_name: string;
    enum: { label: string; value: string }[];
    [key: string]: any;
  }[];
}

export interface AudienceFeedStatTag {
  key: string;
  value: string;
}

export type Visibility = 'PRIVATE' | 'PUBLIC';

export class AudienceFeedInstanceContextError extends Error {
  public visibility: Visibility = 'PUBLIC';

  constructor(public message: string) {
    super();
  }
}

export class MissingConfigurationPropertyError extends AudienceFeedInstanceContextError {
  public log: string;

  constructor(
    public feed_id: string,
    public property_name: string,
  ) {
    super(
      'Invalid technical configuration - It seems your audience feed has not been configured correctly. Please contact your support with the provided error id.',
    );
    this.log = `Missing configuration property: ${property_name}`;
  }
}

export class MandatoryPropertyValueError extends AudienceFeedInstanceContextError {
  public log: string;

  constructor(
    public feed_id: string,
    public property_name: string,
  ) {
    super(`${property_name} is a mandatory property. Please provide it when creating the feed.`);
    this.log = `Mandatory property: ${property_name}`;
  }
}

export class InvalidPropertyValueError extends AudienceFeedInstanceContextError {
  public log: string;

  constructor(
    public feed_id: string,
    public property_name: string,
    public property_value: string,
    public allowed: string[],
  ) {
    super(
      `${property_value} is an invalid value for ${property_name} property. Only one of the following can be used: ${allowed.join(
        ',',
      )}. Please select a valid value when creating the feed.`,
    );
    this.log = `Invalid value ${property_value} for ${property_name} property `;
  }
}

export class FileDownloadError extends AudienceFeedInstanceContextError {
  public log: string;

  constructor(
    public feed_id: string,
    public file_name: string,
  ) {
    super('Error downloading configuration file, please contact your support with the provided error id.');
    this.log = `Error while fetching file: ${file_name}`;
  }
}

export class MissingRealmError extends AudienceFeedInstanceContextError {
  public log: string;

  constructor(
    public datamart_id: string,
    public realmFilter: RealmFilter,
  ) {
    super(
      'Invalid technical configuration - It seems your audience feed has not been configured correctly. Please contact your support with the provided error id.',
    );
    this.log = `No user agent identifier realm selection of type ${realmFilter.realmType}${
      isWebDomainRealmFilter(realmFilter) ? ` with sld_name ${realmFilter.sld_name} ` : ' '
    }was found in datamart ${datamart_id}`;
  }
}
