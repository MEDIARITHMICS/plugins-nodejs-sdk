/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */

import 'mocha';

import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';

import { core } from '../';
import { PropertiesWrapper } from '../mediarithmics';
import { CustomActionBaseInstanceContext } from '../mediarithmics/plugins/custom-action/CustomActionBasePlugin';

const PLUGIN_AUTHENTICATION_TOKEN = 'Manny';
const PLUGIN_WORKER_ID = 'Calavera';

// set by the plugin runner in production
process.env.PLUGIN_AUTHENTICATION_TOKEN = PLUGIN_AUTHENTICATION_TOKEN;
process.env.PLUGIN_WORKER_ID = PLUGIN_WORKER_ID;

class MyFakeCustomActionBasePlugin extends core.CustomActionBasePlugin {
  protected async instanceContextBuilder(customActionId: string): Promise<CustomActionBaseInstanceContext> {
    const customActionProps = await this.fetchCustomActionProperties(customActionId);

    const customAction = await this.fetchCustomAction(customActionId);

    const context: CustomActionBaseInstanceContext = {
      customAction: customAction,
      properties: new PropertiesWrapper(customActionProps),
    };

    return context;
  }

  protected onCustomActionCall(
    request: core.CustomActionRequest,
    instanceContext: core.CustomActionBaseInstanceContext,
  ): Promise<core.CustomActionPluginResponse> {
    const response: core.CustomActionPluginResponse = {
      status: 'ok',
    };
    return Promise.resolve(response);
  }
}

const rpMockup: sinon.SinonStub = sinon.stub().returns(
  new Promise((resolve, reject) => {
    resolve('Yolo');
  }),
);

describe('Fetch Scenario Custom Action Gateway API', () => {
  // All the magic is here
  const plugin = new MyFakeCustomActionBasePlugin(false);
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });

  it('Check that custom_action_id is passed correctly in fetchCustomActionProperties', async function () {
    const fakeId = '62';

    // We try to call the Gateway
    await (runner.plugin as MyFakeCustomActionBasePlugin).fetchCustomActionProperties(fakeId).then(() => {
      expect(rpMockup.args[0][0].url).to.be.eq(
        `${runner.plugin.outboundPlatformUrl}/v1/scenario_custom_actions/${fakeId}/properties`,
      );
    });
  });

  it('Check that custom_action_id is passed correctly in fetchCustomAction', async function () {
    const fakeId = '62';

    // We try to call the Gateway
    await (runner.plugin as MyFakeCustomActionBasePlugin).fetchCustomAction(fakeId).then(() => {
      expect(rpMockup.args[1][0].url).to.be.eq(
        `${runner.plugin.outboundPlatformUrl}/v1/scenario_custom_actions/${fakeId}`,
      );
    });
  });
});

describe('Custom Action API test', function () {
  // All the magic is here
  const plugin = new MyFakeCustomActionBasePlugin(false);
  let runner: core.TestingPluginRunner;

  after(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });

  it('Check that the plugin is giving good results with a simple handler', async function () {
    const rpMockup: sinon.SinonStub = sinon.stub();

    const customAction: core.DataResponse<core.CustomAction> = {
      status: 'ok',
      data: {
        id: '1',
        name: 'custom action',
        organisation_id: '1234',
        group_id: 'com.test.custom-action',
        artifact_id: 'test',
        creation_ts: 1234,
        created_by: '2',
        version_id: '3',
        version_value: '1.0.0',
      },
    };

    rpMockup
      .withArgs(
        sinon.match.has(
          'url',
          sinon.match(function (value: string) {
            return value.match(/\/v1\/scenario_custom_actions\/(.){1,10}$/) !== null;
          }),
        ),
      )
      .returns(customAction);

    const properties: core.DataListResponse<core.PluginProperty> = {
      status: 'ok',
      count: 1,
      data: [
        {
          technical_name: 'hello_world',
          value: {
            value: 'Sacre Hubert',
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
            return value.match(/\/v1\/scenario_custom_actions\/(.){1,10}\/properties/) !== null;
          }),
        ),
      )
      .returns(properties);

    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const customActionRequest: core.CustomActionRequest = {
      user_point_id: '26340584-f777-404c-82c5-56220667464b',
      custom_action_id: '62',
      datamart_id: '1234',
      node_id: '25',
      scenario_id: '888',
    };

    const res = await request(runner.plugin.app).post('/v1/scenario_custom_actions').send(customActionRequest);
    expect(res.status).to.equal(200);
    expect(JSON.parse(res.text).status).to.be.eq('ok');
  });
});
