import {expect} from 'chai';
import 'mocha';
import {core} from '../';
import {newGatewaySdkMock} from '../mediarithmics/api/sdk/GatewaySdkMock';
import {IAudienceFeedConnectorSdk} from '../mediarithmics/api/sdk/GatewaySdk';
import {AudienceFeedApiTester} from '../helper';

class MyFakeAudienceFeedConnector extends core.AudienceFeedConnectorBasePlugin {
  protected onExternalSegmentCreation(
    request: core.ExternalSegmentCreationRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext
  ): Promise<core.ExternalSegmentCreationPluginResponse> {
    const response: core.ExternalSegmentCreationPluginResponse = {
      status: 'ok'
    };
    return Promise.resolve(response);
  }

  protected onExternalSegmentConnection(
    request: core.ExternalSegmentConnectionRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext
  ): Promise<core.ExternalSegmentConnectionPluginResponse> {
    const response: core.ExternalSegmentConnectionPluginResponse = {
      status: 'ok'
    };
    return Promise.resolve(response);
  }

  protected onUserSegmentUpdate(
    request: core.UserSegmentUpdateRequest,
    instanceContext: core.AudienceFeedConnectorBaseInstanceContext
  ): Promise<core.UserSegmentUpdatePluginResponse> {
    const response: core.UserSegmentUpdatePluginResponse = {
      status: 'ok'
    };
    return Promise.resolve(response);
  }
}

describe('Fetch Audience Feed Gateway API', () => {
  const gatewayMock = newGatewaySdkMock<IAudienceFeedConnectorSdk>({
    fetchAudienceFeed: Promise.resolve({} as any),
    fetchAudienceFeedProperties: Promise.resolve({} as any),
    fetchAudienceSegment: Promise.resolve({} as any),
  });
  const plugin = new MyFakeAudienceFeedConnector({gatewaySdk: gatewayMock});

  it('Check that feed_id is passed correctly in fetchAudienceFeedProperties', async function () {
    const fakeId = '42000000';
    await plugin.gatewaySdk.fetchAudienceFeedProperties(fakeId);
    expect(gatewayMock.calledMethods.fetchAudienceFeedProperties.getArgs(0)?.[0] === fakeId);
  });

  it('Check that feed_id is passed correctly in fetchAudienceSegment', async function () {
    const fakeId = '42000000';
    await plugin.gatewaySdk.fetchAudienceSegment(fakeId);
    expect(gatewayMock.calledMethods.fetchAudienceSegment.getArgs(0)?.[0] === fakeId);
  });
});

describe('External Audience Feed API test', function () {

  const audienceFeed: core.AudienceSegmentExternalFeedResource = {
    id: '74',
    plugin_id: '984',
    organisation_id: '95',
    group_id: 'com.mediarithmics.audience-feed',
    artifact_id: 'awesome-audience-feed',
    version_id: '1254'
  };

  const properties: core.PluginProperty[] = [
    {
      technical_name: 'hello_world',
      value: {value: 'Yay'},
      property_type: 'STRING',
      origin: 'PLUGIN',
      writable: true,
      deletable: false
    }
  ];
  const gatewayMock = newGatewaySdkMock<IAudienceFeedConnectorSdk>({
    fetchAudienceFeed: Promise.resolve(audienceFeed),
    fetchAudienceFeedProperties: Promise.resolve(properties),
    fetchAudienceSegment: Promise.resolve({} as any),
  });

  const plugin = new MyFakeAudienceFeedConnector({gatewaySdk: gatewayMock});

  it('Check that the plugin is giving good results with a simple handler', async function () {
    const externalSegmentCreation: core.ExternalSegmentCreationRequest = {
      feed_id: '42',
      datamart_id: '1023',
      segment_id: '451256'
    };

    const externalSegmentConnection: core.ExternalSegmentConnectionRequest = {
      feed_id: '42',
      datamart_id: '1023',
      segment_id: '451256'
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
          user_point_id: '26340584-f777-404c-82c5-56220667464b'
        } as core.UserPointIdentifierInfo,
        {
          type: 'USER_ACCOUNT',
          user_account_id: '914eb2aa50cef7f3a8705b6bb54e50bb',
          creation_ts: 1493118667529
        } as core.UserAccountIdentifierInfo,
        {
          type: 'USER_EMAIL',
          hash: 'e2749f6f4d8104ec385a75490b587c86',
          email: undefined,
          operator: undefined,
          creation_ts: 1493118667529,
          last_activity_ts: 1493127642622,
          providers: []
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
            carrier: undefined
          },
          creation_ts: 1493118667529,
          last_activity_ts: 1493126966889,
          providers: [],
          mappings: []
        } as core.UserAgentIdentifierInfo
      ]
    };
    const tester = new AudienceFeedApiTester(plugin);
    await tester.init();

    const resCreation = await tester.postExternalSegmentCreation(externalSegmentCreation);
    expect(resCreation.parsedText.status).to.be.eq('ok');

    const resConnection = await tester.postExternalSegmentConnection(externalSegmentConnection);
    expect(resConnection.parsedText.status).to.be.eq('ok');

    const resUpdate = await tester.postUserSegmentUpdate(userSegmentUpdateRequest);
    expect(resUpdate.parsedText.status).to.be.eq('ok');
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    plugin.pluginCache.clear();
  });
});
