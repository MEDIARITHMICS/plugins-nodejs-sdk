/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */

import 'mocha';

import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';

import { core } from '../';

const PLUGIN_AUTHENTICATION_TOKEN = 'Manny';
const PLUGIN_WORKER_ID = 'Calavera';

// set by the plugin runner in production
process.env.PLUGIN_AUTHENTICATION_TOKEN = PLUGIN_AUTHENTICATION_TOKEN;
process.env.PLUGIN_WORKER_ID = PLUGIN_WORKER_ID;

describe('Fetch recommender API', () => {
  class MyFakeRecommenderPlugin extends core.RecommenderPlugin {
    protected onRecommendationRequest(
      request: core.RecommenderRequest,
      instanceContext: core.RecommenderBaseInstanceContext,
    ) {
      const proposal: core.ItemProposal = {
        $type: 'ITEM_PROPOSAL',
        $id: '42',
      };

      const response: core.RecommendationsWrapper = {
        ts: Date.now(),
        proposals: [proposal],
        recommendation_log: 'yolo',
      };

      return Promise.resolve(response);
    }
  }

  const rpMockup: sinon.SinonStub = sinon.stub().returns(
    new Promise((resolve, reject) => {
      resolve('Yolo');
    }),
  );

  // All the magic is here
  const plugin = new MyFakeRecommenderPlugin();
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  it('Check that recommenderId is passed correctly in fetchRecommenderProperties', async function () {
    const fakeRecommenderId = '42000000';

    // We try a call to the Gateway
    await (runner.plugin as MyFakeRecommenderPlugin).fetchRecommenderProperties(fakeRecommenderId).then(() => {
      expect(rpMockup.args[0][0].url).to.be.eq(
        `${runner.plugin.outboundPlatformUrl}/v1/recommenders/${fakeRecommenderId}/properties`,
      );
    });
  });

  it('Check that RecommenderId is passed correctly in fetchRecommenderCatalogs', async function () {
    const fakeRecommenderId = '4255';

    // We try a call to the Gateway
    await (runner.plugin as MyFakeRecommenderPlugin).fetchRecommenderCatalogs(fakeRecommenderId).then(() => {
      expect(rpMockup.args[1][0].url).to.be.eq(
        `${plugin.outboundPlatformUrl}/v1/recommenders/${fakeRecommenderId}/catalogs`,
      );
    });
  });
});

describe('Recommender API test', function () {
  class MyFakeSimpleRecommenderPlugin extends core.RecommenderPlugin {
    protected onRecommendationRequest(
      request: core.RecommenderRequest,
      instanceContext: core.RecommenderBaseInstanceContext,
    ) {
      const response: core.RecommendationsWrapper = {
        ts: Date.now(),
        recommendation_log: '',
        proposals: [],
      };
      return Promise.resolve(response);
    }
  }

  // All the magic is here
  const plugin = new MyFakeSimpleRecommenderPlugin();
  let runner: core.TestingPluginRunner;

  after(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });

  it('Check that the plugin is giving good results with a simple onRecommendationRequest handler', async function () {
    const rpMockup = sinon.stub();

    const fakeRecommenderProperties = {
      status: 'ok',
      count: 45,
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
          'url',
          sinon.match(function (value: string) {
            return value.match(/\/v1\/recommenders\/(.){1,10}\/properties/) !== null;
          }),
        ),
      )
      .returns(fakeRecommenderProperties);

    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const requestBody = {
      recommender_id: '5',
      datamart_id: '1089',
      user_identifiers: [],
      input_data: {
        user_agent_id: 'vec:971677694',
      },
    };

    const res = await request(runner.plugin.app).post('/v1/recommendations').send(requestBody);
    expect(res.status).to.equal(200);
  });
});
