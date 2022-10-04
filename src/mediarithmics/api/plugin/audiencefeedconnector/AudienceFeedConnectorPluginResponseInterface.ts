export type AudienceFeedConnectorStatus = 'ok' | 'error' | 'retry';
export type AudienceFeedConnectorContentType = 'text/csv' | 'application/json' | 'text/plain';
export type DeliveryType = UserSegmentUpdatePluginFileDeliveryResponseData | UserSegmentUpdatePluginBatchDeliveryResponseData;
export declare type AudienceFeedConnectorConnectionStatus = 'ok' | 'error' | 'external_segment_not_ready_yet';

export interface AudienceFeedConnectorPluginResponse {
  status: AudienceFeedConnectorStatus;
  data?: DeliveryType[];
  stats?: UserSegmentUpdatePluginResponseStats[];
  message?: string;
}

export interface ExternalSegmentCreationPluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
}

export interface ExternalSegmentConnectionPluginResponse {
  status: AudienceFeedConnectorConnectionStatus;
  message?: string;
}

export interface UserSegmentUpdatePluginResponse {
  status: AudienceFeedConnectorStatus;
  data?: DeliveryType[];
  stats?: UserSegmentUpdatePluginResponseStats[];
  message?: string;
  nextMsgDelayInMs?: number;
}

export interface UserSegmentUpdatePluginResponseData {
  grouping_key?: string;
  content?: string;
  binary_content?: BinaryType;
}

export interface UserSegmentUpdatePluginFileDeliveryResponseData extends UserSegmentUpdatePluginResponseData {
  type: 'FILE_DELIVERY';
  destination_token?: string;
}

export interface UserSegmentUpdatePluginBatchDeliveryResponseData extends UserSegmentUpdatePluginResponseData {
  type: 'BATCH_DELIVERY';
  batch_token?: string;
}

export interface UserSegmentUpdatePluginResponseStats {
  identifier?: string;
  sync_result?: string;
  tags?: any;
}
