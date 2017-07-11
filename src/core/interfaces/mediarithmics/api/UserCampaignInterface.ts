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

export interface RecommenderRequest {
    recommender_id: string;
    datamart_id: string;
    user_identifiers:Array<>

    //Customizable
    [propsName: string]: any;
}

export type ProposalType =
    'ITEM_PROPOSAL' |
    'PRODUCT_PROPOSAL' |
    'CATEGORY_PROPOSAL' |
    'CONTENT_PROPOSAL'


export interface Proposal {
    type: ProposalType;
    $id?: string;
    $gid?: string;

    //Customizable
    [propsName: string]: any;
}

export interface ProductProposal extends Proposal {
    $price?: number;
    $salePrice?: number;
    $discountPercentage?:number;
    $currency?:string;
}

export interface ItemProposal extends ProductProposal {
    $name?:string;
    $brand?:string;
    $url?:string;
    $description?:string;
    $imageUrl?:string;
}