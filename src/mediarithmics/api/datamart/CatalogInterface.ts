import { DataListResponse } from '../core/common/Response';

export type CatalogResponse = DataListResponse<Catalog>;

export interface Catalog {
  id: string;
  editor_id: string;
  datamart_id: string;
  locale: string;
  currency: string;
  token: string;
  creation_ts: string;
}
