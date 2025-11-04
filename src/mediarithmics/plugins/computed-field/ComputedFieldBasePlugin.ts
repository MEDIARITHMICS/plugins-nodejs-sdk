import { BasePlugin } from '../common/BasePlugin';
import * as ion from 'ion-js';
import express from 'express';
import { ComputedFieldResource } from './ComputedFieldInterface';
import { DataResponse } from '../../api/core/common/Response';

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

export interface BaseUserActivity {}
export interface BaseUserProfile {}
export interface BaseComputedField {}

export type DataType = 'USER_ACTIVITY' | 'USER_PROFILE' | 'COMPUTED_FIELD';

export type Operation = 'UPSERT' | 'DELETE';

export interface Update {
  data_type: DataType;
  operation: Operation;
  data: BaseUserActivity | BaseUserProfile | BaseComputedField;
}

export interface RequestData<S> {
  computed_field_id: string;
  state: S;
  update: Update;
}

export interface RequestDataBatch<S> {
  computed_field_id: string;
  state: S;
  updates: Update[];
}

export interface RequestResult<S> {
  computed_field_id: string;
  state: S;
}

export interface ComputedFieldBaseInstanceContext {
  computedField: ComputedFieldResource;
}

export abstract class ComputedFieldPlugin<
  State,
  Result,
  UserActivity extends BaseUserActivity,
  UserProfile extends BaseUserProfile,
  ComputedField extends BaseComputedField,
> extends BasePlugin<ComputedFieldBaseInstanceContext> {
  constructor() {
    super();
    this.initUpdateRoute();
    this.initUpdateBatchRoute();
    this.initBuildResultRoute();
  }

  abstract onUpdateActivity(
    state: State | null,
    userActivity: UserActivity,
    instanceContext: ComputedFieldBaseInstanceContext,
  ): State | null;
  abstract onUpdateUserProfile(
    state: State | null,
    userProfile: UserProfile,
    operation: Operation,
    instanceContext: ComputedFieldBaseInstanceContext,
  ): State | null;
  abstract onUpdateComputedField(
    state: State | null,
    computedField: ComputedField,
    instanceContext: ComputedFieldBaseInstanceContext,
  ): State | null;

  abstract buildResult(state: State | null, instanceContext: ComputedFieldBaseInstanceContext): Result | null;

  protected fetchComputedField(computedFieldId: string): Promise<ComputedFieldResource> {
    return super
      .requestGatewayHelper<DataResponse<ComputedFieldResource>>(
        'GET',
        `${this.outboundPlatformUrl}/v1/computed_fields/${computedFieldId}`,
      )
      .then((res) => {
        this.logger.debug(`Fetched computed field: ${computedFieldId}`, { res });
        return res.data;
      });
  }

  // This is a default provided implementation
  protected instanceContextBuilder(computedFieldId: string): Promise<ComputedFieldBaseInstanceContext> {
    return this.fetchComputedField(computedFieldId).then((computedField) => {
      return {
        computedField: computedField,
      } as ComputedFieldBaseInstanceContext;
    });
  }

  protected getInstanceContext(computedFieldId: string): Promise<ComputedFieldBaseInstanceContext> {
    if (!this.pluginCache.get(computedFieldId)) {
      void this.pluginCache.put(
        computedFieldId,
        this.instanceContextBuilder(computedFieldId).catch((error) => {
          this.logger.error('Error while caching instance context', error);
          this.pluginCache.del(computedFieldId);
          throw error;
        }),
        this.getInstanceContextCacheExpiration(),
      );
    }
    return this.pluginCache.get(computedFieldId) as Promise<ComputedFieldBaseInstanceContext>;
  }

  private getUpdateMethod(
    state: State | null,
    update: Update,
    instanceContext: ComputedFieldBaseInstanceContext,
  ): State | null {
    switch (update.data_type) {
      case 'USER_ACTIVITY':
        return this.onUpdateActivity(state, update.data as UserActivity, instanceContext);
      case 'USER_PROFILE':
        return this.onUpdateUserProfile(state, update.data as UserProfile, update.operation, instanceContext);
      case 'COMPUTED_FIELD':
        return this.onUpdateComputedField(state, update.data as ComputedField, instanceContext);
      default:
        return state;
    }
  }

  private onUpdateBatch(
    state: State,
    updates: Update[],
    instanceContext: ComputedFieldBaseInstanceContext,
  ): State | null {
    return updates.reduce((acc, curr) => {
      return this.getUpdateMethod(acc, curr, instanceContext);
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
      async (req: express.Request<unknown, unknown, string>, res: express.Response) => {
        try {
          const body = this.formatRequestData<RequestData<State>>(req);
          const instanceContext = await this.getInstanceContext(body.computed_field_id);
          const updatedState = this.getUpdateMethod(body.state, body.update, instanceContext);
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
      async (req: express.Request<unknown, unknown, string>, res: express.Response) => {
        try {
          const body = this.formatRequestData<RequestDataBatch<State>>(req);
          const instanceContext = await this.getInstanceContext(body.computed_field_id);
          const updatedState = this.onUpdateBatch(body.state, body.updates, instanceContext);
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
      async (req: express.Request<unknown, unknown, string>, res: express.Response) => {
        try {
          const body = this.formatRequestData<RequestResult<State>>(req);
          const instanceContext = await this.getInstanceContext(body.computed_field_id);
          const buildResult = this.buildResult(body.state, instanceContext);
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
