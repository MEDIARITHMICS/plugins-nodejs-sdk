import { DataListResponse } from '../common/Response';

export type RealmType = 'MEDIARITHMICS' | 'MOBILE' | 'WEB_DOMAIN' | 'GOOGLE_OPERATOR' | 'APP_NEXUS_OPERATOR' | 'ETAG';

export interface WebDomainResource {
  id: string;
  organisation_id: string;
  name: string;
  sld_name: string;
  token?: string;
  user_id_key?: string;
  user_id_max_age?: number;
  auto_create_cookie?: boolean;
  cookie_matching?: boolean;
  cookie_matching_out?: string;
  private_key?: string;
  tcf_vendor_id?: number;
  enable_tcf_on_get_user_agent_id?: boolean;
  enable_tcf_on_set_user_agent_id?: boolean;
}

export interface UserAgentIdentifierRealmSelectionResource {
  id: string;
  datamart_id: string;
  realm_type: RealmType;
  matching?: boolean;
  url?: string;
  web_domain: WebDomainResource;
}

export type UserAgentIdentifierRealmSelectionResourcesResponse =
  DataListResponse<UserAgentIdentifierRealmSelectionResource>;

interface AbstractRealmFilter {
  realmType: RealmType;
}

export interface WebDomainRealmFilter extends AbstractRealmFilter {
  realmType: 'WEB_DOMAIN';
  sld_name: string;
}

export interface OtherRealmFilter extends AbstractRealmFilter {
  realmType: 'MEDIARITHMICS' | 'MOBILE' | 'GOOGLE_OPERATOR' | 'APP_NEXUS_OPERATOR' | 'ETAG';
}

export type RealmFilter = WebDomainRealmFilter | OtherRealmFilter;

export const isWebDomainRealmFilter = (filter: RealmFilter): filter is WebDomainRealmFilter => {
  return filter.realmType === 'WEB_DOMAIN';
};
