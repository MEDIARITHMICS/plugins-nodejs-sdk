import { DataResponse, DropResponse } from '../../api/core/common/Response';
import { UserActivity, UserVisitActivity } from '../../index';

export type ActivityAnalyzerResponse = DataResponse<ActivityAnalyzer>;

export interface ActivityAnalyzer {
  id: string;
  organisation_id: string;
  name: string;
  group_id: string;
  artifact_id: string;
  visit_analyzer_plugin_id: number;
}

export interface ActivityAnalyzerRequest {
  activity_analyzer_id: string;
  datamart_id: string;
  activity: UserActivity;
}

export interface VisitAnalyzerRequest extends ActivityAnalyzerRequest {
  activity: UserVisitActivity;
}

export type ActivityAnalyzerPluginResponse = DataResponse<UserActivity> | DropResponse;

/** Discards the analyzed activity: the platform does not ingest it, does not treat the call as an error, and
 * does not call the activity analyzers chained after this one on the channel.
 */
export const dropActivity = (): DropResponse => ({ status: 'drop' });

export const isDroppedActivity = (response: ActivityAnalyzerPluginResponse): response is DropResponse =>
  response.status === 'drop';
