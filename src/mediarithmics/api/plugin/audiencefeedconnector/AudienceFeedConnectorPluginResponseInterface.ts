export type AudienceFeedConnectorStatus = 'ok' | 'error';
export declare type AudienceFeedConnectorConnectionStatus = 'ok' | 'error' | 'external_segment_not_ready_yet';
export type AudienceFeedConnectorContentType = 'text/csv' | 'application/json' | 'text/plain';

export interface UserSegmentUpdatePluginResponse {
  status: DeliveredDataPluginResponseStatus;
  data?: DeliveryType[];
  stats?: UserSegmentUpdatePluginResponseStats[];
  message?: string;
  nextMsgDelayInMs?: number;
}

export type DeliveryType = UserSegmentUpdatePluginFileDeliveryResponseData | UserSegmentUpdatePluginBatchDeliveryResponseData;

export interface UserSegmentUpdatePluginResponseData {
  destination_token?: string;
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

type SyncResult = 'PROCESSED' | 'SUCCESS' | 'REJECTED';

export interface UserSegmentUpdatePluginResponseStats {
  identifier: string;
  sync_result: SyncResult;
  tags?: AudienceFeedStatTag[];
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

export interface AudienceFeedStatTag {
  key: string;
  value: string;
}

export interface BatchUpdateRequest<T> {
  batch_content: T[];
  ts: number;
  context: AudienceFeedBatchContext;
}

export interface AudienceFeedBatchContext {
  endpoint: string;
  feed_id: string;
  feed_session_id: string;
  segment_id: string;
  datamart_id:string;
}

export interface BatchUpdatePluginResponse {
  status: DeliveredDataPluginResponseStatus;
  message?: string;
  nextMsgDelayInMs?: number;
}

export type DeliveredDataPluginResponseStatus = AudienceFeedConnectorStatus | 'retry' | 'no_eligible_identifier';