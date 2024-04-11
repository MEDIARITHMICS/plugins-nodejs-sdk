import { BatchUpdateContext } from '../../core/batchupdate/BatchUpdateInterface';
import { UserIdentifierInfo } from '../../reference/UserIdentifierInterface';

export type UpdateType = 'UPSERT' | 'DELETE';

export interface UserSegmentUpdateRequest {
  feed_id: string;
  session_id: string;
  datamart_id: string;
  segment_id: string;
  user_identifiers: UserIdentifierInfo[];
  ts: number;
  operation: UpdateType;
}

export interface ExternalSegmentConnectionRequest {
  feed_id: string;
  datamart_id: string;
  segment_id: string;
}

export interface ExternalSegmentCreationRequest {
  feed_id: string;
  datamart_id: string;
  segment_id: string;
}

export interface AudienceFeedBatchContext extends BatchUpdateContext {
  endpoint: string;
  feed_id: string;
  feed_session_id: string;
  segment_id: string;
  datamart_id: string;
  grouping_key: string;
}

export const ExternalSegmentTroubleshootActions = ['FETCH_DESTINATION_AUDIENCE'] as const;
export type ExternalSegmentTroubleshootAction = (typeof ExternalSegmentTroubleshootActions)[number];

type ExternalSegmentTroubleshootBaseRequest = {
  feed_id: string;
  datamart_id: string;
  segment_id: string;
};

export type TroubleshootActionFetchDestinationAudience = ExternalSegmentTroubleshootBaseRequest & {
  action: 'FETCH_DESTINATION_AUDIENCE';
};

// This comment is just to have an example when an action with args will be implemented
//
// export type TroubleshootActionWithArgs = ExternalSegmentTroubleshootBaseRequest & {
//   action: 'ACTION_WITH_ARGS';
//   args: {}; // Put args for specific action
// };

export type ExternalSegmentTroubleshootRequest = TroubleshootActionFetchDestinationAudience; // | TroubleshootActionWithArgs;
