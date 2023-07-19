import { StatusCode } from '../../core/common/Response';

export type AudienceFeedConnectorStatus = 'ok' | 'error' | 'retry' | 'no_eligible_identifier';
export declare type AudienceFeedConnectorConnectionStatus = 'ok' | 'error' | 'external_segment_not_ready_yet';
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
