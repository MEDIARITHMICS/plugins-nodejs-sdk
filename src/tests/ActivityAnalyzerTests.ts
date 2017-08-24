import { expect } from "chai";
import "mocha";
import { core } from "../";
import * as request from "supertest";
import * as sinon from "sinon";
import * as mockery from "mockery";
import * as rp from "request-promise-native";

describe("Fetch analyzer API", () => {
  let plugin: core.ActivityAnalyzerPlugin;
  let requestPromiseProx: sinon.SinonStub = sinon.stub().returns("Fake answer");

  beforeEach(function(done) {
    requestPromiseProx = sinon.stub().returns(
      new Promise((resolve, reject) => {
        resolve("Yolo");
      })
    );

    plugin = new core.ActivityAnalyzerPlugin();

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    mockery.registerMock("request-promise-native", function(
      options: rp.Options
    ) {
      return Promise.resolve(requestPromiseProx(options));
    });

    done();
  });

  afterEach(function(done) {
    plugin.server.close();
    mockery.disable();
    mockery.deregisterAll();
    done();
  });

  it("Check that ActivityAnalyzerId is passed correctly in FetchActivityAnalyzer", function(
    done
  ) {
    // We replace the request-promise-native in the plugin
    plugin._transport = require("request-promise-native");

    const fakeActivityAnalyzerId = "42000000";

    // We try a call to the Gateway
    plugin.fetchActivityAnalyzer(fakeActivityAnalyzerId).then(() => {
      expect(requestPromiseProx.args[0][0].uri).to.be.eq(
        `${plugin.outboundPlatformUrl}/v1/activity_analyzers/${fakeActivityAnalyzerId}`
      );
      done();
    });
  });

  it("Check that ActivityAnalyzerId is passed correctly in FetchActivityAnalyzerProperties", function(
    done
  ) {
    // We replace the request-promise-native in the plugin
    plugin._transport = require("request-promise-native");

    const fakeActivityAnalyzerId = "4255";

    // We try a call to the Gateway
    plugin.fetchActivityAnalyzerProperties(fakeActivityAnalyzerId).then(() => {
      expect(requestPromiseProx.args[0][0].uri).to.be.eq(
        `${plugin.outboundPlatformUrl}/v1/activity_analyzers/${fakeActivityAnalyzerId}/properties`
      );
      done();
    });
  });
});

describe("Activity Analysis API test", function() {
  let plugin: core.ActivityAnalyzerPlugin;
  let requestPromiseProx: sinon.SinonStub = sinon.stub().returns("Fake answer");

  beforeEach(function(done) {
    requestPromiseProx = sinon.stub().returns(
      new Promise((resolve, reject) => {
        resolve("Yolo");
      })
    );

    plugin = new core.ActivityAnalyzerPlugin();

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    mockery.registerMock("request-promise-native", function(
      options: rp.Options
    ) {
      return Promise.resolve(requestPromiseProx(options));
    });

    done();
  });

  afterEach(function(done) {
    plugin.server.close();
    mockery.disable();
    mockery.deregisterAll();
    done();
  });

  it("Check that the plugin is not OK if there is no ActivityAnalysisHandler", function(
    done
  ) {
    // All the magic is here

    plugin.start();

    const requestBody = {};

    request(plugin.app)
      .post("/v1/activity_analysis")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(500);
        done();
      });
  });

  it("Check that the plugin is giving good results with a simple activityAnalysis handler", function(
    done
  ) {
    requestPromiseProx = sinon.stub();
    requestPromiseProx.onCall(0).returns(
      new Promise((resolve, reject) => {
        const pluginInfo: core.ActivityAnalyzerResponse = {
          status: "ok",
          count: 2,
          data: {
            id: "42",
            organisation_id: "1001",
            name: "Yolo",
            group_id: "5445",
            artifact_id: "5441",
            visit_analyzer_plugin_id: 555777
          }
        };
        resolve(pluginInfo);
      })
    );
    requestPromiseProx.onCall(1).returns(
      new Promise((resolve, reject) => {
        const pluginInfo: core.ActivityAnalyzerPropertyResponse = {
          status: "ok",
          count: 45,
          data: [{
            technical_name: "hello_world",
            value: {
             value: "Yay" 
            },
            property_type: "STRING",
            origin: "PLUGIN",
            writable: true,
            deletable: false
          }]
        };
        resolve(pluginInfo);
      })
    );

    mockery.registerMock("request-promise-native", function(
      options: rp.Options
    ) {
      return Promise.resolve(requestPromiseProx(options));
    });

    plugin._transport = require("request-promise-native");

    plugin.setOnActivityAnalysis((analyzerRequest, instanceContext) => {
      const response: core.ActivityAnalyzerPluginResponse = {
        status: "ok",
        data: analyzerRequest.activity
      };
      return response;
    });
    plugin.start();

    request(plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);
      });

    const requestBody = JSON.parse(`{
      "activity_analyzer_id": 1923,
      "datamart_id": 1034,
      "channel_id": "1268",
      "activity": {
        "$email_hash": null,
        "$events": [
          {
            "$event_name": "page HP",
            "$properties": {
              "$referrer": "https://www.google.fr/",
              "$url": "https://estcequecestbientotlapero.fr/",
              "produit": "SANTE",
              "session id": "tQ6GQojf"
            },
            "$ts": 1479820606900
          }
        ],
        "$location": null,
        "$session_duration": 302,
        "$session_status": "CLOSED_SESSION",
        "$site_id": "1268",
        "$topics": {},
        "$ts": 1479820606901,
        "$ttl": 0,
        "$type": "SITE_VISIT",
        "$user_account_id": null,
        "$user_agent_id": "vec:289388396"
      }
    }`);

    request(plugin.app)
      .post("/v1/activity_analysis")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(200);
        
        expect(JSON.parse(res.text).data).to.deep.eq(requestBody.activity);
      
        done();
      });
  });
});
