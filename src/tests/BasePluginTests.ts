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

describe('Plugin Status API Tests', function () {
  class MyFakePlugin extends core.BasePlugin {}

  it('should return plugin status (200) if the plugin is OK', async function () {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin);

    const res = await request(runner.plugin.app).get('/v1/status');
    expect(res.status).to.equal(200);
  });
});

describe('Plugin Metadata API Tests', function () {
  class MyFakePlugin extends core.BasePlugin {}

  it('should return metadata', async function () {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin);

    const res = await request(runner.plugin.app).get('/v1/metadata');
    expect(res.status).to.equal(200);
    expect(JSON.stringify(res.body)).to.equal(
      JSON.stringify({ runtime: 'node', runtime_version: process.version, dependencies: {} }),
    );
  });
});

describe('Plugin log level API tests', function () {
  class MyFakePlugin extends core.BasePlugin {}

  it('Log Level update should return 200', async function () {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin);

    const requestBody = {
      level: 'debug',
    };

    const res = await request(runner.plugin.app).put('/v1/log_level').send(requestBody);
    expect(res.status).to.equal(200);
  });

  it('Malformed Log level update should return 400', async function () {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin);

    // Bad input format
    const requestBody = {
      hector: 'debug',
    };

    const res = await request(runner.plugin.app).put('/v1/log_level').send(requestBody);
    expect(res.status).to.equal(400);
  });

  it('Should return WARN when getting Log Level', async function () {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin);

    const requestBody = {
      level: 'WARN',
    };

    const res1 = await request(runner.plugin.app).put('/v1/log_level').send(requestBody);
    expect(res1.status).to.equal(200);

    const res2 = await request(runner.plugin.app).get('/v1/log_level');
    expect(res2.status).to.equal(200);
    expect(res2.body.level).to.equal(requestBody.level);
  });
});

describe('Request Gateway helper API tests', function () {
  const rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve('YOLO'));

  class MyFakePlugin extends core.BasePlugin {}

  it('Check that url is passed correctly', async function () {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const fakeUri = '/v1/easter_eggs/';
    const fakeMethod = 'GET';

    // We try a call to the Gateway
    await runner.plugin.requestGatewayHelper({ method: 'GET', url: fakeUri }).then(() => {
      expect(rpMockup.args[0][0].method).to.be.eq(fakeMethod);
      expect(rpMockup.args[0][0].url).to.be.eq(fakeUri);
    });
  });

  it('Authentification token should be passed from values passed in the env', async function () {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    // We try a call to the Gateway
    await runner.plugin.requestGatewayHelper({ method: 'GET', url: '/v1/easter_eggs/' }).then(() => {
      expect(rpMockup.args[1][0].headers.pass).to.be.eq(PLUGIN_AUTHENTICATION_TOKEN);
      expect(rpMockup.args[1][0].headers.user).to.be.eq(PLUGIN_WORKER_ID);
    });
  });

  it('Check that body is passed correctly when set', async function () {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const fakeUri = '/v1/easter_eggs/';
    const fakeMethod = 'GET';
    const fakeBody = { sucess: true };

    // We try a call to the Gateway
    await runner.plugin.requestGatewayHelper({ method: 'GET', url: fakeUri, body: fakeBody }).then(() => {
      expect(rpMockup.args[2][0].method).to.be.eq(fakeMethod);
      expect(rpMockup.args[2][0].url).to.be.eq(fakeUri);
      expect(rpMockup.args[2][0].json).to.be.eq(fakeBody);
    });
  });
});

describe('Data File helper Tests', function () {
  class MyFakePlugin extends core.BasePlugin {}

  const fakeDataFile = Buffer.from('Hello');

  const rpMockup = sinon.stub().returns(Promise.resolve(fakeDataFile));

  const plugin = new MyFakePlugin(false);
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  it('DataFile: Should call the proper gateway URL', async function () {
    const dataFileGatewayURI = '/v1/data_file/data';
    const method = 'GET';
    const fakeDataFileURI = 'mics://fake_dir/fake_file';

    // We try a call to the Gateway
    await runner.plugin.fetchDataFile(fakeDataFileURI).then((file) => {
      expect(rpMockup.args[0][0].method).to.be.eq(method);
      expect(rpMockup.args[0][0].url).to.be.eq(
        `http://${runner.plugin.gatewayHost}:${runner.plugin.gatewayPort}${dataFileGatewayURI}`,
      );
      expect(rpMockup.args[0][0].searchParams['uri']).to.be.eq(fakeDataFileURI);
      expect(file).to.be.eq(fakeDataFile);
    });
  });

  it('ConfigurationFile: Should call the proper gateway URL', async function () {
    const confFileName = 'toto';
    const method = 'GET';
    const confFileGatewayURI = `/v1/configuration/technical_name=${confFileName}`;

    // We try a call to the Gateway
    await runner.plugin.fetchConfigurationFile(confFileName).then((file) => {
      expect(rpMockup.args[1][0].method).to.be.eq(method);
      expect(rpMockup.args[1][0].url).to.be.eq(
        `http://${runner.plugin.gatewayHost}:${runner.plugin.gatewayPort}${confFileGatewayURI}`,
      );
      expect(file).to.be.eq(fakeDataFile);
    });
  });
});

describe('Instance Context Expiration Tests', function () {
  class MyFakePlugin extends core.BasePlugin {}

  it('InstanceContextExpiration: Check Instance Context variability: should be less than 10%', function () {
    const plugin = new MyFakePlugin(false);

    const refreshInterval = plugin.getInstanceContextCacheExpiration();

    expect(refreshInterval).to.be.gte(plugin.INSTANCE_CONTEXT_CACHE_EXPIRATION);
    expect(refreshInterval).to.be.lte(plugin.INSTANCE_CONTEXT_CACHE_EXPIRATION * 1.1);
  });
});
