import {BasePlugin, Credentials} from '../mediarithmics/plugins/common';
import {agent, Response, SuperTest, Test} from 'supertest';
import {
  ActivityAnalyzerPluginResponse,
  AudienceFeedConnectorPluginResponse,
  BidOptimizerPluginResponse,
  CheckEmailsPluginResponse,
  EmailRendererPluginResponse,
  EmailRoutingPluginResponse,
  ExternalSegmentConnectionPluginResponse,
  LogLevel,
  RecommenderPluginResponse
} from '../mediarithmics';

export interface PluginApiResponse<T> extends Response {
  parsedText: T
}

export class PluginApiTester {
  constructor(private plugin: BasePlugin) {
    this.request = agent(plugin.app);
  }

  private readonly request: SuperTest<Test>;

  readonly get = <T>(uri: string): Promise<Response> => this.request.get(uri)
    .then(this.throwIfNot200);

  readonly post = <T>(uri: string, body?: any): Promise<Response> => this.request.post(uri)
    .send(body)
    .then(this.throwIfNot200);

  readonly put = <T>(uri: string, body?: any): Promise<Response> => this.request.put(uri)
    .send(body)
    .then(this.throwIfNot200);

  protected readonly throwIfNot200 = (res: Response): Response | Promise<never> => {
    return res.status !== 200 ? Promise.reject(res.status) : res;
  };

  protected readonly parseText = <T>(res: Response): PluginApiResponse<T> => {
    return {...res, parsedText: JSON.parse(res.text)} as PluginApiResponse<T>;
  };

  readonly init = async (credentials: Credentials = {authentication_token: 'Manny', worker_id: 'Calavera'}): Promise<Response> => {
    return this.post('/v1/init', credentials);
  };

  readonly setLogLevel = async (logLevel: LogLevel = 'info'): Promise<Response> => {
    return this.put('/v1/log_level', {level: logLevel});
  };

  readonly getStatus = async (): Promise<Response> => {
    return this.get('/v1/status');
  };

  readonly initAndSetLogLevel = async (logLevel?: LogLevel, credentials?: Credentials): Promise<[Response, Response]> => {
    const initRes = await this.init(credentials);
    const logLevelRes = await this.setLogLevel(logLevel);
    return [initRes, logLevelRes];
  };
}

export class ActivityAnalyzerApiTester extends PluginApiTester {
  readonly postActivityAnalysis = (body?: any) => this.post('/v1/activity_analysis', body)
    .then(_ => this.parseText<ActivityAnalyzerPluginResponse>(_));
}

export class AdRendererApiTester extends PluginApiTester {
  readonly postAdContents = (body?: any) => this.post('/v1/ad_contents', body);
}

export class AudienceFeedApiTester extends PluginApiTester {
  readonly postExternalSegmentCreation = (body?: any) => this.post('/v1/external_segment_creation', body)
    .then(_ => this.parseText<AudienceFeedConnectorPluginResponse>(_));

  readonly postExternalSegmentConnection = (body?: any) => this.post('/v1/external_segment_connection', body)
    .then(_ => this.parseText<ExternalSegmentConnectionPluginResponse>(_));

  readonly postUserSegmentUpdate = (body?: any) => this.post('/v1/user_segment_update', body)
    .then(_ => this.parseText<AudienceFeedConnectorPluginResponse>(_));
}

export class BidOptimizerApiTester extends PluginApiTester {
  readonly postBidDecisions = (body?: any) => this.post('/v1/bid_decisions', body)
    .then(_ => this.parseText<BidOptimizerPluginResponse>(_));
}

export class EmailRendererApiTester extends PluginApiTester {
  readonly postEmailContents = (body?: any) => this.post('/v1/email_contents', body)
    .then(_ => this.parseText<EmailRendererPluginResponse>(_));
}

export class EmailRouterApiTester extends PluginApiTester {
  readonly postEmailRouting = (body?: any) => this.post('/v1/email_routing', body)
    .then(_ => this.parseText<EmailRoutingPluginResponse>(_));

  readonly postEmailCheck = (body?: any) => this.post('/v1/email_router_check', body)
    .then(_ => this.parseText<CheckEmailsPluginResponse>(_));
}

export class RecommenderApiTester extends PluginApiTester {
  readonly postRecommendation = (body?: any) => this.post('/v1/recommendations', body)
    .then(_ => this.parseText<RecommenderPluginResponse>(_));
}
