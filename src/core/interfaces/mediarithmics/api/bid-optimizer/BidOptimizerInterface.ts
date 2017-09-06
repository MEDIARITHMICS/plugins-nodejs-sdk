export interface BidOptimizerResponse {
    status: string;
    data: BidOptimizer;
    count: number;
}

export interface BidOptimizer {
    id: string;
    organisation_id: string;
    name: string;
    group_id: string;
    engine_artifact_id: string;
    engine_version_id: number;
    engine_group_id: string;
}