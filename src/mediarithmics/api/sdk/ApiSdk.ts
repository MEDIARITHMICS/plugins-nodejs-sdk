import {HttpClient} from './HttpClient';
import {Compartment, DataListResponse, Datamart} from '../../index';
import * as winston from 'winston';
import {core} from '../../../index';

const mapData = <T = any>(_: core.DataResponse<T>): T => _.data;

export class ApiSdk {

  constructor(
    baseURL: string = 'https://api.mediarithmics.com',
    public logger: () => winston.Logger,
    public client: HttpClient = new HttpClient(baseURL, logger, undefined)
  ) {
  }

  readonly fetchDatamarts = async (apiToken: string, organisationId: string): Promise<DataListResponse<Datamart>> => {
    return this.client.get(`/v1/datamarts`, {qs: {organisation_id: organisationId, allow_administrator: 'false'}});
  };

  readonly fetchDatamartCompartments = async (apiToken: string, datamartId: string): Promise<DataListResponse<Compartment>> => {
    return this.client.get(`/v1/datamarts/${datamartId}/user_account_compartments`);
  };
}