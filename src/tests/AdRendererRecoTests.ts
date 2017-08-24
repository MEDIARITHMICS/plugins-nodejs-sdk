import { expect } from "chai";
import "mocha";
import { core } from "../";
import * as request from "supertest";
import * as sinon from "sinon";
import * as mockery from "mockery";
import * as rp from "request-promise-native";

describe("Fetch template API", () => {
  let plugin: core.AdRendererRecoTemplatePlugin;
  let requestPromiseProx: sinon.SinonStub = sinon.stub().returns("Fake answer");

  beforeEach(function(done) {
    requestPromiseProx = sinon.stub().returns(
      new Promise((resolve, reject) => {
        resolve("Yolo");
      })
    );

    plugin = new core.AdRendererRecoTemplatePlugin();

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

  it("Check that templateURI is passed correctly in fetchTemplateContent", function(
    done
  ) {
    // We replace the request-promise-native in the plugin
    plugin._transport = require("request-promise-native");

    const faketemplatePath = "mics://yolo";

    // We try a call to the Gateway
    plugin.fetchTemplateContent(faketemplatePath).then(() => {
      expect(requestPromiseProx.args[0][0].uri).to.be.eq(
        `${plugin.outboundPlatformUrl}/v1/data_file/data?uri=${encodeURIComponent(
          faketemplatePath
        )}`
      );
      done();
    });
  });

  it("Check that orgId / adLayoutId / versionId are passed correctly in fetchTemplateProperties", function(
    done
  ) {
    // We replace the request-promise-native in the plugin
    plugin._transport = require("request-promise-native");

    const fakeOrgId = "1";
    const fakeAdLayoutId = "23";
    const fakeVersionId = "456";

    // We try a call to the Gateway
    plugin
      .fetchTemplateProperties(fakeOrgId, fakeAdLayoutId, fakeVersionId)
      .then(() => {
        expect(requestPromiseProx.args[0][0].uri).to.be.eq(
          `${plugin.outboundPlatformUrl}/v1/ad_layouts/${fakeAdLayoutId}/versions/${fakeVersionId}?organisation_id=${fakeOrgId}`
        );
        done();
      });
  });
});

describe("Fetch recommendation API", () => {
  let plugin: core.AdRendererRecoTemplatePlugin;
  let requestPromiseProx: sinon.SinonStub = sinon.stub().returns("Fake answer");

  const fakeRecommenderResponse = `{
        "status": "ok",
        "data": {
            "ts": 1496939189652,
            "proposals": [{
                    "$type": "ITEM_PROPOSAL",
                    "$item_id": "8",
                    "$id": "8",
                    "$catalog_id": "16",
                    "$name": "Résidence Les Terrasses de Veret***",
                    "$brand": "Madame Vacance",
                    "$url": "https://www.madamevacances.com/locations/france/alpes-du-nord/flaine/residence-les-terrasses-de-veret/",
                    "$image_url": "http://hbs.madamevacances.com/photos/etab/87/235x130/residence_les_terrasses_de_veret_piscine.jpg",
                    "$price": 160.3,
                    "$sale_price": null,
                    "city": "Flaine",
                    "country": "France",
                    "region": "Alpes du Nord",
                    "zip_code": "74300"
                },
                {
                    "$type": "ITEM_PROPOSAL",
                    "$item_id": "7",
                    "$id": "7",
                    "$catalog_id": "16",
                    "$name": "Le Chalet Altitude*****",
                    "$brand": "Madame Vacance",
                    "$url": "https://www.madamevacances.com/locations/france/alpes-du-nord/val-thorens/le-chalet-altitude/",
                    "$image_url": "http://hbs.madamevacances.com/photos/etab/335/235x130/chalet_altitude_exterieure_2.jpg",
                    "$price": null,
                    "$sale_price": null,
                    "city": "Val Thorens",
                    "country": "France",
                    "region": "Alpes du Nord",
                    "zip_code": "73440"
                },
                {
                    "$type": "ITEM_PROPOSAL",
                    "$item_id": "6",
                    "$id": "6",
                    "$catalog_id": "16",
                    "$name": "Les Chalets du Thabor***",
                    "$brand": "Madame Vacance",
                    "$url": "https://www.madamevacances.com/locations/france/alpes-du-nord/valfrejus/les-chalets-du-thabor/",
                    "$image_url": "http://hbs.madamevacances.com/photos/etab/65/235x130/valfrejus_chalet_thabor_exterieure_2.jpg",
                    "$price": 143.2,
                    "$sale_price": null,
                    "city": "Valfréjus",
                    "country": "France",
                    "region": "Alpes du Nord",
                    "zip_code": "73500"
                }
            ]
        }
    }`;

  const fakeRecommenderResponseJSON = JSON.parse(fakeRecommenderResponse);

  const fakeCreative: core.Creative = {
    type: "DISPLAY_AD",
    id: "7168",
    organisation_id: "1126",
    name: "Toto",
    technical_name: null,
    archived: false,
    editor_version_id: "5",
    editor_version_value: "1.0.0",
    editor_group_id: "com.mediarithmics.creative.display",
    editor_artifact_id: "default-editor",
    editor_plugin_id: "5",
    renderer_version_id: "1054",
    renderer_version_value: "1.0.0",
    renderer_group_id: "com.trololo.creative.display",
    renderer_artifact_id: "multi-advertisers-display-ad-renderer",
    renderer_plugin_id: "1041",
    creation_date: 1492785056278,
    subtype: "BANNER",
    format: "300x250",
    published_version: 1,
    creative_kit: null,
    ad_layout: null,
    locale: null,
    destination_domain: "estcequecestbientotlapero.fr",
    audit_status: "NOT_AUDITED",
    available_user_audit_actions: ["START_AUDIT"]
  };

  const fakeCreativeProperties = [
    {
      technical_name: "hello_world",
      value: {
        value: "Yay"
      },
      property_type: "STRING",
      origin: "PLUGIN",
      writable: true,
      deletable: false
    }
  ];

  const fakeInstanceContext: core.AdRendererRecoTemplateInstanceContext = {
    recommender_id: "74",
    creative_click_url: "http://yolo.com",
    ad_layout_id: "48",
    ad_layout_version: "204",
    template: "toto",
    creative: fakeCreative,
    creativeProperties: fakeCreativeProperties
  };

  const fakeUserAgentId = "vec:888888";

  beforeEach(function(done) {
    requestPromiseProx = sinon
      .stub()
      .returns(new Promise((resolve, reject) => {
          resolve(fakeRecommenderResponseJSON);
      }));

    plugin = new core.AdRendererRecoTemplatePlugin();

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

  it("Check that recommenderId and user_agent_id are passed correctly in fetchRecommendations", function(
    done
  ) {
    // We replace the request-promise-native in the plugin
    plugin._transport = require("request-promise-native");

    // We try a call to the Gateway
    plugin
      .fetchRecommendations(fakeInstanceContext, fakeUserAgentId)
      .then(() => {
        expect(requestPromiseProx.args[0][0].uri).to.be.eq(
          `${plugin.outboundPlatformUrl}/v1/recommenders/${fakeInstanceContext.recommender_id}/recommendations`
        );
        expect(requestPromiseProx.args[0][0].body.input_data.user_agent_id).to.be.eq(fakeUserAgentId);
        done();
      });
  });

  it("Check that fetched itemProposal are the same as sent by the recommender", function(
    done
  ) {
    // We replace the request-promise-native in the plugin
    plugin._transport = require("request-promise-native");

    // We try a call to the Gateway
    plugin
      .fetchRecommendations(fakeInstanceContext, fakeUserAgentId)
      .then((proposals: Array<core.ItemProposal>) => {
        expect(proposals[0]).to.deep.eq(
          fakeRecommenderResponseJSON.data.proposals[0]
        );
        expect(proposals[1]).to.deep.eq(
          fakeRecommenderResponseJSON.data.proposals[1]
        );
        expect(proposals[2]).to.deep.eq(
          fakeRecommenderResponseJSON.data.proposals[2]
        );
        done();
      });
  });
});