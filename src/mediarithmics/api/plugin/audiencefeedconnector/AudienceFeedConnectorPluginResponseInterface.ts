export type AudienceFeedConnectorStatus = 'ok' | 'error';
export declare type AudienceFeedConnectorConnectionStatus =
  | 'ok'
  | 'error'
  | 'external_segment_not_ready_yet';
export type AudienceFeedConnectorContentType =
  | 'text/csv'
  | 'application/json'
  | 'text/plain';

export interface ExternalSegmentCreationPluginResponse {
  status: AudienceFeedConnectorStatus;
  message?: string;
  visibility?: 'private' | 'public';
}

export interface ExternalSegmentConnectionPluginResponse {
  status: AudienceFeedConnectorConnectionStatus;
  message?: string;
}

export interface UserSegmentUpdatePluginResponse {
  status: AudienceFeedConnectorStatus | 'retry';
  data?: UserSegmentUpdatePluginResponseData[];
  stats?: UserSegmentUpdatePluginResponseStats[];
  message?: string;
  nextMsgDelayInMs?: number;
}

export interface UserSegmentUpdatePluginResponseData {
  destination_token?: string;
  grouping_key?: string;
  content?: string;
  binary_content?: BinaryType;
}

type SyncResult =
  | 'PROCESSED'
  | 'FAILURE'
  | 'NO_ELIGIBLE_IDENTIFIER'
  | 'SUCCESS';

export interface UserSegmentUpdatePluginResponseStats {
  identifier?: string;
  sync_result?: SyncResult;
  tags?: { key: string; value: string };
}
