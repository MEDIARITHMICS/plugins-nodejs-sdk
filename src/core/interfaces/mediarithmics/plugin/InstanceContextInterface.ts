import {
  BidOptimizer,
  Creative,
  ActivityAnalyzer,
  PluginProperty
} from "../../../index";
import { EmailRouteur } from "../api/email-routeur/EmailRouteurInterface";

export interface AdRendererBaseInstanceContext {
  creative: Creative;
  creativeProperties: PluginProperty[];
}

export interface EmailRendererBaseInstanceContext {
  creative: Creative;
  creativeProperties: PluginProperty[];
}

export interface EmailRouteurBaseInstanceContext {
  routeurProperties: PluginProperty[];
}

export interface ActivityAnalyzerBaseInstanceContext {
  activityAnalyzer: ActivityAnalyzer;
  activityAnalyzerProperties: PluginProperty[];
}

export interface BidOptimizerBaseInstanceContext {
  bidOptimizer: BidOptimizer;
  bidOptimizerProperties: PluginProperty[];
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
