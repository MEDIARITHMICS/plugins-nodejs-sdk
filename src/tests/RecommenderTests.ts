import {expect} from 'chai';
import 'mocha';
import {core} from '../';
import {newGatewaySdkMock} from '../mediarithmics/api/sdk/GatewaySdkMock';
import {IRecommenderSdk} from '../mediarithmics/api/sdk/GatewaySdk';
import {RecommenderApiTester} from '../helper';

describe('Fetch recommender API', () => {
  class MyFakeRecommenderPlugin extends core.RecommenderPlugin {
    protected onRecommendationRequest(
      request: core.RecommenderRequest,
      instanceContext: core.RecommenderBaseInstanceContext
    ) {
      const proposal: core.ItemProposal = {
        $type: 'ITEM_PROPOSAL',
        $id: '42'
      };

      const response: core.RecommenderPluginResponse = {
        ts: Date.now(),
        proposals: [proposal],
        recommendation_log: 'yolo'
      };

      return Promise.resolve(response);
    }
  }

  const gatewaySdk = newGatewaySdkMock<IRecommenderSdk>({
    fetchRecommenderCatalogs: Promise.resolve({} as any),
    fetchRecommenderProperties: Promise.resolve({} as any),
  });
  const plugin = new MyFakeRecommenderPlugin({gatewaySdk: gatewaySdk});

  it('Check that recommenderId is passed correctly in fetchRecommenderProperties', async function () {
    const fakeRecommenderId = '42000000';
    await plugin.gatewaySdk.fetchRecommenderProperties(fakeRecommenderId);
    expect(gatewaySdk.calledMethods.fetchRecommenderProperties.getArgs(0)?.[0] === fakeRecommenderId);
  });

  it('Check that RecommenderId is passed correctly in fetchRecommenderCatalogs', async function () {
    const fakeRecommenderId = '4255';
    await plugin.gatewaySdk.fetchRecommenderCatalogs(fakeRecommenderId);
    expect(gatewaySdk.calledMethods.fetchRecommenderCatalogs.getArgs(0)?.[0] === fakeRecommenderId);
  });
});

describe('Recommender API test', function () {
  class MyFakeSimpleRecommenderPlugin extends core.RecommenderPlugin {
    protected onRecommendationRequest(
      request: core.RecommenderRequest,
      instanceContext: core.RecommenderBaseInstanceContext
    ) {
      const response: core.RecommenderPluginResponse = {
        ts: Date.now(),
        recommendation_log: '',
        proposals: []
      };
      return Promise.resolve(response);
    }
  }

  const gatewaySdk = newGatewaySdkMock<IRecommenderSdk>({
    fetchRecommenderCatalogs: Promise.resolve({}) as any,
    fetchRecommenderProperties: Promise.resolve([
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
  const plugin = new MyFakeSimpleRecommenderPlugin({gatewaySdk: gatewaySdk});

  it('Check that the plugin is giving good results with a simple onRecommendationRequest handler', async function () {
    const tester = new RecommenderApiTester(plugin);
    await tester.init();

    const requestBody = {
      recommender_id: '5',
      datamart_id: '1089',
      user_identifiers: [],
      input_data: {
        user_agent_id: 'vec:971677694'
      }
    };

    await tester.postRecommendation(requestBody);
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    plugin.pluginCache.clear();
  });
});
