import { UpdateType } from '../../plugin/audiencefeedconnector/AudienceFeedConnectorRequestInterface';

export interface BatchUpdateContext {
  endpoint: string;
  grouping_key: string;
}

export interface BatchUpdateRequest<C extends BatchUpdateContext, T> {
  batch_content: T[];
  ts: number;
  context: C;
}
export interface BatchUpdatePluginResponse {
  status: BatchUpdatePluginResponseStatus;
  message?: string;
  next_msg_delay_in_ms?: number;
  stats: BatchUpdatePluginResponseStat[];
}

export interface BatchUpdatePluginResponseStat {
  successes: number;
  errors: number;
  operation: UpdateType | 'UNKNOWN';
}

export type BatchUpdatePluginResponseStatus = 'OK' | 'ERROR' | 'RETRY';
