import * as express from 'express';
import * as winston from 'winston';
import * as bodyParser from 'body-parser';
import * as cache from 'memory-cache';
import * as toobusy from 'toobusy-js';
import * as _ from 'lodash';

import {MsgCmd} from './index';

import {
  AdLayoutProperty,
  asAdLayoutProperty,
  asAssetFileProperty,
  asAssetFolderProperty,
  asBooleanProperty,
  asDataFileProperty,
  asNativeDataProperty,
  asNativeImageProperty,
  asNativeTitleProperty,
  AssetFileProperty,
  AssetFolderProperty,
  asStringProperty,
  asUrlProperty,
  BooleanProperty,
  DataFileProperty,
  NativeDataProperty,
  NativeImageProperty,
  NativeTitleProperty,
  PluginProperty,
  PropertyType,
  StringProperty,
  UrlProperty
} from '../../api/core/plugin/PluginPropertyInterface';

import {flatMap, Index, Option} from '../../utils';
import {normalizeArray} from '../../utils/Normalizer';
import {GatewaySdk, IGatewaySdk} from '../../api/sdk/GatewaySdk';
import {PluginConf} from '../../../conf/PluginConf';
import {ApiSdk} from '../../api/sdk/ApiSdk';

export interface InitUpdateResponse {
  status: ResponseStatusCode;
  msg?: string;
}

export interface LogLevelUpdateResponse {
  status: ResponseStatusCode;
  msg?: string;
}

export interface Credentials {
  authentication_token: string;
  worker_id: string;
}

export type ResponseStatusCode = 'ok' | 'error';

export class PropertiesWrapper {

  readonly normalized: Index<PluginProperty>;

  constructor(readonly values: Array<PluginProperty>) {
    this.normalized = normalizeArray(values, 'technical_name');
  }

  get = (key: string): Option<PluginProperty> => this.normalized[key];

  ofType = (typeName: PropertyType): Option<PluginProperty> =>
    _.find(this.values, p => p.property_type === typeName);

  findAssetFileProperty = (key?: string): Option<AssetFileProperty> => {
    const p = key ? this.get(key) : this.ofType('ASSET') || this.ofType('ASSET_FILE');
    return flatMap(p, asAssetFileProperty);
  };

  findAssetFolderProperty = (key?: string): Option<AssetFolderProperty> => {
    const p = key ? this.get(key) : this.ofType('ASSET_FOLDER');
    return flatMap(p, asAssetFolderProperty);
  };

  findDataFileProperty = (key?: string): Option<DataFileProperty> => {
    const p = key ? this.get(key) : this.ofType('DATA_FILE');
    return flatMap(p, asDataFileProperty);
  };

  findUrlProperty = (key?: string): Option<UrlProperty> => {
    const p = key ? this.get(key) : this.ofType('URL');
    return flatMap(p, asUrlProperty);
  };

  findStringProperty = (key?: string): Option<StringProperty> => {
    const p = key ? this.get(key) : this.ofType('STRING');
    return flatMap(p, asStringProperty);
  };

  findAdLayoutProperty = (key?: string): Option<AdLayoutProperty> => {
    const p = key ? this.get(key) : this.ofType('AD_LAYOUT');
    return flatMap(p, asAdLayoutProperty);
  };

  findBooleanProperty = (key?: string): Option<BooleanProperty> => {
    const p = key ? this.get(key) : this.ofType('BOOLEAN');
    return flatMap(p, asBooleanProperty);
  };

  findNativeDataProperty = (key?: string): Option<NativeDataProperty> => {
    const p = key ? this.get(key) : this.ofType('NATIVE_DATA');
    return flatMap(p, asNativeDataProperty);
  };

  findNativeTitleProperty = (key?: string): Option<NativeTitleProperty> => {
    const p = key ? this.get(key) : this.ofType('NATIVE_TITLE');
    return flatMap(p, asNativeTitleProperty);
  };

  findNativeImageProperty = (key?: string): Option<NativeImageProperty> => {
    const p = key ? this.get(key) : this.ofType('NATIVE_IMAGE');
    return flatMap(p, asNativeImageProperty);
  };
}

export interface BasePluginProps {
  readonly enableThrottling?: boolean
  readonly config?: PluginConf
  readonly gatewaySdk?: IGatewaySdk
  readonly apiSdk?: ApiSdk
}

export abstract class BasePlugin {

  // Default cache is now 10 min to give some breathing to the Gateway
  // Note: This will be private or completly remove in the next major release as a breaking change
  // TODO: in 0.8.x+, make this private or remove it completly (this should no longer be overriden in plugin impl.,
  // or we should implement a minimum threshold pattern)
  readonly INSTANCE_CONTEXT_CACHE_EXPIRATION: number = 600000;
  readonly pluginCache: any;
  readonly app: express.Application;

  logger = winston.createLogger().add(new winston.transports.Console());
  credentials = {authentication_token: '', worker_id: ''};
  multiThread: boolean = false;

  readonly config: PluginConf;
  readonly gatewaySdk: IGatewaySdk;
  readonly apiSdk: ApiSdk;

  constructor(props: BasePluginProps = {}) {
    this.config = props.config ?? new PluginConf();
    this.gatewaySdk = props.gatewaySdk ?? new GatewaySdk(this.config.outboundPlatformUrl, () => this.credentials, () => this.logger);
    this.apiSdk = props.apiSdk ?? new ApiSdk('https://api.mediarithmics.com', () => this.logger);
    this.app = express();
    if (props.enableThrottling) {
      this.app.use((req, res, next) => {
        if (toobusy()) {
          res.status(429).send('I\'m busy right now, sorry.');
        } else {
          next();
        }
      });
    }
    this.app.use(bodyParser.json({type: '*/*', limit: '5mb'}));

    this.pluginCache = cache;
    this.pluginCache.clear();

    this.initInitRoute();
    this.initStatusRoute();
    this.initLogLevelUpdateRoute();
    this.initLogLevelGetRoute();
  }

  // The objective is to stop having 'synchronized' instance context re-build that are putting some stress on the gateway due to burst of API calls
  getInstanceContextCacheExpiration() {
    return this.INSTANCE_CONTEXT_CACHE_EXPIRATION * (1 + 0.1 * Math.random());
  }

  // Log level update implementation

  onLogLevelUpdate(level: string) {
    const logLevel = level.toLowerCase();
    this.logger.info('Setting log level to ' + logLevel);
    this.logger.level = logLevel;
  }

  onInitRequest(creds: Credentials) {
    this.credentials.authentication_token = creds.authentication_token;
    this.credentials.worker_id = creds.worker_id;
    this.logger.info('Update authentication_token with %s', this.credentials.authentication_token);
  }

  // Method to start the plugin
  start() {
  }

  private sendMessageToMaster = (cmd: MsgCmd, value: string) => {
    this.logger.debug(`Sending ${cmd} from worker ${process.pid} to master with value: ${value}`);
    if (typeof process.send === 'function') {
      process.send({cmd, value});
    }
  };

  // This method can be overridden by any subclass
  protected onLogLevelUpdateHandler(req: express.Request, res: express.Response) {
    if (req.body?.level) {
      const level = req.body.level;

      if (this.multiThread) {
        this.sendMessageToMaster(MsgCmd.LOG_LEVEL_UPDATE_FROM_WORKER, req.body.level.toLowerCase());
        // We have to assume that everything went fine in the propagation...
        res.status(200).end();
      } else {
        // Lowering case
        this.onLogLevelUpdate(level);
        return res.status(200).end();
      }
    } else {
      this.logger.error('Incorrect body : Cannot change log level, actual: ' + this.logger.level);
      res.status(400).end();
    }
  }

  // This method can be overridden by any subclass
  protected onLogLevelRequest(req: express.Request, res: express.Response) {
    res.send({level: this.logger.level.toUpperCase()});
  }

  // This method can be overridden by any subclass
  protected onStatusRequest(req: express.Request, res: express.Response) {
    //Route used by the plugin manager to check if the plugin is UP and running
    this.logger.silly('GET /v1/status');
    if (this.credentials.worker_id && this.credentials.authentication_token) {
      res.status(200).end();
    } else {
      this.logger.error(`Plugin is not inialized yet, we don't have any worker_id & authentification_token`);
      res.status(503).end();
    }
  }

  // This method can be overridden by any subclass
  protected onInitRequestHandler(req: express.Request, res: express.Response) {
    if (req.body.authentication_token && req.body.worker_id) {
      const creds: Credentials = {
        authentication_token: req.body.authentication_token,
        worker_id: req.body.worker_id
      };

      // If MultiThread, we send a message to the cluster master,
      // the onInitRequest() will be called once the master will propagate the update to each worker
      if (this.multiThread) {
        this.sendMessageToMaster(MsgCmd.CREDENTIAL_UPDATE_FROM_WORKER, JSON.stringify(creds));
        // We have to assume that everything went fine in the propagation...
        res.status(200).end();

        // Else, we handle the onInitRequest in this process
      } else {
        this.logger.debug('POST /v1/init ', JSON.stringify(creds));

        if (creds && creds.authentication_token && creds.worker_id) {
          this.onInitRequest(creds);
          res.status(200).end();
        } else {
          this.logger.error(`Error while Init: "creds are undefined"`);
          res.status(500).end();
        }
      }
    } else {
      this.logger.error(
        `Received /v1/init call without authentification_token or worker_id`
      );
      res.status(400).end();
    }
  }

  // Plugin Init implementation

  protected asyncMiddleware = (fn: express.Handler): express.Handler => (req, res, next,) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  protected setErrorHandler() {
    this.app.use(
      (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        this.logger.error(`Something bad happened : ${err.message} - ${err.stack}`);
        return res.status(500).send(err.message + '\n' + err.stack);
      }
    );
  }

  private initLogLevelUpdateRoute() {
    //Route used by the plugin manager to check if the plugin is UP and running
    this.app.put(
      '/v1/log_level',
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          this.onLogLevelUpdateHandler(req, res);
        }
      )
    );
  }

  private initLogLevelGetRoute() {
    this.app.get(
      '/v1/log_level',
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          this.onLogLevelRequest(req, res);
        }
      )
    );
  }

  private initStatusRoute() {
    this.app.get(
      '/v1/status',
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          this.onStatusRequest(req, res);
        }
      )
    );
  }

  private initInitRoute() {
    this.app.post(
      '/v1/init',
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          this.onInitRequestHandler(req, res);
        }
      )
    );
  }
}
