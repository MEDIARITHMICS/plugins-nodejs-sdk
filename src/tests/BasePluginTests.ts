import {expect} from 'chai';
import 'mocha';
import {core} from '../';
import {newGatewaySdkMock} from '../mediarithmics/api/sdk/GatewaySdkMock';
import {GatewaySdk, IBaseSdk} from '../mediarithmics/api/sdk/GatewaySdk';
import {PluginApiTester} from '../helper';

describe('Plugin Status API Tests', function () {
  class MyFakePlugin extends core.BasePlugin {
  }

  const gatewayMock = newGatewaySdkMock<IBaseSdk>({
    fetchDataFile: Promise.resolve({} as any),
    fetchConfigurationFile: Promise.resolve({} as any),
  });

  it('should return plugin status (200) if the plugin is OK', async function () {
    const plugin = new MyFakePlugin({gatewaySdk: gatewayMock});
    const tester = new PluginApiTester(plugin);
    await tester.init();
    await tester.getStatus();
  });

  it('should return (503) if the plugin is not initialized yet', async function () {
    const plugin = new MyFakePlugin({gatewaySdk: gatewayMock});
    const tester = new PluginApiTester(plugin);
    try {
      await tester.getStatus();
      expect(false).eq(true);
    } catch (statusCode) {
      expect(statusCode).eq(503);
    }
  });
});

describe('Plugin log level API tests', function () {
  class MyFakePlugin extends core.BasePlugin {
  }

  const gatewayMock = newGatewaySdkMock<IBaseSdk>({
    fetchDataFile: Promise.resolve({} as any),
    fetchConfigurationFile: Promise.resolve({} as any),
  });

  it('Log Level update should return 200', async function () {
    const plugin = new MyFakePlugin({gatewaySdk: gatewayMock});
    const tester = new PluginApiTester(plugin);
    await tester.setLogLevel('debug');
  });

  it('Malformed Log level update should return 400', async function () {
    const plugin = new MyFakePlugin({gatewaySdk: gatewayMock});
    const tester = new PluginApiTester(plugin);
    try {
      await tester.put('/v1/log_level', {hector: 'debug'});
      expect(false).eq(true);
    } catch (statusCode) {
      expect(statusCode).to.equal(400);
    }
  });

  it('Should return WARN when getting Log Level', async function () {
    const logLevel = 'warn';
    const plugin = new MyFakePlugin({gatewaySdk: gatewayMock});
    const tester = new PluginApiTester(plugin);
    await tester.setLogLevel(logLevel);
    const res = await tester.get('/v1/log_level');
    expect(res.body.level).to.equal(logLevel.toUpperCase());
  });
});

describe('Request Gateway helper API tests', function () {

  class MyFakePlugin extends core.BasePlugin {
  }

  it('Authentification token should be passed from values passed in /v1/init', async function () {
    const plugin = new MyFakePlugin();
    const tester = new PluginApiTester(plugin);
    const authenticationToken = 'Manny';
    const workerId = 'Calavera';
    await tester.init({authentication_token: authenticationToken, worker_id: workerId});

    // We try a call to the Gateway
    const sdkHeader = (plugin.gatewaySdk as GatewaySdk).client.options?.().headers;
    expect(sdkHeader.auth.pass).to.be.eq(authenticationToken);
    expect(sdkHeader.auth.user).to.be.eq(workerId);
  });
});

describe('Data File helper Tests', function () {
  class MyFakePlugin extends core.BasePlugin {
  }

  const authenticationToken = 'Manny';
  const workerId = 'Calavera';
  const fakeDataFile = new Buffer('Hello');
  const gatewayMock = newGatewaySdkMock<IBaseSdk>({
    fetchDataFile: Promise.resolve(fakeDataFile),
    fetchConfigurationFile: Promise.resolve(fakeDataFile),
  });

  const plugin = new MyFakePlugin({gatewaySdk: gatewayMock});

  it('DataFile: Should call the proper gateway URL', async function () {
    const tester = new PluginApiTester(plugin);
    await tester.init({authentication_token: authenticationToken, worker_id: workerId});
    // We try a call to the Gateway
    plugin.gatewaySdk.fetchDataFile('mics://fake_dir/fake_file').then(file => {
      expect(file).to.be.eq(fakeDataFile);
    });
  });

  it('ConfigurationFile: Should call the proper gateway URL', async function () {
    const tester = new PluginApiTester(plugin);
    await tester.init({authentication_token: authenticationToken, worker_id: workerId});
    plugin.gatewaySdk.fetchConfigurationFile('toto').then(file => {
      expect(file).to.be.eq(fakeDataFile);
    });
  });
});

describe('Instance Context Expiration Tests', function () {

  class MyFakePlugin extends core.BasePlugin {
  }

  it('InstanceContextExpiration: Check Instance Context variability: should be less than 10%', function () {
    const plugin = new MyFakePlugin();
    const refreshInterval = plugin.getInstanceContextCacheExpiration();
    expect(refreshInterval).to.be.gte(plugin.INSTANCE_CONTEXT_CACHE_EXPIRATION);
    expect(refreshInterval).to.be.lte(plugin.INSTANCE_CONTEXT_CACHE_EXPIRATION * 1.1);
  });
});