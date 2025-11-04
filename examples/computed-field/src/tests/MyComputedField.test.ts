import * as sinon from 'sinon';
import request from 'supertest';

import 'mocha';

import { core } from '@mediarithmics/plugins-nodejs-sdk';
import { expect } from 'chai';
import { MyComputedField, Result, State } from '../MyComputedField';
import { DataType, Operation } from '../../../../lib/mediarithmics/plugins/computed-field/ComputedFieldBasePlugin';

process.env.PLUGIN_WORKER_ID = 'Calavera';
process.env.PLUGIN_AUTHENTICATION_TOKEN = 'Manny';

describe('ClientComputedField - json data', function () {
  const plugin = new MyComputedField();
  let runner: core.TestingPluginRunner;

  const rpMockup: sinon.SinonStub = sinon.stub();

  rpMockup
    .withArgs(
      sinon.match.has(
        'uri',
        sinon.match(function (value: string) {
          return value.match(/\/v1\/computed_fields\/(.){1,10}/) !== null;
        }),
      ),
    )
    .returns({
      status: 'ok',
      data: {
        id: '62',
        organisation_id: '6262',
        datamart_id: '626262',
        group_id: '62_62',
        artifact_id: '62-62',
        plugin_id: '62',
        version_id: '6262',
        status: 'ACTIVE',
        technical_name: 'testComputedField',
        name: 'computedFieldForTest',
        filter_graphql_query: '62',
        cache_max_duration: 62,
        version_value: '62',
        created_ts: 62,
        created_by: '62',
        archived: false,
      },
    });

  it('update route with null state', async () => {
    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const data = {
      computed_field_id: '62',
      update: {
        data_type: 'USER_ACTIVITY',
        operation: 'UPSERT',
        data: { events: [{ basketPrice: 1 }, { basketPrice: 2 }, { basketPrice: 3 }, { basketPrice: 2 }] },
      },
    };
    const response = JSON.parse(
      (await request(runner.plugin.app).post('/v1/computed_field/update/single').send(JSON.stringify(data))).text,
    ) as core.OnUpdatePluginResponse<State>;

    expect(response.status).to.deep.equal('ok');
    expect(response.data).to.deep.equal({
      state: {
        totalSpentAmount: 8,
      },
    });
  });

  it('update route with state', async () => {
    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const data = {
      computed_field_id: '62',
      state: { totalSpentAmount: 10 },
      update: {
        data_type: 'USER_ACTIVITY',
        operation: 'UPSERT',
        data: {
          events: [{ basketPrice: 1 }, { basketPrice: 2 }, { basketPrice: 3 }, { basketPrice: 2 }],
        },
      },
    };

    const response = JSON.parse(
      (await request(runner.plugin.app).post('/v1/computed_field/update/single').send(JSON.stringify(data))).text,
    ) as core.OnUpdatePluginResponse<State>;

    expect(response.status).to.deep.equal('ok');
    expect(response.data).to.deep.equal({
      state: { totalSpentAmount: 18 },
    });
  });

  it('update batch route', async () => {
    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const data = {
      computed_field_id: '62',
      state: { totalSpentAmount: 55 },
      updates: [
        {
          data_type: 'USER_ACTIVITY',
          operation: 'UPSERT',
          data: { events: [{ basketPrice: 1 }] },
        },
        {
          data_type: 'USER_ACTIVITY',
          operation: 'UPSERT',
          data: { events: [{ basketPrice: 2 }, { basketPrice: 3 }] },
        },
      ],
    };

    const response = JSON.parse(
      (await request(runner.plugin.app).post('/v1/computed_field/update/batch').send(JSON.stringify(data))).text,
    ) as core.OnUpdatePluginResponse<State>;

    expect(response.status).to.deep.equal('ok');
    expect(response.data).to.deep.equal({
      state: { totalSpentAmount: 61 },
    });
  });

  it('build result route', async () => {
    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const data1 = {
      computed_field_id: '62',
      state: { totalSpentAmount: 55 },
      updates: [
        {
          data_type: 'USER_ACTIVITY',
          operation: 'UPSERT',
          data: { events: [{ basketPrice: 1 }] },
        },
        {
          data_type: 'USER_ACTIVITY',
          operation: 'UPSERT',
          data: { events: [{ basketPrice: 2 }, { basketPrice: 3 }] },
        },
      ],
    };

    const update1 = JSON.parse(
      (await request(runner.plugin.app).post('/v1/computed_field/update/batch').send(JSON.stringify(data1))).text,
    ) as core.OnUpdatePluginResponse<State>;

    expect(update1.status).to.deep.equal('ok');
    expect(update1.data).to.deep.equal({
      state: { totalSpentAmount: 61 },
    });

    const data2 = {
      computed_field_id: '62',
      state: update1.data.state,
      updates: [
        {
          data_type: 'USER_ACTIVITY',
          operation: 'UPSERT',
          data: { events: [{ basketPrice: 2 }] },
        },
        {
          data_type: 'USER_ACTIVITY',
          operation: 'UPSERT',
          data: { events: [{ basketPrice: 4 }, { basketPrice: 6 }] },
        },
      ],
    };

    const update2 = JSON.parse(
      (await request(runner.plugin.app).post('/v1/computed_field/update/batch').send(JSON.stringify(data2))).text,
    ) as core.OnUpdatePluginResponse<State>;

    expect(update2.status).to.deep.equal('ok');
    expect(update2.data).to.deep.equal({
      state: { totalSpentAmount: 73 },
    });

    const buildResult = JSON.parse(
      (await request(runner.plugin.app).post('/v1/computed_field/build_result').send(JSON.stringify(update2.data)))
        .text,
    ) as core.OnUpdatePluginResponse<Result>;

    expect(buildResult.status).to.deep.equal('ok');
    expect(buildResult.data).to.deep.equal({
      result: { score: 73 },
    });
  });
});
