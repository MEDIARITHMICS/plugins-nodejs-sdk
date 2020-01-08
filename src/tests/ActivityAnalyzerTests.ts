import {expect} from 'chai';
import 'mocha';
import {core} from '../';
import {newGatewaySdkMock} from '../mediarithmics/api/sdk/GatewaySdkMock';
import {IActivityAnalyzerSdk} from '../mediarithmics/api/sdk/GatewaySdk';
import {ActivityAnalyzerTester} from '../helper';

describe('Fetch analyzer API', () => {

  class MyFakeActivityAnalyzerPlugin extends core.ActivityAnalyzerPlugin {
    protected onActivityAnalysis(
      request: core.ActivityAnalyzerRequest,
      instanceContext: core.ActivityAnalyzerBaseInstanceContext
    ) {
      const updatedActivity = request.activity;
      // We add a field on the processed activitynégative
      updatedActivity.processed_by = `${instanceContext.activityAnalyzer
        .group_id}:${instanceContext.activityAnalyzer
        .artifact_id} v.${instanceContext.activityAnalyzer
        .visit_analyzer_plugin_id}`;

      const response: core.ActivityAnalyzerPluginResponse = {
        status: 'ok',
        data: updatedActivity
      };

      return Promise.resolve(response);
    }
  }

  const gatewayMock = newGatewaySdkMock<IActivityAnalyzerSdk>({
    fetchActivityAnalyzer: Promise.resolve({} as any),
    fetchActivityAnalyzerProperties: Promise.resolve({} as any),
  });

  const plugin = new MyFakeActivityAnalyzerPlugin({gatewaySdk: gatewayMock});

  it('Check that ActivityAnalyzerId is passed correctly in FetchActivityAnalyzer', async function () {
    const fakeActivityAnalyzerId = '42000000';
    await plugin.gatewaySdk.fetchActivityAnalyzer(fakeActivityAnalyzerId);
    expect(gatewayMock.calledMethods.fetchActivityAnalyzer.calledTime() > 0);
  });

  it('Check that ActivityAnalyzerId is passed correctly in FetchActivityAnalyzerProperties', async function () {
    const fakeActivityAnalyzerId = '4255';
    await plugin.gatewaySdk.fetchActivityAnalyzerProperties(fakeActivityAnalyzerId);
    expect(gatewayMock.calledMethods.fetchActivityAnalyzerProperties.calledTime() > 0);
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    plugin.pluginCache.clear();
  });
});

describe('Activity Analysis API test', function () {

  class MyFakeSimpleActivityAnalyzerPlugin extends core.ActivityAnalyzerPlugin {
    protected onActivityAnalysis(
      request: core.ActivityAnalyzerRequest,
      instanceContext: core.ActivityAnalyzerBaseInstanceContext
    ) {
      const response: core.ActivityAnalyzerPluginResponse = {
        status: 'ok',
        data: request.activity
      };
      return Promise.resolve(response);
    }
  }

  it('Check that the plugin is giving good results with a simple activityAnalysis handler', async function () {

    const requestBody = JSON.parse(`{
      "activity_analyzer_id": 1923,
      "datamart_id": 1034,
      "channel_id": "1268",
      "activity": {
        "$email_hash": null,
        "$events": [
          {
            "$event_name": "page HP",
            "$properties": {
              "$referrer": "https://www.google.fr/",
              "$url": "https://estcequecestbientotlapero.fr/",
              "produit": "SANTE",
              "session id": "tQ6GQojf"
            },
            "$ts": 1479820606900
          }
        ],
        "$location": null,
        "$session_duration": 302,
        "$session_status": "CLOSED_SESSION",
        "$site_id": "1268",
        "$topics": {},
        "$ts": 1479820606901,
        "$ttl": 0,
        "$type": "SITE_VISIT",
        "$user_account_id": null,
        "$user_agent_id": "vec:289388396"
      }
    }`);

    const output = await new ActivityAnalyzerTester(MyFakeSimpleActivityAnalyzerPlugin).process({
      input: requestBody,
      activityAnalyzer: {
        id: '42',
        organisation_id: '1001',
        name: 'Yolo',
        group_id: '5445',
        artifact_id: '5441',
        visit_analyzer_plugin_id: 555777
      },
      properties: [
        {
          technical_name: 'hello_world',
          value: {
            value: 'Yay'
          },
          property_type: 'STRING',
          origin: 'PLUGIN',
          writable: true,
          deletable: false
        }
      ]
    });
    expect(ActivityAnalyzerTester.compare(requestBody.activity, output.data)).true;
  });
});
