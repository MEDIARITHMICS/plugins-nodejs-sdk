export type AudienceFeedConnectorStatus = 'ok' | 'error';
export declare type AudienceFeedConnectorConnectionStatus = 'ok' | 'error' | 'external_segment_not_ready_yet';
export type AudienceFeedConnectorContentType = 'text/csv' | 'application/json' | 'text/plain';

export interface UserSegmentUpdatePluginResponse {
  status: AudienceFeedConnectorStatus | 'retry';
  data?: DeliveryType[];
  stats?: UserSegmentUpdatePluginResponseStats[];
  message?: string;
  nextMsgDelayInMs?: number;
}

export type DeliveryType = UserSegmentUpdatePluginFileDeliveryResponseData | UserSegmentUpdatePluginBatchDeliveryResponseData;

export interface UserSegmentUpdatePluginFileDeliveryResponseData extends UserSegmentUpdatePluginResponseData {
  type: 'FILE_DELIVERY';
  destination_token?: string;
}

export interface UserSegmentUpdatePluginBatchDeliveryResponseData extends UserSegmentUpdatePluginResponseData {
  type: 'BATCH_DELIVERY';
  batch_token?: string;
}

type SyncResult = 'PROCESSED' | 'FAILURE' | 'NO_ELIGIBLE_IDENTIFIER' | 'SUCCESS';

export interface UserSegmentUpdatePluginResponseStats {
  identifier?: string;
  sync_result?: SyncResult;
  tags?: { key: string; value: string };
}

export interface ExternalSegmentCreationPluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
  visibility?: 'PRIVATE' | 'PUBLIC';
}

export interface ExternalSegmentConnectionPluginResponse {
  status: AudienceFeedConnectorConnectionStatus;
  message?: string;
}

export interface UserSegmentUpdatePluginResponseData {
  destination_token?: string;
  grouping_key?: string;
  content?: string;
  binary_content?: BinaryType;
}
