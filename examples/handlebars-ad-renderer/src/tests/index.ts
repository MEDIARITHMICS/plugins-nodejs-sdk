import { expect } from "chai";
import "mocha";
import { core } from "@mediarithmics/plugins-nodejs-sdk";
import * as request from "supertest";
import * as sinon from "sinon";
import * as rp from "request-promise-native";
import { MyHandlebarsAdRenderer } from "../index";

describe("Test Example Activity Analyzer", function() {
  // We stub the Gateway calls
  const rpMockup: sinon.SinonStub = sinon.stub();

  // Creative stub
  const creative: core.CreativeResponse = {
    status: "ok",
    data: {
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
      destination_domain: "splendia.com",
      audit_status: "NOT_AUDITED",
      available_user_audit_actions: ["START_AUDIT"]
    },
    count: 1
  };

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return value.match(/\/v1\/creatives\/(.){1,10}/) !== null;
        })
      )
    )
    .returns(creative);

  // Activity Analyzer properties stub
  const creativePropertiesResponse: core.CreativePropertyResponse = {
    status: "ok",
    data: [
      {
        technical_name: "click_url",
        value: {
          url:
            "http://www.april.fr/mon-assurance-de-pret-formulaire?cmpid=disp_datacomp_formadp_bann_300x250"
        },
        property_type: "URL",
        origin: "PLUGIN",
        writable: true,
        deletable: false
      },
      {
        technical_name: "ad_layout",
        value: { id: "144", version: "145" },
        property_type: "AD_LAYOUT",
        origin: "PLUGIN",
        writable: true,
        deletable: false
      },
      {
        technical_name: "backup_image",
        value: { original_file_name: null, asset_id: null, file_path: null },
        property_type: "ASSET",
        origin: "PLUGIN",
        writable: true,
        deletable: false
      },
      {
        technical_name: "datamart_id",
        value: { value: null },
        property_type: "STRING",
        origin: "PLUGIN",
        writable: true,
        deletable: false
      },
      {
        technical_name: "default_items",
        value: { value: null },
        property_type: "STRING",
        origin: "PLUGIN",
        writable: true,
        deletable: false
      },
      {
        technical_name: "style_sheet",
        value: { id: null, version: null },
        property_type: "STYLE_SHEET",
        origin: "PLUGIN",
        writable: true,
        deletable: false
      },
      {
        technical_name: "recommender_id",
        value: { value: "1" },
        property_type: "STRING",
        origin: "PLUGIN",
        writable: true,
        deletable: false
      },
      {
        technical_name: "tag_type",
        value: { value: null },
        property_type: "STRING",
        origin: "PLUGIN_STATIC",
        writable: false,
        deletable: false
      }
    ],
    count: 8
  };

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return (
            value.match(/\/v1\/creatives\/(.){1,10}\/renderer_properties/) !==
            null
          );
        })
      )
    )
    .returns(creativePropertiesResponse);

  // Template properties stub
  const templateProperties: core.AdLayoutVersionResponse = {
    status: "ok",
    data: {
      id: "276",
      version_id: "1",
      creation_date: 1492784898140,
      filename: "multi_annonceur_trololo_300x250_v1.ssp",
      template: "mics://data_file/tenants/1126/ads_templates/250.276.template",
      ad_layout_id: "250",
      status: "DRAFT"
    },
    count: 1
  };

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return (
            value.match(/\/v1\/ad_layouts\/(.){1,10}\/versions\/(.){1,10}/) !==
            null
          );
        })
      )
    )
    .returns(templateProperties);

  // Template File stub
  const templateContent: string = `
    <!doctype html>
    <html>
       <head>
          <meta charset="UTF-8">
          <title>Hotels recommendations</title>
          <style>html{margin:0;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;padding:0;height:250px;width:300px}body{margin:0;padding:0;height:100%;background-color:#fff;overflow:hidden}a{text-decoration:none}a img{border:0}html{-ms-font-feature-settings:normal}.hidden{display:none}#ad-table td{padding:0;margin:0}#ad-table{border-collapse:collapse;width:300px}.ad{position:absolute;width:300px;height:250px;}.ad>div>a{display:block}.logo{width:190px;padding:0 55px;display:block;background-color:#EA1A5B}.logo-link{height:55px}.background1{border:1px solid #EA1A5B;width:298px;height:248px;position:absolute;background-color:#fff;z-index:-1;top:0}#product1:hover #product-button1{background-color:#00a1df}#product2:hover #product-button2{background-color:#00a1df}#product3:hover #product-button3{background-color:#00a1df}.product{width:100px;text-align:left;float:left}.product>a,.page>a{display:block;width:100%}.picture-container{height:90px;text-align:center;white-space:nowrap;overflow:hidden;margin:0 5px}.picture-container .product-picture{width:90px;position:relative;top:50%;transform:translateY(-50%)}.picture-container .sales-tag-1{position:absolute;top:0;left:0;height:38px;margin-top:55px;margin-left:67px}.picture-container .sales-tag-2{position:absolute;top:0;left:0;height:38px;margin-top:55px;margin-left:167px}.picture-container .sales-tag-3{position:absolute;top:0;left:0;height:38px;margin-top:55px;margin-left:257px}.picture-container .sales-price-1{position:absolute;top:0;left:0;margin-top:65px;margin-left:72px;color:#EA1A5B;font-weight:700;font-size:15px}.picture-container .sales-price-1 .percent{font-size:9px}.picture-container .sales-price-2{position:absolute;top:0;left:0;margin-top:65px;margin-left:172px;color:#EA1A5B;font-weight:700;font-size:15px}.picture-container .sales-price-2 .percent{font-size:9px}.picture-container .sales-price-3{position:absolute;top:0;left:0;margin-top:65px;margin-left:262px;color:#EA1A5B;font-weight:700;font-size:15px}.picture-container .sales-price-3 .percent{font-size:9px}.product-title{color:#0862AD;font-weight:700;font-size:13px;margin:7px 10px;width:80px;height:45px;overflow:hidden;text-align:center}.product-brand{color:#0862AD;font-weight:700;font-size:10px;margin:7px 10px;width:80px;overflow:hidden;text-align:center}.product-price{margin:0 10px;width:80px;color:#EA1A5B;font-weight:700;font-size:14px;text-align:center}.product-price-sale{margin:0 10px;width:80px;color:#333;font-weight:700;font-size:14px;text-decoration:line-through;text-align:center}.highlighted{background-color:#00a1df!important}.product-button{height:22px;width:75px;font-weight:700;margin:7px 10px 10px;padding-top:3px;text-align:center;display:inline-block;color:#fff;background-color:#003056;border-radius:8px}</style>
       </head>
       <body>
          <div class="ad">
             <div id="page1" class="page">
                <div class="background1"></div>
                {{#each recommendations}}
                <div id="product1" class="product " onmouseout="enableHighlights()" onmouseover="disableHighlights()">
                   <a href='{{> encodeRecoClickUrl }}' target="_blank">
                      <div class="picture-container"> <img class="product-picture" src="//catalog.mediarithmics.com/v1/datamarts/1089/{{this.$catalog_id}}/{{this.$item_id}}/image/small"> </div>
                      <div class="product-info">
                         <div class="product-title">{{this.$name}}</div>
                         <div class="product-price">{{formatPrice this.$price "##"}} {{this.$currency}}</div>
                         <div class="product-brand">{{this.$brand}}</div>
                         <div id="product-button1" class="product-button highlighted">Voir</div>
                      </div>
                   </a>
                </div>
                {{/each}}
             </div>
          </div>
          <div style="display:none"> <img src="{{request.displayTrackingUrl}}"> </div>
          <script type="text/javascript">var restrictions = {"animation_max_duration":null};</script> <script>function getRandomInt(t,e){return Math.floor(Math.random()*(e-t+1))+t}function stopAnimation(){if("undefined"!=typeof pages){for(var t=0;t<pages.length;++t)pages[t].className=0==t?"page":"page hidden";clearTimeout(switchPageId)}for(t=0;t<productPrices.length;++t)productPrices[t].className="product-price",productSalePrices[t].className="product-price-sale hidden";clearInterval(salePricesId),clearInterval(highlightButtonsId),disableHighlights()}function switchPage(){shownPage=shownPage==pages.length-1?0:++shownPage;for(var t=0;t<pages.length;++t)pages[t].className=t==shownPage?"page":pages[t].className="hidden page";switchPageInterval=1==shownPage?12e3:2==shownPage?8e3:5e3,switchPageId=setTimeout(switchPage,switchPageInterval)}function highlightButton(){if(!disableHighlight){if(1==buttons.length)return buttons[0].className=highlightedButton%2?(++highlightedButton,"product-button highlighted"):(--highlightedButton,"product-button");highlightedButton=highlightedButton==buttons.length-1?0:++highlightedButton;for(var t=0;t<buttons.length;++t)buttons[t].className=t==highlightedButton?"product-button highlighted":"product-button"}}function disableHighlights(){disableHighlight=!0;for(var t=0;t<buttons.length;++t)buttons[t].className="product-button"}function enableHighlights(){disableHighlight=!1}function showHideSalePrice(){hiddenSalePrice=!hiddenSalePrice;var t=0;if(hiddenSalePrice)for(t=0;t<productPrices.length;++t)productPrices[t].className="product-price",productSalePrices[t].className="product-price-sale hidden";else for(t=0;t<productPrices.length;++t)productPrices[t].className="product-price hidden",productSalePrices[t].className="product-price-sale"}var buttons=document.getElementsByClassName("product-button");if(buttons.length>0){buttons[0].className="product-button highlighted";var highlightButtonsId=setInterval(highlightButton,1e3)}var highlightedButton=0,disableHighlight=buttons.length<=0,productPrices=document.querySelectorAll(".js-toggle-price .product-price"),productSalePrices=document.querySelectorAll(".js-toggle-price .product-price-sale"),hiddenSalePrice=!0,salePricesId=0;document.getElementsByClassName("js-toggle-price")&&(salePricesId=setInterval(showHideSalePrice,1e3));for(var productTitles=document.getElementsByClassName("product-title"),titlesLength=1===buttons.length?60:20,i=0;i<productTitles.length;++i)productTitles[i].textContent=productTitles[i].textContent.length>titlesLength?productTitles[i].textContent.substr(0,titlesLength)+"...":productTitles[i].textContent.substr(0,titlesLength);if(null==restrictions.animation_max_duration||restrictions.animation_max_duration>0){var pages=[document.getElementById("page1")],shownPage=0,switchPageInterval=5e3,switchPageId=setTimeout(switchPage,switchPageInterval);null!=restrictions.animation_max_duration&&setTimeout(stopAnimation,1e3*restrictions.animation_max_duration)}else stopAnimation();</script>
       </body>
    </html>
      `;

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return value.match(/\/v1\/data_file\/(.){1,10}\/data/) !== null;
        })
      )
    )
    .returns(templateContent);

  // Recommendation stub

  const recommendations: core.RecommenderResponse = {
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

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return (
            value.match(/\/v1\/recommenders\/(.){1,10}\/recommendations/) !==
            null
          );
        })
      )
    )
    .returns(recommendations);

  // Fake AdCall

  const adRequest: core.AdRendererRequest = {
    call_id: "auc:goo:58346725000689de0a16ac4f120ecc41-0",
    context: "LIVE",
    creative_id: "2757",
    campaign_id: "1537",
    ad_group_id: "1622",
    protocol: "https",
    user_agent:
      "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; MALCJS; rv:11.0) like Gecko",
    user_agent_info: {
      form_factor: "PERSONAL_COMPUTER",
      os_family: "WINDOWS",
      browser_family: "IE",
      brand: null,
      model: null,
      os_version: null,
      carrier: null
    },
    placeholder_id: "mics_ed54e0e",
    user_campaign_id: "toto",
    click_urls: [
      "https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=%7B%7BMICS_AD_CONTENT_ID%7D%7D&redirect=",
      "https://adclick.g.doubleclick.net/aclk?sa=L&ai=CDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE&num=1&sig=AOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw&client=ca-pub-6163857992956964&adurl="
    ],
    display_tracking_url:
      "https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=imp&vid=4080&cb=ef3933a2-591b-4b1e-8fe2-4d9fd75980c4",
    latitude: null,
    longitude: null,
    restrictions: { animation_max_duration: 25 }
  };

  it("Check behavior of dummy handlebar adRenderer", function(done) {
    // All the magic is here
    const plugin = new MyHandlebarsAdRenderer();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    // Plugin init
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        // Plugin log level to debug
        request(runner.plugin.app)
          .put("/v1/log_level")
          .send({ level: "debug" })
          .end((err, res) => {
            expect(res.status).to.equal(200);

            // Activity to process
            request(runner.plugin.app)
              .post("/v1/ad_contents")
              .send(adRequest)
              .end((err, res) => {
                expect(res.status).to.eq(200);

                expect(res.text).to.be.eq(
                  `YOLO`
                );
                done();
              });
          });
      });
  });
});
