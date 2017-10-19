import { expect } from "chai";
import "mocha";
import { core, extra } from "../";
import * as request from "supertest";
import * as sinon from "sinon";
import * as mockery from "mockery";
import * as rp from "request-promise-native";

describe("Fetch template API", () => {
  class MyDummyHandlebarsAdRenderer extends core.AdRendererRecoTemplatePlugin {
    protected async onAdContents(
      adRenderRequest: core.AdRendererRequest,
      instanceContext: core.AdRendererRecoTemplateInstanceContext
    ): Promise<core.AdRendererPluginResponse> {
      return {
        html: `This is Spart.... Oups, HTML I mean`
      };
    }

    constructor() {
      super();
      this.engineBuilder = new extra.HandlebarsEngine();
    }
  }

  const rpMockup: sinon.SinonStub = sinon
    .stub()
    .returns(Promise.resolve("Fake answer"));

  it("Check that templateURI is passed correctly in fetchTemplateContent", function(
    done
  ) {
    const plugin = new MyDummyHandlebarsAdRenderer();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const faketemplatePath = "mics://yolo";

    // We try a call to the Gateway
    (runner.plugin as MyDummyHandlebarsAdRenderer)
      .fetchTemplateContent(faketemplatePath)
      .then(() => {
        expect(rpMockup.args[0][0].uri).to.be.eq(
          `${runner.plugin.outboundPlatformUrl}/v1/data_file/data`
        );
        expect(rpMockup.args[0][0].qs.uri).to.be.eq(faketemplatePath);
        done();
      });
  });

  it("Check that orgId / adLayoutId / versionId are passed correctly in fetchTemplateProperties", function(
    done
  ) {
    const plugin = new MyDummyHandlebarsAdRenderer();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const fakeOrgId = "1";
    const fakeAdLayoutId = "23";
    const fakeVersionId = "456";

    // We try a call to the Gateway
    (runner.plugin as MyDummyHandlebarsAdRenderer)
      .fetchTemplateProperties(fakeOrgId, fakeAdLayoutId, fakeVersionId)
      .then(() => {
        expect(rpMockup.args[1][0].uri).to.be.eq(
          `${runner.plugin
            .outboundPlatformUrl}/v1/ad_layouts/${fakeAdLayoutId}/versions/${fakeVersionId}?organisation_id=${fakeOrgId}`
        );
        done();
      });
  });
});

describe("Fetch recommendation API", () => {
  class MyDummyHandlebarsAdRenderer extends core.AdRendererRecoTemplatePlugin {
    protected async onAdContents(
      adRenderRequest: core.AdRendererRequest,
      instanceContext: core.AdRendererRecoTemplateInstanceContext
    ): Promise<core.AdRendererPluginResponse> {
      return {
        html: `This is Spart.... Oups, HTML I mean`
      };
    }

    constructor() {
      super();
      this.engineBuilder = new extra.HandlebarsEngine();
    }
  }

  const fakeRecommenderResponse: core.ResponseData<core.RecommandationsWrapper> = {
    status: "ok",
    data: {
      ts: 1496939189652,
      proposals: [
        {
          $type: "ITEM_PROPOSAL",
          $item_id: "8",
          $id: "8",
          $catalog_id: "16",
          $name: "Résidence Les Terrasses de Veret***",
          $brand: "Madame Vacance",
          $url:
            "https://www.madamevacances.com/locations/france/alpes-du-nord/flaine/residence-les-terrasses-de-veret/",
          $image_url:
            "http://hbs.madamevacances.com/photos/etab/87/235x130/residence_les_terrasses_de_veret_piscine.jpg",
          $price: 160.3,
          $sale_price: null,
          city: "Flaine",
          country: "France",
          region: "Alpes du Nord",
          zip_code: "74300"
        },
        {
          $type: "ITEM_PROPOSAL",
          $item_id: "7",
          $id: "7",
          $catalog_id: "16",
          $name: "Le Chalet Altitude*****",
          $brand: "Madame Vacance",
          $url:
            "https://www.madamevacances.com/locations/france/alpes-du-nord/val-thorens/le-chalet-altitude/",
          $image_url:
            "http://hbs.madamevacances.com/photos/etab/335/235x130/chalet_altitude_exterieure_2.jpg",
          $price: null,
          $sale_price: null,
          city: "Val Thorens",
          country: "France",
          region: "Alpes du Nord",
          zip_code: "73440"
        },
        {
          $type: "ITEM_PROPOSAL",
          $item_id: "6",
          $id: "6",
          $catalog_id: "16",
          $name: "Les Chalets du Thabor***",
          $brand: "Madame Vacance",
          $url:
            "https://www.madamevacances.com/locations/france/alpes-du-nord/valfrejus/les-chalets-du-thabor/",
          $image_url:
            "http://hbs.madamevacances.com/photos/etab/65/235x130/valfrejus_chalet_thabor_exterieure_2.jpg",
          $price: 143.2,
          $sale_price: null,
          city: "Valfréjus",
          country: "France",
          region: "Alpes du Nord",
          zip_code: "73500"
        }
      ]
    }
  };

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
      id: "42",
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

  const rpMockup: sinon.SinonStub = sinon.stub();

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          console.log(value);
          return (
            value.match(/\/v1\/recommenders\/(.){1,10}\/recommendations/) !==
            null
          );
        })
      )
    )
    .returns(fakeRecommenderResponse);

  it("Check that recommenderId and userAgentId are passed correctly in fetchRecommendations", function(
    done
  ) {
    const plugin = new MyDummyHandlebarsAdRenderer();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    // We try a call to the Gateway
    (runner.plugin as MyDummyHandlebarsAdRenderer)
      .fetchRecommendations(fakeInstanceContext, fakeUserAgentId)
      .then(() => {
        expect(rpMockup.args[0][0].uri).to.be.eq(
          `${plugin.outboundPlatformUrl}/v1/recommenders/${fakeInstanceContext.recommender_id}/recommendations`
        );
        expect(rpMockup.args[0][0].body.input_data.user_agent_id).to.be.eq(
          fakeUserAgentId
        );
        done();
      });
  });

  it("Check that fetched itemProposal are the same as sent by the recommender", function(
    done
  ) {
    const plugin = new MyDummyHandlebarsAdRenderer();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    // We try a call to the Gateway
    (runner.plugin as MyDummyHandlebarsAdRenderer)
      .fetchRecommendations(fakeInstanceContext, fakeUserAgentId)
      .then((proposals: Array<core.ItemProposal>) => {
        expect(proposals[0]).to.deep.eq(
          fakeRecommenderResponse.data.proposals[0]
        );
        expect(proposals[1]).to.deep.eq(
          fakeRecommenderResponse.data.proposals[1]
        );
        expect(proposals[2]).to.deep.eq(
          fakeRecommenderResponse.data.proposals[2]
        );
        done();
      });
  });
});
