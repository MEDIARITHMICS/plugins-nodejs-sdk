import { BasePlugin } from '../common/BasePlugin';
import * as ion from 'ion-js';
import express from 'express';

export type OnUpdatePluginStatus = 'ok' | 'error';

export interface PluginResponse {
  status: OnUpdatePluginStatus;
}
export interface OnUpdatePluginResponse<S> extends PluginResponse {
  data: {
    state: S;
  };
}

export interface OnUpdateBatchPluginResponse<S> extends PluginResponse {
  data: {
    state: S;
  };
}

export interface BuildResultPluginResponse<R> extends PluginResponse {
  data: {
    result: R;
  };
}

export enum DataType {
  USER_ACTIVITY,
  USER_PROFILE,
  COMPUTED_FIELD,
}

export enum Operation {
  INSERT,
  DELETE,
  UPDATE,
}

export interface BaseUserActivity {}
export interface BaseUserProfile {}
export interface BaseComputedField {}

export interface Update {
  data_type: DataType;
  operation: Operation;
  data: BaseUserActivity | BaseUserProfile | BaseComputedField;
}

export interface RequestData<S> {
  state: S;
  update: Update;
}

export interface RequestDataBatch<S> {
  state: S;
  updates: Update[];
}

export interface RequestResult<S> {
  state: S;
}

export abstract class ComputedFieldPlugin<
  State,
  Result,
  UserActivity extends BaseUserActivity,
  UserProfile extends BaseUserProfile,
  ComputedField extends BaseComputedField,
> extends BasePlugin {
  constructor() {
    super();
    this.initUpdateRoute();
    this.initUpdateBatchRoute();
    this.initBuildResultRoute();
  }

  abstract onUpdateActivity(state: State | null, userActivity: UserActivity): State | null;
  abstract onUpdateUserProfile(state: State | null, userProfile: UserProfile, operation: Operation): State | null;
  abstract onUpdateComputedField(state: State | null, computedField: ComputedField): State | null;

  abstract buildResult(state: State | null): Result | null;

  private getUpdateMethod(state: State | null, update: Update): State | null {
    switch (update.data_type) {
      case DataType.USER_ACTIVITY:
        return this.onUpdateActivity(state, update.data as UserActivity);
      case DataType.USER_PROFILE:
        return this.onUpdateUserProfile(state, update.data as UserProfile, update.operation);
      case DataType.COMPUTED_FIELD:
        return this.onUpdateComputedField(state, update.data as ComputedField);
      default:
        return state;
    }
  }

  private onUpdateBatch(state: State, updates: Update[]): State | null {
    return updates.reduce((acc, curr) => {
      return this.getUpdateMethod(acc, curr);
    }, state);
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
        try {
          const body = this.formatRequestData<RequestData<State>>(req);
          const updatedState = this.getUpdateMethod(body.state, body.update);
          const pluginResponse: OnUpdatePluginResponse<State | null> = {
            status: 'ok',
            data: {
              state: updatedState,
            },
          };
          const response = this.formatResponse(req, pluginResponse);
          res.status(200).send(response);
        } catch (error) {
          this.logger.error('Something bad happened on single update route', error);
          return res.status(500).send({ status: 'error', message: `${(error as Error).message}` });
        }
      },
    );
  }

  private initUpdateBatchRoute(): void {
    this.app.post(
      '/v1/computed_field/update/batch',
      (req: express.Request<unknown, unknown, string>, res: express.Response) => {
        try {
          const body = this.formatRequestData<RequestDataBatch<State>>(req);
          const updatedState = this.onUpdateBatch(body.state, body.updates);
          const pluginResponse: OnUpdatePluginResponse<State | null> = {
            status: 'ok',
            data: {
              state: updatedState,
            },
          };
          res.status(200).send(this.formatResponse(req, pluginResponse));
        } catch (error) {
          this.logger.error('Something bad happened on single update route', error);
          return res.status(500).send({ status: 'error', message: `${(error as Error).message}` });
        }
      },
    );
  }

  private initBuildResultRoute(): void {
    this.app.post(
      '/v1/computed_field/build_result',
      (req: express.Request<unknown, unknown, string>, res: express.Response) => {
        try {
          const body = this.formatRequestData<RequestResult<State>>(req);
          const buildResult = this.buildResult(body.state);
          const pluginResponse: BuildResultPluginResponse<Result | null> = {
            status: 'ok',
            data: {
              result: buildResult,
            },
          };
          res.status(200).send(this.formatResponse(req, pluginResponse));
        } catch (error) {
          this.logger.error('Something bad happened on single update route', error);
          return res.status(500).send({ status: 'error', message: `${(error as Error).message}` });
        }
      },
    );
  }
}
