import { expect } from "chai";
import * as sinon from "sinon";
import nock = require('nock');
import * as request from "supertest";
import { core } from "@mediarithmics/plugins-nodejs-sdk";

const credentials = require("../../src/tests/support/properties");
const configuration = require("../../src/tests/support/configuration");
import * as ExampleAudienceFeed from "../services/ExampleAudienceFeed";

import { IExampleAudienceFeedConnector } from "../interfaces/IExampleAudienceFeedConnector";
import ExampleAudienceFeedConnector from "../MyPluginImpl";
import { AudienceFeedConnectorBasePlugin } from "@mediarithmics/plugins-nodejs-sdk/lib/mediarithmics";

let createSegmentStub: sinon.SinonStub;
let populateEmailsAudience: sinon.SinonStub;
let getAllSegmentsStub: sinon.SinonStub;

const LOG_LEVEL: string = "debug";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

describe("Test Example Audience Feed Manager", function() {
    
  beforeEach(() => {
    // v1/log_level
    if (createSegmentStub) {
      nock('http://api.exampleaudiencefeed.com')
      .persist()
      .post('/v1/external_segment_creation')
      .query({
        payload : audienceSegmentId
         }
      )
      .reply(200, {
        results: [{  payload : audienceSegmentId }],
      })
      .log(console.log);
    }
    if (createSegmentStub) {
      nock('http://api.exampleaudiencefeed.com')
      .persist()
      .post('/v1/audience_segment_external_feeds')
      .query({
        payload : audienceSegmentId
         }
      )
      .reply(200, {
        results: [{ status: 'ok' }],
      })
      .log(console.log);
      
    }
    if (createSegmentStub) {
      nock('http://api.exampleaudiencefeed.com')
      .post('/v1/init')
      .query({
        instanceContext: 22
      })
      .reply(200, {
        results: [{ status: 'ok' }],
      });
      
    } 
    if (getAllSegmentsStub) {
      nock('http://api.exampleaudiencefeed.com')
      .persist()
      .get('/v1/external_segment_connection/${id}')
      .query({
            payload : audienceSegmentId,
         }
      )
      .reply(200, {
        results: [{ status: 'ok' }],
      });
      
    }
    if (populateEmailsAudience) {
      nock('http://api.exampleaudiencefeed.com')
      .get('/v1/init')
      .query({
        instanceContext: 22
      })
      .reply(200, {
        results: [{ status: 'ok' }],
      });
      
    } 
   if (populateEmailsAudience) {
    nock('http://api.exampleaudiencefeed.com')
    .post('/v1/user_segment_update/${id}')
    .query({
      audience_id: 'device_ifa,list_id,delete\n38400000-8cf0-11bd-b23e-10b96e40000a,3456,0'
    })
    .reply(200, {
      results: [{ status: 'ok' }],
    });
    
  } 
}) 
  const audienceSegmentName = "Awesome Segment";
  const audienceSegmentId = "1254";

  function buildGatewayRpMockup() {
 
    const rpMockup: sinon.SinonStub = sinon.stub();
    const pluginRes: core.DataResponse<core.AudienceSegmentExternalFeedResource> = {
      status: "ok",
      data: {
        id: "125",
        plugin_id: "121",
        organisation_id: "15471",
        group_id: "hello",
        artifact_id: "lolo",
        version_id: "what's up"
      }
    };

    rpMockup
      .withArgs(
        sinon.match.has(
          "uri",
          sinon.match(function(value: string) {
            return (
              value.match(
                /\/v1\/audience_segment_external_feeds\/(.){1,10}/
              ) !== null
            );
          })
        )
      ) 
    .returns(pluginRes);

    const audienceSegment: core.DataResponse<core.AudienceSegmentResource> = {
      status: "ok",
      data: {
        id: audienceSegmentId,
        name: audienceSegmentName,
        organisation_id: "45614455",
        short_description: "hello",
        technical_name: "lolo",
        datamart_id: "what's up",
        provider_name: "44",
        persisted: true,
        default_ttl: 0
      }
    };
    rpMockup
      .withArgs(
        
        sinon.match.has(
          "uri",
          sinon.match(function(value: string) {
            return (
              value.match(
                /\/v1\/audience_segment_external_feeds\/(.){1,10}\/audience_segment/
              ) !== null
            );
          })
        )
      )
      .returns(audienceSegment);

    const pluginProperties = {
      status: "ok",
      data: [
        {
          technical_name: "api-key",
          value: {
            value: "apikey"
          },
          property_type: "STRING",
          origin: "PLUGIN",
          writable: true,
          deletable: false
        },    
        {
            technical_name: "exampleaudiencefeed_audience_id",
            value: {
              value: "audience_id"
            },
            property_type: "STRING",
            origin: "PLUGIN",
            writable: true,
            deletable: false
          },    
          {
              technical_name: "exampleaudiencefeed_audience_name",
              value: {
                value: "audience_name"
              },
              property_type: "STRING",
              origin: "PLUGIN",
              writable: true,
              deletable: false
            }, 
      ],
      count: 1
    };

    rpMockup
      .withArgs(
        sinon.match.has(
          "uri",
          sinon.match(function(value: string) {
            return (
              value.match(
                /\/v1\/audience_segment_external_feeds\/(.){1,10}\/properties/
              ) !== null
            );
          })
        )
      )
      .returns(pluginProperties);

    rpMockup
      .withArgs(
        sinon.match.has(
          "uri",
          sinon.match(function(value: string) {
            return (
              value.match(
                /\/v1\/configuration\/technical_name=configuration/
              ) !== null
            );
          })
        )
      )
      .returns(new Buffer(JSON.stringify(configuration)));

    rpMockup
      .withArgs(
        sinon.match.has(
          "uri",
          sinon.match(function(value: string) {
            return (
              value.match(/\/v1\/configuration\/technical_name=credentials/) !==
              null
            );
          })
        )
      )
      .returns(new Buffer(JSON.stringify(credentials)));

    return rpMockup;
  }

  it("Check the segment creation", function(done) {
    // All the magic is here
    const plugin = new ExampleAudienceFeedConnector();
    const rpMockup = buildGatewayRpMockup();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    // Payload
    const payload: core.ExternalSegmentCreationRequest = {
      feed_id: "1234",
      datamart_id: "9012",
      segment_id: "3456"
    };

    // ExampleAudienceFeed results
    createSegmentStub = sinon.stub(ExampleAudienceFeed, "createCustomAudience")
      .returns({
        results: {
          audienceId: payload.segment_id
        }
      });
    // Plugin init
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        request(runner.plugin.app)
          .put("/v1/log_level")
          .send({ level: LOG_LEVEL })
          .end((err, res) => {
            expect(res.status).to.be.equal(200);
            // Activity to process
            request(runner.plugin.app)
                .post("/v1/external_segment_creation")
                .send(payload)
                .end((err, res) => {
                    expect(res.status).to.be.equal(200);
                    expect(
                        (JSON.parse(
                        res.text
                        ) as core.ExternalSegmentCreationPluginResponse).status
                    ).to.be.equal('ok');
                done();
              });
          });
      });
  });

  it("Check the segment creation when the segment already exists", function(done) {
    // All the magic is here
    const plugin = new ExampleAudienceFeedConnector();
    const rpMockup = buildGatewayRpMockup();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    // Payload
    const payload: core.ExternalSegmentCreationRequest = {
      feed_id: "1234",
      datamart_id: "9012",
      segment_id: "3456"
    };

    // ExampleAudienceFeed results
    getAllSegmentsStub = sinon.stub(ExampleAudienceFeed, "getAllSegments")
      .returns({
        id: "1254"
      });

    // Plugin init
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        request(runner.plugin.app)
          .put("/v1/log_level")
          .send({ level: LOG_LEVEL })
          .end((err, res) => {
            expect(res.status).to.equal(200);

            // Activity to process
            request(runner.plugin.app)
              .post("/v1/external_segment_creation")
              .send(payload)
              .end((err, res) => {
                expect(res.status).to.eq(200);
                expect(
                  (JSON.parse(
                    res.text
                  ) as core.ExternalSegmentCreationPluginResponse).status
                ).to.be.eq("ok");

                done();
              });
          });
      });
  });

  it("Check the segment connection when external API is OK", function(done) {
    // All the magic is here
    const plugin = new ExampleAudienceFeedConnector();
    const rpMockup = buildGatewayRpMockup();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const payload: core.ExternalSegmentConnectionRequest = {
      feed_id: "1234",
      datamart_id: "3434",
      segment_id: "3456"
    };

    populateEmailsAudience = sinon.stub(ExampleAudienceFeed, "pushEmailsAudience").returns(`{
        "instanceContext": 22,
        "id": 1,
        "payload": ${payload},
        "logger": 3.0722387
      }`);

    // Plugin init
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        request(runner.plugin.app)
          .put("/v1/log_level")
          .send({ level: LOG_LEVEL })
          .end((err, res) => {
            expect(res.status).to.equal(200);

            // Activity to process
            request(runner.plugin.app)
              .post("/v1/external_segment_connection")
              .send(payload)
              .end((err, res) => {
                expect(res.status).to.equal(200);
                expect(
                  (JSON.parse(
                    res.text
                  ) as core.ExternalSegmentConnectionPluginResponse).status
                ).to.be.equal("ok");     
              });
              done();
          });
      });
  });

  it("Check the segment connection when external API is KO (e.g. the dummy user was not inserted in the segment)", function(done) {
    // All the magic is here
    const plugin = new ExampleAudienceFeedConnector();
    const rpMockup = buildGatewayRpMockup();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const payload: core.ExternalSegmentConnectionRequest = {
      feed_id: "1234",
      datamart_id: "9012",
      segment_id: "3456"
    };
      
    
    // Plugin init
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        request(runner.plugin.app)
          .put("/v1/log_level")
          .send({ level: LOG_LEVEL })
          .end((err, res) => {
            expect(res.status).to.equal(200);

            // Activity to process
            request(runner.plugin.app)
              .post("/v1/external_segment_connection")
              .send(payload)
              .end((err, res) => {
                expect(res.status).to.equal(500);
                expect(
                  (JSON.parse(
                    res.text
                  ) as core.ExternalSegmentConnectionPluginResponse).status
                ).to.be.eq("external_segment_not_ready_yet");        

                const credentialsAPI = populateEmailsAudience.getCall(0).args[0];
                const payloadAPI = populateEmailsAudience.getCall(0).args[1];

                /* Authentication checks */
                expect(credentialsAPI.dmpId).to.be.eq(
                  credentials.credentials.test.dmp_id
                );
                expect(credentialsAPI.token).to.be.eq(
                  credentials.credentials.test.token
                );

                /* Body checks */
                expect(payloadAPI).to.be.eq(
                  payloadAPI
                );

              });
              
          });
      });
      
      done();
  });

  it("Check the user segment update", function(done) {
    // All the magic is here
    const plugin = new ExampleAudienceFeedConnector();
    const rpMockup = buildGatewayRpMockup();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const payload: core.UserSegmentUpdateRequest = {
      feed_id: "1234",
      session_id: "5678",
      datamart_id: "9012",
      segment_id: "3456",
      ts: Date.now(),
      operation: "UPSERT",
      user_identifiers: [
        {
          type: "USER_AGENT",
          vector_id: "vec:12345",
          device: {
            form_factor: "PERSONAL_COMPUTER",
            os_family: "MAC_OS",
            browser_family: "CHROME",
            brand: null,
            model: null,
            os_version: null,
            carrier: null
          },
          creation_ts: Date.now(),
          last_activity_ts: Date.now(),
          providers: [],
          mappings: [
            {
              user_agent_id: "web:1034:YOLO",
              realm_name: "ExampleAudienceFeed.fr",
              last_activity_ts: Date.now()
            }
          ]
        } as core.UserAgentIdentifierInfo
      ]
    };

    // Plugin init
    
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        request(runner.plugin.app)
          .put("/v1/log_level")
          .send({ level: LOG_LEVEL })
          .end((err, res) => {
            expect(res.status).to.be.equal(200);

            // Activity to process
            request(runner.plugin.app)
              .post("/v1/user_segment_update")
              .send(payload)
              .end(async (err, res) => {
                expect(res.status).to.be.eq(200);
                expect(
                  (JSON.parse(res.text) as core.UserSegmentUpdatePluginResponse).status
                ).to.be.eq("ok");
                
                done();
                await delay(100);

              });
              
          });
      });
    // Plugin init
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        request(runner.plugin.app)
          .put("/v1/log_level")
          .send({ level: LOG_LEVEL })
          .end((err, res) => {
            expect(res.status).to.equal(200);

            // Activity to process
            request(runner.plugin.app)
              .post("/v1/user_segment_update")
              .send(payload)
              .end(async (err, res) => {
                expect(res.status).to.eq(200);
                expect(
                  (JSON.parse(res.text) as core.UserSegmentUpdatePluginResponse).status
                ).to.be.eq("ok");
                done();
              });
          });
      });
  });

afterEach(() => {
  
      nock.restore();
})

});