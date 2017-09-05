import { Creative } from "../api/CreativeInterface";
import { CreativeProperty } from "../api/CreativePropertyInterface";
import { ActivityAnalyzer } from "../api/ActivityAnalyzerInterface";
import { ActivityAnalyzerProperty } from "../api/ActivityAnalyzerPropertyInterface";

// AdRenderer Instance Contexts
export interface AdRendererBaseInstanceContext {
  creative: Creative;
  creativeProperties: CreativeProperty[];
}

export interface ActivityAnalyzerBaseInstanceContext {
  activityAnalyzer: ActivityAnalyzer;
  activityAnalyzerProperties: ActivityAnalyzerProperty[];
}

export interface AdRendererRecoTemplateInstanceContext
  extends AdRendererBaseInstanceContext {
  recommender_id: string;
  creative_click_url: string;
  ad_layout_id: string;
  ad_layout_version: string;
  // Raw template to be compiled
  template: any;
  // Compiled tempalte
  compiled_template?: any;
}
