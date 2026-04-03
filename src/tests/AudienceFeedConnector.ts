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
  TestAuthenticationPluginResponse,
} from '../mediarithmics/api/plugin/audiencefeedconnector/AudienceFeedConnectorPluginResponseInterface';
import {
  CreateOAuthRedirectUrlRequest,
  ExternalSegmentAuthenticationRequest,
  TestAuthenticationRequest,
} from '../mediarithmics/api/plugin/audiencefeedconnector/AudienceFeedConnectorRequestInterface';
import {
  FeedDestinationCredentials,
} from '../mediarithmics';

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
    return Promise.resolve({ status: 'ok' });
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
  it('should call upsertFeedDestinationCredentials and strip credentials when feed_destination_id present', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({}));
    const plugin = new MyFakeAudienceFeedConnectorWithOAuth(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const req: ExternalSegmentAuthenticationRequest = {
      user_id: 'user1',
      plugin_version_id: '99',
      feed_destination_id: '42',
      params: { code: 'auth-code', state: '42' },
    };

    void request(runner.plugin.app)
      .post('/v1/authentication')
      .send(req)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.text).status).to.be.eq('ok');
        expect(JSON.parse(res.text).credentials).to.be.undefined;
        expect(rpMockup.calledOnce).to.be.true;
        expect(rpMockup.args[0][0].uri).to.include('/v1/feed_destinations/42/credentials');
        expect(rpMockup.args[0][0].method).to.be.eq('POST');
        done();
      });
  });

  it('should not call upsertFeedDestinationCredentials when feed_destination_id is absent', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({}));
    const plugin = new MyFakeAudienceFeedConnectorWithOAuth(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const req: ExternalSegmentAuthenticationRequest = {
      user_id: 'user1',
      plugin_version_id: '99',
      params: { code: 'auth-code', state: 'some-state' },
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

  it('should return 500 when feed_destination_id is present but plugin returns no credentials', function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve({}));
    const plugin = new MyFakeAudienceFeedConnectorWithOAuthNoCredentials(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const req: ExternalSegmentAuthenticationRequest = {
      user_id: 'user1',
      plugin_version_id: '99',
      feed_destination_id: '42',
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

    void plugin.upsertFeedDestinationCredentials('42', {
      scheme: 'OAUTH2',
      credentials: { refresh_token: 'my-token' },
    }).then(() => {
      expect(rpMockup.args[0][0].uri).to.be.eq(
        `${plugin.outboundPlatformUrl}/v1/feed_destinations/42/credentials`,
      );
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
