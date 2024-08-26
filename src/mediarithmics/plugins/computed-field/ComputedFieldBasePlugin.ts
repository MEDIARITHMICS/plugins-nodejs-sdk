import { BasePlugin } from '../common/BasePlugin';
import * as ion from 'ion-js';
import express from 'express';

export type OnUpdatePluginStatus = 'ok' | 'error';

export interface PluginResponse {
  status: OnUpdatePluginStatus;
}
export interface OnUpdatePluginResponse<D> extends PluginResponse {
  data: D;
}

export interface OnUpdateBatchPluginResponse<D> extends PluginResponse {
  data: D[];
}

export interface BuildResultPluginResponse<D> extends PluginResponse {
  data: D;
}

export interface RequestData<S, D> {
  state: S;
  data: D;
}

export interface RequestDataBatch<S, D> {
  state: S;
  data: D[];
}

export interface RequestResult<S> {
  state: S;
}

export abstract class ComputedFieldPlugin<State, Data, Result> extends BasePlugin {
  constructor() {
    super();
    this.initUpdateRoute();
    this.initUpdateBatchRoute();
    this.initBuildResultRoute();
  }

  abstract onUpdate(state: State | null, data: Data): State | null;

  abstract buildResult(state: State | null): {
    state: State | null;
    result: Result;
  };

  private onUpdateBatch(state: State, data: Data[]): State | null {
    const reducedData = data.reduce((acc, curr) => {
      return { ...acc, ...curr };
    });
    return this.onUpdate(state, reducedData);
  }

  private formatResponse(req: express.Request<unknown, unknown, string>, data: PluginResponse): string | Buffer {
    return req.headers['accept'] === 'application/ion'
      ? Buffer.from(ion.dumpBinary(ion.load(JSON.stringify(data))))
      : JSON.stringify(data);
  }

  private formatRequestData<T>(req: express.Request<unknown, unknown, string>): T {
    return req.headers['content-type'] === 'application/ion'
      ? (JSON.parse(JSON.stringify(ion.load(req.body))) as T)
      : (req.body as T);
  }

  private initUpdateRoute(): void {
    this.app.post(
      '/v1/computed_field/update/single',
      (req: express.Request<unknown, unknown, string>, res: express.Response) => {
        const body = this.formatRequestData<RequestData<State, Data>>(req);
        const updatedState = this.onUpdate(body.state, body.data);
        const pluginResponse: OnUpdatePluginResponse<State | null> = {
          status: 'ok',
          data: updatedState,
        };
        const response = this.formatResponse(req, pluginResponse);
        res.status(200).send(response);
      },
    );
  }

  private initUpdateBatchRoute(): void {
    this.app.post(
      '/v1/computed_field/update/batch',
      (req: express.Request<unknown, unknown, string>, res: express.Response) => {
        const body = this.formatRequestData<RequestDataBatch<State, Data>>(req);
        const updatedState = this.onUpdateBatch(body.state, body.data);
        const pluginResponse: OnUpdatePluginResponse<State | null> = {
          status: 'ok',
          data: updatedState,
        };
        res.status(200).send(this.formatResponse(req, pluginResponse));
      },
    );
  }

  private initBuildResultRoute(): void {
    this.app.post(
      '/v1/computed_field/build_result',
      (req: express.Request<unknown, unknown, string>, res: express.Response) => {
        const body = this.formatRequestData<RequestResult<State>>(req);
        const buildResult = this.buildResult(body.state);
        const pluginResponse: BuildResultPluginResponse<{
          state: State | null;
          result: Result;
        }> = {
          status: 'ok',
          data: buildResult,
        };
        res.status(200).send(this.formatResponse(req, pluginResponse));
      },
    );
  }
}
