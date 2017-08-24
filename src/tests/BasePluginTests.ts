import { expect } from "chai";
import "mocha";
import { core } from "../";
import * as request from "supertest";
import * as sinon from "sinon";
import * as mockery from "mockery";
import * as rp from "request-promise-native";

describe("Plugin Status API Tests", function() {
  let plugin: core.BasePlugin;
  beforeEach(function() {
    plugin = new core.BasePlugin();
  });
  afterEach(function() {
    plugin.server.close();
  });

  it("should return plugin status (200) if the plugin is OK", function(done) {
    request(plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);
      });

    request(plugin.app).get("/v1/status").end(function(err, res) {
      expect(res.status).to.equal(200);
      done();
    });
  });

  it("should return (503) if the plugin is not initialized yet", function(
    done
  ) {
    request(plugin.app).get("/v1/status").end(function(err, res) {
      expect(res.status).to.equal(503);
      done();
    });
  });
});

describe("Plugin log level API tests", function() {
  let plugin: core.BasePlugin;
  beforeEach(function() {
    plugin = new core.BasePlugin();
  });
  afterEach(function() {
    plugin.server.close();
  });

  it("Log Level update should return 200", function(done) {
    // All the magic is here

    const requestBody = {
      level: "debug"
    };

    request(plugin.app)
      .put("/v1/log_level")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it("Malformed Log level update should return 400", function(done) {
    // Bad input format
    const requestBody = {
      hector: "debug"
    };

    request(plugin.app)
      .put("/v1/log_level")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(400);
        done();
      });
  });

  it("Should return warn when getting Log Level", function(done) {
    const requestBody = {
      level: "warn"
    };

    request(plugin.app)
      .put("/v1/log_level")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(200);
      });

    request(plugin.app).get("/v1/log_level").end(function(err, res) {
      expect(res.status).to.equal(200);
      expect(res.body.level).to.equal("warn");
      done();
    });
  });
});

describe("Request Gateway helper API tests", function() {
  let plugin: core.BasePlugin;
  let requestPromiseProx: sinon.SinonStub = sinon.stub().returns("Fake answer");

  beforeEach(function(done) {
    requestPromiseProx = sinon.stub().returns(
      new Promise((resolve, reject) => {
        resolve("Yolo");
      })
    );

    plugin = new core.BasePlugin();

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

  it("Check that uri is passed correctly", function(done) {
    // We replace the request-promise-native in the plugin
    plugin._transport = require("request-promise-native");

    const fakeUri = "/v1/easter_eggs/";
    const fakeMethod = "GET";

    // We try a call to the Gateway
    plugin.requestGatewayHelper("GET", fakeUri).then(() => {
      expect(requestPromiseProx.args[0][0].method).to.be.eq(fakeMethod);
      expect(requestPromiseProx.args[0][0].uri).to.be.eq(
        fakeUri
      );
      done();
    });
  });

  it("Authentification token should be passed from values passed in /v1/init", function(
    done
  ) {
    // We replace the request-promise-native in the plugin
    plugin._transport = require("request-promise-native");

    const authenticationToken = "Manny";
    const workerId = "Calavera";

    // We init the plugin
    request(plugin.app)
      .post("/v1/init")
      .send({ authentication_token: authenticationToken, worker_id: workerId })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        // We try a call to the Gateway
        plugin.requestGatewayHelper("GET", "/v1/easter_eggs/").then(() => {
          expect(requestPromiseProx.args[0][0].auth.pass).to.be.eq(
            authenticationToken
          );
          expect(requestPromiseProx.args[0][0].auth.user).to.be.eq(workerId);
          done();
        });
      });
  });

  it("Check that body is passed correctly when set", function(done) {
    // We replace the request-promise-native in the plugin
    plugin._transport = require("request-promise-native");

    const fakeUri = "/v1/easter_eggs/";
    const fakeMethod = "GET";
    const fakeBody = { sucess: true }

    // We try a call to the Gateway
    plugin.requestGatewayHelper("GET", fakeUri, fakeBody).then(() => {
      expect(requestPromiseProx.args[0][0].method).to.be.eq(fakeMethod);
      expect(requestPromiseProx.args[0][0].uri).to.be.eq(
        fakeUri
      );
      expect(requestPromiseProx.args[0][0].body).to.be.eq(
        fakeBody
      );
      done();
    });
  });
});
