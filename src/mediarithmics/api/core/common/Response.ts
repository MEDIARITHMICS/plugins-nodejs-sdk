export type StatusCode = 'ok' | 'error';

export interface SimpleResponse {
  status: StatusCode;
}

export interface DataResponse<T> extends SimpleResponse {
  data: T;
}

export interface DropResponse {
  status: 'drop';
}

export interface DataListResponse<T> extends SimpleResponse {
  data: T[];
  count: number;
  first_result?: number;
  max_results?: number;
  total?: number;
}
