export interface ComputedFieldResource {
  id: string;
  organisation_id: string;
  datamart_id: string;
  group_id: string;
  artifact_id: string;
  plugin_id: string;
  version_id: string;
  status: ComputedFieldStatus;
  technical_name: string;
  name: string;
  filter_graphql_query: string;
  cache_max_duration: number;
  last_periodic_evaluation_ts?: number;
  version_value: string;
  description?: string;
  created_ts: number;
  created_by: string;
  archived: boolean;
}

export type ComputedFieldStatus = 'ACTIVE' | 'PAUSED' | 'INITIAL_LOADING' | 'INITIAL';