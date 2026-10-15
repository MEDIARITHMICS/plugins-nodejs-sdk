/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */

import 'mocha';

import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';

import { core } from '../';
import { AudienceFeedBatchContext, UserSegmentUpdatePluginFileDeliveryResponseData } from '../mediarithmics';
import { BatchUpdateRequest } from '../mediarithmics/api/core/batchupdate/BatchUpdateInterface';
import {
  CreateOAuthRedirectUrlPluginResponse,
  DestinationAudienceDeletionPluginResponse,
  TestAuthenticationPluginResponse,
} from '../mediarithmics/api/plugin/audiencefeedconnector/AudienceFeedConnectorPluginResponseInterface';
import {
  CreateOAuthRedirectUrlRequest,
  DestinationAudienceDeletionRequest,
  ExternalSegmentAuthenticationRequest,
  TestAuthenticationRequest,
} from '../mediarithmics/api/plugin/audiencefeedconnector/AudienceFeedConnectorRequestInterface';
import { FeedDestinationCredentials } from '../mediarithmics';

const PLUGIN_AUTHENTICATION_TOKEN = 'Manny';
const PLUGIN_WORKER_ID = 'Calavera';

// set by the plugin runner in production
process.env.PLUGIN_AUTHENTICATION_TOKEN = PLUGIN_AUTHENTICATION_TOKEN;
process.env.PLUGIN_WORKER_ID = PLUGIN_WORKER_ID;

class MyFakeAudienceFeedConnector extends core.AudienceFeedConnectorBasePlugin {
  protected onExternalSegmentCreation(
    request: core.ExternalSegmentCreationRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentCreationPluginResponse> {
    const response: core.ExternalSegmentCreationPluginResponse = {
      status: 'ok',
    };
    return Promise.resolve(response);
  }

  protected onExternalSegmentConnection(
    request: core.ExternalSegmentConnectionRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentConnectionPluginResponse> {
    const response: core.ExternalSegmentConnectionPluginResponse = {
      status: 'ok',
    };
    return Promise.resolve(response);
  }

  protected onUserSegmentUpdate(
    request: core.UserSegmentUpdateRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.UserSegmentUpdatePluginResponse> {
    const data: UserSegmentUpdatePluginFileDeliveryResponseData[] = [
      { type: 'FILE_DELIVERY', content: 'my_string', grouping_key: 'groupingKey', destination_token: 'destination_1' },
    ];

    const response: core.UserSegmentUpdatePluginResponse = {
      status: 'ok',
      data,
    };

    return Promise.resolve(response);
  }
}

const rpMockup: sinon.SinonStub = sinon.stub().returns(
  new Promise((resolve, reject) => {
    resolve('Yolo');
  }),
);

class MyFakeAudienceFeedConnectorWithCredentialsCheck extends core.AudienceFeedConnectorBasePlugin {
  protected onExternalSegmentCreation(
    request: core.ExternalSegmentCreationRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentCreationPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onExternalSegmentConnection(
    request: core.ExternalSegmentConnectionRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentConnectionPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onUserSegmentUpdate(
    request: core.UserSegmentUpdateRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.UserSegmentUpdatePluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onTestAuthentication(
    request: TestAuthenticationRequest,
    credentials: FeedDestinationCredentials,
  ): Promise<TestAuthenticationPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }
}

class MyFakeAudienceFeedConnectorWithInvalidCredentials extends MyFakeAudienceFeedConnectorWithCredentialsCheck {
  protected onTestAuthentication(
    request: TestAuthenticationRequest,
    credentials: FeedDestinationCredentials,
  ): Promise<TestAuthenticationPluginResponse> {
    return Promise.resolve({ status: 'invalid_credentials', message: 'Invalid credentials' });
  }
}

describe('Check Destination Credentials', function () {
  it('should return error (500) when no credentials are stored', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().rejects(new Error('Not Found'));
    const plugin = new MyFakeAudienceFeedConnectorWithCredentialsCheck(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const checkRequest: TestAuthenticationRequest = { feed_destination_id: '42' };

    void request(runner.plugin.app)
      .post('/v1/test_authentication')
      .send(checkRequest)
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        expect(JSON.parse(res.text).status).to.be.eq('error');
        expect(JSON.parse(res.text).message).to.be.eq('Could not fetch feed destination credentials');
        done();
      });
  });

  it('should call onTestAuthentication with fetched credentials and return ok', function (done) {
    const credentials: FeedDestinationCredentials = {
      scheme: 'API_TOKEN',
      credentials: { token: 'my-secret-token' },
    };

    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({ status: 'ok', data: credentials }));

    const plugin = new MyFakeAudienceFeedConnectorWithCredentialsCheck(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const checkRequest: TestAuthenticationRequest = { feed_destination_id: '42' };

    void request(runner.plugin.app)
      .post('/v1/test_authentication')
      .send(checkRequest)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.text).status).to.be.eq('ok');
        expect(rpMockup.args[0][0].uri).to.be.eq(
          `${runner.plugin.outboundPlatformUrl}/v1/feed_destinations/42/credentials`,
        );
        done();
      });
  });

  it('should return invalid_credentials (401) when onTestAuthentication rejects the credentials', function (done) {
    const credentials: FeedDestinationCredentials = {
      scheme: 'API_TOKEN',
      credentials: { token: 'bad-token' },
    };

    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({ status: 'ok', data: credentials }));

    const plugin = new MyFakeAudienceFeedConnectorWithInvalidCredentials(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const checkRequest: TestAuthenticationRequest = { feed_destination_id: '42' };

    void request(runner.plugin.app)
      .post('/v1/test_authentication')
      .send(checkRequest)
      .end(function (err, res) {
        expect(res.status).to.equal(401);
        expect(JSON.parse(res.text).status).to.be.eq('invalid_credentials');
        done();
      });
  });

  it('should return not_implemented (400) when onTestAuthentication is not overridden', function (done) {
    const credentials: FeedDestinationCredentials = {
      scheme: 'API_TOKEN',
      credentials: { token: 'my-secret-token' },
    };

    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({ status: 'ok', data: credentials }));

    const plugin = new MyFakeAudienceFeedConnector(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const checkRequest: TestAuthenticationRequest = { feed_destination_id: '42' };

    void request(runner.plugin.app)
      .post('/v1/test_authentication')
      .send(checkRequest)
      .end(function (err, res) {
        expect(res.status).to.equal(400);
        expect(JSON.parse(res.text).status).to.be.eq('not_implemented');
        done();
      });
  });
});

class MyFakeAudienceFeedConnectorWithOAuth extends core.AudienceFeedConnectorBasePlugin {
  protected onExternalSegmentCreation(
    request: core.ExternalSegmentCreationRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentCreationPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onExternalSegmentConnection(
    request: core.ExternalSegmentConnectionRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentConnectionPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onUserSegmentUpdate(
    request: core.UserSegmentUpdateRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.UserSegmentUpdatePluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onCreateOAuthRedirectUrl(
    request: CreateOAuthRedirectUrlRequest,
  ): Promise<CreateOAuthRedirectUrlPluginResponse> {
    return Promise.resolve({
      login_url: `https://accounts.google.com/o/oauth2/v2/auth?feed_destination_id=${request.feed_destination_id}&client_id=my-client`,
    });
  }

  protected onAuthentication(
    request: ExternalSegmentAuthenticationRequest,
  ): Promise<core.ExternalSegmentAuthenticationResponse> {
    return Promise.resolve({
      status: 'ok',
      refresh_token: 'my-refresh-token',
      feed_destination_id: request.params?.state,
    });
  }
}

class MyFakeAudienceFeedConnectorWithBadOAuthUrl extends core.AudienceFeedConnectorBasePlugin {
  protected onExternalSegmentCreation(
    request: core.ExternalSegmentCreationRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentCreationPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onExternalSegmentConnection(
    request: core.ExternalSegmentConnectionRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentConnectionPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onUserSegmentUpdate(
    request: core.UserSegmentUpdateRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.UserSegmentUpdatePluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onCreateOAuthRedirectUrl(
    request: CreateOAuthRedirectUrlRequest,
  ): Promise<CreateOAuthRedirectUrlPluginResponse> {
    return Promise.resolve({
      login_url: `https://accounts.google.com/o/oauth2/v2/auth?state=other_param&client_id=my-client&feed_destination_id=wrong_id`,
    });
  }
}

class MyFakeAudienceFeedConnectorWithOAuthNoCredentials extends core.AudienceFeedConnectorBasePlugin {
  protected onExternalSegmentCreation(
    request: core.ExternalSegmentCreationRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentCreationPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onExternalSegmentConnection(
    request: core.ExternalSegmentConnectionRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.ExternalSegmentConnectionPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onUserSegmentUpdate(
    request: core.UserSegmentUpdateRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
  ): Promise<core.UserSegmentUpdatePluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onAuthentication(
    request: ExternalSegmentAuthenticationRequest,
  ): Promise<core.ExternalSegmentAuthenticationResponse> {
    return Promise.resolve({ status: 'ok', feed_destination_id: request.params?.state });
  }
}

describe('createOAuthRedirectUrl', function () {
  it('should return 200 with login_url when feed_destination_id is a query param', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({}));
    const plugin = new MyFakeAudienceFeedConnectorWithOAuth(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const req: CreateOAuthRedirectUrlRequest = { feed_destination_id: '42', plugin_version_id: '99' };

    void request(runner.plugin.app)
      .post('/v1/oauth_redirect_url')
      .send(req)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.text).login_url).to.include('42');
        done();
      });
  });

  it('should return 500 when login_url feed_destination_id query param does not match', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({}));
    const plugin = new MyFakeAudienceFeedConnectorWithBadOAuthUrl(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const req: CreateOAuthRedirectUrlRequest = { feed_destination_id: '42', plugin_version_id: '99' };

    void request(runner.plugin.app)
      .post('/v1/oauth_redirect_url')
      .send(req)
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        expect(JSON.parse(res.text).message).to.include('feed_destination_id');
        done();
      });
  });

  it('should return 500 when feed_destination_id is missing from request', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({}));
    const plugin = new MyFakeAudienceFeedConnectorWithOAuth(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    void request(runner.plugin.app)
      .post('/v1/oauth_redirect_url')
      .send({ plugin_version_id: '99' })
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        expect(JSON.parse(res.text).message).to.include('feed_destination_id');
        done();
      });
  });
});

describe('authenticate wrapper', function () {
  it('should upsert with the feed_destination_id returned by the plugin (from state) and strip credentials', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({}));
    const plugin = new MyFakeAudienceFeedConnectorWithOAuth(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const req: ExternalSegmentAuthenticationRequest = {
      user_id: 'user1',
      plugin_version_id: '99',
      params: { code: 'auth-code', state: '42' },
    };

    void request(runner.plugin.app)
      .post('/v1/authentication')
      .send(req)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.text).status).to.be.eq('ok');
        expect(JSON.parse(res.text).refresh_token).to.be.undefined;
        expect(rpMockup.calledOnce).to.be.true;
        expect(rpMockup.args[0][0].uri).to.include('/v1/feed_destinations/42/credentials');
        expect(rpMockup.args[0][0].method).to.be.eq('POST');
        done();
      });
  });

  it('should not upsert when the plugin returns no feed_destination_id', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({}));
    const plugin = new MyFakeAudienceFeedConnectorWithOAuth(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const req: ExternalSegmentAuthenticationRequest = {
      user_id: 'user1',
      plugin_version_id: '99',
      params: { code: 'auth-code' },
    };

    void request(runner.plugin.app)
      .post('/v1/authentication')
      .send(req)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(rpMockup.called).to.be.false;
        done();
      });
  });

  it('should return 500 when the plugin returns a feed_destination_id but no refresh_token', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({}));
    const plugin = new MyFakeAudienceFeedConnectorWithOAuthNoCredentials(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const req: ExternalSegmentAuthenticationRequest = {
      user_id: 'user1',
      plugin_version_id: '99',
      params: { code: 'auth-code', state: '42' },
    };

    void request(runner.plugin.app)
      .post('/v1/authentication')
      .send(req)
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        expect(JSON.parse(res.text).message).to.include('refresh_token');
        done();
      });
  });
});

describe('upsertFeedDestinationCredentials', function () {
  it('should POST to the correct URL with credentials', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({}));
    const plugin = new MyFakeAudienceFeedConnector(false);
    new core.TestingPluginRunner(plugin, rpMockup);

    void plugin
      .upsertFeedDestinationCredentials('42', {
        scheme: 'OAUTH2',
        credentials: { refresh_token: 'my-token' },
      })
      .then(() => {
        expect(rpMockup.args[0][0].uri).to.be.eq(`${plugin.outboundPlatformUrl}/v1/feed_destinations/42/credentials`);
        expect(rpMockup.args[0][0].method).to.be.eq('POST');
        done();
      });
  });
});

describe('Fetch Audience Feed Gateway API', () => {
  // All the magic is here
  const plugin = new MyFakeAudienceFeedConnector(false);
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  it('Check that feed_id is passed correctly in fetchAudienceFeedProperties', function (done) {
    const fakeId = '42000000';

    // We try a call to the Gateway
    void (runner.plugin as MyFakeAudienceFeedConnector).fetchAudienceFeedProperties(fakeId).then(() => {
      expect(rpMockup.args[0][0].uri).to.be.eq(
        `${runner.plugin.outboundPlatformUrl}/v1/audience_segment_external_feeds/${fakeId}/properties`,
      );
      done();
    });
  });

  it('Check that feed_id is passed correctly in fetchAudienceSegment', function (done) {
    const fakeId = '42000000';

    // We try a call to the Gateway
    void (runner.plugin as MyFakeAudienceFeedConnector).fetchAudienceSegment(fakeId).then(() => {
      expect(rpMockup.args[1][0].uri).to.be.eq(
        `${runner.plugin.outboundPlatformUrl}/v1/audience_segment_external_feeds/${fakeId}/audience_segment`,
      );
      done();
    });
  });
});

describe('External Audience Feed API test', function () {
  // All the magic is here
  const plugin = new MyFakeAudienceFeedConnector(false);
  let runner: core.TestingPluginRunner;

  it('Check that the plugin is giving good results with a simple handler', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub();

    const audienceFeed: core.DataResponse<core.AudienceSegmentExternalFeedResource> = {
      status: 'ok',
      data: {
        id: '74',
        plugin_id: '984',
        organisation_id: '95',
        group_id: 'com.mediarithmics.audience-feed',
        artifact_id: 'awesome-audience-feed',
        version_id: '1254',
      },
    };

    rpMockup
      .withArgs(
        sinon.match.has(
          'uri',
          sinon.match(function (value: string) {
            return value.match(/\/v1\/audience_segment_external_feeds\/(.){1,10}/) !== null;
          }),
        ),
      )
      .returns(audienceFeed);

    const properties: core.DataListResponse<core.PluginProperty> = {
      status: 'ok',
      count: 1,
      data: [
        {
          technical_name: 'hello_world',
          value: {
            value: 'Yay',
          },
          property_type: 'STRING',
          origin: 'PLUGIN',
          writable: true,
          deletable: false,
        },
      ],
    };

    rpMockup
      .withArgs(
        sinon.match.has(
          'uri',
          sinon.match(function (value: string) {
            return value.match(/\/v1\/audience_segment_external_feeds\/(.){1,10}\/properties/) !== null;
          }),
        ),
      )
      .returns(properties);

    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const externalSegmentCreation: core.ExternalSegmentCreationRequest = {
      feed_id: '42',
      datamart_id: '1023',
      segment_id: '451256',
    };

    const externalSegmentConnection: core.ExternalSegmentConnectionRequest = {
      feed_id: '42',
      datamart_id: '1023',
      segment_id: '451256',
    };

    const userSegmentUpdateRequest: core.UserSegmentUpdateRequest = {
      feed_id: '42',
      session_id: '43',
      datamart_id: '1023',
      segment_id: '451256',
      ts: 1254412,
      operation: 'UPSERT',
      user_identifiers: [
        {
          type: 'USER_POINT',
          user_point_id: '26340584-f777-404c-82c5-56220667464b',
        } as core.UserPointIdentifierInfo,
        {
          type: 'USER_ACCOUNT',
          user_account_id: '914eb2aa50cef7f3a8705b6bb54e50bb',
          creation_ts: 1493118667529,
        } as core.UserAccountIdentifierInfo,
        {
          type: 'USER_EMAIL',
          hash: 'e2749f6f4d8104ec385a75490b587c86',
          email: undefined,
          operator: undefined,
          creation_ts: 1493118667529,
          last_activity_ts: 1493127642622,
          providers: [],
        } as core.UserEmailIdentifierInfo,
        {
          type: 'USER_AGENT',
          vector_id: 'vec:886742516',
          device: {
            form_factor: 'PERSONAL_COMPUTER',
            os_family: 'MAC_OS',
            browser_family: 'CHROME',
            brand: undefined,
            model: undefined,
            os_version: undefined,
            carrier: undefined,
          },
          creation_ts: 1493118667529,
          last_activity_ts: 1493126966889,
          providers: [],
          mappings: [],
        } as core.UserAgentIdentifierInfo,
      ],
      user_profiles: [],
    };

    const batchUpdateRequest: BatchUpdateRequest<AudienceFeedBatchContext, string> = {
      batch_content: ['subBatch_1', 'subBatch_2', 'subBatch_3'],
      ts: new Date().getTime(),
      context: {
        endpoint: '/v1/user-segment-update',
        feed_id: '42',
        feed_session_id: '43',
        segment_id: '451256',
        datamart_id: '1023',
        grouping_key: '',
      },
    };

    void request(runner.plugin.app)
      .post('/v1/external_segment_creation')
      .send(externalSegmentCreation)
      .end(function (err, res) {
        expect(res.status).to.equal(200);

        expect(JSON.parse(res.text).status).to.be.eq('ok');

        void request(runner.plugin.app)
          .post('/v1/external_segment_connection')
          .send(externalSegmentConnection)
          .end(function (err, res) {
            expect(res.status).to.equal(200);

            expect(JSON.parse(res.text).status).to.be.eq('ok');

            void request(runner.plugin.app)
              .post('/v1/user_segment_update')
              .send(userSegmentUpdateRequest)
              .end(function (err, res) {
                expect(res.status).to.equal(200);
                expect(JSON.parse(res.text).data).to.deep.equal([
                  {
                    type: 'FILE_DELIVERY',
                    content: 'my_string',
                    grouping_key: 'groupingKey',
                    destination_token: 'destination_1',
                  },
                ]);
                expect(JSON.parse(res.text).status).to.be.eq('ok');
              });

            void request(runner.plugin.app)
              .post('/v1/batch_update')
              .send(batchUpdateRequest)
              .end(function (err, res) {
                expect(res.status).to.equal(500);

                expect(JSON.parse(res.text).message).to.be.eq("Plugin doesn't support batch update");

                done();
              });
          });
      });
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });
});

const emptyPropertiesResponse: core.DataListResponse<core.PluginProperty> = { status: 'ok', count: 0, data: [] };

function feedResponse(feedId: string): core.DataResponse<core.AudienceSegmentExternalFeedResource> {
  return {
    status: 'ok',
    data: {
      id: feedId,
      plugin_id: '984',
      organisation_id: '95',
      group_id: 'com.mediarithmics.audience-feed',
      artifact_id: 'awesome-audience-feed',
      version_id: '1254',
    },
  };
}

function buildFeedRunner(
  plugin: core.BasePlugin,
  feedId: string,
  credentialsImpl: () => Promise<unknown> = () => Promise.resolve({ status: 'ok', data: {} }),
) {
  const credentialsCall = sinon.spy(credentialsImpl);
  const rpMockup: sinon.SinonStub = sinon.stub();
  rpMockup
    .withArgs(
      sinon.match.has(
        'uri',
        sinon.match((value: string) => /\/v1\/audience_segment_external_feeds\/(.){1,10}$/.test(value)),
      ),
    )
    .returns(Promise.resolve(feedResponse(feedId)));
  rpMockup
    .withArgs(
      sinon.match.has(
        'uri',
        sinon.match((value: string) => /\/v1\/audience_segment_external_feeds\/(.){1,10}\/properties/.test(value)),
      ),
    )
    .returns(Promise.resolve(emptyPropertiesResponse));
  rpMockup
    .withArgs(
      sinon.match.has(
        'uri',
        sinon.match((value: string) => /\/v1\/feed_destinations\/(.+)\/credentials/.test(value)),
      ),
    )
    .callsFake(credentialsCall);
  return { runner: new core.TestingPluginRunner(plugin, rpMockup), credentialsCall };
}

class CapturingAudienceFeedConnector extends core.AudienceFeedConnectorBasePlugin {
  public capturedFeedDestinationCredentials?: FeedDestinationCredentials;
  public onUserSegmentUpdateCalled = false;
  public onTroubleshootCalled = false;

  protected onExternalSegmentCreation(): Promise<core.ExternalSegmentCreationPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onExternalSegmentConnection(): Promise<core.ExternalSegmentConnectionPluginResponse> {
    return Promise.resolve({ status: 'ok' });
  }

  protected onUserSegmentUpdate(
    request: core.UserSegmentUpdateRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
    feedDestinationCredentials?: FeedDestinationCredentials,
  ): Promise<core.UserSegmentUpdatePluginResponse> {
    this.onUserSegmentUpdateCalled = true;
    this.capturedFeedDestinationCredentials = feedDestinationCredentials;
    return Promise.resolve({ status: 'ok' });
  }

  protected onTroubleshoot(
    request: core.ExternalSegmentTroubleshootRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
    feedDestinationCredentials?: FeedDestinationCredentials,
  ): Promise<core.ExternalSegmentTroubleshootResponse> {
    this.onTroubleshootCalled = true;
    this.capturedFeedDestinationCredentials = feedDestinationCredentials;
    return Promise.resolve({ status: 'ok' });
  }
}

describe('Live path feed destination credentials', function () {
  const feedId = '512';

  function userSegmentUpdateRequest(feedDestinationId?: string): core.UserSegmentUpdateRequest {
    return {
      feed_id: feedId,
      session_id: 'session',
      datamart_id: '1023',
      segment_id: '451256',
      user_identifiers: [],
      user_profiles: [],
      ts: 1,
      operation: 'UPSERT',
      feed_destination_id: feedDestinationId,
    };
  }

  const buildRunner = (plugin: CapturingAudienceFeedConnector, credentialsImpl?: () => Promise<unknown>) =>
    buildFeedRunner(plugin, feedId, credentialsImpl);

  it('passes vault credentials to the handler when the request has feed_destination_id', function (done) {
    const credentials: FeedDestinationCredentials = { scheme: 'API_TOKEN', credentials: { token: 'secret' } };
    const plugin = new CapturingAudienceFeedConnector(false);
    const { runner } = buildRunner(plugin, () => Promise.resolve({ status: 'ok', data: credentials }));

    void request(runner.plugin.app)
      .post('/v1/user_segment_update')
      .send(userSegmentUpdateRequest('42'))
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(plugin.capturedFeedDestinationCredentials).to.deep.equal(credentials);
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('passes undefined credentials to the handler when the vault returns 404', function (done) {
    const notFound = { name: 'StatusCodeError', response: { statusCode: 404, statusMessage: 'Not Found', body: {} } };
    const plugin = new CapturingAudienceFeedConnector(false);
    const { runner } = buildRunner(plugin, () => Promise.reject(notFound));

    void request(runner.plugin.app)
      .post('/v1/user_segment_update')
      .send(userSegmentUpdateRequest('42'))
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(plugin.onUserSegmentUpdateCalled).to.be.true;
        expect(plugin.capturedFeedDestinationCredentials).to.be.undefined;
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('does not fetch credentials when the request has no feed_destination_id', function (done) {
    const plugin = new CapturingAudienceFeedConnector(false);
    const { runner, credentialsCall } = buildRunner(plugin, () => Promise.resolve({ status: 'ok', data: {} }));

    void request(runner.plugin.app)
      .post('/v1/user_segment_update')
      .send(userSegmentUpdateRequest(undefined))
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(plugin.onUserSegmentUpdateCalled).to.be.true;
        expect(plugin.capturedFeedDestinationCredentials).to.be.undefined;
        expect(credentialsCall.called).to.be.false;
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  function troubleshootRequest(feedDestinationId?: string): core.ExternalSegmentTroubleshootRequest {
    return {
      feed_id: feedId,
      datamart_id: '1023',
      segment_id: '451256',
      action: 'FETCH_DESTINATION_AUDIENCE',
      feed_destination_id: feedDestinationId,
    };
  }

  it('passes vault credentials to the troubleshoot handler when the request has feed_destination_id', function (done) {
    const credentials: FeedDestinationCredentials = { scheme: 'API_TOKEN', credentials: { token: 'secret' } };
    const plugin = new CapturingAudienceFeedConnector(false);
    const { runner } = buildRunner(plugin, () => Promise.resolve({ status: 'ok', data: credentials }));

    void request(runner.plugin.app)
      .post('/v1/troubleshoot')
      .send(troubleshootRequest('42'))
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(plugin.onTroubleshootCalled).to.be.true;
        expect(plugin.capturedFeedDestinationCredentials).to.deep.equal(credentials);
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('does not fetch credentials for troubleshoot when the request has no feed_destination_id', function (done) {
    const plugin = new CapturingAudienceFeedConnector(false);
    const { runner, credentialsCall } = buildRunner(plugin, () => Promise.resolve({ status: 'ok', data: {} }));

    void request(runner.plugin.app)
      .post('/v1/troubleshoot')
      .send(troubleshootRequest(undefined))
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(plugin.onTroubleshootCalled).to.be.true;
        expect(plugin.capturedFeedDestinationCredentials).to.be.undefined;
        expect(credentialsCall.called).to.be.false;
        runner.plugin.pluginCache.clear();
        done();
      });
  });
});

describe('Destination audience deletion', function () {
  const feedId = '74';

  class DeletingAudienceFeedConnector extends CapturingAudienceFeedConnector {
    public capturedRequest?: DestinationAudienceDeletionRequest;

    constructor(private readonly deletionResponse: DestinationAudienceDeletionPluginResponse) {
      super(false);
    }

    public capturedInstanceContext?: core.AudienceFeedConnectorBaseInstanceContext;

    protected onDestinationAudienceDeletion(
      request: DestinationAudienceDeletionRequest,
      instanceContext: core.AudienceFeedConnectorBaseInstanceContext,
      feedDestinationCredentials?: FeedDestinationCredentials,
    ): Promise<DestinationAudienceDeletionPluginResponse> {
      this.capturedRequest = request;
      this.capturedInstanceContext = instanceContext;
      this.capturedFeedDestinationCredentials = feedDestinationCredentials;
      return Promise.resolve(this.deletionResponse);
    }
  }

  function deletionRequest(feedDestinationId?: string): DestinationAudienceDeletionRequest {
    return {
      feed_id: feedId,
      datamart_id: '1023',
      segment_id: '451256',
      feed_destination_id: feedDestinationId,
    };
  }

  const buildRunner = (plugin: core.BasePlugin, credentialsImpl?: () => Promise<unknown>) =>
    buildFeedRunner(plugin, feedId, credentialsImpl);

  it('should return not_implemented (400) when onDestinationAudienceDeletion is not overridden', function (done) {
    const plugin = new MyFakeAudienceFeedConnector(false);
    const { runner } = buildRunner(plugin);

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send(deletionRequest())
      .end(function (err, res) {
        expect(res.status).to.equal(400);
        expect(JSON.parse(res.text).status).to.be.eq('not_implemented');
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('should return 400 without calling the handler when a required id is missing', function (done) {
    const plugin = new DeletingAudienceFeedConnector({ status: 'ok' });
    const rpMockup: sinon.SinonStub = sinon.stub().rejects(new Error('the gateway must not be called'));
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send({ feed_id: feedId, datamart_id: '1023' })
      .end(function (err, res) {
        expect(res.status).to.equal(400);
        expect(JSON.parse(res.text)).to.deep.equal({
          status: 'error',
          message: 'Missing feed_id, datamart_id or segment_id',
          visibility: 'PRIVATE',
        });
        expect(plugin.capturedRequest).to.be.undefined;
        expect(rpMockup.called).to.be.false;
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('should return 200 and ok, without fetching credentials when there is no feed_destination_id', function (done) {
    const plugin = new DeletingAudienceFeedConnector({ status: 'ok' });
    const { runner, credentialsCall } = buildRunner(plugin);

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send(deletionRequest())
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.text)).to.deep.equal({ status: 'ok' });
        expect(plugin.capturedRequest).to.deep.equal({
          feed_id: feedId,
          datamart_id: '1023',
          segment_id: '451256',
        });
        expect(plugin.capturedFeedDestinationCredentials).to.be.undefined;
        expect(credentialsCall.called).to.be.false;
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('should pass freshly fetched vault credentials to the handler, ignoring the plugin cache', function (done) {
    const credentials: FeedDestinationCredentials = { scheme: 'API_TOKEN', credentials: { token: 'rotated' } };
    const plugin = new DeletingAudienceFeedConnector({ status: 'ok' });
    const { runner, credentialsCall } = buildRunner(plugin, () => Promise.resolve({ status: 'ok', data: credentials }));

    void runner.plugin.pluginCache.put(
      'feed_destination_credentials:42',
      Promise.resolve({ scheme: 'API_TOKEN', credentials: { token: 'revoked' } }),
      3600,
    );

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send(deletionRequest('42'))
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(credentialsCall.called).to.be.true;
        expect(plugin.capturedFeedDestinationCredentials).to.deep.equal(credentials);
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('should return 200 and not_found when the destination audience is already absent', function (done) {
    const plugin = new DeletingAudienceFeedConnector({ status: 'not_found', message: 'Segment 42 not found' });
    const { runner } = buildRunner(plugin);

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send(deletionRequest())
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.text).status).to.be.eq('not_found');
        expect(JSON.parse(res.text).message).to.be.eq('Segment 42 not found');
        expect(JSON.parse(res.text).visibility).to.be.eq('PRIVATE');
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('should return 500 with a PRIVATE message by default when the deletion fails', function (done) {
    const plugin = new DeletingAudienceFeedConnector({
      status: 'error',
      message: 'HTTP 503 from https://api.partner.com/v2/audiences/42',
    });
    const { runner } = buildRunner(plugin);

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send(deletionRequest())
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        expect(JSON.parse(res.text).status).to.be.eq('error');
        expect(JSON.parse(res.text).visibility).to.be.eq('PRIVATE');
        expect(JSON.parse(res.text).message).to.be.eq('HTTP 503 from https://api.partner.com/v2/audiences/42');
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('should expose the error message when the connector asks for it', function (done) {
    const plugin = new DeletingAudienceFeedConnector({
      status: 'error',
      message: 'This audience is shared with another line item and cannot be deleted.',
      visibility: 'PUBLIC',
    });
    const { runner } = buildRunner(plugin);

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send(deletionRequest())
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        expect(JSON.parse(res.text).visibility).to.be.eq('PUBLIC');
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('should leave the instance context cached by the live path untouched', function (done) {
    const plugin = new DeletingAudienceFeedConnector({ status: 'ok' });
    const { runner } = buildRunner(plugin);
    const livePathContext = { feed: feedResponse(feedId).data, feedProperties: 'LIVE_PATH_CONTEXT' };

    void runner.plugin.pluginCache.put(feedId, Promise.resolve(livePathContext), 3600);

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send(deletionRequest())
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(plugin.capturedInstanceContext).to.not.equal(livePathContext);
        void (runner.plugin.pluginCache.get(feedId) as Promise<unknown>).then((cached) => {
          expect(cached).to.equal(livePathContext);
          runner.plugin.pluginCache.clear();
          done();
        });
      });
  });

  it('should report an instance context build failure as PRIVATE', function (done) {
    const plugin = new DeletingAudienceFeedConnector({ status: 'ok' });
    const rpMockup: sinon.SinonStub = sinon.stub().rejects(new Error('Not Found'));
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send(deletionRequest())
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        expect(JSON.parse(res.text).status).to.be.eq('error');
        expect(JSON.parse(res.text).visibility).to.be.eq('PRIVATE');
        expect(plugin.capturedRequest).to.be.undefined;
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('should report an AudienceFeedInstanceContextError as PUBLIC', function (done) {
    class BadContextAudienceFeedConnector extends DeletingAudienceFeedConnector {
      protected instanceContextBuilder(): Promise<core.AudienceFeedConnectorBaseInstanceContext> {
        return Promise.reject(new core.AudienceFeedInstanceContextError('The "Account id" property is missing'));
      }
    }

    const plugin = new BadContextAudienceFeedConnector({ status: 'ok' });
    const { runner } = buildRunner(plugin);

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send(deletionRequest())
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        expect(JSON.parse(res.text).status).to.be.eq('error');
        expect(JSON.parse(res.text).visibility).to.be.eq('PUBLIC');
        expect(JSON.parse(res.text).message).to.be.eq('The "Account id" property is missing');
        runner.plugin.pluginCache.clear();
        done();
      });
  });

  it('should report an uncaught connector error as PRIVATE', function (done) {
    class ThrowingAudienceFeedConnector extends DeletingAudienceFeedConnector {
      protected onDestinationAudienceDeletion(): Promise<DestinationAudienceDeletionPluginResponse> {
        return Promise.reject(new Error('ECONNRESET api.partner.com'));
      }
    }

    const plugin = new ThrowingAudienceFeedConnector({ status: 'ok' });
    const { runner } = buildRunner(plugin);

    void request(runner.plugin.app)
      .post('/v1/destination_audience_deletion')
      .send(deletionRequest())
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        expect(JSON.parse(res.text).status).to.be.eq('error');
        expect(JSON.parse(res.text).visibility).to.be.eq('PRIVATE');
        runner.plugin.pluginCache.clear();
        done();
      });
  });
});

describe('Credentials gateway 5xx - message sanitization', function () {
  const gateway5xxError = {
    name: 'StatusCodeError',
    response: { statusCode: 500, statusMessage: 'Internal Server Error', body: 'core-plugins-private-api unavailable' },
  };

  function build5xxCredentialsStub(): sinon.SinonStub {
    const rpMockup: sinon.SinonStub = sinon.stub();
    rpMockup
      .withArgs(
        sinon.match.has(
          'uri',
          sinon.match((value: string) => /\/v1\/feed_destinations\/(.+)\/credentials/.test(value)),
        ),
      )
      .rejects(gateway5xxError);
    return rpMockup;
  }

  it('dynamic_property_values_queries returns generic message on credentials 5xx — no internal URL or token leaked', function (done) {
    const plugin = new CapturingAudienceFeedConnector(false);
    const runner = new core.TestingPluginRunner(plugin, build5xxCredentialsStub());

    void request(runner.plugin.app)
      .post('/v1/dynamic_property_values_queries')
      .send({ datamart_id: '1', user_id: 'u1', feed_destination_id: '42' })
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        const body = JSON.parse(res.text) as { status: string; message: string };
        expect(body.status).to.equal('error');
        expect(body.message).to.equal('Unable to load the destination credentials. Please try again later.');
        expect(body.message).to.not.include('plugin-gateway');
        expect(body.message).to.not.include('http://');
        done();
      });
  });
});
