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

  it('update route with null state', async () => {
    runner = new core.TestingPluginRunner(plugin);

    const data = {
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
    runner = new core.TestingPluginRunner(plugin);

    const data = {
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
    runner = new core.TestingPluginRunner(plugin);

    const data = {
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
    runner = new core.TestingPluginRunner(plugin);

    const data1 = {
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
