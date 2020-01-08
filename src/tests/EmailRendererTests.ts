import {expect} from 'chai';
import 'mocha';
import {core} from '../';
import {newGatewaySdkMock} from '../mediarithmics/api/sdk/GatewaySdkMock';
import {IEmailRendererSdk} from '../mediarithmics/api/sdk/GatewaySdk';
import {EmailRendererApiTester} from '../helper';

class MyFakeEmailRendererPlugin extends core.EmailRendererPlugin {
  protected onEmailContents(
    request: core.EmailRenderRequest,
    instanceContext: core.EmailRendererBaseInstanceContext
  ): Promise<core.EmailRendererPluginResponse> {
    const response: core.EmailRendererPluginResponse = {
      content: {
        html: request.call_id
      },
      meta: {
        from_email: 'hello@hello.com',
        from_name: 'Hello',
        to_email: 'hello@destination.com',
        to_name: 'Destination',
        reply_to: 'hello@hello.com',
        subject_line: 'Hello You!'
      }
    };

    return Promise.resolve(response);
  }
}

const gatewayMock = newGatewaySdkMock<IEmailRendererSdk>({
  fetchCreative: Promise.resolve({} as any),
  fetchCreativeProperties: Promise.resolve({} as any),
});

describe('Fetch Email Renderer API', () => {
  const plugin = new MyFakeEmailRendererPlugin({gatewaySdk: gatewayMock});

  it('Check that email_renderer_id is passed correctly in fetchCreative & fetchCreativeProperties', async function () {
    const fakeId = '42000000';

    // We try a call to the Gateway
    await plugin.gatewaySdk.fetchCreative(fakeId);
    expect(gatewayMock.calledMethods.fetchCreative.getArgs(0)?.[0] === fakeId);
    // We try a call to the Gateway
    await plugin.gatewaySdk.fetchCreativeProperties(fakeId);
    expect(gatewayMock.calledMethods.fetchCreativeProperties.getArgs(0)?.[0] === fakeId);
  });
});

describe('Email Renderer API test', function () {
  const gatewayMock = newGatewaySdkMock<IEmailRendererSdk>({
    fetchCreative: Promise.resolve({
      type: 'EMAIL_TEMPLATE',
      id: '8592',
      organisation_id: '1135',
      name: 'Market Box',
      technical_name: 'hello',
      archived: false,
      editor_version_id: '1020',
      editor_version_value: '1.0.0',
      editor_group_id: 'com.mediarithmics.template.email',
      editor_artifact_id: 'default-editor',
      editor_plugin_id: '1015',
      renderer_version_id: '1047',
      renderer_version_value: '1.0.1',
      renderer_group_id: 'com.mediarithmics.email-renderer',
      renderer_artifact_id: 'email-handlebars-template',
      renderer_plugin_id: '1034',
      creation_date: 1504533940679,
      subtype: 'EMAIL_TEMPLATE'
    }),
    fetchCreativeProperties: Promise.resolve([
      {
        technical_name: 'hello_world',
        value: {value: 'Yay'},
        property_type: 'STRING',
        origin: 'PLUGIN',
        writable: true,
        deletable: false
      }
    ]),
  });
  const plugin = new MyFakeEmailRendererPlugin({gatewaySdk: gatewayMock});

  it('Check that the plugin is giving good results with a simple onEmailContents handler', async function () {
    const tester = new EmailRendererApiTester(plugin);
    await tester.init();

    const requestBody = JSON.parse(`{
      "email_renderer_id": "1034",
      "call_id": "8e20e0fc-acb5-4bf3-8e36-f85a9ff25150",
      "context": "LIVE",
      "creative_id": "6475",
      "campaign_id": "1810",
      "campaign_technical_name": null,
      "user_identifiers": [
        {
          "type": "USER_POINT",
          "user_point_id": "62ce5f30-191d-40fb-bd6b-8ea6f39c80eb"
        },
        {
          "type": "USER_EMAIL",
          "hash": "8865501e69c464f42a5ae7bada6d342a",
          "email": "email_mics_152@yopmail.com",
          "operator": null,
          "creation_ts": 1489688728108,
          "last_activity_ts": 1489688728108,
          "providers": []
        }
      ],
      "user_data_bag": {},
      "click_urls": [],
      "email_tracking_url": null
    }`);
    const res = await tester.postEmailContents(requestBody);
    expect(res.parsedText.content.html).to.be.eq(requestBody.call_id);
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    plugin.pluginCache.clear();
  });
});
