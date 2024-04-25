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

  private formatResponse(req: express.Request, data: any): any {
    return req.headers['accept'] === 'application/ion' ? ion.dumpBinary(data) : data;
  }

  private formatRequestData(req: express.Request): any {
    return req.headers['content-type'] === 'application/ion' ? JSON.stringify(ion.load(req.body.data)) : req.body.data;
  }

  private initUpdateRoute(): void {
    this.app.post('/v1/computed_field/update/single', (req: express.Request, res: express.Response) => {
      const json = JSON.parse(this.formatRequestData(req)) as RequestData<State, Data>;

      const updatedState = this.onUpdate(json.state, json.data);
      const pluginResponse: OnUpdatePluginResponse<State | null> = {
        status: 'ok',
        data: updatedState,
      };
      res.status(200).send(this.formatResponse(req, pluginResponse));
    });
  }

  private initUpdateBatchRoute(): void {
    this.app.post('/v1/computed_field/update/batch', (req: express.Request, res: express.Response) => {
      const json = JSON.parse(this.formatRequestData(req)) as RequestDataBatch<State, Data>;
      const updatedState = this.onUpdateBatch(json.state, json.data);
      const pluginResponse: OnUpdatePluginResponse<State | null> = {
        status: 'ok',
        data: updatedState,
      };
      res.status(200).send(this.formatResponse(req, pluginResponse));
    });
  }

  private initBuildResultRoute(): void {
    this.app.post('/v1/computed_field/build_result', (req: express.Request, res: express.Response) => {
      const json = JSON.parse(this.formatRequestData(req)) as State;

      const buildResult = this.buildResult(json);
      const pluginResponse: BuildResultPluginResponse<{
        state: State | null;
        result: Result;
      }> = {
        status: 'ok',
        data: buildResult,
      };
      res.status(200).send(this.formatResponse(req, pluginResponse));
    });
  }
}
