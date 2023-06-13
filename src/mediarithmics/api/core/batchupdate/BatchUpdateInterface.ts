
export interface BatchUpdateContext {
    endpoint: string;
    grouping_key: string;
}

export interface BatchUpdateRequest<C extends BatchUpdateContext, T> {
    batch_content: T[];
    ts: number;
    context: C;
}
export interface BatchUpdatePluginResponse {
    status: BatchUpdatePluginResponseStatus;
    message?: string;
    next_msg_delay_in_ms?: number;
}

export type BatchUpdatePluginResponseStatus = 'OK' | 'ERROR' | 'RETRY';
