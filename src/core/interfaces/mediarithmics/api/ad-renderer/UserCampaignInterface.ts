import { UserIdentifierInfo } from "../../../../index";

export interface UserCampaignResource {
    user_account_id: string;
    user_agent_ids: Array<string>;
    databag: string;
    user_identifiers: UserIdentifierInfo[];
}
