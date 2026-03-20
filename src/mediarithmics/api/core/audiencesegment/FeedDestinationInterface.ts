import { DataResponse } from '../common/Response';

export type TenantCredentialsScheme = 'OAUTH2' | 'API_TOKEN' | 'LOGIN_PASSWORD';

export interface FeedDestinationCredentials {
  scheme: TenantCredentialsScheme;
  credentials: Record<string, unknown>;
}

export type FeedDestinationCredentialsResponse = DataResponse<FeedDestinationCredentials>;
