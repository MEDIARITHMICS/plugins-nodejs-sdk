import { expect } from "chai";
import "mocha";
import { core } from "@mediarithmics/plugins-nodejs-sdk";
import * as request from "supertest";
import * as sinon from "sinon";
import * as mockery from "mockery";
import * as rp from "request-promise-native";

describe("Test Example Activity Analyzer", function() {
  it("toto", function(done) {
    // All the magic is here
    const plugin = new core.ActivityAnalyzerPlugin();

    plugin.setOnActivityAnalysis();

    plugin.start();
  });
});
