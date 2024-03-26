import request from 'supertest';

import 'mocha';

import { MyComputedField, State } from '../MyComputedField';
import { core } from '@mediarithmics/plugins-nodejs-sdk';
import { expect } from 'chai';
import * as ion from 'ion-js';

process.env.PLUGIN_WORKER_ID = 'Calavera';
process.env.PLUGIN_AUTHENTICATION_TOKEN = 'Manny';

describe('ClientComputedField', function () {
  const plugin = new MyComputedField();
  let runner: core.TestingPluginRunner;

  it('update route', async () => {
    runner = new core.TestingPluginRunner(plugin);

    const ionData =
      '{state:{ts:33,amount:55},data:{events:[{ts:1,amount:1},{ts:2,amount:2},{ts:3,amount:3},{ts:2,amount:2}]}}';
    const response = await request(runner.plugin.app).post('/v1/update').send({ data: ionData });

    expect((response.body as core.OnUpdatePluginResponse<State>).status).to.deep.equal('ok');
    expect((response.body as core.OnUpdatePluginResponse<State>).data).to.deep.equal({
      ts: 2,
      amount: 2,
    });
  });

  it('update route with null state', async () => {
    runner = new core.TestingPluginRunner(plugin);

    const ionData = '{state:null,data:{events:[{ts:1,amount:1},{ts:2,amount:2},{ts:3,amount:3},{ts:2,amount:2}]}}';
    const response = await request(runner.plugin.app).post('/v1/update').send({ data: ionData });

    expect((response.body as core.OnUpdatePluginResponse<State>).status).to.deep.equal('ok');
    expect((response.body as core.OnUpdatePluginResponse<State>).data).to.deep.equal({
      ts: 2,
      amount: 2,
    });
  });

  it('update batch route', async () => {
    runner = new core.TestingPluginRunner(plugin);

    const ionData =
      '{state:{ts:33,amount:55},data:[{events:[{ts:1,amount:1}]},{events:[{ts:2,amount:2},{ts:3,amount:3}]}]}';
    const response = await request(runner.plugin.app).post('/v1/update/batch').send({ data: ionData });

    expect((response.body as core.OnUpdatePluginResponse<State>).status).to.deep.equal('ok');
    expect((response.body as core.OnUpdatePluginResponse<State>).data).to.deep.equal({
      ts: 3,
      amount: 3,
    });
  });

  it('build result route', async () => {
    runner = new core.TestingPluginRunner(plugin);

    const ionData1 =
      '{state:{ts:33,amount:55},data:[{events:[{ts:1,amount:1}]},{events:[{ts:2,amount:2},{ts:3,amount:3}]}]}';
    const update1 = await request(runner.plugin.app).post('/v1/update/batch').send({ data: ionData1 });
    expect((update1.body as core.OnUpdatePluginResponse<State>).status).to.deep.equal('ok');
    expect((update1.body as core.OnUpdatePluginResponse<State>).data).to.deep.equal({
      ts: 3,
      amount: 3,
    });

    const state1 = ion.dumpText((update1.body as core.OnUpdatePluginResponse<State>).data);

    const ionData2 = `{state:${state1},data:[{events:[{ts:2,amount:2}]},{events:[{ts:4,amount:4},{ts:6,amount:6}]}]}`;
    const update2 = await request(runner.plugin.app).post('/v1/update/batch').send({ data: ionData2 });
    expect((update2.body as core.OnUpdatePluginResponse<State>).status).to.deep.equal('ok');
    expect((update2.body as core.OnUpdatePluginResponse<State>).data).to.deep.equal({
      ts: 6,
      amount: 6,
    });

    const state2 = ion.dumpText((update2.body as core.OnUpdatePluginResponse<State>).data);
    const buildResult = await request(runner.plugin.app).post('/v1/buildresult').send({ data: state2 });
    expect((buildResult.body as core.OnUpdatePluginResponse<State>).status).to.deep.equal('ok');
    expect((buildResult.body as core.OnUpdatePluginResponse<State>).data).to.deep.equal({
      result: {
        score: 1,
      },
      state: {
        ts: 6,
        amount: 6,
      },
    });
  });
});
