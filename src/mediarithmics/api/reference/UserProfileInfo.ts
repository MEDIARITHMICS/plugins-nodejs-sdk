export interface UserProfileInfo {
  $compartment_id: string;
  $creation_ts: number;
  $last_modified_ts: number;
  $user_account_id?: string;
  $expiration_ts?: number;
  [key: string]: unknown;
}
