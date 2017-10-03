import { ResponseData } from "../common/Response";

export interface ActivityAnalyzer {
  id: string;
  organisation_id: string;
  name: string;
  group_id: string;
  artifact_id: string;
  visit_analyzer_plugin_id: number;
}

export type ActivityAnalyzerResponse = ResponseData<ActivityAnalyzer>;