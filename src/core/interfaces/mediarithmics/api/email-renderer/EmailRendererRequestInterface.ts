import { EmailRenderingContext, UserPointIdentifierInfo, UserEmailIdentifierInfo, UserAccountIdentifierInfo, UserAgentIdentifierInfo } from "../../../../index";

export interface EmailRenderRequest {
  email_renderer_id: string;
  call_id: string;
  context: EmailRenderingContext;
  creative_id: string;
  campaign_id: string;
  campaign_technical_name?: string;
  user_identifiers: (UserPointIdentifierInfo | UserEmailIdentifierInfo | UserAccountIdentifierInfo | UserAgentIdentifierInfo)[];
  user_data_bag: any;
  click_urls: string[];
  email_tracking_url: string;
}