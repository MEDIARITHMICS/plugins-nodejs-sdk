import 'mocha';

import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';

import { core } from '../index';
import { ActivityAnalyzerPlugin } from '../mediarithmics';

type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';

const activityAnalyzer: core.ActivityAnalyzerResponse = {
  status: 'ok',
  data: {
    id: '1000',
    name: 'my analyzer',
    organisation_id: '1000',
    visit_analyzer_plugin_id: 1001,
    group_id: 'com.mediarithmics.visit-analyzer',
    artifact_id: 'default',
  },
};

const rpMockupGlobal: sinon.SinonStub = sinon.stub();
const mockApi = (uriPattern: RegExp): sinon.SinonStub => {
  return rpMockupGlobal.withArgs(
    sinon.match.has(
      'url',
      sinon.match((value: string) => value.match(uriPattern) !== null),
    ),
  );
};

mockApi(/\/v1\/activity_analyzers\/(.){1,10}/).returns(activityAnalyzer);

const itFactory =
  (plugin: ActivityAnalyzerPlugin, property: core.PluginPropertyResponse, logLevel: LogLevel = 'info') =>
  (name: string, input: string, output: string) => {
    const runner = new core.TestingPluginRunner(plugin, rpMockupGlobal);

    after(function () {
      runner.plugin.pluginCache.clear();
    });

    it(name, async function () {
      mockApi(/\/v1\/activity_analyzers\/(.){1,10}\/properties/).returns(property);

      const res1 = await request(runner.plugin.app).put('/v1/log_level').send({ level: logLevel });
      expect(res1.status).to.equal(200);

      const res2 = await request(runner.plugin.app).post('/v1/activity_analysis').send(input);
      expect(res2.status).to.eq(200);
      expect(JSON.parse(res2.text)).to.be.deep.equal(output);
    });
  };

export { itFactory, mockApi };
