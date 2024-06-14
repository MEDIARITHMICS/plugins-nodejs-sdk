export interface DeviceIdRegistryResource {
  id: string;
  token: string;
  name: string;
  description: string;
  drop_before_reduction: boolean;
  type: DeviceIdRegistryType;
  image_uri?: string;
  organisation_id: string;
  creation_ts: number;
  last_modified_ts?: number;
  created_by: string;
  last_modified_by?: string;
}
export interface DeviceIdRegistryDatamartSelectionResource {
  id: string;
  device_id_registry_id: string;
  datamart_id: string;
  triggers_device_point_merge: boolean;
  creation_ts: number;
  created_by: string;
  last_modified_ts: number;
  last_modified_by: string;
}

export type DeviceIdRegistryType =
  | 'MUM_ID'
  | 'MOBILE_ADVERTISING_ID'
  | 'MOBILE_VENDOR_ID'
  | 'INSTALLATION_ID'
  | 'CUSTOM_DEVICE_ID'
  | 'NETWORK_DEVICE_ID'
  | 'TV_ADVERTISING_ID';
