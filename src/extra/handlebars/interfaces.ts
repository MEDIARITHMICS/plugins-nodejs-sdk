import { AdRendererRequest, ClickUrlInfo, ItemProposal } from '../../mediarithmics';

// Handlebar Context for URLs (not all macros are available)
export interface URLHandlebarsRootContext {
  REQUEST: AdRendererRequest;
  CREATIVE: HandlebarsRootContextCreative;
  // Viewability TAGs specific
  IAS_CLIENT_ID?: string;
  // Main mediarithmics macros
  ORGANISATION_ID: string;
  AD_GROUP_ID?: string;
  MEDIA_ID?: string;
  ENCODED_MEDIA_ID?: string;
  CAMPAIGN_ID?: string;
  CREATIVE_ID: string;
  CACHE_BUSTER: string;
  CB: string;
}

// Handlebar Context for the Template - without recommandations
export interface HandlebarsRootContext extends URLHandlebarsRootContext {
  ENCODED_CLICK_URL: string;
  CLICK_URL: string;
  ADDITIONAL_HTML?: string;
}

// Handlebar Context for the Template - with recommendations
export interface RecommendationsHandlebarsRootContext extends HandlebarsRootContext {
  private: {
    redirectUrls: ClickUrlInfo[];
    clickableContents: ClickableContent[];
  };
  RECOMMENDATIONS: ItemProposal[];
}

export interface ClickableContent {
  item_id?: string;
  catalog_token: string;
  $content_id: number;
}

export interface HandlebarsRootContextCreative {
  CLICK_URL?: string;
  WIDTH: string;
  HEIGHT: string;
}
