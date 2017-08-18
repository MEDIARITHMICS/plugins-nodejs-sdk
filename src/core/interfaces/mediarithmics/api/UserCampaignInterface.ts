import { UserIdentifierInfo } from "./UserIdentifierInterface";

export interface UserCampaignResource {
    user_account_id: string;
    user_campaign_id: string;
    user_agent_ids: Array<string>;
    databag: string;
    start_date: number;//Date
    organisation_id: number;
    campaign_id: number;
    ad_group_id: number;
    last_modified: number;//Date
    stopped: boolean;
    next_bid_price: number;
    total_impression_count: number;
    last_day_impression_count: number;
    total_click_count: number;
    last_day: number;//Date
    total_lost_bid_count: number;
}
