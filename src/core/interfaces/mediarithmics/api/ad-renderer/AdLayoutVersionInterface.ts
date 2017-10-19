import { ResponseData } from "../common/Response";

export interface AdLayoutVersion {
  id: string;
  version_id: string;
  creation_date: number;
  filename: string;
  template: string;
  ad_layout_id: string;
  status: string;
}

export type AdLayoutVersionResponse = ResponseData<AdLayoutVersion>;