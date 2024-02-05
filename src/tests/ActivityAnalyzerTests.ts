/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

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

describe('Fetch analyzer API', () => {
  class MyFakeActivityAnalyzerPlugin extends core.ActivityAnalyzerPlugin {
    protected onActivityAnalysis(
      request: core.ActivityAnalyzerRequest,
      instanceContext: core.ActivityAnalyzerBaseInstanceContext,
    ) {
      const updatedActivity = request.activity;

      // We add a field on the processed activitynégative
      updatedActivity.processed_by = `${instanceContext.activityAnalyzer.group_id}:${instanceContext.activityAnalyzer.artifact_id} v.${instanceContext.activityAnalyzer.visit_analyzer_plugin_id}`;

      const response: core.ActivityAnalyzerPluginResponse = {
        status: 'ok',
        data: updatedActivity,
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
  const plugin = new MyFakeActivityAnalyzerPlugin(false);
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  it('Check that ActivityAnalyzerId is passed correctly in FetchActivityAnalyzer', async function () {
    const fakeActivityAnalyzerId = '42000000';

    // We try a call to the Gateway
    await (runner.plugin as MyFakeActivityAnalyzerPlugin).fetchActivityAnalyzer(fakeActivityAnalyzerId).then(() => {
      expect(rpMockup.args[0][0].url).to.be.eq(
        `${runner.plugin.outboundPlatformUrl}/v1/activity_analyzers/${fakeActivityAnalyzerId}`,
      );
    });
  });

  it('Check that ActivityAnalyzerId is passed correctly in FetchActivityAnalyzerProperties', async function () {
    const fakeActivityAnalyzerId = '4255';

    // We try a call to the Gateway
    await (runner.plugin as MyFakeActivityAnalyzerPlugin)
      .fetchActivityAnalyzerProperties(fakeActivityAnalyzerId)
      .then(() => {
        expect(rpMockup.args[1][0].url).to.be.eq(
          `${plugin.outboundPlatformUrl}/v1/activity_analyzers/${fakeActivityAnalyzerId}/properties`,
        );
      });
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });
});

describe('Activity Analysis API test', function () {
  let runner: core.TestingPluginRunner;

  class MyFakeSimpleActivityAnalyzerPlugin extends core.ActivityAnalyzerPlugin {
    protected onActivityAnalysis(
      request: core.ActivityAnalyzerRequest,
      instanceContext: core.ActivityAnalyzerBaseInstanceContext,
    ) {
      const response: core.ActivityAnalyzerPluginResponse = {
        status: 'ok',
        data: request.activity,
      };
      return Promise.resolve(response);
    }
  }

  // All the magic is here
  const plugin = new MyFakeSimpleActivityAnalyzerPlugin(false);

  it('Check that the plugin is giving good results with a simple activityAnalysis handler', function (done) {
    const rpMockup = sinon.stub();

    rpMockup.onCall(0).returns(
      new Promise((resolve, reject) => {
        const pluginInfo: core.DataResponse<core.ActivityAnalyzer> = {
          status: 'ok',
          data: {
            id: '42',
            organisation_id: '1001',
            name: 'Yolo',
            group_id: '5445',
            artifact_id: '5441',
            visit_analyzer_plugin_id: 555777,
          },
        };
        resolve(pluginInfo);
      }),
    );

    rpMockup.onCall(1).returns(
      new Promise((resolve, reject) => {
        const pluginInfo: core.PluginPropertyResponse = {
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
        resolve(pluginInfo);
      }),
    );

    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const requestBody = {
      activity_analyzer_id: 1923,
      datamart_id: 1034,
      channel_id: '1268',
      activity: {
        $email_hash: null,
        $events: [
          {
            $event_name: 'page HP',
            $properties: {
              $referrer: 'https://www.google.fr/',
              $url: 'https://estcequecestbientotlapero.fr/',
              produit: 'SANTE',
              'session id': 'tQ6GQojf',
            },
            $ts: 1479820606900,
          },
        ],
        $location: null,
        $session_duration: 302,
        $session_status: 'CLOSED_SESSION',
        $site_id: '1268',
        $topics: {},
        $ts: 1479820606901,
        $ttl: 0,
        $type: 'SITE_VISIT',
        $user_account_id: null,
        $user_agent_id: 'vec:289388396',
      },
    };

    void request(runner.plugin.app)
      .post('/v1/activity_analysis')
      .send(requestBody)
      .end(function (err, res) {
        expect(res.status).to.equal(200);

        expect(JSON.parse(res.text).data).to.deep.eq(requestBody.activity);

        done();
      });
  });

  it("Check that the plugin doesn't reply when not initialized", function (done) {
    const rpMockup = sinon.stub();

    runner = new core.TestingPluginRunner(plugin, rpMockup);

    // We init the plugin
    request(runner.plugin.app);
    const requestBody = {
      activity_analyzer_id: 123456789,
      datamart_id: 1034,
      channel_id: '1268',
      activity: {
        $email_hash: null,
        $events: [],
        $site_id: '1268',
        $ts: 1479820606901,
        $type: 'SITE_VISIT',
      },
    };

    void request(runner.plugin.app)
      .post('/v1/activity_analysis')
      .send(requestBody)
      .end(function (err, res) {
        expect(res.status).to.equal(500);
        expect(runner.plugin.pluginCache.size()).to.equal(
          0,
          "no cache should has been initialized when we don't even have init the plugin",
        );

        done();
      });
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });
});
